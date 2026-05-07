import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const data = JSON.parse(event.body);

        const { marks, subject } = data;

        // ✅ SUBJECT MAPPING
        const subjectMap = {
            "ENGLISH": "english",
            "MATHEMATICS": "mathematics",
            "MATH": "mathematics",
            "KINYARWANDA": "kinyarwanda",
            "SOCIAL AND RELIGIOUS STUDIES": "social_studies",
            "SST": "social_studies",
            "SCIENCE": "science",
            "CHEMISTRY": "chemistry",
            "PHYSICS": "physics",
            "BIOLOGY": "biology",
            "GEOGRAPHY": "geography",
            "HISTORY": "history",
            "ENTREPRENEURSHIP": "entrepreneurship"
        };

        const cleanSubject = subject?.trim().toUpperCase();
const column = subjectMap[cleanSubject];

        if (!column) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Invalid subject"
                })
            };
        }

        // ✅ VALIDATION
        if (!Array.isArray(marks) || marks.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "No marks provided"
                })
            };
        }

        for (let m of marks) {

            const studentId = m.student_id;
            const mark = Number(m.mark);

            if (!studentId || isNaN(mark)) continue;

            await client.query(
                `UPDATE students SET ${column} = $1 WHERE id = $2`,
                [mark, studentId]
            );
        }

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Marks saved successfully"
            })
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
