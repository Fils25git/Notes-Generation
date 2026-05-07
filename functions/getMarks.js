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

        const { class_name, subject, school } = params;

        // SUBJECT → COLUMN
        const subjectMap = {
            "ENGLISH": "english",
            "MATHEMATICS": "mathematics",
            "MATH": "mathematics",
            "KINYARWANDA": "kinyarwanda",
            "SOCIAL AND RELIGIOUS STUDIES": "social_studies",
            "SST": "social_studies",
            "SCIENCE": "science",
            "SCIENCE AND ELEMENTARY STUDIES": "science",
            "CHEMISTRY": "chemistry",
            "PHYSICS": "physics",
            "BIOLOGY": "biology",
            "GEOGRAPHY": "geography",
            "HISTORY": "history",
            "ENTREPRENEURSHIP": "entrepreneurship"
        };

        const column = subjectMap[subject?.trim().toUpperCase()];

        if (!column) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Invalid subject"
                })
            };
        }

        const result = await client.query(
            `
            SELECT
                id,
                student_name,
                ${column} AS mark
            FROM students
            WHERE school_name = $1
            AND class_name = $2
            ORDER BY student_name ASC
            `,
            [school, class_name]
        );

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify(result.rows)
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
