import { Client } from "pg";

export async function handler(event) {
  const userId = event.queryStringParameters?.user;

  if (!userId) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "User ID is required" })
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Daily plans
    const dailyPurchasedRes = await client.query(
      `SELECT COALESCE(SUM(lessons),0) AS total_purchased
       FROM payments
       WHERE user_id=$1 AND status='approved'`,
      [userId]
    );
    const dailyUsedRes = await client.query(
      `SELECT COALESCE(SUM(lessons_used),0) AS total_used
       FROM lesson_usage
       WHERE user_id=$1`,
      [userId]
    );
    const remainingDaily = Number(dailyPurchasedRes.rows[0].total_purchased || 0) - Number(dailyUsedRes.rows[0].total_used || 0);

    // Weekly plans
    const weeklyPurchasedRes = await client.query(
      `SELECT COALESCE(SUM(lessons),0) AS total_purchased
       FROM weekly_plan_payments
       WHERE user_id=$1 AND status='approved'`,
      [userId]
    );
    const weeklyUsedRes = await client.query(
      `SELECT COALESCE(SUM(lessons_used),0) AS total_used
       FROM weekly_p_lesson_usage
       WHERE user_id=$1`,
      [userId]
    );
    const remainingWeekly = Number(weeklyPurchasedRes.rows[0].total_purchased || 0) - Number(weeklyUsedRes.rows[0].total_used || 0);

    // User balance
    const userRes = await client.query(
      `SELECT balance FROM users WHERE id=$1`,
      [userId]
    );
    const balance = Number(userRes.rows[0]?.balance || 0);

    // Total paid
    const totalPaid = Number(dailyPurchasedRes.rows[0].total_purchased || 0) + Number(weeklyPurchasedRes.rows[0].total_purchased || 0);

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify({
        totals: {
          totalPaid,
          remainingDaily,
          remainingWeekly,
          balanceRemaining: balance
        }
      })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    await client.end();
  }
      }
