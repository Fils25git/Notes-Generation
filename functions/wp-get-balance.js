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

    // 1️⃣ Get user
    const userRes = await pool.query(
      'SELECT id, weekly_plan FROM users WHERE email=$1 OR phone=$2',
      [email || '', phone || '']
    );

    if (userRes.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ lessonBalance: 0, weeklyBalance: 0, success: false }) };
    }

    const userId = userRes.rows[0].id;
    const weeklyPlanColumn = parseInt(userRes.rows[0].weekly_plan, 10) || 0;

    // 2️⃣ Total approved regular lesson plans
    const paymentRes = await pool.query(
      'SELECT COALESCE(SUM(lessons),0) AS total_purchased FROM payments WHERE user_id=$1 AND status=$2',
      [userId, 'approved']
    );
    const totalPurchased = parseInt(paymentRes.rows[0].total_purchased, 10);

    // 3️⃣ Total used regular lesson plans
    const usageRes = await pool.query(
      'SELECT COALESCE(SUM(lessons_used),0) AS total_used FROM lesson_usage WHERE user_id=$1',
      [userId]
    );
    const totalUsed = parseInt(usageRes.rows[0].total_used, 10);

    const lessonBalance = totalPurchased - totalUsed;

    // 4️⃣ Total approved weekly plans
    const weeklyPaymentRes = await pool.query(
      'SELECT COALESCE(SUM(lessons),0) AS total_weekly_purchased FROM weekly_plan_payments WHERE user_id=$1 AND status=$2',
      [userId, 'approved']
    );
    const totalWeeklyPurchased = parseInt(weeklyPaymentRes.rows[0].total_weekly_purchased, 10);

    // 5️⃣ Total used weekly plans
    const weeklyUsageRes = await pool.query(
      'SELECT COALESCE(SUM(lessons_used),0) AS total_weekly_used FROM weekly_p_lesson_usage WHERE user_id=$1',
      [userId]
    );
    const totalWeeklyUsed = parseInt(weeklyUsageRes.rows[0].total_weekly_used, 10);

    const weeklyBalance = totalWeeklyPurchased - totalWeeklyUsed + weeklyPlanColumn;

    return {
      statusCode: 200,
      body: JSON.stringify({
        lessonBalance: lessonBalance >= 0 ? lessonBalance : 0,
        weeklyBalance: weeklyBalance >= 0 ? weeklyBalance : 0,
        success: true
      })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ lessonBalance: 0, weeklyBalance: 0, success: false })
    };
  }
};
