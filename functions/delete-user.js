import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
  const userId = event.queryStringParameters?.id;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "User ID required" })
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(
      "DELETE FROM users WHERE id = $1",
      [userId]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error("Error deleting user:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to delete user" })
    };

  } finally {
    await client.end();
  }
      }
