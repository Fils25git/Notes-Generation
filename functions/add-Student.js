const db = require("./db");

exports.handler = async (event) => {
  try {
    const {
      full_name,
      gender,
      reg_number,
      class_id
    } = JSON.parse(event.body);

    const result = await db.query(
      `INSERT INTO students (full_name, gender, class_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [full_name, gender, class_id]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Student added",
        student: result.rows[0]
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
