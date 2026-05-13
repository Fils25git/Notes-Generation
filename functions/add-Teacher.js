const db = require("./db");

exports.handler = async (event) => {
  try {
    const {
      full_name,
      email,
      password
    } = JSON.parse(event.body);

    const result = await db.query(
      `INSERT INTO teachers (full_name, email, password)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [full_name, email, password]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Teacher created",
        teacher: result.rows[0]
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
