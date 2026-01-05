import { Client } from "pg";
import crypto from "crypto";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { email, phone } = JSON.parse(event.body);
  if (!email || !phone) return { statusCode: 400, body: "Missing fields" };

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Create a login token
    const token = crypto.randomBytes(32).toString("hex");

    // Insert user if not exists or update email
    await client.query(
      `INSERT INTO users(phone, email, login_token, balance)
       VALUES ($1, $2, $3, 0)
       ON CONFLICT (phone)
       DO UPDATE SET email = EXCLUDED.email, login_token = EXCLUDED.login_token`,
      [phone, email, token]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Logged in", token })
    };
  } catch (err) {
    if (client) await client.end();
    return { statusCode: 500, body: "Server error: " + err.message };
  }
}
