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
      return { statusCode: 400, body: JSON.stringify({ balance: 0 }) };
    }

    // 1️⃣ Get user id
    let userRes = await pool.query(
      'SELECT id FROM users WHERE email=$1 OR phone IS NOT DISTINCT FROM $2',
      [email || '', phone]
    );

    let userId;
    if (userRes.rows.length === 0 && phone) {
      // fallback to phone only
      const fallbackRes = await pool.query(
        'SELECT id FROM users WHERE phone=$1',
        [phone]
      );
      if (fallbackRes.rows.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ balance: 0 }) };
      }
      userId = fallbackRes.rows[0].id;
    } else if (userRes.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ balance: 0 }) };
    } else {
      userId = userRes.rows[0].id;
    }

    // 2️⃣ Sum approved lesson plans
    const paymentRes = await pool.query(
      'SELECT COALESCE(SUM(lessons),0) AS balance FROM payments WHERE user_id=$1 AND status=$2',
      [userId, 'approved']
    );

    const balance = Number(paymentRes.rows[0].balance) || 0;

    return {
      statusCode: 200,
      body: JSON.stringify({ balance })
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ balance: 0 }) };
  }
  }
