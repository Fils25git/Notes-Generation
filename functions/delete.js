import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const { id } = JSON.parse(event.body);

        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing student id" })
            };
        }

        await client.query(
            `DELETE FROM students WHERE id = $1`,
            [id]
        );

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Student deleted successfully"
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
