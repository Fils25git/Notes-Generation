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
  `
  SELECT 
    t.user_id,
    t.full_name,
    t.current_school,
    t.current_province,
    t.current_district,
    t.current_sector,
    t.position
  FROM teacher_profiles t
  WHERE t.user_id <> $1
    AND t.position = $2

    -- 1️⃣ They want MY location
    AND $3 = ANY(t.preferred_provinces)
    AND $4 = ANY(t.preferred_districts)
    AND (
      t.preferred_sectors IS NULL 
      OR array_length(t.preferred_sectors, 1) = 0
      OR $5 = ANY(t.preferred_sectors)
    )

    -- 2️⃣ I want THEIR location
    AND $6 = ANY(COALESCE($6::text[], ARRAY[t.current_province]))
    AND $7 = ANY(COALESCE($7::text[], ARRAY[t.current_district]))
    -- sector optional on your side too
    AND (
      $8 IS NULL 
      OR array_length($8, 1) = 0
      OR t.current_sector = ANY($8)
    )
  `,
  [
    teacher_id,
    me.position,

    // My current location
    me.current_province,
    me.current_district,
    me.current_sector,       // optional: used only if other teacher selected sectors

    // My preferred locations
    me.preferred_provinces,
    me.preferred_districts,
    me.preferred_sectors,    // optional: empty = accept any sector
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
