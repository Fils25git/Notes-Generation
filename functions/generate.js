exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle preflight OPTIONS request
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

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a professional Rwandan CBC teacher.
Create detailed primary school lesson notes for: ${title}.
Include introduction, objectives, key vocabulary, lesson notes, examples, classroom activities, assessment questions, and homework. 
Output HTML only, no explanations.`
            }]
          }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 2048
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
