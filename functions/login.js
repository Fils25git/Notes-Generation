import { Client } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const { email, password } = JSON.parse(event.body || {});
  if (!email || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: "Email and password required" }) };
  }

  const cleanEmail = email.trim().toLowerCase(); // ✅ normalize

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // ✅ CASE-INSENSITIVE QUERY
    const result = await client.query(
      `SELECT id, password, email FROM users WHERE LOWER(email) = $1`,
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid email or password" }) };
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid email or password" }) };
    }

    // ✅ store normalized email in token
    const token = jwt.sign(
      { userId: user.id, email: user.email.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
  statusCode: 200,
  body: JSON.stringify({
    token,
    email: user.email.toLowerCase(),
    id: user.id   // 👈 ADD THIS
  })
};

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  } finally {
    await client.end();
  }
    }
