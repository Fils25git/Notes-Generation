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
    class_name,
    subject,
    school
} = params;

const cleanSchool =
    school &&
    school !== "undefined" &&
    school !== "null" &&
    school.trim() !== ""
        ? school.trim()
        : null;

const cleanClass = class_name?.trim();
const cleanSubject = subject?.trim();

// ✅ SAFETY CHECK (IMPORTANT)
if (!cleanSchool) {
    await client.end();
    return {
        statusCode: 400,
        body: JSON.stringify({
            message: "School is required"
        })
    };
}

        const cleanClass = class_name?.trim();
        const cleanSubject = subject?.trim();

        const subjectMap = {
            "ENGLISH": "english",
            "MATHEMATICS": "mathematics",
            "MATH": "mathematics",
            "KINYARWANDA": "kinyarwanda",
            "SOCIAL AND RELIGIOUS STUDIES": "social_studies",
            "SST": "social_studies",
            "SCIENCE AND ELEMENTARY TECHNOLOGY": "science",
            "CHEMISTRY": "chemistry",
            "PHYSICS": "physics",
            "BIOLOGY": "biology",
            "GEOGRAPHY": "geography",
            "HISTORY": "history",
            "ENTREPRENEURSHIP": "entrepreneurship"
        };

        const column =
            subjectMap[cleanSubject?.toUpperCase()];

        if (!column) {
            await client.end();

            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Invalid subject"
                })
            };
        }

        // ================= MAIN QUERY =================
        const query = `
            SELECT
                s.id,
                s.student_name,
                s.class_name,
                s.school_name,

                ${column} AS mark,

                (
                    COALESCE(s.english,0) +
                    COALESCE(s.mathematics,0) +
                    COALESCE(s.kinyarwanda,0) +
                    COALESCE(s.social_studies,0) +
                    COALESCE(s.science,0) +
                    COALESCE(s.chemistry,0) +
                    COALESCE(s.physics,0) +
                    COALESCE(s.biology,0) +
                    COALESCE(s.geography,0) +
                    COALESCE(s.history,0) +
                    COALESCE(s.entrepreneurship,0)
                ) AS total,

                ROUND(
                    (
                        (
                            COALESCE(s.english,0) +
                            COALESCE(s.mathematics,0) +
                            COALESCE(s.kinyarwanda,0) +
                            COALESCE(s.social_studies,0) +
                            COALESCE(s.science,0) +
                            COALESCE(s.chemistry,0) +
                            COALESCE(s.physics,0) +
                            COALESCE(s.biology,0) +
                            COALESCE(s.geography,0) +
                            COALESCE(s.history,0) +
                            COALESCE(s.entrepreneurship,0)
                        ) /
                        CASE
                            WHEN s.class_name = 'Primary 6'
                                THEN 500.0

                            WHEN s.class_name = 'Senior 3'
                                THEN 900.0

                            ELSE 1
                        END
                    ) * 100
                ,2) AS percentage,

                RANK() OVER (
                    PARTITION BY s.class_name
                    ORDER BY (
                        COALESCE(s.english,0) +
                        COALESCE(s.mathematics,0) +
                        COALESCE(s.kinyarwanda,0) +
                        COALESCE(s.social_studies,0) +
                        COALESCE(s.science,0) +
                        COALESCE(s.chemistry,0) +
                        COALESCE(s.physics,0) +
                        COALESCE(s.biology,0) +
                        COALESCE(s.geography,0) +
                        COALESCE(s.history,0) +
                        COALESCE(s.entrepreneurship,0)
                    ) DESC
                ) AS position

            FROM students s

            WHERE s.class_name = $1
            AND s.school_name = $2

            ORDER BY s.student_name ASC
        `;

        const values = [
            cleanClass,
            cleanSchool
        ];

        const result =
            await client.query(query, values);

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify(result.rows)
        };

    } catch (err) {

        try {
            await client.end();
        } catch (e) {}

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: err.message
            })
        };
    }
}
