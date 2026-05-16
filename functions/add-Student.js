const db = require("./db");

exports.handler = async (event) => {

  try {

    const {
      full_name,
      gender,
      class_id
    } = JSON.parse(event.body);

    // =========================
    // CURRENT ACADEMIC YEAR
    // =========================
    const currentYearRes = await db.query(
      `SELECT *
       FROM academic_years
       WHERE is_current = true
       LIMIT 1`
    );

    const currentYear =
      currentYearRes.rows[0];

    if (!currentYear) {

      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No active academic year"
        })
      };
    }

    // =========================
    // INSERT LEARNER
    // =========================
    const result = await db.query(
      `INSERT INTO learners (

          full_name,
          gender,
          class_id,
          academic_year_id

      )

      VALUES ($1, $2, $3, $4)

      RETURNING *`,
      [
        full_name,
        gender,
        class_id,
        currentYear.id
      ]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Learner added successfully",
        learner: result.rows[0]
      })
    };

  }

  // =========================
  // ERROR
  // =========================
  catch (error) {

    console.log(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
