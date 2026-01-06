import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { email, phone } = JSON.parse(event.body);

    if (!email) return { statusCode: 400, body: "Missing email" };

    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    await client.query(
      `INSERT INTO users(email, phone, balance)
       VALUES($1, $2, 0)
       ON CONFLICT(email) DO NOTHING`,
      [email, phone || null]
    );

    await client.end();

    return { statusCode: 200, body: "User created or already exists" };
  } catch (err) {
    return { statusCode: 500, body: "Server error: " + err.message };
  }
            }
