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
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {

    const { title, level, classLevel, subject, email } = JSON.parse(event.body || "{}");

    if (!title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No lesson title provided" })
      };
    }

    // --- Fetch user info
    const [rows] = await db.query(
      "SELECT balance,last_note_date,daily_note_used,notes_package FROM users WHERE email=?",
      [email]
    );

    if (!rows.length) return response(403, { error: "User not found" });

    let user = rows[0];
    const today = new Date().toISOString().slice(0, 10);

    // --- Reset daily usage if new day
    if (user.last_note_date !== today) {
      await db.query(
        "UPDATE users SET daily_note_used=0,last_note_date=? WHERE email=?",
        [today, email]
      );
      user.daily_note_used = 0;
    }

    // --- Determine mode
    let mode = null;
    if (user.notes_package > 0) mode = "package";
    else if (user.balance >= 5 && user.daily_note_used === 0) mode = "daily";

    if (!mode) return response(403, { error: "Daily limit reached" });

    // --- Safe fallback values
    const safeLevel = level || "Primary";
    const safeClass = classLevel || "P4";
    const safeSubject = subject || "General Studies";

    let data;
    let lastError;

    // --- Try all API keys
    for (const key of API_KEYS) {
      try {

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are a professional Rwandan CBC teacher.
Create a complete primary school lesson plan for ${safeLevel} ${safeClass}, subject ${safeSubject}, topic ${title}.
Include:
1. Introduction
2. Objectives
3. Detailed Lesson Notes
4. Examples
Do **not** include instructions for the teacher. Lesson notes must be longer section than others. Depend on CBC revised syllabus and student books.
Output only HTML that can be directly displayed to students. No extra explanations.`
                }]
              }],
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 4500
              }
            })
          }
        );

        data = await response.json();

        // --- Handle quota/permission errors
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
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: lastError?.message || "All API keys failed" })
      };
    }

    const notes = data.candidates?.[0]?.content?.parts?.[0]?.text || "AI returned empty response";

    // --- Deduct usage BEFORE returning
    if (mode === "package") {
      await db.query("UPDATE users SET notes_package = notes_package - 1 WHERE email = ?", [email]);
    } else if (mode === "daily") {
      await db.query("UPDATE users SET daily_note_used = 1 WHERE email = ?", [email]);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ notes })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.stack })
    };
  }
};
