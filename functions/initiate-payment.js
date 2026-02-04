import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { phone, email, amount, lessons, reference, user_id, plan } = JSON.parse(event.body);
  // 'plan' will be 'weekly' or 'daily'

  if (!user_id) {
    return { statusCode: 400, body: "Missing user_id" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Choose table based on plan
  const table = plan === "weekly" ? "weekly_plan_payments" : "payments";

  try {
    await client.connect();

    // Ensure user exists
    const userCheck = await client.query("SELECT id FROM users WHERE id = $1", [user_id]);
    if (!userCheck.rows.length) {
      return { statusCode: 400, body: "Invalid user_id" };
    }

    // Prevent duplicate initiations within 5 minutes
    const check = await client.query(
      `SELECT id FROM ${table} 
       WHERE phone = $1 AND amount = $2 AND status = 'initiated'
       AND created_at > NOW() - INTERVAL '5 minutes'`,
      [phone, amount]
    );

    if (check.rows.length) {
      return { statusCode: 200, body: "Payment already initiated recently." };
    }

    // Insert payment
    await client.query(
      `INSERT INTO ${table} (phone, email, amount, lessons, status, reference, user_id)
       VALUES ($1, $2, $3, $4, 'initiated', $5, $6)`,
      [phone, email, amount, lessons, reference, user_id]
    );

    return { statusCode: 200, body: "Payment request recorded" };

  } catch (err) {
    console.error("Insert failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  } finally {
    await client.end();
  }
}
