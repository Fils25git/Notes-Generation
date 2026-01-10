import { Client } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
      "SELECT id, email, password FROM users WHERE email = $1",
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

    // ✅ CREATE JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        email: user.email
      })
    };

  } catch (err) {
    if (client) await client.end();
    return { statusCode: 500, body: err.message };
  }
      }
