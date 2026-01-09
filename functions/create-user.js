import { Client } from "pg";
import bcrypt from "bcryptjs";

export async function handler(event) {
  console.log("CREATE USER FUNCTION HIT");

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { name, email, phone, role, password, recoveryEmail } = JSON.parse(event.body || "{}");

    // Basic validation
    if (!name || !email || !phone || !role || !password) {
      return { statusCode: 400, body: "Missing required fields" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log("DB connected");

    const result = await client.query(
      `INSERT INTO users(name, email, phone, role, password, recovery_email, balance)
       VALUES($1,$2,$3,$4,$5,$6,0)
       ON CONFLICT(email) DO NOTHING
       RETURNING id`,
      [name, email, phone, role, hashedPassword, recoveryEmail || null]
    );

    await client.end();

    if (result.rows.length > 0) {
      console.log("User created:", email);
      return {
        statusCode: 200,
        body: "Account created successfully!"
      };
    } else {
      return {
        statusCode: 409,
        body: "Email already exists"
      };
    }

  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    return {
      statusCode: 500,
      body: "Server error: " + err.message
    };
  }
  }
