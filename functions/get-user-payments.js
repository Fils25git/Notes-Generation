import { Client } from "pg";

export async function handler(event) {
  const userId = event.queryStringParameters?.user;

  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: "User ID required" }) };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const res = await client.query(
      `SELECT id, amount_rwf, plans_purchased, payment_status, payment_date 
       FROM weekly_plan_payments
       WHERE user_id=$1
       ORDER BY payment_date DESC`,
      [userId]
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(res.rows)
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  } finally {
    await client.end();
  }
    }
