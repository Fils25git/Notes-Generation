// get-matches.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  try {
    const teacherId = event.queryStringParameters?.teacherId;
    if (!teacherId) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing teacherId" }) };
    }

    const profileRes = await pool.query(
      `SELECT * FROM teacher_profiles WHERE user_id = $1`,
      [teacherId]
    );
    const profile = profileRes.rows[0];
    if (!profile) return { statusCode: 404, body: JSON.stringify({ message: "Profile not found" }) };

    // Parse preferred locations arrays
    const preferredProvinces = Array.isArray(profile.preferred_provinces)
      ? profile.preferred_provinces
      : JSON.parse(profile.preferred_provinces || '[]');

    const preferredDistricts = Array.isArray(profile.preferred_districts)
      ? profile.preferred_districts
      : JSON.parse(profile.preferred_districts || '[]');

    const matchesRes = await pool.query(
      `
      SELECT tp.*, sr.status as swap_status
      FROM teacher_profiles tp
      LEFT JOIN swap_requests sr
        ON ( (sr.requester_id = $1 AND sr.requested_id = tp.user_id)
          OR (sr.requester_id = tp.user_id AND sr.requested_id = $1) )
      WHERE tp.user_id != $1
        AND tp.position = $2
        AND (
          tp.current_province = ANY($3::text[])
          OR tp.current_district = ANY($4::text[])
        )
      ORDER BY tp.full_name
      `,
      [
        teacherId,
        profile.position,
        preferredProvinces,
        preferredDistricts
      ]
    );

    const matches = matchesRes.rows.map(t => ({
      user_id: t.user_id,
      full_name: t.full_name,
      current_school: t.current_school,
      current_province: t.current_province,
      current_district: t.current_district,
      current_sector: t.current_sector,
      position: t.position,
      contact: t.contact,
      swap_status: t.swap_status || "none"
    }));

    return { statusCode: 200, body: JSON.stringify({ matches }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Server error" }) };
  }
        }
