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
    const { title, level, classLevel, subject } = JSON.parse(event.body || "{}");

    if (!title || !level || !classLevel || !subject) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing title, level, classLevel, or subject" })
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a professional Rwandan CBC teacher.
Create a complete primary school lesson plan for ${level} ${classLevel}, subject ${subject}, topic ${title}.
Include:
1. Introduction
2. Objectives
3. Key Vocabulary
4. Detailed Lesson Notes
5. Examples
6. Classroom Activities
7. Assessment Questions
8. Homework
Output **HTML only**, properly formatted for web display. No extra explanations.`
            }]
          }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 3000
          }
        })
      }
    );

    const data = await response.json();

    const notes = data.candidates?.[0]?.content?.parts?.[0]?.text || "AI returned empty response";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ notes })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
