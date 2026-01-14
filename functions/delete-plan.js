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
      return { statusCode: 400, body: JSON.stringify({ error: "ID required" }) };
    }

    await pool.query(
      `DELETE FROM user_lesson_plans WHERE id = $1`,
      [id]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error("Delete error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
}
