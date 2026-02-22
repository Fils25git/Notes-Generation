function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json",
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

  if (event.httpMethod !== "POST") {
    return response(405, { error: "Method not allowed" });
  }

  try {
    const body = JSON.parse(event.body);
    const { lesson_text } = body;

    if (!lesson_text) {
      return response(400, { error: "Missing lesson_text" });
    }

    let data;
    let lastError;

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
                  text: `
You are an expert Rwandan  CBC  teacher of mentioned subject.

Improve grammar, clarity, and vocabulary of the following lesson plan.

CRITICAL INSTRUCTIONS:
- Do NOT summarize.
- Do NOT shorten.
- Do NOT remove any sentence.
- Do NOT remove any section.
- Keep the EXACT same structure.
- Keep the EXACT same number of sections.
- Keep the SAME length or LONGER.
- Return the FULL improved lesson plan.
- Do NOT stop early.

Lesson Plan:
${lesson_text}
`
                }]
              }],
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 3500
              }
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
  return response(200, { improved_text: null });

    }

    const improved_text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI returned empty response";

    return response(200, { improved_text });

  } catch (err) {
    return response(500, { error: err.message });
  }
};
