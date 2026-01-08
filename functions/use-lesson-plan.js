import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  const { email, phone } = JSON.parse(event.body || "{}");

  if (!email && !phone) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Missing email or phone" })
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    /* ===============================
       1️⃣ FIND USER
    =============================== */
    const userRes = await client.query(
      email
        ? "SELECT id FROM users WHERE email=$1"
        : "SELECT id FROM users WHERE phone=$1",
      [email || phone]
    );

    if (userRes.rows.length === 0) {
      await client.end();
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: "User not found" })
      };
    }

    const userId = userRes.rows[0].id;

    /* ===============================
       2️⃣ TOTAL PURCHASED LESSON PLANS
    =============================== */
    const purchasedRes = await client.query(
      `SELECT COALESCE(SUM(lessons), 0) AS total_purchased
       FROM payments
       WHERE user_id=$1 AND status='approved'`,
      [userId]
    );

    const totalPurchased = parseInt(purchasedRes.rows[0].total_purchased, 10);

    /* ===============================
       3️⃣ TOTAL USED LESSON PLANS
    =============================== */
    const usedRes = await client.query(
      `SELECT COALESCE(SUM(lessons_used), 0) AS total_used
       FROM lesson_usage
       WHERE user_id=$1`,
      [userId]
    );

    const totalUsed = parseInt(usedRes.rows[0].total_used, 10);

    /* ===============================
       4️⃣ CHECK AVAILABLE BALANCE
    =============================== */
    const available = totalPurchased - totalUsed;

    if (available < 1) {
      await client.end();
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "No lesson plans available",
          balance: 0
        })
      };
    }

    /* ===============================
       5️⃣ DEDUCT ONE LESSON PLAN
    =============================== */
    await client.query(
      `INSERT INTO lesson_usage (user_id, lessons_used, used_at)
       VALUES ($1, 1, NOW())`,
      [userId]
    );

    const newBalance = available - 1;

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Lesson plan used successfully",
        balance: newBalance
      })
    };

  } catch (err) {
    console.error("use-lesson-plan error:", err);
    try { await client.end(); } catch {}

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Server error"
      })
    };
  }
          }
