import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  let client;

  try {
    const { email } = JSON.parse(event.body || "{}");

    if (!email) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing email" })
      };
    }

    client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const result = await client.query(
      `SELECT secret_question
       FROM users
       WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
      [email]
    );

    // ✅ User truly not found
    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "User not found" })
      };
    }

    // ✅ User exists but secret question missing
    if (!result.rows[0].secret_question) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Secret question not set" })
      };
    }

    // ✅ Success
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        question: result.rows[0].secret_question
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error: " + err.message })
    };
  } finally {
    if (client) await client.end();
  }
      }
