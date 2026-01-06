import { Client } from 'pg';

// Connect to Neon/Supabase database
const client = new Client({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Neon
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    // Parse body
    const { phone, amount, reference, status, email, lessons } = JSON.parse(event.body);

    if (!phone || !amount || !reference || !status) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    if (status !== 'SUCCESS') {
      return { statusCode: 400, body: 'Payment not successful' };
    }

    await client.connect();

    // --- Insert or update user ---
    const userRes = await client.query(
      `INSERT INTO users(phone, email, balance, last_payment_reference, last_payment_time)
       VALUES($1, $2, $3, $4, NOW())
       ON CONFLICT (phone)
       DO UPDATE SET 
         balance = users.balance + EXCLUDED.balance,
         last_payment_reference = EXCLUDED.last_payment_reference,
         last_payment_time = NOW(),
         email = COALESCE(EXCLUDED.email, users.email)
       RETURNING id, balance`,
      [phone, email || null, amount, reference]
    );

    const userId = userRes.rows[0].id;

    // --- Record transaction (existing) ---
    await client.query(
      `INSERT INTO transactions(user_id, amount, reference, status)
       VALUES($1, $2, $3, $4)`,
      [userId, amount, reference, status]
    );

    // --- NEW: Record pending payment for admin approval ---
    await client.query(
      `INSERT INTO payments(user_id, phone, amount, lessons, status, reference, created_at)
       VALUES($1, $2, $3, $4, 'pending', $5, NOW())`,
      [userId, phone, amount, lessons || 0, reference]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Payment recorded successfully. Await admin approval.',
        balance: userRes.rows[0].balance
      }),
    };
  } catch (error) {
    if (client) await client.end();
    return { statusCode: 500, body: 'Server error: ' + error.message };
  }
      }
