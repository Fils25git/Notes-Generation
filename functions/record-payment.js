import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Neon
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { phone, amount, reference, status, email, lessons } = JSON.parse(event.body);

    if (!phone || !amount || !status) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    if (status !== 'SUCCESS' && status !== 'pending') {
      return { statusCode: 400, body: 'Payment not successful' };
    }

    // --- Insert or update user ---
    const userRes = await pool.query(
      `INSERT INTO users(phone, email)
VALUES($1, $2)
ON CONFLICT (phone) DO NOTHING,
      [phone, email || null, amount, reference]
    );

    const userId = userRes.rows[0].id;

    // --- Record transaction ---
    await pool.query(
      `INSERT INTO transactions(user_id, amount, reference, status)
       VALUES($1, $2, $3, $4)`,
      [userId, amount, reference, status]
    );

    // --- Record payment for admin approval ---
    await pool.query(
      `INSERT INTO payments(user_id, phone, amount, lessons, status, reference, created_at)
       VALUES($1, $2, $3, $4, $5, $6, NOW())`,
      [
        userId,
        phone,
        amount,
        lessons ? lessons : 0, // default 0 if lessons not passed
        status,
        reference
      ]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: status === 'pending'
          ? 'Payment recorded as pending. Admin will approve shortly.'
          : 'Payment recorded successfully',
        balance: userRes.rows[0].balance
      }),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Server error: ' + error.message };
  }
        }
