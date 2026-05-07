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

        // ✅ SAFE SUBJECT MAPPING
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

        const column = subjectMap[subject];

        if (!column) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Invalid subject"
                })
            };
        }

        for (let m of marks) {

            const studentId = m.student_id;
            const mark = Number(m.mark);

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
