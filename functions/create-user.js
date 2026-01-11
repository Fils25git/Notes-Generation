import { Client } from "pg";
import bcrypt from "bcryptjs";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
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
    } = JSON.parse(event.body);

    if (!email || !password || !secretQuestion || !secretAnswer) {
      return { statusCode: 400, body: "Missing required fields" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(secretAnswer.toLowerCase(), 10);

    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const res = await client.query(
      `INSERT INTO users
      (name, email, password, role, phone, recovery_email, balance, secret_question, secret_answer_hash)
      VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8)
      ON CONFLICT(email) DO NOTHING
      RETURNING id`,
      [
        name,
        email,
        hashedPassword,
        role,
        phone,
        recoveryEmail || null,
        secretQuestion,
        hashedAnswer
      ]
    );

    await client.end();

    if (res.rowCount === 0) {
      return { statusCode: 409, body: "Account already exists" };
    }

    return { statusCode: 200, body: "Account created successfully" };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  }
            }
