import { Client } from "pg";

export async function handler(event) {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const status = event.queryStringParameters?.status;

  try {
    await client.connect();

    const res = await client.query(`
      SELECT p.id, u.full_name, u.email, u.phone, p.amount, p.lessons, p.status, p.created_at, p.user_id
      FROM payments p
      JOIN users u ON p.user_id = u.id
      ${status ? "WHERE p.status = $1" : ""}
      ORDER BY p.created_at DESC
    `, status ? [status] : []);

    return { statusCode: 200, body: JSON.stringify(res.rows) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  } finally {
    await client.end();
  }
}
