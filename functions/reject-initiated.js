import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") 
    return { statusCode: 405, body: JSON.stringify({ success: false, message: "Method not allowed" }) };

  const { items = [] } = JSON.parse(event.body || "{}");

  // ✅ FIX 1: validate items (ids does not exist)
  if (!items.length) 
    return { statusCode: 400, body: JSON.stringify({ success: false, message: "No IDs provided" }) };

  // ✅ FIX 2: split IDs by table
  const paymentsIds = items
    .filter(i => i.source === "payments")
    .map(i => i.id);

  const weeklyIds = items
    .filter(i => i.source === "weekly")
    .map(i => i.id);

  const client = new Client({ 
    connectionString: process.env.NEON_DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    await client.connect();

    let totalUpdated = 0;

    // 1️⃣ Reject payments in "payments" table
    if (paymentsIds.length) {
      const resPayments = await client.query(
        "UPDATE payments SET status='rejected', approved_at=NOW() WHERE id = ANY($1::int[]) AND status='initiated'",
        [paymentsIds]
      );
      totalUpdated += resPayments.rowCount;
    }

    // 2️⃣ Reject payments in "weekly_plan_payments" table
    if (weeklyIds.length) {
      const resWeekly = await client.query(
        "UPDATE weekly_plan_payments SET status='rejected', approved_at=NOW() WHERE id = ANY($1::int[]) AND status='initiated'",
        [weeklyIds]
      );
      totalUpdated += resWeekly.rowCount;
    }

    // ✅ FIX 3: correct success condition
    if (totalUpdated === 0) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ success: false, message: "No initiated payments found for selected IDs" }) 
      };
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ success: true, message: "Payments rejected successfully." }) 
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error" }) };
  } finally {
    await client.end();
  }
                            }
