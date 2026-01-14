const { Client } = require("pg");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method not allowed" })
        };
    }

    try {
        const { email } = JSON.parse(event.body);

        if (!email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Email is required" })
            };
        }

        const client = new Client({
            connectionString: process.env.NEON_DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        const result = await client.query(
            "SELECT id FROM users WHERE email = $1 LIMIT 1",
            [email]
        );

        await client.end();

        if (result.rows.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "User not found" })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                user_id: result.rows[0].id
            })
        };

    } catch (err) {
        console.error("GET USER ID ERROR:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server error" })
        };
    }
};
