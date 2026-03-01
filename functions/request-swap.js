// File: netlify/functions/request-swap.js
import jwt from "jsonwebtoken";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return { statusCode: 401, body: JSON.stringify({ message: "Invalid or expired token" }) };
    }

    const requester_id = decoded.userId;  // from JWT
    const { requested_id } = JSON.parse(event.body || "{}");

    if (!requested_id) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing requested_id" }) };
    }

    // Check if swap request already exists in either direction
    const existsRes = await pool.query(
      `SELECT * FROM swap_requests
       WHERE (requester_id = $1 AND requested_id = $2)
          OR (requester_id = $2 AND requested_id = $1)`,
      [requester_id, requested_id]
    );

    if (existsRes.rows.length > 0) {
      return { statusCode: 400, body: JSON.stringify({ message: "Swap request already exists" }) };
    }

    // Insert new swap request
    await pool.query(
      `INSERT INTO swap_requests (requester_id, requested_id, status, requested_at)
       VALUES ($1, $2, 'pending', NOW())`,
      [requester_id, requested_id]
    );

    return { statusCode: 200, body: JSON.stringify({ message: "Swap request sent successfully" }) };

  } catch (err) {
    console.error("Swap request error:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "Server error" }) };
  }
  }
