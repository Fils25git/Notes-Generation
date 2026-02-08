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
    const { title } = JSON.parse(event.body || "{}");
    if (!title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No lesson title provided" })
      };
    }

    let data;
    let lastError;

    // Try each key until one works
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
Create a complete primary school lesson plan for ${level} ${classLevel}, subject ${subject}, topic ${title}.
Include:
1. Introduction
2. Objectives
3. Detailed Lesson Notes 
4. Examples
Do **not** include instructions for the teacher. Lesson notes must be longer section than others. depend on CBC new revised students books, and syllabus. also never provide notes when input provided seems to be not relating to lesson title
Output only HTML that can be directly displayed to students. No extra explanations.`
            }]
              }],
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 2048
              }
            })
          }
        );

        data = await response.json();

        // If API returns quota error, throw to try next key
        if (data.error && ["PERMISSION_DENIED","RESOURCE_EXHAUSTED"].includes(data.error.status)) {
          lastError = data.error;
          continue;
        }

        break; // Success
      } catch (err) {
        lastError = err;
        continue; // try next key
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

    return {
  statusCode: 200,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    debug: data
  })
};

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
