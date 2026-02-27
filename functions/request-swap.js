// File: netlify/functions/request-swap.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  try {
    const { requester_id, requested_id } = JSON.parse(event.body || "{}");

    if (!requester_id || !requested_id) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing requester_id or requested_id" }) };
    }

    // Check if swap request already exists
    const existsRes = await pool.query(
      `SELECT * FROM swap_requests 
       WHERE requester_id = $1 AND requested_id = $2`,
      [requester_id, requested_id]
    );

    if (existsRes.rows.length > 0) {
      return { statusCode: 400, body: JSON.stringify({ message: "Swap request already sent" }) };
    }

    // Insert new swap request
    await pool.query(
      `INSERT INTO swap_requests (requester_id, requested_id, status, requested_at) 
       VALUES ($1, $2, 'pending', NOW())`,
      [requester_id, requested_id]
    );

    return { statusCode: 200, body: JSON.stringify({ message: "Swap request sent successfully" }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Server error" }) };
  }
}
