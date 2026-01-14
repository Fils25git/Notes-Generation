import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
  const userId = event.queryStringParameters?.user;

  if (!userId) {
    return { statusCode: 400, body: "User ID missing" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const result = await client.query(
      "SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Failed to fetch payments" };

  } finally {
    await client.end();
  }
    }
