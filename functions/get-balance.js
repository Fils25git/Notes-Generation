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
        body: JSON.stringify({ balance: 0, referralBonus: 0, success: false })
      };
    }

    // 1️⃣ Get user ID + referral bonus
    const userRes = email
      ? await pool.query(
          'SELECT id, total_referral_bonus FROM users WHERE email = $1',
          [email]
        )
      : await pool.query(
          'SELECT id, total_referral_bonus FROM users WHERE phone = $1',
          [phone]
        );

    if (userRes.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ balance: 0, referralBonus: 0, success: false })
      };
    }

    const userId = userRes.rows[0].id;
    const referralBonus = userRes.rows[0].total_referral_bonus || 0;

    // 2️⃣ Total approved lessons purchased
    const paymentRes = await pool.query(
      'SELECT COALESCE(SUM(lessons),0) AS total_purchased FROM payments WHERE user_id=$1 AND status=$2',
      [userId, 'approved']
    );
    const totalPurchased = parseInt(paymentRes.rows[0].total_purchased, 10);

    // 3️⃣ Total lessons used
    const usageRes = await pool.query(
      'SELECT COALESCE(SUM(lessons_used),0) AS total_used FROM lesson_usage WHERE user_id=$1',
      [userId]
    );
    const totalUsed = parseInt(usageRes.rows[0].total_used, 10);

    // 4️⃣ Calculate available balance (without referral bonus)
    const balance = totalPurchased - totalUsed;

    return {
      statusCode: 200,
      body: JSON.stringify({
        balance: balance > 0 ? balance : 0,
        referralBonus: referralBonus,
        success: true
      })
    };

  } catch (err) {
    console.error('Lesson balance error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ balance: 0, referralBonus: 0, success: false })
    };
  }
                              }
