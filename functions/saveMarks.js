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
        const { marks, subject, school, class_name } = data;

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

        const column = subjectMap[subject?.trim().toUpperCase()];

        if (!column) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid subject" })
            };
        }

        // 1️⃣ SAVE MARKS
        for (let m of marks) {

            const studentId = m.student_id;
            const mark = Number(m.mark);

            if (!studentId || isNaN(mark)) continue;

            await client.query(
                `UPDATE students SET ${column} = $1 WHERE id = $2`,
                [mark, studentId]
            );
        }

        // 2️⃣ UPDATE TOTAL + PERCENTAGE (ALL SUBJECTS SUM)
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
            WHERE school_name = $1 AND class_name = $2
        `, [school, class_name]);

        // 3️⃣ UPDATE PERCENTAGE (OUT OF 600 MARKS)
        await client.query(`
            UPDATE students
            SET percentage = ROUND((total / 600.0) * 100, 2)
            WHERE school_name = $1 AND class_name = $2
        `, [school, class_name]);

        // 4️⃣ UPDATE POSITION (RANKING)
        await client.query(`
            WITH ranked AS (
                SELECT id,
                RANK() OVER (ORDER BY total DESC) AS pos
                FROM students
                WHERE school_name = $1 AND class_name = $2
            )
            UPDATE students s
            SET position = r.pos
            FROM ranked r
            WHERE s.id = r.id
        `, [school, class_name]);

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Marks, total, percentage and positions updated"
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
