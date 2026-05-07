import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const data = JSON.parse(event.body);

        const { id, full_name, username, password, school } = data;

        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "User ID is required" })
            };
        }

        // Build dynamic update query
        let query = `
            UPDATE users
            SET full_name = $1,
                username = $2,
                school = $3
        `;

        let params = [full_name, username, school];

        // Only update password if provided
        if (password && password.trim() !== "") {
            query += `, password = $4 WHERE id = $5`;
            params.push(password, id);
        } else {
            query += ` WHERE id = $4`;
            params.push(id);
        }

        await client.query(query, params);

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "User updated successfully"
            })
        };

    } catch (err) {
        await client.end();

        return {
            statusCode: 500,
            body: JSON.stringify({ message: err.message })
        };
    }
}
