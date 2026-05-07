import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const { school } = event.queryStringParameters || {};

        // 1. GET TEACHERS ONLY
        let teacherQuery = `
            SELECT id, full_name, username, role, school
            FROM users
            WHERE role = 'teacher'
        `;

        let params = [];

        if (school) {
            teacherQuery += ` AND school = $1`;
            params.push(school);
        }

        const teachersResult = await client.query(teacherQuery, params);
        const teachers = teachersResult.rows;

        // 2. GET SUBJECT ASSIGNMENTS
        const assignmentsResult = await client.query(`
            SELECT teacher_id, class_name, subject
            FROM teacher_subjects
        `);

        const assignments = assignmentsResult.rows;

        // 3. MERGE DATA
        const formatted = teachers.map(t => {
            const teacherSubjects = assignments
                .filter(a => a.teacher_id === t.id)
                .map(a => ({
                    class_name: a.class_name,
                    subject: a.subject
                }));

            return {
                ...t,
                assignments: teacherSubjects
            };
        });

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify(formatted)
        };

    } catch (err) {
        await client.end();

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: err.message
            })
        };
    }
          }
