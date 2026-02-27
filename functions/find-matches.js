import { Client } from "pg";

export async function handler(event) {
  try {
    const { teacher_id } = JSON.parse(event.body);

    const client = new Client({
      connectionString: process.env.NEON_DATABASE,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // 1. Get current teacher's profile
    const profileRes = await client.query(
      "SELECT * FROM teacher_profiles WHERE user_id=$1",
      [teacher_id]
    );

    if (!profileRes.rows[0]) {
      await client.end();
      return { statusCode: 404, body: JSON.stringify({ message: "Profile not found" }) };
    }

    const me = profileRes.rows[0];

    // 2. Find other teachers who match preferred locations and qualification
    const matchRes = await client.query(
      `SELECT user_id, full_name, current_school, current_province, current_district, current_sector, position
       FROM teacher_profiles
       WHERE user_id <> $1
         AND position = $2
         AND current_province = ANY($3::text[])
         AND current_district = ANY($4::text[])
         AND current_sector = ANY($5::text[])`,
      [
        teacher_id,
        me.position,
        me.preferred_provinces,
        me.preferred_districts,
        me.preferred_sectors,
      ]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ matches: matchRes.rows }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Server error" }) };
  }
}
