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
        body: JSON.stringify({ success: false, referralCode: null })
      };
    }

    // 1️⃣ Get user
    const userRes = email
      ? await pool.query('SELECT referral_code FROM users WHERE email=$1', [email])
      : await pool.query('SELECT referral_code FROM users WHERE phone=$1', [phone]);

    if (userRes.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, referralCode: null })
      };
    }

    const referralCode = userRes.rows[0].referral_code;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, referralCode })
    };

  } catch (err) {
    console.error('Get referral code error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, referralCode: null })
    };
  }
}
