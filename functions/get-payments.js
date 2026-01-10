import { Client } from "pg";

export async function handler(event) {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const status = event.queryStringParameters?.status;

  try {
    await client.connect();

    // Build query dynamically with alias
    let query = `
      SELECT 
        p.id, 
        u.name AS full_name, 
        u.email, 
        u.phone, 
        p.amount, 
        p.lessons, 
        p.status, 
        p.created_at, 
        p.user_id
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
      body: JSON.stringify({
        success: true,
        data: res.rows,
        message: res.rows.length ? "Payments loaded successfully." : "No payments found."
      })
    };

  } catch (err) {
    console.error("Database error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: err.message })
    };
  } finally {
    await client.end();
  }
        }
