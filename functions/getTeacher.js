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

        // ================= GET TEACHERS =================
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

        // ================= GET ASSIGNMENTS =================
        const assignmentsResult = await client.query(`
            SELECT teacher_id, class_name, subject
            FROM teacher_subjects
        `);

        // ================= GROUP ASSIGNMENTS =================
        const assignmentMap = new Map();

        for (const a of assignmentsResult.rows) {

            const key = Number(a.teacher_id);

            if (!assignmentMap.has(key)) {
                assignmentMap.set(key, []);
            }

            assignmentMap.get(key).push({
                class_name: a.class_name,
                subject: a.subject
            });
        }

        // ================= MERGE =================
        const formatted = teachersResult.rows.map(t => ({
            ...t,
            assignments: assignmentMap.get(Number(t.id)) || []
        }));

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify(formatted)
        };

    } catch (err) {
        await client.end();

        return {
            statusCode: 500,
            body: JSON.stringify({ message: err.message })
        };
    }
}
