import { query } from './db.js'; // your Postgres helper

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      };
    }

    const { email, newPlan } = JSON.parse(event.body);

    if (!email || !newPlan) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Email and lesson plan are required' }),
      };
    }

    // 1️⃣ Fetch existing plans
    const res = await query('SELECT lesson_plans FROM users WHERE email = $1', [email]);
    let existingPlans = res.rows[0]?.lesson_plans || [];

    // 2️⃣ Add the new plan to the beginning (most recent first)
    existingPlans.unshift(newPlan);

    // 3️⃣ Keep only the 10 most recent
    const recentPlans = existingPlans.slice(0, 10);

    // 4️⃣ Save back to DB
    await query(
      `UPDATE users SET lesson_plans = $1 WHERE email = $2`,
      [JSON.stringify(recentPlans), email]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, plans: recentPlans }),
    };
  } catch (err) {
    console.error('Error saving lesson plans:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
          }
