import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
    try {
        const data = JSON.parse(event.body);

        const { full_name, username, password } = data;

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        const check = await client.query(
            "SELECT * FROM users WHERE role = 'sector_admin'"
        );

        if(check.rows.length > 0){
            await client.end();
            return {
                statusCode: 400,
                body: JSON.stringify({message:"Sector Admin already exists"})
            };
        }

        await client.query(
            "INSERT INTO users(full_name, username, password, role) VALUES($1,$2,$3,$4)",
            [full_name, username, password, "sector_admin"]
        );

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({message:"Sector Admin created"})
        };

    } catch(err){
        return {
            statusCode: 500,
            body: JSON.stringify({message: err.message})
        };
    }
          }
