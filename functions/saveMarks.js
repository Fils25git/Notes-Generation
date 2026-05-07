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

        // ================= SUBJECT MAPPING =================
        const subjectMap = {
            "ENGLISH": "english",
            "MATHEMATICS": "mathematics",
            "MATH": "mathematics",
            "KINYARWANDA": "kinyarwanda",

            "SOCIAL AND RELIGIOUS STUDIES": "social_studies",
            "SOCIAL STUDIES": "social_studies",
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

        const cleanSubject = subject?.trim().toUpperCase();
        const column = subjectMap[cleanSubject];

        if (!column) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid subject" })
            };
        }

        // ================= VALIDATION =================
        if (!Array.isArray(marks) || marks.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "No marks provided" })
            };
        }

        // ================= 1. SAVE MARKS =================
        for (let m of marks) {

            const studentId = m.student_id;
            const mark = Number(m.mark);

            if (!studentId || isNaN(mark)) continue;

            await client.query(
                `UPDATE students SET ${column} = $1 WHERE id = $2`,
                [mark, studentId]
            );
        }

        // ================= 2. UPDATE TOTAL =================
        await client.query(`
            UPDATE students
            SET total =
                COALESCE(english,0) +
                COALESCE(mathematics,0) +
                COALESCE(kinyarwanda,0) +
                COALESCE(social_studies,0) +
                COALESCE(science,0) +
                COALESCE(chemistry,0) +
                COALESCE(physics,0) +
                COALESCE(biology,0) +
                COALESCE(geography,0) +
                COALESCE(history,0) +
                COALESCE(entrepreneurship,0)
        `);

        // ================= 3. UPDATE PERCENTAGE =================
        await client.query(`
            UPDATE students
            SET percentage =
            CASE
                WHEN class_name = 'Primary 6' THEN total / 5
                WHEN class_name = 'Senior 3' THEN total / 9
                ELSE 0
            END
        `);

        // ================= 4. UPDATE POSITION =================
        await client.query(`
            WITH ranked AS (
                SELECT
                    id,
                    RANK() OVER (
                        PARTITION BY class_name
                        ORDER BY total DESC
                    ) AS pos
                FROM students
            )
            UPDATE students s
            SET position = r.pos
            FROM ranked r
            WHERE s.id = r.id;
        `);

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
