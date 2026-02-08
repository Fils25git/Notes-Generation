exports.handler = async (event) => {

  // CORS HEADERS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // VERY IMPORTANT (browser sends preflight first)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers, body: "Method Not Allowed" };
    }

    const { title } = JSON.parse(event.body || "{}");

    if (!title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No title provided" })
      };
    }

    const notes = `
      <h2>Lesson Notes</h2>
      <p>Generated successfully for:</p>
      <b>${title}</b>
    `;

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
