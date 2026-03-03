// get-teacher.js
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

    const requestedId = event.queryStringParameters?.id;
    if (!requestedId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing teacher id" }) };
    }

    // Fetch teacher profile from DB
    const res = await pool.query(
      `SELECT * FROM teacher_profiles WHERE auth_user_id = $1`,
      [requestedId]
    );

    const teacher = res.rows[0];

    if (!teacher) {
      return { statusCode: 404, body: JSON.stringify({ message: "Teacher not found" }) };
    }

    // Only reveal contact if swap accepted (optional)
    const contact = {
      phone: teacher.phone,
      whatsapp: teacher.whatsapp
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ teacher: { ...teacher, contact } })
    };
  } catch (err) {
    console.error("get-teacher error:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "Server error" }) };
  }
}
