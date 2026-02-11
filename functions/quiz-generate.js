const { Client } = require("pg");
function response(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

const API_KEYS = [
  process.env.GEMINI_KEY1,
  process.env.GEMINI_KEY2,
  process.env.GEMINI_KEY3,
  process.env.GEMINI_KEY4,
  process.env.GEMINI_KEY5,
].filter(k => k && k.length > 10);

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
function buildStep2Prompt({
  title,
  safeLevel,
  safeClass,
  safeSubject,
  chunk,
  startNumber
}) {
  return `
You are a professional Rwandan CBC teacher.

TASK:
Generate learner QUESTIONS ONLY.
DO NOT generate answers.
DO NOT generate explanations.
DO NOT generate teacher notes.

OUTPUT:
Return ONLY clean HTML.
NO markdown.
NO code blocks.
NO extra text.

QUIZ DETAILS
Level: ${safeLevel}
Class: ${safeClass}
Subject: ${safeSubject}
Topic: ${title}

QUESTIONS TO GENERATE
${JSON.stringify(chunk, null, 2)}

RULES
- Start numbering from ${startNumber}
- Add marks after each question (e.g. Question /2 Marks)
- MCQ must have 4 options (A–D)
- True/False must show (True / False)
- Open-ended must leave <br><br>
- Scenario must appear BEFORE its questions
- Language must be age-appropriate
- HTML must be valid and closed
`;
}

async function generateQuestionChunk(prompt, apiKey) {
  const res = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
  {
    method: "POST",
    headers: {
  "Content-Type": "application/json",
  "x-goog-api-key": apiKey   // ✅ FIX HERE TOO
},
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1500
      }
    })
  }
);

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}
exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  let db;

  try {
    // -------------------- INPUT --------------------
    const {
      title,
      level,
      classLevel,
      subject,
      quizType,
      questionSequence,
      marks,
      email
    } = JSON.parse(event.body || "{}");

    if (!title) return response(400, { error: "Lesson title required" });
    if (!email) return response(400, { error: "Email required" });
    if (!quizType || !questionSequence || !marks) {
      return response(400, { error: "Quiz configuration incomplete" });
    }

    // -------------------- DB --------------------
    db = new Client({ connectionString: process.env.NEON_DATABASE_URL });
    await db.connect();
    

    const today = new Date().toISOString().slice(0, 10);
    await db.query(
  `
  UPDATE users
  SET daily_note_used = 0
  WHERE email = $1
    AND last_note_date IS DISTINCT FROM $2
  `,
  [email, today]
);
const { rows } = await db.query(
  `
  UPDATE users
  SET daily_note_used = daily_note_used + 1,
      last_note_date = $1
  WHERE email = $2
    AND daily_note_used < 5
  RETURNING daily_note_used, notes_package
  `,
  [today, email]
);

    if (!rows.length) {
      await db.end();
      return response(403, { error: "Daily limit reached" });
    }

    const user = rows[0];

    if (user.notes_package > 0) {
      await db.query(
        `UPDATE users SET notes_package = notes_package - 1 WHERE email = $1`,
        [email]
      );
    }

    // -------------------- SAFE VALUES --------------------
    const safeLevel = level || "Primary";
    const safeClass = classLevel || "P4";
    const safeSubject = subject || "General Studies";
    const numericMarks = Number(marks);

    // -------------------- QUESTION COUNT --------------------
    let questionCount;
    if (numericMarks <= 10) questionCount = 5;
    else if (numericMarks <= 20) questionCount = 10;
    else if (numericMarks <= 30) questionCount = 15;
    else questionCount = 15; // HARD CAP (important)

    // -------------------- QUIZ RULES --------------------
    let quizInstruction = "";
    switch (quizType) {
      case "scenario_comprehension":
        quizInstruction = "Start with ONE scenario, followed by comprehension questions.";
        break;
      case "true_false":
        quizInstruction = "Mix True/False and Multiple Choice questions.";
        break;
      case "mcq":
        quizInstruction = "Mix Multiple Choice and Open-ended questions.";
        break;
      case "openClosed":
        quizInstruction = "Mix Open-ended, True/False, and Multiple Choice questions.";
        break;
      case "tf_only":
        quizInstruction = "Generate ONLY True/False questions.";
        break;
      case "mcq_only":
        quizInstruction = "Generate ONLY Multiple Choice questions.";
        break;
      case "openEnded":
        quizInstruction = "Generate ONLY Open-ended questions.";
        break;
      default:
        quizInstruction = "Generate a balanced mix of question types.";
    }

    let sequenceInstruction = "Randomize question order.";
    if (questionSequence === "progressive") {
      sequenceInstruction = "Arrange questions from easy to difficult.";
    } else if (questionSequence === "by_type") {
      sequenceInstruction = "Group questions by type.";
    }

    // -------------------- STEP 1 PROMPT --------------------
    const step1Prompt = `
You are a professional Rwandan CBC teacher.

TASK:
Create a QUIZ PLAN ONLY.
DO NOT generate questions.
DO NOT generate HTML.
DO NOT explain anything.

QUIZ DETAILS
Level: ${safeLevel}
Class: ${safeClass}
Subject: ${safeSubject}
Topic: ${title}

REQUIREMENTS
- Total questions: ${questionCount}
- Total marks: ${marks}
- Question rule: ${quizInstruction}
- Ordering rule: ${sequenceInstruction}

OUTPUT FORMAT
Return ONLY a valid JSON array.

Each object must contain:
- q (number)
- type (scenario | mcq | true_false | open)
- marks (number)

RULES
- Scenario (if any) MUST be question 1 and ONLY one.
- Total questions MUST equal ${questionCount}.
- Total marks MUST equal ${marks}.
`;

    // -------------------- AI CALL --------------------
    let quizPlanText;
let lastError;
let debugData = []; // collect info for debugging

for (const key of API_KEYS) {
  try {
    const res = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key   // ✅ THIS IS THE FIX
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: step1Prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
    })
  }
);
    if (!res.ok) {
  const errText = await res.text();
  debugData.push({ key, status: res.status, errText });
  continue;
}

    const data = await res.json();
    debugData.push({ key, data }); // store response for debugging
    debugData.push({ key, prompt: step1Prompt, data });

    if (data.error) {
      lastError = data.error;
      continue;
    }

    if (data.candidates && data.candidates.length > 0) {
  const parts = data.candidates[0].content?.parts || [];
  quizPlanText = parts.map(p => p.text || "").join("").trim();
}
    if (quizPlanText) break;

  } catch (err) {
    lastError = err;
    debugData.push({ key, error: err.message });
  }
}

