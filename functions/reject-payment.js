import { Client } from "pg";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

  const { payment_id, reason } = JSON.parse(event.body);

  if (!payment_id) {
    return { statusCode: 400, body: "Missing payment ID" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Check if payment exists and is pending
    const paymentRes = await client.query(
      "SELECT * FROM payments WHERE id=$1 AND status='pending'",
      [payment_id]
    );

    if (paymentRes.rowCount === 0) {
      return { statusCode: 404, body: "Pending payment not found" };
    }

    // Mark payment as rejected
    await client.query(
      "UPDATE payments SET status='rejected', approved_at=NOW() WHERE id=$1",
      [payment_id]
    );

    return {
      statusCode: 200,
      body: `Payment rejected${reason ? ": " + reason : ""}`
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  } finally {
    await client.end();
  }
      }
