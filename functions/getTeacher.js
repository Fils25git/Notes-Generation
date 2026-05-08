import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const {
            school,
            role
        } = event.queryStringParameters || {};

        // ================= CLEAN INPUT =================
        const cleanSchool = school && school !== "undefined"
            ? school.trim()
            : null;

        // ================= BASE QUERY =================
        let teacherQuery = `
            SELECT id, full_name, username, role, school
            FROM users
            WHERE role = 'teacher'
        `;

        const params = [];

        // ================= ROLE LOGIC =================
        // teacher → only themselves (optional future use)
        if (role === "teacher") {
            teacherQuery += ` AND username = $1`;
            params.push(event.queryStringParameters?.username);
        }

        // school_admin → only their school
        else if (role === "school_admin" && cleanSchool) {
            teacherQuery += ` AND school = $1`;
            params.push(cleanSchool);
        }

        // sector_admin → NO filter (sees everything)

        const teachersResult = await client.query(teacherQuery, params);

        // ================= ASSIGNMENTS =================
        const assignmentsResult = await client.query(`
            SELECT teacher_id, class_name, subject
            FROM teacher_subjects
        `);

        // ================= MAP ASSIGNMENTS =================
        const assignmentMap = {};

        for (const a of assignmentsResult.rows) {

            const key = String(a.teacher_id);

            if (!assignmentMap[key]) {
                assignmentMap[key] = [];
            }

            assignmentMap[key].push({
                class_name: a.class_name,
                subject: a.subject
            });
        }

        // ================= MERGE =================
        const formatted = teachersResult.rows.map(t => ({
            ...t,
            assignments: assignmentMap[String(t.id)] || []
        }));

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify(formatted)
        };

    } catch (err) {

        try {
            await client.end();
        } catch (e) {}

        return {
            statusCode: 500,
            body: JSON.stringify({ message: err.message })
        };
    }
                    }
