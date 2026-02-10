import { Client } from "pg";

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
];

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

  try {
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

    if (!title) return { statusCode: 400, headers, body: JSON.stringify({ error: "No lesson title provided" }) };
    if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: "Email required" }) };
    if (!quizType || !questionSequence || !marks) {
  return response(400, { error: "Quiz configuration incomplete" });
    }

    // --- Connect to DB
    const db = new Client({ connectionString: process.env.NEON_DATABASE_URL });
    await db.connect();

    const today = new Date().toISOString().slice(0, 10);

    // --- Atomically increment daily_note_used only if user hasn't fetched today
    const { rows } = await db.query(
      `UPDATE users
       SET daily_note_used = daily_note_used + 1,
           last_note_date = $1
       WHERE email = $2
         AND (daily_note_used < 5 OR last_note_date < $1)
       RETURNING daily_note_used, notes_package, balance`,
      [today, email]
    );

    if (!rows.length) {
      await db.end();
      return response(403, { error: "Daily limit reached. Try tomorrow or buy a package." });
    }

    const user = rows[0];

    // --- Determine mode
    let mode = null;
    if (user.notes_package > 0) mode = "package";
    else if (user.daily_note_used <= 5) mode = "daily";

    if (!mode) {
      await db.end();
      return response(403, { error: "No lesson fetches left today." });
    }

    // --- Deduct package if used
    if (mode === "package") {
      await db.query(`UPDATE users SET notes_package = notes_package - 1 WHERE email = $1`, [email]);
    }

    // --- Safe fallback values
    // --- Safe fallback values
const safeLevel = level || "Primary";
const safeClass = classLevel || "P4";
const safeSubject = subject || "General Studies";
const safeMarks = Number(marks) || 0;

    // --- Quiz logic (PLACE HERE)
    // --- Question count based on marks
let questionCount;

const numericMarks = Number(marks);

if (numericMarks <= 10) questionCount = 5;
else if (numericMarks <= 20) questionCount = 10;
else if (numericMarks <= 30) questionCount = 15;
else questionCount = 20;

    let quizInstruction = "";

switch (quizType) {

  // Mixed formats
  case "scenario_comprehension":
    quizInstruction = "Start with a short scenario or passage, then ask comprehension questions, followed by closed and open-ended questions.";
    break;

  case "true_false":
    quizInstruction = "Mix True/False questions with Multiple Choice questions.";
    break;

  case "mcq":
    quizInstruction = "Mix Multiple Choice questions and Open-ended questions.";
    break;

  case "openClosed":
    quizInstruction = "Mix Open-ended, True/False, and Multiple Choice questions.";
    break;


  // Single format
  case "tf_only":
    quizInstruction = "Generate ONLY True or False questions.";
    break;

  case "mcq_only":
    quizInstruction = "Generate ONLY Multiple Choice Questions with 4 options (A–D).";
    break;

  case "openEnded":
    quizInstruction = "Generate ONLY open-ended questions.";
    break;

  default:
    quizInstruction = "Generate a balanced mix of question types.";
}
  let sequenceInstruction = "";

if (questionSequence === "progressive") {
  sequenceInstruction = "Arrange questions from easy to difficult.";
}
else if (questionSequence === "by_type") {
  sequenceInstruction = "Group questions by their type.";
}
else {
  sequenceInstruction = "Randomize the question order.";
}  

    let data;
    let lastError;

    // --- Try all API keys
    for (const key of API_KEYS) {
      try {
        const apiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are a professional Rwandan CBC teacher.

Generate a COMPLETE learner assessment (QUIZ), not lesson notes.

QUIZ DETAILS
Level: ${safeLevel}
Class: ${safeClass}
Subject: ${safeSubject}
Topic: ${title}

QUIZ SETTINGS
Question count: ${questionCount}
Total marks: ${marks}
Question format rule: ${quizInstruction}
Ordering rule: ${sequenceInstruction}

STRICT RULES (MUST FOLLOW EXACTLY)

GENERAL
- Follow Rwanda Competence Based Curriculum (CBC).
- Adapt difficulty to learner level and subject.
- DO NOT include answers.
- DO NOT include explanations.
- DO NOT include marking guide.
- DO NOT include teacher notes.
- Output ONLY clean HTML (no markdown, no code block, no extra text).

STRUCTURE (EXACT ORDER ONLY)

<h1>${title} – Quiz</h1>

<h2>Instructions</h2>
Write short learner-friendly instructions (2–3 simple lines).

<h2>Questions</h2>

QUESTION RULES
- Number questions clearly: 1., 2., 3., 4...
- Total questions MUST equal ${questionCount}
- Follow exactly: ${quizInstruction}
- Follow exactly: ${sequenceInstruction}
- Questions must be concise and clear
- Avoid repeating the same question style
- Use age-appropriate vocabulary

FORMATTING RULES
- Multiple choice must have exactly 4 options labeled A, B, C, D
- True/False must show: (True / False)
- Open-ended questions must leave blank lines using <br><br>
- Scenario/comprehension must include a short passage before its questions

FINAL VALIDATION (VERY IMPORTANT)
Before finishing, verify:
1. Count questions again → must equal ${questionCount}
2. No answers exist anywhere
3. HTML is complete and properly closed

IMPORTANT
- Never cut off output
- End the HTML properly`
                }]
              }],
              generationConfig: { temperature: 0.6, maxOutputTokens: 3500 }
            })
          }
        );

        data = await apiRes.json();

        if (data.error && ["PERMISSION_DENIED", "RESOURCE_EXHAUSTED"].includes(data.error.status)) {
          lastError = data.error;
          continue;
        }

        break;

      } catch (err) {
        lastError = err;
      }
    }

    if (!data || !data.candidates) {
      await db.end();
      return response(500, { error: lastError?.message || "All API keys failed" });
    }

    const notes = data.candidates?.[0]?.content?.parts?.[0]?.text || "AI returned empty response";

    await db.end();
    return response(200, { notes });

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.stack }) };
  }
};
