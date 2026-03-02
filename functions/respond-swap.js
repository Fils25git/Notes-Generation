// File: netlify/functions/respond-swap.js
import { Client } from "pg";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const { requester_id, requested_id, accept } = JSON.parse(event.body);

    if (!requester_id || !requested_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing IDs" }),
      };
    }

    // Update swap request
    await client.query(
      `
      UPDATE swap_requests
      SET status = $1
      WHERE requester_id = $2
      AND requested_id = $3
      `,
      [accept ? "accepted" : "rejected", requester_id, requested_id]
    );

    // ----- Fetch both teachers to get emails -----
    const teachersRes = await client.query(
      `
      SELECT auth_user_id, full_name, email, current_school
      FROM teacher_profiles
      WHERE auth_user_id = $1 OR auth_user_id = $2
      `,
      [requester_id, requested_id]
    );

    const teachers = teachersRes.rows;
    if (teachers.length === 2) {
      const requester = teachers.find(t => t.auth_user_id === requester_id);
      const requested = teachers.find(t => t.auth_user_id === requested_id);

      // Email to requester
      if (requester?.email) {
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

      // Email to requested teacher
      if (requested?.email) {
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

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: accept ? "Swap accepted" : "Swap rejected",
      }),
    };
  } catch (err) {
    console.error(err);
    await client.end();

    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
      }
