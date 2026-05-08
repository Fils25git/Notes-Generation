import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const params = event.queryStringParameters || {};

        const {
            school,
            role,
            username
        } = params;

        const cleanSchool = school && school !== "undefined"
            ? school.trim()
            : null;

        // ================= BASE QUERY =================
        let teacherQuery = `
            SELECT id, full_name, username, role, school
            FROM users
            WHERE role = 'teacher'
        `;

        const values = [];

        // ================= ROLE LOGIC =================

        // 🔵 teacher → ONLY themselves (SAFE)
        if (role === "teacher" && username) {
            teacherQuery += ` AND username = $1`;
            values.push(username);
        }

        // 🟡 school_admin → only their school
        else if (role === "school_admin" && cleanSchool) {
            teacherQuery += ` AND school = $1`;
            values.push(cleanSchool);
        }

        // 🔴 sector_admin → no filter

        const teachersResult = await client.query(teacherQuery, values);

        // ================= ASSIGNMENTS =================
        const assignmentsResult = await client.query(`
            SELECT teacher_id, class_name, subject
            FROM teacher_subjects
        `);

        // ================= MAP =================
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

        try { await client.end(); } catch (e) {}

        return {
            statusCode: 500,
            body: JSON.stringify({ message: err.message })
        };
    }
                }
