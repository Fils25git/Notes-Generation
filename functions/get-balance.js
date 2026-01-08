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
      'SELECT id FROM users WHERE email=$1 OR phone=$2',
      [email || '', phone || '']
    );

    if (userRes.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ balance: 0, success: false }) };
    }

    const userId = userRes.rows[0].id;

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

    // 4️⃣ Calculate available balance
    const balance = totalPurchased - totalUsed;

    return {
      statusCode: 200,
      body: JSON.stringify({ balance: balance >= 0 ? balance : 0, success: true })
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ balance: 0, success: false }) };
  }
              }
