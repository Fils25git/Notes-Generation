import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  try {
    const email = event.queryStringParameters?.email;
    const phone = event.queryStringParameters?.phone;

    if (!email && !phone) {
      return {
        statusCode: 400,
        body: JSON.stringify({ weeklyBalance: 0, success: false })
      };
    }

    // 1️⃣ Get user ID and current weekly_plan (bonuses included)
    const userRes = email
      ? await pool.query('SELECT id, weekly_plan FROM users WHERE email = $1', [email])
      : await pool.query('SELECT id, weekly_plan FROM users WHERE phone = $1', [phone]);

    if (userRes.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ weeklyBalance: 0, success: false })
      };
    }

    const userId = userRes.rows[0].id;
    const bonusWeeklyPlan = parseInt(userRes.rows[0].weekly_plan || 0, 10);

    // 2️⃣ Total approved weekly plans purchased
    const purchaseRes = await pool.query(
      `SELECT COALESCE(SUM(lessons), 0) AS total
       FROM weekly_plan_payments
       WHERE user_id = $1 AND status = 'approved'`,
      [userId]
    );

    const purchased = parseInt(purchaseRes.rows[0].total, 10);

    // 3️⃣ Total weekly plans used
    const usageRes = await pool.query(
      `SELECT COALESCE(SUM(lessons_used), 0) AS used
       FROM weekly_p_lesson_usage
       WHERE user_id = $1`,
      [userId]
    );

    const used = parseInt(usageRes.rows[0].used, 10);

    // 4️⃣ Final weekly balance = purchased + bonuses - used
    const weeklyBalance = purchased + bonusWeeklyPlan - used;

    return {
      statusCode: 200,
      body: JSON.stringify({
        weeklyBalance: weeklyBalance > 0 ? weeklyBalance : 0,
        success: true
      })
    };

  } catch (err) {
    console.error('Weekly balance error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ weeklyBalance: 0, success: false })
    };
  }
}
