const db = require("./db");

exports.handler = async (event) => {
  try {
    const {
      student_id,
      test_id,
      score
    } = JSON.parse(event.body);

    const result = await db.query(
      `INSERT INTO marks (student_id, test_id, score)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, test_id)
       DO UPDATE SET score = EXCLUDED.score
       RETURNING *`,
      [student_id, test_id, score]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Mark saved",
        data: result.rows[0]
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
