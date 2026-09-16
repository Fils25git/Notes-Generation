
import { pool } from "./db.js";

export const handler = async (event) => {
    try {
        const { teacher_id } = event.queryStringParameters || {};
        const teacherId = Number(teacher_id);

        // --------------------------------
        // CHECK TEACHER ID
        // --------------------------------
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
        // GET TEACHER
        // --------------------------------
        const teacherRes = await pool.query(
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
        // GET CURRENT ACADEMIC YEAR
        // --------------------------------
        const yearRes = await pool.query(
            `
            SELECT *
            FROM academic_years
            WHERE is_current = TRUE
            ORDER BY start_date DESC NULLS LAST, id DESC
            LIMIT 1
            `
        );

        const currentYear = yearRes.rows[0] || null;

        if (!currentYear) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    students: 0,
                    classes: 0,
                    subjects: 0,
                    tests: 0,
                    academic_year: "No Year Set",
                    term: "No Term Set",
                    teacher: {
                        id: teacher.id,
                        name: teacher.name,
                        email: teacher.email,
                        phone: teacher.phone,
                        role: teacher.role
                    }
                })
            };
        }

        const academicYearId = currentYear.id;

        // --------------------------------
        // GET CURRENT TERM
        // --------------------------------
        const termRes = await pool.query(
            `
            SELECT t.*
            FROM terms t
            INNER JOIN academic_years ay
                ON t.academic_year_id = ay.id
            WHERE ay.id = $1
              AND t.is_current = TRUE
            ORDER BY t.term_number
            LIMIT 1
            `,
            [academicYearId]
        );

        const currentTerm = termRes.rows[0] || null;

        // --------------------------------
        // COUNT STUDENTS
        // --------------------------------
        const students = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM learners
            WHERE teacher_id = $1
              AND academic_year_id = $2
            `,
            [teacherId, academicYearId]
        );

        // --------------------------------
        // COUNT CLASSES
        // --------------------------------
        const classes = await pool.query(
            `
            SELECT COUNT(DISTINCT c.id) AS count
            FROM classes c
            INNER JOIN teacher_class_subjects tcs
                ON tcs.class_id = c.id
            WHERE c.teacher_id = $1
              AND tcs.teacher_id = $1
              AND tcs.academic_year_id = $2
            `,
            [teacherId, academicYearId]
        );

        // --------------------------------
        // COUNT SUBJECTS ACTUALLY TAUGHT
        // --------------------------------
        const subjects = await pool.query(
            `
            SELECT COUNT(DISTINCT tcs.subject_id) AS count
            FROM teacher_class_subjects tcs
            WHERE tcs.teacher_id = $1
              AND tcs.academic_year_id = $2
            `,
            [teacherId, academicYearId]
        );

        // --------------------------------
        // COUNT TESTS
        // --------------------------------
        const tests = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM subject_tests
            WHERE teacher_id = $1
              AND academic_year_id = $2
            `,
            [teacherId, academicYearId]
        );

        // --------------------------------
        // SUCCESS RESPONSE
        // --------------------------------
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,

                students: Number(students.rows[0].count),
                classes: Number(classes.rows[0].count),
                subjects: Number(subjects.rows[0].count),
                tests: Number(tests.rows[0].count),

                academic_year:
                    currentYear.year_name || "No Year Set",

                term:
                    currentTerm?.term_name || "No Term Set",

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

