import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const { teacher_id, class_name, subject, school } = JSON.parse(event.body);

        // ================= VALIDATION =================
        if (!teacher_id || !class_name || !subject) {
            await client.end();
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing required fields" })
            };
        }

        // ================= OPTIONAL: AVOID DUPLICATES =================
        const check = await client.query(
            `SELECT * FROM teacher_subjects 
             WHERE teacher_id = $1 AND class_name = $2 AND subject = $3`,
            [teacher_id, class_name, subject]
        );

        if (check.rows.length > 0) {
            await client.end();
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Subject already assigned to this teacher" })
            };
        }

        // ================= INSERT SUBJECT =================
        await client.query(
            `INSERT INTO teacher_subjects (teacher_id, class_name, subject, school_name)
             VALUES ($1, $2, $3, $4)`,
            [teacher_id, class_name, subject, school]
        );

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Subject added successfully"
            })
        };

    } catch (err) {
        await client.end();

        return {
            statusCode: 500,
            body: JSON.stringify({ message: err.message })
        };
    }
    }
