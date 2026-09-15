import db from "./db.js";

export const handler = async (event) => {
  try {
    const { teacher_id } = event.queryStringParameters || {};

    const teacherId = Number(teacher_id);

    if (!teacherId) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Teacher ID is required"
        })
      };
    }

    // --------------------------------
    // TEACHER
    // --------------------------------
    const teacherRes = await db.query(
      `
      SELECT id, name, email, phone, role
      FROM users
      WHERE id = $1
      `,
      [teacherId]
    );

    if (!teacherRes.rows.length) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "User not found"
        })
      };
    }

    const teacher = teacherRes.rows[0];

    // --------------------------------
    // COUNTS FOR THIS TEACHER ONLY
    // --------------------------------

    const students = await db.query(
      `
      SELECT COUNT(*)
      FROM learners
      WHERE teacher_id = $1
      `,
      [teacherId]
    );

    const classes = await db.query(
      `
      SELECT COUNT(*)
      FROM classes
      WHERE teacher_id = $1
      `,
      [teacherId]
    );

    const subjects = await db.query(
      `
      SELECT COUNT(*)
      FROM subjects
      WHERE teacher_id = $1
      `,
      [teacherId]
    );

    const tests = await db.query(
      `
      SELECT COUNT(*)
      FROM subject_tests
      WHERE teacher_id = $1
      `,
      [teacherId]
    );

    // --------------------------------
    // CURRENT ACADEMIC YEAR
    // --------------------------------

    const yearRes = await db.query(
      `
      SELECT *
      FROM academic_years
      WHERE is_current = true
      ORDER BY id DESC
      LIMIT 1
      `
    );

    const currentYear = yearRes.rows[0] || null;

    // --------------------------------
    // CURRENT TERM
    // --------------------------------

    const termRes = await db.query(
      `
      SELECT *
      FROM terms
      ORDER BY term_number DESC
      LIMIT 1
      `
    );

    const currentTerm = termRes.rows[0] || null;

    // --------------------------------
    // RESPONSE
    // --------------------------------

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,

        students: Number(students.rows[0].count),
        classes: Number(classes.rows[0].count),
        subjects: Number(subjects.rows[0].count),
        tests: Number(tests.rows[0].count),

        academic_year: currentYear?.year_name || "No Year Set",
        term: currentTerm?.term_name || "No Term Set",

        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          role: teacher.role
        }
      })
    };

  } catch (error) {
    console.error("Dashboard Stats Error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
