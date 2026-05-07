import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const body = JSON.parse(event.body);
        const id = Number(body.id); // 🔥 FORCE NUMBER

        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid student ID" })
            };
        }

        // 🔥 CHECK FIRST (VERY IMPORTANT DEBUG STEP)
        const check = await client.query(
            "SELECT id FROM students WHERE id = $1",
            [id]
        );

        if (check.rowCount === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Student not found" })
            };
        }

        // DELETE
        await client.query(
            "DELETE FROM students WHERE id = $1",
            [id]
        );

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Student deleted successfully",
                deletedId: id
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
