import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Neon
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { phone, email, amount, lessons } = JSON.parse(event.body);

    if (!phone || !amount || !lessons) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    // 1️⃣ Get user by phone or email
    let userRes = await pool.query(
      'SELECT id FROM users WHERE phone=$1 OR email=$2',
      [phone, email || null]
    );

    let userId;
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
    } else {
      // Create user if not exists
      const newUser = await pool.query(
        'INSERT INTO users(phone, email, balance) VALUES($1, $2, 0) RETURNING id',
        [phone, email || null]
      );
      userId = newUser.rows[0].id;
    }

    // 2️⃣ Insert pending payment
    const reference = 'LP' + Date.now();
    await pool.query(
      `INSERT INTO payments(user_id, phone, amount, lessons, status, reference, created_at)
       VALUES($1, $2, $3, $4, 'initiated', $5, NOW())`,
      [userId, phone, amount, lessons, reference]
    );

    return {
      statusCode: 200,
      body: 'Payment initiated successfully.'
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Server error: ' + err.message };
  }
            }
