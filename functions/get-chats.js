import { Client } from "pg";
import jwt from "jsonwebtoken";

export async function handler(event) {
  console.log("🔥 Function triggered");

  if (event.httpMethod !== "GET") {
    console.log("❌ Invalid method:", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  let client;

  try {
    console.log("📌 Headers:", event.headers);

    const authHeader = event.headers.authorization;
    if (!authHeader) {
      console.log("❌ No Authorization header");
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Unauthorized" })
      };
    }

    const token = authHeader.split(" ")[1];
    console.log("🔑 Token received:", token ? "YES" : "NO");

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Unauthorized" })
      };
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Decoded JWT:", decoded);

    const userId = Number(decoded.id);
    console.log("👤 Logged userId:", userId);

    console.log("🌍 DB URL exists:", process.env.NEON_DATABASE ? "YES" : "NO");

    client = new Client({
      connectionString: process.env.NEON_DATABASE,
      ssl: { rejectUnauthorized: false }
    });

    console.log("🔌 Connecting to database...");
    await client.connect();
    console.log("✅ Database connected");

    // NEW CLEAN QUERY
    const query = `
      SELECT DISTINCT ON (u.id)
        u.id,
        u.name,
        m.message AS last_message,
        m.created_at AS last_message_at
      FROM messages m
      JOIN users u 
        ON (u.id = m.sender_id OR u.id = m.receiver_id)
      WHERE (m.sender_id = $1 OR m.receiver_id = $1)
        AND u.id != $1
      ORDER BY u.id, m.created_at DESC;
    `;

    console.log("📤 Running query for user:", userId);

    const result = await client.query(query, [userId]);

    console.log("📥 Query rows count:", result.rows.length);
    console.log("📄 Rows:", result.rows);

    await client.end();
    console.log("🔌 Database connection closed");

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        teachers: result.rows
      })
    };

  } catch (err) {
    console.error("💥 ERROR OCCURRED:");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);

    if (client) {
      try {
        await client.end();
        console.log("🔌 DB closed after error");
      } catch (closeErr) {
        console.error("Error closing DB:", closeErr);
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Server error",
        error: err.message
      })
    };
  }
      }
