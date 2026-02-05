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

    // Instead of updating rejected payments, we just delete them
    const resPayments = await client.query(
      "DELETE FROM payments WHERE id = ANY($1::int[]) AND status='initiated'",
      [ids]
    );

    const resWeekly = await client.query(
      "DELETE FROM weekly_plan_payments WHERE id = ANY($1::int[]) AND status='initiated'",
      [ids]
    );

    if (resPayments.rowCount === 0 && resWeekly.rowCount === 0) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: "No initiated payments found for selected IDs" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, message: "initiated payments cleared successfully." }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error" }) };
  } finally {
    await client.end();
  }
}
