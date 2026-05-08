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
            school,
            role
        } = params;

        // ================= CLEAN INPUT =================
        const cleanSchool = school && school !== "undefined"
            ? school.trim()
            : null;

        const cleanClass = class_name?.trim();

        const cleanSubject = subject?.trim();

        // ================= SUBJECT MAP =================
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

        const column = subjectMap[cleanSubject?.toUpperCase()];

        if (!column) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid subject" })
            };
        }

        // ================= BASE QUERY =================
        let query = `
            SELECT
                id,
                student_name,
                class_name,
                school_name,

                ${column} AS mark,

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

                RANK() OVER (
                    PARTITION BY class_name
                    ORDER BY (
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
            WHERE class_name = $1
        `;

        const values = [cleanClass];

        // ================= ROLE-BASED ACCESS =================

        // school_admin → only their school
        if (role === "school_admin" && cleanSchool) {
            query += ` AND school_name = $2`;
            values.push(cleanSchool);
        }

        // teacher → only their school
        else if (role === "teacher" && cleanSchool) {
            query += ` AND school_name = $2`;
            values.push(cleanSchool);
        }

        // sector_admin → NO restriction (sees all schools)

        query += ` ORDER BY student_name ASC`;

        const result = await client.query(query, values);

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
            body: JSON.stringify({ message: err.message })
        };
    }
            }
