import { Client } from "pg";

export async function handler(event) {
  const email = event.queryStringParameters?.email;

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

    return {
      statusCode: 200,
      body: JSON.stringify({ balance: res.rows[0].balance })
    };

  } catch (err) {
    return { statusCode: 500, body: err.message };
  } finally {
    await client.end();
  }
      }
