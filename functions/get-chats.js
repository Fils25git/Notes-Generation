import { Client } from "pg";
import jwt from "jsonwebtoken";

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  try {
    const token = event.headers.authorization?.split(" ")[1];
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Unauthorized" })
      };
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const client = new Client({
      connectionString: process.env.NEON_DATABASE,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Get last message per teacher
    const result = await client.query(`
      SELECT 
        u.id,
        u.name,
        m.message AS last_message,
        m.created_at AS last_message_at
      FROM messages m
      JOIN users u 
        ON (u.id = m.sender_id OR u.id = m.receiver_id)
      WHERE (m.sender_id = $1 OR m.receiver_id = $1)
        AND u.id != $1
      AND m.created_at = (
          SELECT MAX(created_at)
          FROM messages
          WHERE 
            (sender_id = $1 AND receiver_id = u.id)
            OR
            (sender_id = u.id AND receiver_id = $1)
      )
      ORDER BY m.created_at DESC
    `, [userId]);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        teachers: result.rows
      })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error" })
    };
  }
}
