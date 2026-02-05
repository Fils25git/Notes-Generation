import fetch from "node-fetch";

export async function handler(event, context) {
  try {
    const { prompt } = JSON.parse(event.body);

    const API_KEY = process.env.GEMINI_KEY; // ✅ store key in Netlify environment
    const MODEL = "models/gemini-2.5-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 2048 }
        })
      }
    );

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
