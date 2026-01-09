import { Client } from "pg";
import bcrypt from "bcryptjs";

export async function handler(event) {
  console.log("🔥 FUNCTION HIT");

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let client;

  try {
    console.log("📥 RAW BODY:", event.body);

    const body = JSON.parse(event.body || "{}");
    console.log("📦 PARSED BODY:", body);

    const { name, email, phone, role, password } = body;

    if (!name || !email || !password || !role) {
      console.log("❌ VALIDATION FAILED");
      return { statusCode: 400, body: "Missing required fields" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔐 PASSWORD HASHED");

    client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    console.log("🔌 CONNECTING TO DB");
    await client.connect();
    console.log("✅ DB CONNECTED");

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

    console.log("🟢 INSERT RESULT:", result.rows);

    await client.end();

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        userId: result.rows[0].id
      })
    };

  } catch (err) {
    console.error("💥 CREATE USER ERROR FULL:", err);
    if (client) await client.end();
    return { statusCode: 500, body: err.message };
  }
}
