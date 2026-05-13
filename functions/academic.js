const db = require("./db");

exports.handler = async (event) => {
  try {

    const action = event.queryStringParameters?.action;

    // =========================
    // GET ALL YEARS
    // =========================
    if (action === "getYears") {

      const result = await db.query(
        "SELECT * FROM academic_years ORDER BY id DESC"
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result.rows)
      };
    }

    // =========================
    // ADD YEAR
    // =========================
    if (action === "addYear") {

      const { year_name } = JSON.parse(event.body);

      const result = await db.query(
        `INSERT INTO academic_years (year_name, is_current)
         VALUES ($1, false)
         RETURNING *`,
        [year_name]
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result.rows[0])
      };
    }

    // =========================
    // SET ACTIVE YEAR
    // =========================
    if (action === "setActive") {

      const { id } = JSON.parse(event.body);

      await db.query("UPDATE academic_years SET is_current = false");

      const result = await db.query(
        `UPDATE academic_years
         SET is_current = true
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result.rows[0])
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid action" })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
