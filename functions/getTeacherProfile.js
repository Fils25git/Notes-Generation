import { Client } from "pg";
import jwt from "jsonwebtoken";

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;

  // 1️⃣ Validate Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" })
    };
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid or expired token" })
    };
  }

  const userId = decoded.userId;

  const client = new Client({
    connectionString: process.env.NEON_DATABASE, // ✅ USE SAME AS LOGIN
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const result = await client.query(
      `SELECT 
        auth_user_id,
        full_name,
        phone,
        whatsapp,
        email,
        current_school,
        current_province,
        current_district,
        current_sector,
        preferred_provinces,
        preferred_districts,
        preferred_sectors,
        position,
        is_active,
        created_at
      FROM teacher_profiles
      WHERE auth_user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // ⚠️ IMPORTANT: Not 401
      // Profile missing does NOT mean user logged out
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Profile not found" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ profile: result.rows[0] })
    };

  } catch (err) {
    console.error("Database error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" })
    };
  } finally {
    await client.end();
  }
}
