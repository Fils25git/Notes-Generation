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
      return {
        statusCode: 400,
        body: JSON.stringify([])
      };
    }

    const result = await pool.query(
      `SELECT 
          id,
          lesson_title,
          language,
          created_at
       FROM user_lesson_plans
       WHERE email = $1
       ORDER BY created_at DESC`,
      [email]
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };

  } catch (err) {
    console.error("Error fetching user plans:", err);
    return {
      statusCode: 500,
      body: JSON.stringify([])
    };
  }
}
