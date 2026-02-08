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
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No title" }) };
    }

    // CALL GEMINI
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=" + process.env.GEMINI_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Create detailed primary school lesson notes for: ${title}.
Include introduction, explanation, examples, activities and conclusion.`
            }]
          }]
        })
      }
    );

    const data = await response.json();

    let notes = "AI returned empty response";

try {
  if (data.candidates && data.candidates.length > 0) {
    const parts = data.candidates[0].content.parts;

    notes = parts
      .map(p => p.text || "")
      .join("\n")
      .trim();
  }

  if (!notes) notes = "AI returned empty response";

} catch (e) {
  notes = "Failed to read AI response";
      }

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
