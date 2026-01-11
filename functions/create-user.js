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

  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      recoveryEmail,
      secretQuestion,
      secretAnswer
    } = JSON.parse(event.body || "{}");

    if (!email || !password || !secretQuestion || !secretAnswer) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }

    // ✅ NORMALIZE EMAIL (VERY IMPORTANT)
    const cleanEmail = email.toLowerCase().trim();

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(secretAnswer.toLowerCase().trim(), 10);

    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const res = await client.query(
      `INSERT INTO users
       (name, email, password, role, phone, recovery_email, balance, secret_question, secret_answer_hash)
       VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8)
       RETURNING id`,
      [
        name || null,
        cleanEmail,
        hashedPassword,
        role || "user",
        phone || null,
        recoveryEmail || null,
        secretQuestion,
        hashedAnswer
      ]
    );

    await client.end();

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, userId: res.rows[0].id })
    };

  } catch (err) {
    console.error(err);

    return {
      statusCode: 409,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Email or phone already registered"
      })
    };
  }
        }
