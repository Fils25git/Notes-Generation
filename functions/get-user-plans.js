import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  try {
    const email = event.queryStringParameters?.email;

    if (!email) {
      return { statusCode: 400, body: JSON.stringify([]) };
    }

    // Get user id
    const userRes = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (userRes.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify([]) };
    }

    const userId = userRes.rows[0].id;

    // Get last 10 plans
    const plansRes = await pool.query(
      `SELECT id, lesson_title, created_at
       FROM user_lesson_plans
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    return {
      statusCode: 200,
      body: JSON.stringify(plansRes.rows)
    };

  } catch (err) {
    console.error("Error fetching plans:", err);
    return { statusCode: 500, body: JSON.stringify([]) };
  }
  }
