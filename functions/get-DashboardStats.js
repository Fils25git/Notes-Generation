const db = require("./db");

exports.handler = async (event) => {
  try {

    // COUNTS
    const students = await db.query("SELECT COUNT(*) FROM students");
    const classes = await db.query("SELECT COUNT(*) FROM classes");
    const subjects = await db.query("SELECT COUNT(*) FROM subjects");
    const tests = await db.query("SELECT COUNT(*) FROM tests");

    // CURRENT ACADEMIC YEAR
    const yearRes = await db.query(
      "SELECT * FROM academic_years WHERE is_current = true LIMIT 1"
    );

    const currentYear = yearRes.rows[0];

    // CURRENT TERM (based on current year)
    let currentTerm = null;

    if (currentYear) {
      const termRes = await db.query(
        "SELECT * FROM terms WHERE academic_year_id = $1 ORDER BY id DESC LIMIT 1",
        [currentYear.id]
      );

      currentTerm = termRes.rows[0];
    }

    // TEACHER (from frontend localStorage is safer, but optional DB fetch)
    const { teacher_id } = event.queryStringParameters || {};

    let teacher = null;

    if (teacher_id) {
      const teacherRes = await db.query(
        "SELECT id, full_name, email FROM teachers WHERE id = $1",
        [teacher_id]
      );

      teacher = teacherRes.rows[0];
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        students: students.rows[0].count,
        classes: classes.rows[0].count,
        subjects: subjects.rows[0].count,
        tests: tests.rows[0].count,

        academic_year: currentYear?.year_name || "No Year Set",
        term: currentTerm?.term_name || "No Term Set",

        teacher
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
