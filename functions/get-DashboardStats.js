
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
        // COUNT STUDENTS
        // --------------------------------
        const students = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM learners
            WHERE teacher_id = $1
            `,
            [teacherId]
        );

        // --------------------------------
        // COUNT CLASSES
        // --------------------------------
        const classes = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM classes
            WHERE teacher_id = $1
            `,
            [teacherId]
        );

        // --------------------------------
        // COUNT SUBJECTS
        // --------------------------------
        const subjects = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM subjects
            WHERE teacher_id = $1
            `,
            [teacherId]
        );

        // --------------------------------
        // COUNT TESTS
        // --------------------------------
        const tests = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM subject_tests
            WHERE teacher_id = $1
            `,
            [teacherId]
        );

        // --------------------------------
        // CURRENT ACADEMIC YEAR
        // --------------------------------
        const yearRes = await pool.query(
            `
            SELECT *
            FROM academic_years
            WHERE is_current = true
            ORDER BY start_date DESC, id DESC
            LIMIT 1
            `
        );

        const currentYear = yearRes.rows[0] || null;

        // --------------------------------
        // CURRENT TERM
        // --------------------------------
        const termRes = await pool.query(
            `
            SELECT t.*
            FROM terms t
            INNER JOIN academic_years ay
                ON t.academic_year_id = ay.id
            WHERE ay.is_current = true
              AND t.is_current = true
            LIMIT 1
            `
        );

        const currentTerm = termRes.rows[0] || null;

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
                    currentYear?.year_name || "No Year Set",

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

