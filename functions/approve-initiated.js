import { Client } from "pg";
import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        success: false,
        message: "Method not allowed"
      })
    };
  }

  let body;

  try {
    body = JSON.parse(
      event.body || "{}"
    );
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        message: "Invalid request body"
      })
    };
  }

  const ids = body.ids || [];

  if (
    !Array.isArray(ids) ||
    !ids.length
  ) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        message: "No IDs provided"
      })
    };
  }

  const client = new Client({
    connectionString:
      process.env.NEON_DATABASE_URL,

    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    await client.query("BEGIN");

    /*
      Fetch normal lesson-plan payments.
    */
    const resPayments =
      await client.query(
        `
          SELECT
            *,
            'normal' AS type
          FROM payments
          WHERE id = ANY($1::int[])
            AND status = 'initiated'
          FOR UPDATE
        `,
        [ids]
      );

    /*
      Fetch weekly-plan payments.
    */
    const resWeekly =
      await client.query(
        `
          SELECT
            *,
            'weekly' AS type
          FROM weekly_plan_payments
          WHERE id = ANY($1::int[])
            AND status = 'initiated'
          FOR UPDATE
        `,
        [ids]
      );

    /*
      Fetch note payments.
    */
    const resNotes =
      await client.query(
        `
          SELECT
            *,
            'note' AS type
          FROM note_payments
          WHERE id = ANY($1::int[])
            AND status = 'initiated'
          FOR UPDATE
        `,
        [ids]
      );

    const allPayments = [
      ...resPayments.rows,
      ...resWeekly.rows,
      ...resNotes.rows
    ];

    if (!allPayments.length) {
      await client.query(
        "ROLLBACK"
      );

      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message:
            "No initiated payments found for the selected IDs"
        })
      };
    }

    for (
      const payment of allPayments
    ) {
      const amountInt =
        Number.parseInt(
          payment.amount,
          10
        ) || 0;

      /*
        NOTE PURCHASE

        A note payment does not add lesson credits.
        Approval unlocks the purchased PDF.
      */
      if (
        payment.type === "note"
      ) {
        await client.query(
          `
            UPDATE note_payments
            SET
              status = 'approved',
              approved_at = NOW(),
              download_count = 0,
              download_limit = 1
            WHERE id = $1
              AND status = 'initiated'
          `,
          [payment.id]
        );

        const userRes =
          await client.query(
            `
              SELECT
                name,
                email
              FROM users
              WHERE id = $1
            `,
            [payment.user_id]
          );

        const user =
          userRes.rows[0];

        if (user?.email) {
          await resend.emails.send({
            from:
              "Fila Assistant <fila@fleduacademy.com>",

            to:
              user.email,

            subject:
              "Notes Payment Approved - Fila Assistant",

            html: `
              <div style="font-family:Arial,sans-serif;padding:20px;">
                <h2 style="color:#2196f3;">
                  Hello ${escapeHtml(user.name)} 👋
                </h2>

                <p>
                  Your payment for the following notes has been approved:
                </p>

                <ul>
                  <li>
                    Subject:
                    <strong>
                      ${escapeHtml(payment.subject)}
                    </strong>
                  </li>

                  <li>
                    Class:
                    <strong>
                      ${escapeHtml(payment.class_level)}
                    </strong>
                  </li>

                  <li>
                    Academic year:
                    <strong>
                      ${escapeHtml(
                        payment.academic_year || "Not specified"
                      )}
                    </strong>
                  </li>

                  <li>
                    Amount paid:
                    <strong>
                      RWF ${amountInt.toLocaleString()}
                    </strong>
                  </li>

                  <li>
                    Downloads allowed:
                    <strong>1</strong>
                  </li>
                </ul>

                <p>
                  You can now return to the notes page and download
                  your generated PDF once.
                </p>

                <a
                  href="https://fleduacademy.com/notes.html"
                  style="
                    display:inline-block;
                    margin-top:15px;
                    padding:10px 15px;
                    background:#2196f3;
                    color:white;
                    text-decoration:none;
                    border-radius:5px;
                  "
                >
                  Download Notes
                </a>
              </div>
            `
          });
        }

        continue;
      }

      /*
        LESSON-PLAN AND WEEKLY-PLAN PAYMENTS
      */
      const lessonsInt =
        Number.parseInt(
          payment.lessons,
          10
        ) || 0;

      if (
        payment.type === "weekly"
      ) {
        await client.query(
          `
            UPDATE users
            SET weekly_plan =
              COALESCE(weekly_plan, 0) + $1
            WHERE id = $2
          `,
          [
            lessonsInt,
            payment.user_id
          ]
        );
      } else {
        await client.query(
          `
            UPDATE users
            SET balance =
              COALESCE(balance, 0) + $1
            WHERE id = $2
          `,
          [
            lessonsInt,
            payment.user_id
          ]
        );
      }

      /*
        Referral logic applies only to lesson-plan
        and weekly-plan purchases.
      */
      if (
        !payment.referral_applied
      ) {
        const refCheck =
          await client.query(
            `
              SELECT referred_by
              FROM users
              WHERE id = $1
            `,
            [payment.user_id]
          );

        const referrerId =
          refCheck.rows[0]
            ?.referred_by;

        if (referrerId) {
          const bonusLessons =
            Math.floor(
              lessonsInt * 0.2
            );

          if (
            bonusLessons > 0
          ) {
            if (
              payment.type ===
              "weekly"
            ) {
              await client.query(
                `
                  UPDATE users
                  SET
                    weekly_plan =
                      COALESCE(weekly_plan, 0) + $1,

                    total_weekly_referral_bonus =
                      COALESCE(
                        total_weekly_referral_bonus,
                        0
                      ) + $1
                  WHERE id = $2
                `,
                [
                  bonusLessons,
                  referrerId
                ]
              );

              await client.query(
                `
                  UPDATE weekly_plan_payments
                  SET
                    referral_applied = TRUE,
                    total_bonus = $1
                  WHERE id = $2
                `,
                [
                  bonusLessons,
                  payment.id
                ]
              );
            } else {
              await client.query(
                `
                  UPDATE users
                  SET
                    balance =
                      COALESCE(balance, 0) + $1,

                    total_referral_bonus =
                      COALESCE(
                        total_referral_bonus,
                        0
                      ) + $1
                  WHERE id = $2
                `,
                [
                  bonusLessons,
                  referrerId
                ]
              );

              await client.query(
                `
                  UPDATE payments
                  SET
                    referral_applied = TRUE,
                    total_bonus = $1
                  WHERE id = $2
                `,
                [
                  bonusLessons,
                  payment.id
                ]
              );
            }
          }
        }
      }

      const userRes =
        await client.query(
          `
            SELECT
              name,
              email
            FROM users
            WHERE id = $1
          `,
          [payment.user_id]
        );

      const user =
        userRes.rows[0];

      if (user?.email) {
        const planType =
          payment.type ===
          "weekly"
            ? "Weekly Plans"
            : "Lesson Plans";

        await resend.emails.send({
          from:
            "Fila Assistant <fila@fleduacademy.com>",

          to:
            user.email,

          subject:
            "Payment Approved - Fila Assistant 🎉",

          html: `
            <div style="font-family:Arial,sans-serif;padding:20px;">
              <h2 style="color:#2196f3;">
                Hello ${escapeHtml(user.name)} 👋
              </h2>

              <p>
                Thank you for purchasing
                <strong>${planType}</strong>
                on
                <strong>Fila Assistant</strong>.
              </p>

              <p>
                <strong>Payment details:</strong>
              </p>

              <ul>
                <li>
                  Plan type:
                  ${planType}
                </li>

                <li>
                  ${planType} added:
                  ${lessonsInt}
                </li>

                <li>
                  Amount paid:
                  RWF ${amountInt.toLocaleString()}
                </li>

                <li>
                  Date:
                  ${new Date(
                    payment.created_at
                  ).toLocaleString()}
                </li>
              </ul>

              <p>
                You can now access your purchase from your dashboard.
              </p>

              <a
                href="https://fleduacademy.com/index.html"
                style="
                  display:inline-block;
                  margin-top:15px;
                  padding:10px 15px;
                  background:#2196f3;
                  color:white;
                  text-decoration:none;
                  border-radius:5px;
                "
              >
                Go to Dashboard
              </a>
            </div>
          `
        });
      }
    }

    /*
      Approve normal lesson-plan payments.
    */
    if (
      resPayments.rows.length
    ) {
      await client.query(
        `
          UPDATE payments
          SET
            status = 'approved',
            approved_at = NOW()
          WHERE id = ANY($1::int[])
            AND status = 'initiated'
        `,
        [
          resPayments.rows.map(
            (payment) =>
              payment.id
          )
        ]
      );
    }

    /*
      Approve weekly-plan payments.
    */
    if (
      resWeekly.rows.length
    ) {
      await client.query(
        `
          UPDATE weekly_plan_payments
          SET
            status = 'approved',
            approved_at = NOW()
          WHERE id = ANY($1::int[])
            AND status = 'initiated'
        `,
        [
          resWeekly.rows.map(
            (payment) =>
              payment.id
          )
        ]
      );
    }

    /*
      Note payments were already updated inside
      the processing loop.
    */

    await client.query("COMMIT");

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,

        message:
          "Initiated payments approved successfully.",

        approved: {
          normal:
            resPayments.rows.length,

          weekly:
            resWeekly.rows.length,

          notes:
            resNotes.rows.length
        }
      })
    };
  } catch (error) {
    try {
      await client.query(
        "ROLLBACK"
      );
    } catch {
      // Ignore rollback errors.
    }

    console.error(
      "Approve initiated error:",
      error
    );

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
