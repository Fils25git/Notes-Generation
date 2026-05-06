import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
    try {
        const data = JSON.parse(event.body);

        const {
            full_name,
            username,
            password,
            role,
            school,
            class_name,
            subject
        } = data;

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        // CHECK IF USERNAME EXISTS
        const existing = await client.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if(existing.rows.length > 0){
            await client.end();
            return {
                statusCode: 400,
                body: JSON.stringify({message: "Username already exists"})
            };
        }

        // INSERT USER
        await client.query(
            `INSERT INTO users(full_name, username, password, role, school, class_name, subject)
             VALUES($1,$2,$3,$4,$5,$6,$7)`,
            [
                full_name,
                username,
                password,
                role,
                school || null,
                class_name || null,
                subject || null
            ]
        );

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({message: role + " created successfully"})
        };

    } catch(err){
        return {
            statusCode: 500,
            body: JSON.stringify({message: err.message})
        };
    }
              }
