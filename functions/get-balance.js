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

    // 1️⃣ Get user id
    const userRes = await pool.query(
      'SELECT id, email, phone FROM users WHERE email=$1 OR phone=$2',
      [email || '', phone || '']
    );

    if (userRes.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ balance: 0 }) };
    }

    const userId = userRes.rows[0].id;

    // 2️⃣ Sum approved lesson plans
    const paymentRes = await pool.query(
      'SELECT COALESCE(SUM(lessons),0) AS balance FROM payments WHERE user_id=$1 AND status=$2',
      [userId, 'approved']
    );

    const balance = parseInt(paymentRes.rows[0].balance);

    return {
      statusCode: 200,
      body: JSON.stringify({ balance })
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Server error' };
  }
      }
