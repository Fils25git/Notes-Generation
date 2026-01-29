import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ success: false, message: "Method not allowed" }) };
  }

  const { id, status } = JSON.parse(event.body || "{}");

  if (!id || !status) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: "ID and status are required" }) };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query(`UPDATE weekly_plan_payments SET payment_status=$1 WHERE id=$2`, [status, id]);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: err.message }) };
  } finally {
    await client.end();
  }
}
