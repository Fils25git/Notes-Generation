// functions/record-payment.js

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Neon
});

// Server-side function to calculate lessons
function calculateLessons(amount) {
  if (amount >= 1000) return Math.floor(amount / 10);
  if (amount >= 500) return Math.floor(amount / (500 / 45));
  if (amount >= 250) return Math.floor(amount / (250 / 20));
  if (amount >= 20) return Math.floor(amount / 20);
  return 0;
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { phone, email, amount, reference, status } = JSON.parse(event.body);

    if (!phone || !amount || !status) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    // --- Step 1: Find existing user or insert new ---
    let userRes = await pool.query(
      `SELECT id, balance FROM users WHERE phone=$1 OR email=$2`,
      [phone, email || null]
    );

    let userId;
    let currentBalance = 0;

    if (userRes.rowCount === 0) {
      const insertRes = await pool.query(
        `INSERT INTO users(phone, email, balance) VALUES($1, $2, 0) RETURNING id, balance`,
        [phone, email || null]
      );
      userId = insertRes.rows[0].id;
      currentBalance = Number(insertRes.rows[0].balance);
    } else {
      userId = userRes.rows[0].id;
      currentBalance = Number(userRes.rows[0].balance);
    }

    // --- Step 2: Calculate lessons ---
    const lessonCount = calculateLessons(Number(amount));

    if (lessonCount <= 0) {
      return { statusCode: 400, body: 'Amount too low for lesson plans' };
    }

    // --- Step 3: Record payment ---
    await pool.query(
      `INSERT INTO payments(user_id, phone, amount, lessons, status, reference, created_at)
       VALUES($1, $2, $3, $4, $5, $6, NOW())`,
      [userId, phone, amount, lessonCount, status, reference]
    );

    // --- Step 4: Record transaction ---
    await pool.query(
      `INSERT INTO transactions(user_id, amount, reference, status)
       VALUES($1, $2, $3, $4)`,
      [userId, amount, reference, status]
    );

    // --- Step 5: Update balance immediately if payment is SUCCESS ---
    let newBalance = currentBalance;
    if (status === 'SUCCESS') {
      newBalance += lessonCount;
      await pool.query(
        `UPDATE users SET balance=$1 WHERE id=$2`,
        [newBalance, userId]
      );
    }

    // --- Step 6: Return message and current balance ---
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: status === 'pending'
          ? 'Payment recorded as pending. Admin will approve shortly.'
          : 'Payment recorded successfully',
        balance: newBalance
      })
    };

  } catch (error) {
    console.error('Record payment error:', error);
    return { statusCode: 500, body: 'Server error: ' + error.message };
  }
      }
