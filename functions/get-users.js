import pkg from "pg";
const { Client } = pkg;

export async function handler() {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT id, name, email, phone, balance
      FROM users
      ORDER BY id DESC
    `);

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };

  } catch (error) {
    console.error("Error fetching users:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch users" })
    };

  } finally {
    await client.end();
  }
      }
