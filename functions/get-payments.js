import { Client } from "pg";

export async function handler(event) {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const status = event.queryStringParameters?.status;

  try {
    await client.connect();

    // Build query dynamically
    let query = `
      SELECT p.id, u.full_name, u.email, u.phone, p.amount, p.lessons, p.status, p.created_at, p.user_id
      FROM payments p
      JOIN users u ON p.user_id = u.id
    `;
    const params = [];

    if (status) {
      query += " WHERE p.status = $1";
      params.push(status);
    }

    query += " ORDER BY p.created_at DESC";

    const res = await client.query(query, params);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(res.rows)
    };

  } catch (err) {
    console.error("Database error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error" })
    };
  } finally {
    await client.end();
  }
      }
