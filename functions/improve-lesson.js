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
                  text: `const prompt = `
You are an expert English teacher.

Improve the language of this lesson plan:
- Correct grammar mistakes.
- Improve clarity.
- Use better vocabulary.
- Do NOT change structure.
- Do NOT remove any section.
- Do NOT add new content.
- Only improve wording.

Lesson Plan:
${lesson_text}
`
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
