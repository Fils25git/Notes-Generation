import { Client } from "pg";

export async function handler(event) {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const status = event.queryStringParameters?.status;

  try {
    await client.connect();

    const query = `
      SELECT 
        p.id, 
        u.name AS full_name, 
        u.email, 
        u.phone, 
        p.amount, 
        p.lessons, 
        p.status, 
        p.created_at, 
        p.user_id,
        p.reference
      FROM weekly_plan_payments p
      JOIN users u ON p.user_id = u.id
      ${status ? "WHERE p.status = $1" : ""}
      ORDER BY p.created_at DESC
    `;

    const res = await client.query(query, status ? [status] : []);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(res.rows)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message, stack: err.stack })
    };
  } finally {
    await client.end();
  }
}