if (!quizPlanText) {
  await db.end();
  return response(500, { 
    error: "Failed to generate quiz plan",
    lastError: lastError?.message || lastError,
    debugData // add this array to collect API responses
  });
}
    // -------------------- VALIDATION --------------------
    let quizPlan;
    try {
      quizPlan = JSON.parse(quizPlanText);
    } catch {
      await db.end();
      return response(500, { error: "Invalid quiz plan JSON" });
    }

    if (quizPlan.length !== questionCount) {
      await db.end();
      return response(500, { error: "Question count mismatch" });
    }

    const totalMarks = quizPlan.reduce((s, q) => s + Number(q.marks || 0), 0);
    if (totalMarks !== numericMarks) {
      await db.end();
      return response(500, { error: "Marks total mismatch" });
    }

    // -------------------- RETURN STEP 1 RESULT --------------------
    let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title} – Quiz</title>
<style>
body { font-family: Arial, sans-serif; }
h1, h2 { text-align: center; }
.question { margin-bottom: 15px; }
</style>
</head>
<body>

<h1>${title}</h1>
<p><strong>Level:</strong> ${safeLevel} |
<strong>Class:</strong> ${safeClass} |
<strong>Subject:</strong> ${safeSubject}</p>

<h2>Instructions</h2>
<p>Answer all questions carefully.</p>

<h2>Questions</h2>
`;
    const chunks = chunkArray(quizPlan, 5);
let startNumber = 1;

for (const chunk of chunks) {
  let chunkHTML;

  for (const key of API_KEYS) {
    try {
      const prompt = buildStep2Prompt({
        title,
        safeLevel,
        safeClass,
        safeSubject,
        chunk,
        startNumber
      });

      chunkHTML = await generateQuestionChunk(prompt, key);
      if (chunkHTML) break;

    } catch (err) {
      continue;
    }
  }

  if (!chunkHTML) {
    await db.end();
    return response(500, { error: "Failed generating questions" });
  }

  html += chunkHTML;
  startNumber += chunk.length;
}
    html += `
</body>
</html>
`;

await db.end();
return response(200, { quiz: html });

} catch (err) {
  if (db) await db.end();
  return response(500, { error: err.message });
        }
};
