import { Client } from "pg";
import bcrypt from "bcryptjs";

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
    const { name, email, phone, role, password } = JSON.parse(event.body || "{}");

    if (!name || !email || !password || !role) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const result = await client.query(
      `INSERT INTO users (name, email, phone, role, password)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        phone || null,
        role,
        hashedPassword
      ]
    );

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, userId: result.rows[0].id })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    if (client) await client.end();
  }
}
