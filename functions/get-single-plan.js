import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  try {
    const id = event.queryStringParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Plan ID required" })
      };
    }

    const result = await pool.query(
      `SELECT 
          id,
          email,
          lesson_title,
          lesson_content, -- RAW HTML
          lesson_text,    -- CLEAN TEXT
          language,
          created_at
       FROM user_lesson_plans
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Plan not found" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows[0])
    };

  } catch (err) {
    console.error("Get plan error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" })
    };
  }
}
