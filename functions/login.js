import { Client } from "pg";
import bcrypt from "bcryptjs";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { email, password } = JSON.parse(event.body || "{}");

  if (!email || !password) {
    return { statusCode: 400, body: "Email and password required" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const result = await client.query(
      `SELECT id, password FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return { statusCode: 401, body: "Invalid email or password" };
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return { statusCode: 401, body: "Invalid email or password" };
    }

    await client.end();

    return {
      statusCode: 200,
      body: "Login successful"
    };

  } catch (err) {
    if (client) await client.end();
    return { statusCode: 500, body: err.message };
  }
              }
