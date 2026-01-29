import { Client } from "pg";

export async function handler(event) {
  const userId = event.queryStringParameters?.user;

  if (!userId) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "User ID required" })
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const res = await client.query(
      `SELECT id, amount, lessons, status, created_at, approved_at
       FROM weekly_plan_payments
       WHERE user_id=$1
       ORDER BY created_at DESC`,
      [userId]
    );

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify(res.rows)
    };

  } catch (err) {
    console.error("get-user-weekly-payments error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    await client.end();
  }
      }
