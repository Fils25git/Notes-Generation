const db = require("./db");

exports.handler = async () => {
  try {
    const result = await db.query(
      "SELECT id, full_name, email FROM teachers ORDER BY id ASC"
    );

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
