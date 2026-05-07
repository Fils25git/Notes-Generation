import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
    try {

        const { school_name, class_name } = event.queryStringParameters || {};

        if (!school_name) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "school_name is required"
                })
            };
        }

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        let query = `
            SELECT
                id,
                student_name,
                class_name,

                english,
                mathematics,
                kinyarwanda,
                social_studies,
                science,
                chemistry,
                physics,
                biology,
                geography,
                history,
                entrepreneurship,

                total,
                percentage,
                position

            FROM students
            WHERE school_name = $1
        `;

        let params = [school_name];

        if (class_name) {
            query += " AND class_name = $2";
            params.push(class_name);
        }

        query += " ORDER BY position ASC NULLS LAST, total DESC";

        const result = await client.query(query, params);

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify(result.rows)
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: err.message
            })
        };
    }
          }
