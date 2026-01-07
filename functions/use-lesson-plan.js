import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { email } = JSON.parse(event.body || "{}");

  if (!email) {
    return { statusCode: 400, body: "Missing email" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const res = await client.query(
      "SELECT balance FROM users WHERE email=$1",
      [email]
    );

    if (res.rowCount === 0) {
      return { statusCode: 404, body: "User not found" };
    }

    if (res.rows[0].balance < 1) {
      return { statusCode: 403, body: "No lesson plans left" };
    }

    await client.query(
      "UPDATE users SET balance = balance - 1 WHERE email=$1",
      [email]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    return { statusCode: 500, body: err.message };
  } finally {
    await client.end();
  }
  }
