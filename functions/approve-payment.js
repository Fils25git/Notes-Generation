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

    const allPayments = [
      ...resPayments.rows.map(p => ({ ...p, type: "normal" })),
      ...resWeekly.rows.map(p => ({ ...p, type: "weekly" }))
    ];

    if (!allPayments.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: "No pending payments found for selected IDs" }) };
    }

    // 2️⃣ Process each payment
    for (const payment of allPayments) {

      // ✅ Add lessons to buyer
      if (payment.type === "weekly") {
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

      // ✅ Check referral only if not already applied
      if (!payment.referral_applied) {

        const refCheck = await client.query(
          "SELECT referred_by FROM users WHERE id=$1",
          [payment.user_id]
        );

        const referrerId = refCheck.rows[0]?.referred_by;

        if (referrerId) {

          const lessonsInt = parseInt(payment.lessons, 10) || 0;
const bonusLessons = Math.floor(lessonsInt * 0.10);
          if (bonusLessons > 0) {

            if (payment.type === "weekly") {
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

            // ✅ Mark referral as applied
            if (payment.type === "weekly") {
              await client.query(
                "UPDATE weekly_plan_payments SET referral_applied=true WHERE id=$1",
                [payment.id]
              );
            } else {
              await client.query(
                "UPDATE payments SET referral_applied=true WHERE id=$1",
                [payment.id]
              );
            }
          }
        }
      }
    }

    // 3️⃣ Approve payments
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

    return { 
      statusCode: 200, 
      body: JSON.stringify({ success: true, message: "Payments approved successfully." }) 
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error" }) };
  } finally {
    await client.end();
  }
                }
