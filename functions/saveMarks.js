import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        await client.query("BEGIN"); // 🔥 START TRANSACTION

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

        if (!column) throw new Error("Invalid subject");

        // 1️⃣ SAVE MARKS
        for (let m of marks) {
            await client.query(
                `UPDATE students SET ${column} = $1 WHERE id = $2`,
                [m.mark, m.student_id]
            );
        }

        // 2️⃣ RECALCULATE TOTAL
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

        // 3️⃣ RECALCULATE PERCENTAGE
        await client.query(`
            UPDATE students
            SET percentage = ROUND((total / 600.0) * 100, 2)
            WHERE school_name = $1 AND class_name = $2
        `, [school, class_name]);

        // 4️⃣ RECALCULATE POSITION (MOST IMPORTANT PART)
        await client.query(`
            WITH ranked AS (
                SELECT id,
                RANK() OVER (
                    PARTITION BY class_name
                    ORDER BY total DESC
                ) AS pos
                FROM students
                WHERE school_name = $1 AND class_name = $2
            )
            UPDATE students s
            SET position = r.pos
            FROM ranked r
            WHERE s.id = r.id
        `, [school, class_name]);

        await client.query("COMMIT"); // 🔥 SUCCESS

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Everything updated successfully"
            })
        };

    } catch (err) {

        await client.query("ROLLBACK"); // 🔥 SAFE FAILURE

        await client.end();

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: err.message
            })
        };
    }
            }
