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

    // ⬇️ KEEP OLD VARIABLES (NOT REMOVED)
    const { user_id, lesson_title, lesson_content, language } = body;

    // ⬇️ ADD EMAIL (NEW – frontend sends this)
    const { email } = body;

    // ⬇️ KEEP VALIDATION BUT EXTEND IT
    if ((!user_id && !email) || !lesson_title || !lesson_content) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Missing required fields"
        })
      };
    }

    let finalUserId = user_id;

    // ⬇️ IF user_id NOT PROVIDED, FIND IT USING EMAIL
    if (!finalUserId && email) {
      const userQuery = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (userQuery.rowCount === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            message: "User not found"
          })
        };
      }

      finalUserId = userQuery.rows[0].id;
    }

    // ⬇️ KEEP ORIGINAL INSERT LOGIC
    const query = `
      INSERT INTO user_lesson_plans (user_id, lesson_title, lesson_content, language)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      finalUserId,
      lesson_title,
      lesson_content,
      language || "english"
    ];

    const res = await client.query(query, values);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        plan: res.rows[0]
      })
    };

  } catch (err) {
    console.error("CREATE USER PLAN ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: err.message
      })
    };
  }
};
