const { Client } = require("pg");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" })
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    const { requester_id, requested_id, accept } = JSON.parse(event.body);

    if (!requester_id || !requested_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing IDs" })
      };
    }

    const status = accept ? "accepted" : "rejected";

    // ---------------- UPDATE SWAP REQUEST ----------------
    await client.query(
      `
      UPDATE swap_requests
      SET status = $1
      WHERE requester_id = $2
      AND requested_id = $3
      `,
      [status, requester_id, requested_id]
    );

    // ---------------- GET BOTH TEACHERS ----------------
    const teachersRes = await client.query(
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

      // ---------------- SEND EMAIL TO BOTH ----------------
      for (const teacher of [requester, requested]) {
        if (!teacher.email) continue;

        await resend.emails.send({
          from: "Fila Assistant <fila@fleduacademy.com>",
          to: teacher.email,
          subject: `Your Swap Request Was ${status.toUpperCase()} 🎉`,
          html: `
            <div style="font-family: Arial, sans-serif; padding:20px;">
              <h2>Hello ${teacher.full_name} 👋</h2>
              <p>Your swap request has been <strong>${status}</strong>.</p>

              ${status === "accepted" ? `
                <h3>Contact Details:</h3>
                <ul>
                  <li><strong>Name:</strong> ${teacher === requester ? requested.full_name : requester.full_name}</li>
                  <li><strong>School:</strong> ${teacher === requester ? requested.current_school : requester.current_school}</li>
                  <li><strong>Location:</strong> 
                    ${teacher === requester ? requested.current_sector : requester.current_sector}, 
                    ${teacher === requester ? requested.current_district : requester.current_district}, 
                    ${teacher === requester ? requested.current_province : requester.current_province}
                  </li>
                </ul>
                <p>You can now contact each other to proceed.</p>
              ` : `
                <p>Unfortunately, the swap request was declined.</p>
              `}

              <p style="margin-top:20px; font-size:12px; color:#666;">
                Fila Assistant Team
              </p>
            </div>
          `
        });
      }
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: accept ? "Swap accepted" : "Swap rejected"
      })
    };

  } catch (err) {
    console.error(err);
    await client.end();

    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message })
    };
  }
};
