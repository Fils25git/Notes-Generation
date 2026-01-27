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

    // 1️⃣ Reject payments in "payments" table
    const resPayments = await client.query(
      "UPDATE payments SET status='rejected', approved_at=NOW() WHERE id = ANY($1::int[]) AND status='pending'",
      [ids]
    );

    // 2️⃣ Reject payments in "weekly_plan_payments" table
    const resWeekly = await client.query(
      "UPDATE weekly_plan_payments SET status='rejected', approved_at=NOW() WHERE id = ANY($1::int[]) AND status='pending'",
      [ids]
    );

    if (resPayments.rowCount === 0 && resWeekly.rowCount === 0) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: "No pending payments found for selected IDs" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, message: "Payments rejected successfully." }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error" }) };
  } finally {
    await client.end();
  }
}
