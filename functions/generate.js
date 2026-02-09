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
    const { title, level, classLevel, subject, email } = JSON.parse(event.body || "{}");

    if (!title) return { statusCode: 400, headers, body: JSON.stringify({ error: "No lesson title provided" }) };
    if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: "Email required" }) };

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
    const safeLevel = level || "Primary";
    const safeClass = classLevel || "P4";
    const safeSubject = subject || "General Studies";

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
                  text: `You are a professional Rwandan CBC primary school teacher.

Generate a COMPLETE and FINISHED lesson plan for:
Level: ${safeLevel}
Class: ${safeClass}
Subject: ${safeSubject}
Topic: ${title}

STRICT RULES (must follow exactly):

GENERAL
- Follow Rwanda Competence Based Curriculum (CBC).
- Adapt language difficulty to the learner level (Nursery = very simple sentences, Upper Primary = detailed explanations).
- The response MUST be complete and MUST NOT stop mid-sentence.
- Output ONLY clean HTML (no markdown, no explanations outside HTML).
- Total response should be moderate in size to avoid truncation.

STRUCTURE (exact order)

<h1>Topic Title</h1>

<h2>Introduction</h2>
A short learner-friendly introduction (2–4 sentences only).



<h2>Lesson Notes</h2>
Very detailed but controlled length explanation:
- Organized with subheadings using <h3>
- Use paragraphs and bullet points
- Include examples inside the notes
- Use age-appropriate language
- Do NOT repeat ideas
- Do NOT add teacher instructions
- Maximum about 200–400 words equivalent

<h2>Worked Examples</h2>
Provide 3 clear worked examples with step-by-step explanations suitable for learners.

<h2>Exercises</h2>
Provide ONLY 5 questions.
No answers.
Mix difficulty (easy → moderate).

IMPORTANT
- End the HTML properly.
- Never cut off the response.
- Keep explanations complete but concise to fit within limits.`
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
