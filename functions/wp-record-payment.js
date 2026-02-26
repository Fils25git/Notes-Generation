import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Neon
});

// Utility to record bonus separately
async function recordTotalBonus(paymentId, referrerId, bonusLessons, type = 'normal') {
  if (!paymentId || !referrerId || bonusLessons <= 0) return;

  try {
    if (type === 'normal') {
      // Add bonus to referrer balance
      await pool.query(
        'UPDATE users SET balance = balance + $1 WHERE id=$2',
        [bonusLessons, referrerId]
      );

      // Save total bonus in payment record
      await pool.query(
        'UPDATE payments SET total_bonus=$1 WHERE id=$2',
        [bonusLessons, paymentId]
      );
    } else if (type === 'weekly') {
      // Add bonus to weekly plan (if you have weekly payments)
      await pool.query(
        'UPDATE users SET weekly_plan = weekly_plan + $1 WHERE id=$2',
        [bonusLessons, referrerId]
      );

      // Save total bonus in weekly payment
      await pool.query(
        'UPDATE weekly_plan_payments SET total_bonus=$1 WHERE id=$2',
        [bonusLessons, paymentId]
      );
    }
    console.log(`Bonus recorded: ${bonusLessons} lessons for referrer ${referrerId}`);
  } catch (err) {
    console.error('Error recording total bonus:', err);
  }
}

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
      'SELECT id, referred_by FROM users WHERE phone=$1 OR email=$2',
      [phone, email || null]
    );

    let userId;
    let referredBy = null;
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      referredBy = userRes.rows[0].referred_by;
    } else {
      // Create user if not exists
      const referralCode = 'REF' + Date.now();

      const newUser = await pool.query(
        `INSERT INTO users(phone, email, balance, referral_code)
         VALUES($1, $2, 0, $3)
         RETURNING id`,
        [phone, email || null, referralCode]
      );
      userId = newUser.rows[0].id;
    }

    // 2️⃣ Insert pending payment
    const reference = 'LP' + Date.now();
    const insertRes = await pool.query(
      `INSERT INTO payments(user_id, phone, amount, lessons, status, reference, created_at)
       VALUES($1, $2, $3, $4, 'pending', $5, NOW())
       RETURNING id`,
      [userId, phone, amount, lessons, reference]
    );

    const paymentId = insertRes.rows[0].id;

    // 3️⃣ Automatically calculate and record referral bonus
    if (referredBy) {
      const bonusLessons = Math.floor(lessons * 0.10);
      await recordTotalBonus(paymentId, referredBy, bonusLessons, 'normal');
    }

    return {
      statusCode: 200,
      body: 'Payment recorded as pending. Admin will approve shortly.'
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Server error: ' + err.message };
  }
           }
