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

    // 1️⃣ Get user
    const userRes = await client.query(
      email
        ? 'SELECT id, weekly_plan FROM users WHERE email=$1'
        : 'SELECT id, weekly_plan FROM users WHERE phone=$1',
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
    let weeklyPlanBalance = parseInt(userRes.rows[0].weekly_plan, 10) || 0;

    // 2️⃣ Total approved weekly plans from payments
    const purchasedWeeklyRes = await client.query(
      `SELECT COALESCE(SUM(lessons), 0) AS total_weekly_purchased
       FROM weekly_plan_payments
       WHERE user_id=$1 AND status='approved'`,
      [userId]
    );
    const totalWeeklyPurchased = parseInt(purchasedWeeklyRes.rows[0].total_weekly_purchased, 10);

    // 3️⃣ Total used weekly plans
    const usedWeeklyRes = await client.query(
      `SELECT COALESCE(SUM(lessons_used), 0) AS total_weekly_used
       FROM "weeklyP_lesson_usage"
       WHERE user_id=$1`,
      [userId]
    );
    const totalWeeklyUsed = parseInt(usedWeeklyRes.rows[0].total_weekly_used, 10);

    // 4️⃣ Calculate available weekly plans
    const availableWeeklyPlans = totalWeeklyPurchased - totalWeeklyUsed + weeklyPlanBalance;

    if (availableWeeklyPlans < 1) {
      await client.end();
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "No weekly plans available",
          weeklyBalance: 0
        })
      };
    }

    // 5️⃣ Deduct one weekly plan
    await client.query(
      `INSERT INTO "weeklyP_lesson_usage" (user_id, lessons_used, used_at)
       VALUES ($1, 1, NOW())`,
      [userId]
    );

    // Optional: decrement the weekly_plan column in users
    await client.query(
      `UPDATE users SET weekly_plan = weekly_plan - 1 WHERE id=$1`,
      [userId]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Weekly plan used successfully",
        weeklyBalance: availableWeeklyPlans - 1
      })
    };

  } catch (err) {
    console.error("weekly-plan error:", err);
    try { await client.end(); } catch {}
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Server error",
        weeklyBalance: 0
      })
    };
  }
       }
