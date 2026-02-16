import { Client } from "pg";

export async function handler(event) {

  const { userId } = JSON.parse(event.body || "{}");

  if (!userId) {
    return { statusCode: 400 };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(
      `DELETE FROM active_users WHERE user_id = $1`,
      [userId]
    );

    return { statusCode: 200 };

  } catch (err) {
    return { statusCode: 500 };
  } finally {
    await client.end();
  }
}
