import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  try {
    const email = event.queryStringParameters?.email;

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email required" }) };
    }

    const result = await pool.query(
      `SELECT name, email, phone, balance FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "User not found" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows[0])
    };

  } catch (err) {
    console.error("Profile error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
}
