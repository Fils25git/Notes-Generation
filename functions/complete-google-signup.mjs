import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { phone, role } = JSON.parse(event.body || "{}");

    if (!phone || !role) {
      return { statusCode: 400, body: "Missing fields" };
    }

    // ⚠️ In production you should identify user via session/JWT
    // For now we trust the last Google user (simple setup)

    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    await client.query(
      `UPDATE users
       SET phone=$1, role=$2, signup_complete=true
       WHERE signup_complete=false`,
      [phone, role]
    );

    await client.end();

    return { statusCode: 200, body: "Signup completed" };

  } catch (err) {
    console.error("COMPLETE SIGNUP ERROR:", err);
    return { statusCode: 500, body: "Server error" };
  }
}
