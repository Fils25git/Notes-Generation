import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
    try {

        const { id } = JSON.parse(event.body);

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        await client.query(`UPDATE tests SET is_active = false`);

        const result = await client.query(
            `UPDATE tests SET is_active = true WHERE id = $1 RETURNING *`,
            [id]
        );

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify(result.rows[0])
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: err.message })
        };
    }
          }
