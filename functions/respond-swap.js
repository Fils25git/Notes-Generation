// File: netlify/functions/respond-swap.js
import { Client } from "pg";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE,
    ssl: { rejectUnauthorized: false },
  });

  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ message: "Method not allowed" }) };
    }

    await client.connect();

    const { requester_id, requested_id, accept } = JSON.parse(event.body || "{}");

    if (!requester_id || !requested_id) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing IDs" }) };
    }

    // Update swap request status
    const updateRes = await client.query(
      `UPDATE swap_requests
       SET status = $1, updated_at = NOW()
       WHERE requester_id = $2 AND requested_id = $3
       RETURNING *`,
      [accept ? "accepted" : "rejected", requester_id, requested_id]
    );

    if (updateRes.rowCount === 0) {
      return { statusCode: 404, body: JSON.stringify({ message: "Swap request not found" }) };
    }

    // Fetch both teachers
    const teachersRes = await client.query(
      `SELECT auth_user_id, full_name, email, current_school
       FROM teacher_profiles
       WHERE auth_user_id = ANY($1::int[])`,
      [[requester_id, requested_id]]
    );

    const teachers = teachersRes.rows;

    const requester = teachers.find(t => t.auth_user_id === requester_id);
    const requested = teachers.find(t => t.auth_user_id === requested_id);

    if (!requester || !requested) {
      console.warn("One of the teachers not found, skipping emails");
    } else {
      // Send email to requester
      if (requester.email) {
        await resend.emails.send({
          from: "Fila Assistant <fila@fleduacademy.com>",
          to: requester.email,
          subject: `Your swap request has been ${accept ? "accepted" : "rejected"} ✅`,
          html: `
            <p>Hello ${requester.full_name},</p>
            <p>Your swap request to ${requested.full_name} (${requested.current_school}) has been <strong>${accept ? "accepted" : "rejected"}</strong>.</p>
          `,
        });
      }

      // Send email to requested teacher
      if (requested.email) {
        await resend.emails.send({
          from: "Fila Assistant <fila@fleduacademy.com>",
          to: requested.email,
          subject: `You have ${accept ? "accepted" : "rejected"} a swap request`,
          html: `
            <p>Hello ${requested.full_name},</p>
            <p>You have <strong>${accept ? "accepted" : "rejected"}</strong> the swap request from ${requester.full_name} (${requester.current_school}).</p>
          `,
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: accept ? "Swap accepted" : "Swap rejected" }),
    };
  } catch (err) {
    console.error("Respond swap error:", err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  } finally {
    await client.end();
  }
}
