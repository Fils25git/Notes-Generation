import { Client } from 'pg';

// Connect to your Neon/Supabase database using environment variable
const client = new Client({
  connectionString: process.env.NEON_DATABASE_URL,
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { phone, amount, reference, status } = JSON.parse(event.body);

    if (!phone || !amount || !reference || !status) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    if (status !== 'SUCCESS') {
      return { statusCode: 400, body: 'Payment not successful' };
    }

    await client.connect();

    // Insert user if not exists, update balance
    const userRes = await client.query(
      `INSERT INTO users(phone, balance, last_payment_reference, last_payment_time)
       VALUES($1, $2, $3, NOW())
       ON CONFLICT (phone)
       DO UPDATE SET balance = users.balance + EXCLUDED.balance,
                     last_payment_reference = EXCLUDED.last_payment_reference,
                     last_payment_time = NOW()
       RETURNING id, balance`,
      [phone, amount, reference]
    );

    const userId = userRes.rows[0].id;

    // Record transaction
    await client.query(
      `INSERT INTO transactions(user_id, amount, reference, status)
       VALUES($1, $2, $3, $4)`,
      [userId, amount, reference, status]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Payment recorded successfully',
        balance: userRes.rows[0].balance
      }),
    };
  } catch (error) {
    return { statusCode: 500, body: 'Server error: ' + error.message };
  }
              }
