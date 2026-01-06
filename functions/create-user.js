import { Client } from "pg";

export async function handler(event) {
  console.log("CREATE USER FUNCTION HIT");

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    console.log("Raw body:", event.body);

    const { email, phone } = JSON.parse(event.body);

    if (!email) {
      return { statusCode: 400, body: "Missing email" };
    }

    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log("DB connected");

    const result = await client.query(
      `INSERT INTO users(email, phone, balance)
       VALUES($1, $2, 0)
       ON CONFLICT(email) DO NOTHING
       RETURNING id`,
      [email, phone]
    );

    console.log("Insert result:", result.rows);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        inserted: result.rows.length > 0
      })
    };

  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    return {
      statusCode: 500,
      body: "Server error: " + err.message
    };
  }
}
