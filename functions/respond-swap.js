const { Client } = require("pg");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" })
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    const { requester_id, responder_id, accept } = JSON.parse(event.body);

    if (!requester_id || !responder_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing IDs" })
      };
    }

    // Update swap request
    await client.query(
      `
      UPDATE swap_requests
      SET status = $1
      WHERE requester_id = $2
      AND responder_id = $3
      `,
      [accept ? "accepted" : "rejected", requester_id, responder_id]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: accept ? "Swap accepted" : "Swap rejected"
      })
    };

  } catch (err) {
    console.error(err);
    await client.end();

    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message })
    };
  }
};
