import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const body = JSON.parse(event.body || "{}");
  const payment_id = body.payment_id || body.id; // ✅ FIX

  if (!payment_id) {
    return { statusCode: 400, body: "Missing payment ID" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const paymentRes = await client.query(
      "SELECT * FROM payments WHERE id=$1 AND status='pending'",
      [payment_id]
    );

    if (paymentRes.rowCount === 0) {
      return { statusCode: 404, body: "Pending payment not found" };
    }

    const payment = paymentRes.rows[0];

    // ✅ Add lesson plans to user
    await client.query(
      "UPDATE users SET balance = balance + $1, phone_locked = true WHERE id=$2",
      [payment.lessons, payment.user_id]
    );

    // ✅ Approve payment
    await client.query(
      "UPDATE payments SET status='approved', approved_at=NOW() WHERE id=$1",
      [payment_id]
    );

    return {
      statusCode: 200,
      body: "Payment approved and lesson plans added."
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  } finally {
    await client.end();
  }
    }
