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

Generate learner QUESTIONS based on the provided plan.

STRICT RULES:
- Generate QUESTIONS ONLY
- Do NOT generate answers
- Do NOT generate explanations
- Do NOT add notes
- Follow numbering exactly starting from ${startNumber}
- Respect marks exactly
- Scenario must appear BEFORE its questions
- MCQ must have options A–D
- True/False must show (True / False)
- Open-ended must leave two blank lines
- Language must be age appropriate

QUIZ DETAILS
Level: ${safeLevel}
Class: ${safeClass}
Subject: ${safeSubject}
Topic: ${title}

QUESTION PLAN
${JSON.stringify(chunk, null, 2)}

OUTPUT FORMAT (VERY IMPORTANT)
Return ONLY VALID HTML.
Do NOT return JSON.
Do NOT wrap in markdown.
Do NOT add explanations.
`;
}

async function generateQuestionChunk(prompt, apiKey) {
  const res = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey   // ✅ Keep your API key here
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
  const parts = data.candidates?.[0]?.content?.parts || [];
return parts.map(p => p.text || "").join("").trim();
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
      numberOfQuestions,
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
    const questionCount = Number(numberOfQuestions);

if (!questionCount || questionCount < 1 || questionCount > 50) {
  await db.end();
  return response(400, { error: "Invalid question count" });
}
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
    const plan = await generateQuizPlan({
  title,
  level,
  classLevel,
  subject,
  numberOfQuestions,
  marks
});
    // -------------------- VALIDATION --------------------
    let quizPlan = plan; // plan comes from generateQuizPlan()

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

// Helper: retry for empty response
async function generateQuestionChunkWithRetry(prompt, keys, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    for (const key of keys) {
      try {
        const text = await generateQuestionChunk(prompt, key);
        if (text?.trim()) return text; // return if valid
      } catch (err) {
        continue; // try next key
      }
    }
    // wait 1 second before retry
    await new Promise(r => setTimeout(r, 1000));
  }
  return null; // failed after all retries
}

// Use this in your main loop
for (const chunk of chunks) {
  const prompt = buildStep2Prompt({
    title,
    safeLevel,
    safeClass,
    safeSubject,
    chunk,
    startNumber
  });

  const chunkHTML = await generateQuestionChunkWithRetry(prompt, API_KEYS);

  if (!chunkHTML) {
    await db.end();
    return response(500, { error: "Failed generating questions after retries" });
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
