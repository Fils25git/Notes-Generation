import { Client } from "pg";
import bcrypt from "bcryptjs";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const {
    name,
    email,
    password,
    role,
    phone,
    recoveryEmail,
    secretQuestion,
    secretAnswer,
    referralCode   // ✅ added
  } = JSON.parse(event.body || "{}");

  if (!name || !email || !password || !secretQuestion || !secretAnswer) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone ? phone.trim() : null;

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 🔍 CHECK IF EMAIL OR PHONE EXISTS
    const existing = await client.query(
      `SELECT id FROM users WHERE LOWER(email) = $1 OR phone = $2`,
      [cleanEmail, cleanPhone]
    );

    if (existing.rows.length > 0) {
      await client.end();
      return { statusCode: 409, body: JSON.stringify({ error: "Email or phone already registered" }) };
    }

    // ✅ Check referral code (if provided)
    let referredById = null;

    if (referralCode) {
      const refUser = await client.query(
        "SELECT id FROM users WHERE referral_code = $1",
        [referralCode.trim()]
      );

      if (refUser.rows.length > 0) {
        referredById = refUser.rows[0].id;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(secretAnswer.toLowerCase().trim(), 10);

    // ✅ Generate referral code for new user
    const newReferralCode = "REF" + Date.now();

    const res = await client.query(
      `INSERT INTO users
       (name, email, password, role, phone, recovery_email, balance, secret_question, secret_answer_hash, referral_code, referred_by)
       VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,$9,$10)
       RETURNING id`,
      [
        name.trim(),
        cleanEmail,
        hashedPassword,
        role || "user",
        cleanPhone,
        recoveryEmail || null,
        secretQuestion,
        hashedAnswer,
        newReferralCode,   // $9
        referredById       // $10
      ]
    );

    await client.end();

    return { 
      statusCode: 201, 
      body: JSON.stringify({ 
        success: true, 
        userId: res.rows[0].id,
        referralCode: newReferralCode   // optional: return it to frontend
      }) 
    };

  } catch (err) {
    await client.end();

    if (err.code === "23505") {
      return { statusCode: 409, body: JSON.stringify({ error: "Email already exists" }) };
    }

    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
        }
