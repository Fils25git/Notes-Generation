import { Client } from "pg";
import jwt from "jsonwebtoken";

export async function handler(event) {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await client.connect();

    // Get my profile
    const myProfileRes = await client.query(
      `SELECT * FROM teacher_profiles WHERE auth_user_id = $1`,
      [decoded.userId]
    );

    const me = myProfileRes.rows[0];
    if (!me) {
      return { statusCode: 404, body: JSON.stringify({ message: "Profile not found" }) };
    }

    // Get teachers I already chatted with
    const chatsRes = await client.query(
      `
      SELECT DISTINCT 
        CASE 
          WHEN sender_id = $1 THEN receiver_id
          ELSE sender_id
        END as other_id
      FROM messages
      WHERE sender_id = $1 OR receiver_id = $1
      `,
      [me.auth_user_id]
    );

    const chattedIds = chatsRes.rows.map(r => r.other_id);

    // Get suggested teachers
    const suggestedRes = await client.query(
      `
      SELECT auth_user_id, full_name, current_school, current_district, current sector
      FROM teacher_profiles
      WHERE is_active = true
      AND auth_user_id != $1
      AND auth_user_id != ALL($2::int[])
      LIMIT 10
      `,
      [me.auth_user_id, chattedIds.length ? chattedIds : [0]]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        teachers: suggestedRes.rows
      }),
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  } finally {
    await client.end();
  }
}
