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

    // 1️⃣ Fetch pending payments from BOTH tables
    const resPayments = await client.query(
      "SELECT * FROM payments WHERE id = ANY($1::int[]) AND status='pending'",
      [ids]
    );
    const resWeekly = await client.query(
      "SELECT * FROM weekly_plan_payments WHERE id = ANY($1::int[]) AND status='pending'",
      [ids]
    );

    const allPayments = [...resPayments.rows, ...resWeekly.rows];

    if (!allPayments.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: "No pending payments found for selected IDs" }) };
    }

    // 2️⃣ Update user balances (or weekly_plan if weekly plan table)
    for (const payment of allPayments) {

  // 1️⃣ Add lessons to buyer
  if (resWeekly.rows.find(wp => wp.id === payment.id)) {

    await client.query(
      "UPDATE users SET weekly_plan = weekly_plan + $1 WHERE id=$2",
      [payment.lessons, payment.user_id]
    );

  } else {

    await client.query(
      "UPDATE users SET balance = balance + $1 WHERE id=$2",
      [payment.lessons, payment.user_id]
    );
  }

  // 2️⃣ Check if buyer was referred by someone
  const refCheck = await client.query(
    "SELECT referred_by FROM users WHERE id=$1",
    [payment.user_id]
  );

  const referrerId = refCheck.rows[0]?.referred_by;

  if (referrerId) {

    const bonusLessons = Math.floor(payment.lessons * 0.10);

    if (bonusLessons > 0) {

      if (resWeekly.rows.find(wp => wp.id === payment.id)) {

        await client.query(
          "UPDATE users SET weekly_plan = weekly_plan + $1 WHERE id=$2",
          [bonusLessons, referrerId]
        );

      } else {

        await client.query(
          "UPDATE users SET balance = balance + $1 WHERE id=$2",
          [bonusLessons, referrerId]
        );

      }

    }
  }
       }

    // 3️⃣ Approve all payments in both tables
    if (resPayments.rows.length) {
      await client.query(
        "UPDATE payments SET status='approved', approved_at=NOW() WHERE id = ANY($1::int[])",
        [resPayments.rows.map(p => p.id)]
      );
    }
    if (resWeekly.rows.length) {
      await client.query(
        "UPDATE weekly_plan_payments SET status='approved', approved_at=NOW() WHERE id = ANY($1::int[])",
        [resWeekly.rows.map(p => p.id)]
      );
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, message: "Payments approved successfully." }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error" }) };
  } finally {
    await client.end();
  }
        }
