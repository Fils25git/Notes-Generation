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
      return { statusCode: 400, body: 'Missing user identifier' };
    }

    // --- 1️⃣ Get user safely ---
    let userRes;
    if (email) {
      userRes = await pool.query('SELECT id, weekly_plan FROM users WHERE email=$1', [email]);
    } else {
      userRes = await pool.query('SELECT id, weekly_plan FROM users WHERE phone=$1', [phone]);
    }

    if (userRes.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ weeklyBalance: 0, success: false }) };
    }

    const userId = userRes.rows[0].id;
    const weeklyPlanColumn = parseInt(userRes.rows[0].weekly_plan || 0, 10); // fallback to 0

    // --- 2️⃣ Total approved weekly plans purchased ---
    const weeklyPaymentRes = await pool.query(
      'SELECT COALESCE(SUM(lessons),0) AS total_weekly_purchased FROM weekly_plan_payments WHERE user_id=$1 AND status=$2',
      [userId, 'approved']
    );
    const totalWeeklyPurchased = parseInt(weeklyPaymentRes.rows[0].total_weekly_purchased, 10);

    // --- 3️⃣ Total weekly plans used ---
    const weeklyUsageRes = await pool.query(
      'SELECT COALESCE(SUM(lessons_used),0) AS total_weekly_used FROM weekly_p_lesson_usage WHERE user_id=$1',
      [userId]
    );
    const totalWeeklyUsed = parseInt(weeklyUsageRes.rows[0].total_weekly_used, 10);

    // --- 4️⃣ Calculate weekly plan balance ---
    const weeklyBalance = totalWeeklyPurchased - totalWeeklyUsed + weeklyPlanColumn;

    return {
      statusCode: 200,
      body: JSON.stringify({
        weeklyBalance: weeklyBalance >= 0 ? weeklyBalance : 0,
        success: true
      })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ weeklyBalance: 0, success: false })
    };
  }
}
