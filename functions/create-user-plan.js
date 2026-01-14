// create-user-plan.js
const { Client } = require("pg");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const body = JSON.parse(event.body);
    const { user_id, lesson_title, lesson_content, language } = body;

    if (!user_id || !lesson_title || !lesson_content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Missing required fields" })
      };
    }

    const query = `
      INSERT INTO user_lesson_plans(user_id, lesson_title, lesson_content, language)
      VALUES($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [user_id, lesson_title, lesson_content, language || 'english'];

    const res = await client.query(query, values);
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, plan: res.rows[0] })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: err.message })
    };
  }
};
