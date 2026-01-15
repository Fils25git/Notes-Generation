const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const {
      email,
      lesson_title,
      lesson_content,
      lesson_text,
      language
    } = JSON.parse(event.body);

    if (!email || !lesson_title || !lesson_content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" })
      };
    }

    // Fallback: strip HTML if lesson_text not provided
    const cleanText =
      lesson_text || lesson_content.replace(/<[^>]*>/g, "");

    const result = await pool.query(
      `
      INSERT INTO user_lesson_plans
      (email, lesson_title, lesson_content, lesson_text, language, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
      `,
      [email, lesson_title, lesson_content, cleanText, language || "english"]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        plan_id: result.rows[0].id
      })
    };

  } catch (err) {
    console.error("Save plan error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error" })
    };
  }
};
