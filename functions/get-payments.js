import { Client } from "pg";

export async function handler(event, context) {
  const client = new Client({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    const res = await client.query(`
      SELECT p.id, u.email, u.phone, p.amount, p.lessons, p.status, p.created_at
      FROM payments p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);

    return {
      statusCode: 200,
      body: JSON.stringify(res.rows)
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  } finally {
    await client.end();
  }
      }
