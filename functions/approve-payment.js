import { Client } from "pg";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  const body = JSON.parse(event.body || "{}");
  const ids = body.ids || [];

  if (!ids.length) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "No IDs provided" })
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1️⃣ Fetch pending payments
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
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "No pending payments found for selected IDs"
        })
      };
    }

    // 2️⃣ Process each payment
    for (const payment of allPayments) {

      const lessonsInt = parseInt(payment.lessons, 10) || 0;
      const amountInt = parseInt(payment.amount, 10) || 0;

      // ✅ Add lessons to buyer
      if (payment.type === "weekly") {
        await client.query(
          "UPDATE users SET weekly_plan = weekly_plan + $1 WHERE id=$2",
          [lessonsInt, payment.user_id]
        );
      } else {
        await client.query(
          "UPDATE users SET balance = balance + $1 WHERE id=$2",
          [lessonsInt, payment.user_id]
        );
      }

// ✅ Referral logic (refined + total_bonus recording)
if (!payment.referral_applied) {

  const refCheck = await client.query(
    "SELECT referred_by FROM users WHERE id=$1",
    [payment.user_id]
  );

  const referrerId = refCheck.rows[0]?.referred_by;

  if (referrerId) {

    const bonusLessons = Math.floor(lessonsInt * 0.20);

    if (bonusLessons > 0) {
  if (payment.type === "weekly") {
    // Add lessons + update total weekly referral bonus
    await client.query(
      "UPDATE users SET weekly_plan = weekly_plan + $1, total_weekly_referral_bonus = total_weekly_referral_bonus + $1 WHERE id=$2",
      [bonusLessons, referrerId]
    );

    // Mark payment referral applied + store bonus for record
    await client.query(
      `UPDATE weekly_plan_payments SET referral_applied=true, total_bonus=$1 WHERE id=$2`,
      [bonusLessons, payment.id]
    );
  } else {
    // Add lessons + update total normal referral bonus
    await client.query(
      "UPDATE users SET balance = balance + $1, total_referral_bonus = total_referral_bonus + $1 WHERE id=$2",
      [bonusLessons, referrerId]
    );

    // Mark payment referral applied + store bonus for record
    await client.query(
      `UPDATE payments SET referral_applied=true, total_bonus=$1 WHERE id=$2`,
      [bonusLessons, payment.id]
    );
  }
  }
 }
}

      // ✅ Fetch user info
      const userRes = await client.query(
        "SELECT name, email FROM users WHERE id=$1",
        [payment.user_id]
      );

      const user = userRes.rows[0];

      // ✅ Send approval email
      if (user?.email) {

        const planType =
          payment.type === "weekly" ? "Weekly Plan" : "Lesson Balance";

        await resend.emails.send({
          from: "Fila Assistant <fila@fleduacademy.com>", // must be verified domain
          to: user.email,
          subject: "Payment Approved - Fila Assistant 🎉",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color:#2196f3;">Hello ${user.name} 👋</h2>

              <p>Thank you for purchasing a <strong>${planType}</strong> on <strong>Fila Assistant</strong>!</p>

              <p><strong>Payment Details:</strong></p>
              <ul>
                <li>Plan Type: ${planType}</li>
                <li>Plans Added: ${lessonsInt}</li>
                <li>Amount Paid: RWF ${amountInt.toLocaleString()}</li>
                <li>Date: ${new Date(payment.created_at).toLocaleString()}</li>
              </ul>

              <p>You can now access your lessons or weekly plan immediately in your dashboard.</p>

              <a href="https://fleduacademy.com/index"
                 style="display:inline-block; margin-top:15px; padding:10px 15px; background:#2196f3; color:white; text-decoration:none; border-radius:5px;">
                 Go to Dashboard
              </a>

              <p style="margin-top:20px; font-size:12px; color:#555;">
                If you did not make this purchase, please contact support immediately.
              </p>
            </div>
          `
        });
      }
    }

    // 3️⃣ Mark payments approved
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
      body: JSON.stringify({
        success: true,
        message: "Payments approved successfully."
      })
    };

  } catch (err) {
    console.error("Approve error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Server error"
      })
    };
  } finally {
    await client.end();
  }
      }
