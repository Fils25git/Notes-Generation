import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { phone, email, amount, lessons, reference, user_id, type } = JSON.parse(event.body);

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // 🔥 Decide table
  const table = type === "weekly" ? "weekly_plan_payments" : "payments";

  try {
    await client.connect();

    // Prevent duplicate initiations
    const check = await client.query(
      `SELECT id FROM ${table}
       WHERE phone = $1 AND amount = $2 
       AND status = 'initiated' 
       AND created_at > NOW() - INTERVAL '5 minutes'`,
      [phone, amount]
    );

    if (check.rows.length) {
      return { statusCode: 200, body: "Payment already initiated recently." };
    }

    await client.query(
      `INSERT INTO ${table} (phone, email, amount, lessons, status, reference, user_id)
       VALUES ($1, $2, $3, $4, 'initiated', $5, $6)`,
      [phone, email, amount, lessons, reference, user_id || null]
    );

    return {
      statusCode: 200,
      body: "Payment request recorded"
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    await client.end();
  }
      }
