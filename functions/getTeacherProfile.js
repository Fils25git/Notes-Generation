import { Client } from "pg";
import jwt from "jsonwebtoken";

export async function handler(event) {
  // Only allow GET
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    // -------------------
    // 1. Get and verify JWT
    // -------------------
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { statusCode: 401, body: JSON.stringify({ error: "Authorization token missing" }) };
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid or expired token" }) };
    }

    const userId = decoded.userId;

    // -------------------
    // 2. Connect to PostgreSQL
    // -------------------
    const client = new Client({
      connectionString: process.env.NEON_DATABASE + "&uselibpqcompat=true&sslmode=require",
    });
    await client.connect();

    // -------------------
    // 3. Query teacher profile
    // -------------------
    const profileQuery = `
      SELECT 
        user_id, 
        full_name, 
        phone, 
        whatsapp, 
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
      WHERE user_id = $1
    `;
    const result = await client.query(profileQuery, [userId]);

    await client.end();

    if (result.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "Teacher profile not found" }) };
    }

    const profile = result.rows[0];

    // -------------------
    // 4. Return profile
    // -------------------
    return {
      statusCode: 200,
      body: JSON.stringify({ profile }),
    };

  } catch (err) {
    console.error("Error fetching teacher profile:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
}
