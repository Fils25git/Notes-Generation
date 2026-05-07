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

        // ================= SUBJECT MAP =================
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
                body: JSON.stringify({ message: "Invalid subject" })
            };
        }

        // ================= MAIN QUERY =================
        const result = await client.query(
            `
            SELECT
                id,
                student_name,
                class_name,
                school_name,

                ${column} AS mark,

                -- TOTAL
                (
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
                ) AS total,

                -- PERCENTAGE
                ROUND(
                    (
                        (
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
                        ) /
                        CASE
                            WHEN class_name = 'Primary 6' THEN 500.0
                            WHEN class_name = 'Senior 3' THEN 900.0
                            ELSE 1
                        END
                    ) * 100
                ,2) AS percentage,

                -- POSITION
                RANK() OVER (
                    PARTITION BY class_name
                    ORDER BY
                        (
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
                        ) DESC
                ) AS position

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
            body: JSON.stringify({ message: err.message })
        };
    }
            }
