const db = require("./db");

exports.handler = async () => {
  try {

    const students = await db.query("SELECT COUNT(*) FROM students");
    const classes = await db.query("SELECT COUNT(*) FROM classes");
    const subjects = await db.query("SELECT COUNT(*) FROM subjects");
    const tests = await db.query("SELECT COUNT(*) FROM tests");

    return {
      statusCode: 200,
      body: JSON.stringify({
        students: students.rows[0].count,
        classes: classes.rows[0].count,
        subjects: subjects.rows[0].count,
        tests: tests.rows[0].count
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
