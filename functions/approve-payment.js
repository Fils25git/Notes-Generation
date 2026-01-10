import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") 
    return { statusCode: 405, body: JSON.stringify({ success: false, message: "Method not allowed" }) };

  const body = JSON.parse(event.body || "{}");
  const ids = body.ids || [];

  if (!ids.length) 
    return { statusCode: 400, body: JSON.stringify({ success: false, message: "No IDs provided" }) };

  const client = new Client({ 
    connectionString: process.env.NEON_DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    await client.connect();

    // Fetch all pending payments for the selected IDs
    const res = await client.query(
      "SELECT * FROM payments WHERE id = ANY($1::int[]) AND status='pending'",
      [ids]
    );

    if (!res.rowCount) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: "No pending payments found for selected IDs" }) };
    }

    // Update user balances and payments
    for (const payment of res.rows) {
      await client.query(
        "UPDATE users SET balance = balance + $1 WHERE id=$2",
        [payment.lessons, payment.user_id]
      );
    }

    // Update payments to approved
    await client.query(
      "UPDATE payments SET status='approved', approved_at=NOW() WHERE id = ANY($1::int[])",
      [ids]
    );

    return { statusCode: 200, body: JSON.stringify({ success: true, message: "Payments approved successfully." }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error" }) };
  } finally {
    await client.end();
  }
}
