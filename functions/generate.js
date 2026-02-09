import { Client } from "pg";

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    },
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
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }

  try {
    const { title, level, classLevel, subject, email } = JSON.parse(event.body || "{}");

    if (!title) return response(400, { error: "No lesson title provided" });
    if (!email) return response(400, { error: "User email missing" });

    const db = new Client({ connectionString: process.env.NEON_DATABASE_URL });
    await db.connect();

    const { rows } = await db.query(
      `SELECT balance, last_note_date, daily_note_used, notes_package 
       FROM users WHERE email=$1`,
      [email]
    );

    if (!rows.length) {
      await db.end();
      return response(403, { error: "User not found" });
    }

    const user = rows[0];
    const today = new Date().toISOString().slice(0, 10);

    if (user.last_note_date !== today) {
      await db.query(
        `UPDATE users SET daily_note_used = 0, last_note_date = $1 WHERE email = $2`,
        [today, email]
      );
      user.daily_note_used = 0;
    }

    let mode = null;
    if (user.notes_package > 0) mode = "package";
    else if (user.balance >= 5 && user.daily_note_used === 0) mode = "daily";

    if (!mode) {
      await db.end();
      return response(403, { error: "Daily limit reached" });
    }

    const safeLevel = level || "Primary";
    const safeClass = classLevel || "P4";
    const safeSubject = subject || "General Studies";

    let data, lastError;

    for (const key of API_KEYS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `You are a professional Rwandan CBC teacher.
Create a complete primary school lesson plan for ${safeLevel} ${safeClass}, subject ${safeSubject}, topic ${title}.
Include:
1. Introduction
2. Objectives
3. Detailed Lesson Notes
4. Examples
Do **not** include instructions for the teacher. Lesson notes must be longer section than others. Depend on CBC revised syllabus and student books.
Output only HTML that can be directly displayed to students. No extra explanations.`
                }] }],
              generationConfig: { temperature: 0.6, maxOutputTokens: 4500 }
            })
          }
        );

        data = await res.json();

        if (data.error && ["PERMISSION_DENIED","RESOURCE_EXHAUSTED"].includes(data.error.status)) {
          lastError = data.error;
          continue;
        }

        break;
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    if (!data || !data.candidates) {
      await db.end();
      return response(500, { error: lastError?.message || "All API keys failed" });
    }

    const notes = data.candidates[0]?.content?.parts?.[0]?.text || "AI returned empty response";

    if (mode === "package") {
      await db.query(`UPDATE users SET notes_package = notes_package - 1 WHERE email = $1`, [email]);
    } else if (mode === "daily") {
      await db.query(`UPDATE users SET daily_note_used = 1 WHERE email = $1`, [email]);
    }

    await db.end();
    return response(200, { notes });

  } catch (err) {
    return response(500, { error: err.stack });
  }
};
