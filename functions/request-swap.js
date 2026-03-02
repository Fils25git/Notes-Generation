// File: netlify/functions/request-swap.js
import jwt from "jsonwebtoken";
import pkg from "pg";
import { Resend } from "resend";

const { Pool } = pkg;

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const requester_id = decoded.userId;
    const { requested_id } = JSON.parse(event.body || "{}");

    if (!requested_id) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing requested_id" }) };
    }

    // Check if swap request already exists
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

    // ---------------- GET BOTH TEACHERS ----------------
    const teachersRes = await pool.query(
      `
      SELECT auth_user_id, full_name, email, current_school,
             current_sector, current_district, current_province
      FROM teacher_profiles
      WHERE auth_user_id = $1 OR auth_user_id = $2
      `,
      [requester_id, requested_id]
    );

    const teachers = teachersRes.rows;

    if (teachers.length === 2) {
      const requester = teachers.find(t => t.auth_user_id === requester_id);
      const requested = teachers.find(t => t.auth_user_id === requested_id);

      // 📩 Email to requested teacher
      if (requested?.email) {
        await resend.emails.send({
          from: "Fila Assistant <fila@fleduacademy.com>",
          to: requested.email,
          subject: "New Swap Request Received 🔔",
          html: `
            <h2>Hello ${requested.full_name} 👋</h2>
            <p>You have received a new swap request from:</p>
            <ul>
              <li><strong>Name:</strong> ${requester.full_name}</li>
              <li><strong>School:</strong> ${requester.current_school}</li>
              <li><strong>Location:</strong> ${requester.current_sector}, ${requester.current_district}, ${requester.current_province}</li>
            </ul>
            <p>Please login to accept or reject the request.</p>
          `
        });
      }

      // 📩 Confirmation email to requester
      if (requester?.email) {
        await resend.emails.send({
          from: "Fila Assistant <fila@fleduacademy.com>",
          to: requester.email,
          subject: "Your Swap Request Has Been Sent ✅",
          html: `
            <h2>Hello ${requester.full_name} 👋</h2>
            <p>Your swap request has been successfully sent to:</p>
            <ul>
              <li><strong>Name:</strong> ${requested.full_name}</li>
              <li><strong>School:</strong> ${requested.current_school}</li>
            </ul>
            <p>You will be notified once they respond.</p>
          `
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Swap request sent successfully" })
    };

  } catch (err) {
    console.error("Swap request error:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "Server error" }) };
  }
                                                      }
