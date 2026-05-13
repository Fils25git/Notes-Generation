const db = require("./db");

exports.handler = async (event) => {
  try {
    const class_id = event.queryStringParameters?.class_id;

    let result;

    if (class_id) {
      result = await db.query(
        "SELECT * FROM learners WHERE class_id = $1 ORDER BY id ASC",
        [class_id]
      );
    } else {
      result = await db.query(
        "SELECT * FROM learners ORDER BY id ASC"
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
