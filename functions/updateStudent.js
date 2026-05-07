import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const { id, student_name, class_name } = JSON.parse(event.body);

        if (!id || !student_name || !class_name) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing fields" })
            };
        }

        await client.query(
            `UPDATE students 
             SET student_name = $1,
                 class_name = $2
             WHERE id = $3`,
            [student_name, class_name, id]
        );

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Student updated successfully"
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
