
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
        // CURRENT ACADEMIC YEAR
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

        // --------------------------------
        // CURRENT TERM
        // --------------------------------
        let currentTerm = null;

        if (currentYear) {
            const termRes = await pool.query(
                `
                SELECT t.*
                FROM terms t
                WHERE t.academic_year_id = $1
                  AND t.is_current = TRUE
                ORDER BY t.term_number
                LIMIT 1
                `,
                [currentYear.id]
            );

            currentTerm = termRes.rows[0] || null;
        }

        // --------------------------------
        // COUNT STUDENTS
        // --------------------------------
        let studentsCount = 0;

        if (currentYear) {
            const students = await pool.query(
                `
                SELECT COUNT(*) AS count
                FROM learners
                WHERE teacher_id = $1
                  AND academic_year_id = $2
                `,
                [teacherId, currentYear.id]
            );

            studentsCount = Number(students.rows[0].count);
        }

        // --------------------------------
        // COUNT CLASSES
        // --------------------------------
        let classesCount = 0;

        if (currentYear) {
            const classes = await pool.query(
                `
                SELECT COUNT(DISTINCT class_id) AS count
                FROM teacher_class_subjects
                WHERE teacher_id = $1
                  AND academic_year_id = $2
                `,
                [teacherId, currentYear.id]
            );

            classesCount = Number(classes.rows[0].count);
        }

        // --------------------------------
        // COUNT SUBJECTS
        // --------------------------------
        let subjectsCount = 0;

        if (currentYear) {
            const subjects = await pool.query(
                `
                SELECT COUNT(DISTINCT LOWER(TRIM(subject_name))) AS count
                FROM teacher_class_subjects
                WHERE teacher_id = $1
                  AND academic_year_id = $2
                  AND subject_name IS NOT NULL
                  AND TRIM(subject_name) <> ''
                `,
                [teacherId, currentYear.id]
            );

            subjectsCount = Number(subjects.rows[0].count);
        }

        // --------------------------------
        // COUNT TESTS
        // --------------------------------
        let testsCount = 0;

        if (currentYear) {
            const tests = await pool.query(
                `
                SELECT COUNT(*) AS count
                FROM subject_tests
                WHERE teacher_id = $1
                  AND academic_year_id = $2
                `,
                [teacherId, currentYear.id]
            );

            testsCount = Number(tests.rows[0].count);
        }

        // --------------------------------
        // SUCCESS RESPONSE
        // --------------------------------
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,

                students: studentsCount,
                classes: classesCount,
                subjects: subjectsCount,
                tests: testsCount,

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
