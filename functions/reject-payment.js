import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") 
    return { statusCode: 405, body: JSON.stringify({ success: false, message: "Method not allowed" }) };

  const body = JSON.parse(event.body || "{}");
  const ids = body.ids || [];

  if (!ids.length) 
    return { statusCode: 400, body: JSON.stringify({ success: false, message: "No IDs provided" }) };

  const client = new Client({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    // Reject all pending payments for the given IDs
    const res = await client.query(
      "UPDATE payments SET status='rejected', approved_at=NOW() WHERE id = ANY($1::int[]) AND status='pending'",
      [ids]
    );

    if (res.rowCount === 0) {
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
