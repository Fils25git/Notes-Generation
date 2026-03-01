import { Client } from "pg";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Method not allowed" }),
    };
  }

  const newTeacher = JSON.parse(event.body || "{}");

  if (!newTeacher?.auth_user_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "New teacher data missing" }),
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Parse preferred arrays safely
    const preferredProvinces = Array.isArray(newTeacher.preferred_provinces)
      ? newTeacher.preferred_provinces
      : JSON.parse(newTeacher.preferred_provinces || "[]");

    const preferredDistricts = Array.isArray(newTeacher.preferred_districts)
      ? newTeacher.preferred_districts
      : JSON.parse(newTeacher.preferred_districts || "[]");

    const myProvince = newTeacher.current_province;
    const myDistrict = newTeacher.current_district;

    // Fetch all teachers who match this new teacher
    const matchesRes = await client.query(
      `
      SELECT * FROM teacher_profiles
      WHERE auth_user_id != $1
        AND position = $2
        AND (current_province = ANY($3::text[]) OR current_district = ANY($4::text[]))
        AND ($5 = ANY(preferred_provinces) OR $6 = ANY(preferred_districts))
      `,
      [
        newTeacher.auth_user_id,
        newTeacher.position,
        preferredProvinces,
        preferredDistricts,
        myProvince,
        myDistrict,
      ]
    );

    const matches = matchesRes.rows;

    // Send email to each matched teacher
    for (const match of matches) {
      if (!match.email) continue;

      await resend.emails.send({
        from: "Fila Assistant <fila@fleduacademy.com>",
        to: match.email,
        subject: "New Teacher Match Available! 🎉",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color:#2196f3;">Hello ${match.full_name} 👋</h2>
            <p>A new teacher has joined Fila Assistant who matches your swap preferences:</p>
            <ul>
              <li><strong>Name:</strong> ${newTeacher.full_name}</li>
              <li><strong>School:</strong> ${newTeacher.current_school}</li>
              <li><strong>Location:</strong> ${newTeacher.current_sector}, ${newTeacher.current_district}, ${newTeacher.current_province}</li>
            </ul>
            <p><a href="https://your-app.com/dashboard.html" 
                  style="display:inline-block; margin-top:15px; padding:10px 15px; background:#2196f3; color:white; text-decoration:none; border-radius:5px;">
              Check Your Matches
            </a></p>
            <p style="margin-top:20px; font-size:12px; color:#555;">
              If you did not expect this, ignore this email.
            </p>
          </div>
        `,
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Notifications sent to ${matches.length} matched teachers.`,
      }),
    };
  } catch (err) {
    console.error("Notify matches error:", err);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error" }) };
  } finally {
    await client.end();
  }
}
