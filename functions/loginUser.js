import pkg from "pg";
const { Client } = pkg;

export async function handler(event){
    try{
        const data = JSON.parse(event.body);
        const { username, password } = data;

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        const result = await client.query(
            "SELECT * FROM users WHERE username = $1 AND password = $2",
            [username, password]
        );

        await client.end();

        if(result.rows.length === 0){
            return {
                statusCode: 401,
                body: JSON.stringify({message:"Invalid credentials"})
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(result.rows[0])
        };

    }catch(err){
        return {
            statusCode: 500,
            body: JSON.stringify({message: err.message})
        };
    }
}
