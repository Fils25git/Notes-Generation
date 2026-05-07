import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Get all schools first (distinct from users table)
        const result = await client.query(`
            SELECT 
                school AS school,
                MAX(full_name) AS admin_name,
                MAX(username) AS username,
                MAX(id) AS id
            FROM users
            WHERE role = 'school_admin'
            GROUP BY school
            ORDER BY school
        `);

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
