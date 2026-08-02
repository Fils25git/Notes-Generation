import { Client } from "pg";
import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(
      405,
      {
        success: false,
        message: "Method not allowed"
      },
      {
        Allow: "POST"
      }
    );
  }

  let body;

  try {
    body = JSON.parse(
      event.body || "{}"
    );
  } catch {
    return jsonResponse(400, {
      success: false,
      message: "Invalid request body"
    });
  }

  /*
    New frontend format:

    {
      payments: [
        { id: 1, type: "normal" },
        { id: 2, type: "weekly" },
        { id: 3, type: "note" }
      ]
    }

    Old frontend format:

    {
      ids: [1, 2, 3]
    }
  */

  const suppliedPayments =
    Array.isArray(body.payments)
      ? body.payments
      : [];

  const oldIds =
    Array.isArray(body.ids)
      ? body.ids
          .map((id) =>
            Number.parseInt(id, 10)
          )
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0
          )
      : [];

  const normalIds =
    uniquePositiveIntegers(
      suppliedPayments
        .filter(
          (payment) =>
            payment?.type === "normal"
        )
        .map(
          (payment) =>
            payment.id
        )
    );

  const weeklyIds =
    uniquePositiveIntegers(
      suppliedPayments
        .filter(
          (payment) =>
            payment?.type === "weekly"
        )
        .map(
          (payment) =>
            payment.id
        )
    );

  const noteIds =
    uniquePositiveIntegers(
      suppliedPayments
        .filter(
          (payment) =>
            payment?.type === "note"
        )
        .map(
          (payment) =>
            payment.id
        )
    );

  /*
    Backward compatibility:

    If the request contains only body.ids, the same IDs
    are checked in the old normal and weekly tables.

    They are not automatically checked in note_payments
    because IDs can overlap between tables.
  */
  if (
    suppliedPayments.length === 0 &&
    oldIds.length > 0
  ) {
    normalIds.push(
      ...oldIds.filter(
        (id) =>
          !normalIds.includes(id)
      )
    );

    weeklyIds.push(
      ...oldIds.filter(
        (id) =>
          !weeklyIds.includes(id)
      )
    );
  }

  if (
    normalIds.length === 0 &&
    weeklyIds.length === 0 &&
    noteIds.length === 0
  ) {
    return jsonResponse(400, {
      success: false,
      message:
        "No valid payments were provided"
    });
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
      normalIds.length > 0
        ? await client.query(
            `
              SELECT
                *,
                'normal' AS type
              FROM payments
              WHERE id = ANY($1::int[])
                AND status = 'initiated'
              FOR UPDATE
            `,
            [normalIds]
          )
        : {
            rows: []
          };

    /*
      Fetch weekly-plan payments.
    */
    const resWeekly =
      weeklyIds.length > 0
        ? await client.query(
            `
              SELECT
                *,
                'weekly' AS type
              FROM weekly_plan_payments
              WHERE id = ANY($1::int[])
                AND status = 'initiated'
              FOR UPDATE
            `,
            [weeklyIds]
          )
        : {
            rows: []
          };

    /*
      Fetch note payments.
    */
    const resNotes =
      noteIds.length > 0
        ? await client.query(
            `
              SELECT
                *,
                'note' AS type
              FROM note_payments
              WHERE id = ANY($1::int[])
                AND status = 'initiated'
              FOR UPDATE
            `,
            [noteIds]
          )
        : {
            rows: []
          };

    const allPayments = [
      ...resPayments.rows,
      ...resWeekly.rows,
      ...resNotes.rows
    ];

    if (!allPayments.length) {
      await client.query(
        "ROLLBACK"
      );

      return jsonResponse(400, {
        success: false,
        message:
          "No initiated payments were found for the selected records"
      });
    }

    const emailsToSend = [];

    for (
      const payment of allPayments
    ) {
      const amountInt =
        Number.parseInt(
          payment.amount,
          10
        ) || 0;

      /*
        =====================================================
        NOTE PURCHASE
        =====================================================

        A note payment does not add lesson credits.
        Approval unlocks one download.
      */
      if (
        payment.type === "note"
      ) {
        const updateResult =
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
              RETURNING
                id,
                user_id,
                subject,
                class_level,
                academic_year,
                amount,
                created_at
            `,
            [payment.id]
          );

        if (
          updateResult.rows.length === 0
        ) {
          continue;
        }

        const userResult =
          await client.query(
            `
              SELECT
                name,
                email
              FROM users
              WHERE id = $1
              LIMIT 1
            `,
            [payment.user_id]
          );

        const user =
          userResult.rows[0];

        if (user?.email) {
          emailsToSend.push({
            type: "note",
            to: user.email,
            subject:
              "Notes Payment Approved - Fila Assistant",
            html:
              buildNotePaymentEmail({
                user,
                payment,
                amountInt
              })
          });
        }

        continue;
      }

      /*
        =====================================================
        LESSON-PLAN AND WEEKLY-PLAN PAYMENTS
        =====================================================
      */

      const lessonsInt =
        Number.parseInt(
          payment.lessons,
          10
        ) || 0;

      if (
        lessonsInt <= 0
      ) {
        throw new Error(
          `Invalid lesson amount for ${payment.type} payment ID ${payment.id}`
        );
      }

      if (
        payment.type === "weekly"
      ) {
        await client.query(
          `
            UPDATE users
            SET weekly_plan =
              COALESCE(
                weekly_plan,
                0
              ) + $1
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
              COALESCE(
                balance,
                0
              ) + $1
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
              LIMIT 1
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
                      COALESCE(
                        weekly_plan,
                        0
                      ) + $1,

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
                      COALESCE(
                        balance,
                        0
                      ) + $1,

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

      const userResult =
        await client.query(
          `
            SELECT
              name,
              email
            FROM users
            WHERE id = $1
            LIMIT 1
          `,
          [payment.user_id]
        );

      const user =
        userResult.rows[0];

      if (user?.email) {
        const planType =
          payment.type === "weekly"
            ? "Weekly Plans"
            : "Lesson Plans";

        emailsToSend.push({
          type: payment.type,
          to: user.email,
          subject:
            "Payment Approved - Fila Assistant 🎉",
          html:
            buildPlanPaymentEmail({
              user,
              payment,
              planType,
              lessonsInt,
              amountInt
            })
        });
      }
    }

    /*
      Approve normal lesson-plan payments.
    */
    if (
      resPayments.rows.length > 0
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
      resWeekly.rows.length > 0
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
      Note payments were updated individually
      inside the processing loop.
    */

    await client.query("COMMIT");

    /*
      Send emails after committing the database transaction.

      If Resend fails, the payment remains approved instead
      of rolling back a successful payment.
    */
    const emailResults =
      await sendApprovalEmails(
        emailsToSend
      );

    return jsonResponse(200, {
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
      },

      emails: emailResults
    });
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

    return jsonResponse(500, {
      success: false,
      message:
        error.message ||
        "Server error"
    });
  } finally {
    try {
      await client.end();
    } catch (error) {
      console.error(
        "Database closing error:",
        error
      );
    }
  }
}

/* =========================================================
   EMAIL DELIVERY
========================================================= */

async function sendApprovalEmails(
  emails
) {
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      await resend.emails.send({
        from:
          "Fila Assistant <fila@fleduacademy.com>",

        to:
          email.to,

        subject:
          email.subject,

        html:
          email.html
      });

      sent += 1;
    } catch (error) {
      failed += 1;

      console.error(
        `Approval email failed for ${email.to}:`,
        error
      );
    }
  }

  return {
    queued:
      emails.length,

    sent,

    failed
  };
}

/* =========================================================
   NOTE PAYMENT EMAIL
========================================================= */

function buildNotePaymentEmail({
  user,
  payment,
  amountInt
}) {
  return `
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
            ${escapeHtml(
              String(
                payment.class_level || ""
              ).toUpperCase()
            )}
          </strong>
        </li>

        <li>
          Academic year:
          <strong>
            ${escapeHtml(
              payment.academic_year ||
              "Not specified"
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

      <p style="margin-top:20px;font-size:12px;color:#555;">
        If you did not make this purchase, contact support immediately.
      </p>
    </div>
  `;
}

/* =========================================================
   LESSON/WEEKLY PAYMENT EMAIL
========================================================= */

function buildPlanPaymentEmail({
  user,
  payment,
  planType,
  lessonsInt,
  amountInt
}) {
  return `
    <div style="font-family:Arial,sans-serif;padding:20px;">
      <h2 style="color:#2196f3;">
        Hello ${escapeHtml(user.name)} 👋
      </h2>

      <p>
        Thank you for purchasing
        <strong>
          ${escapeHtml(planType)}
        </strong>
        on
        <strong>Fila Assistant</strong>.
      </p>

      <p>
        <strong>Payment details:</strong>
      </p>

      <ul>
        <li>
          Plan type:
          ${escapeHtml(planType)}
        </li>

        <li>
          ${escapeHtml(planType)} added:
          ${lessonsInt}
        </li>

        <li>
          Amount paid:
          RWF ${amountInt.toLocaleString()}
        </li>

        <li>
          Date:
          ${escapeHtml(
            formatDate(
              payment.created_at
            )
          )}
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

      <p style="margin-top:20px;font-size:12px;color:#555;">
        If you did not make this purchase, contact support immediately.
      </p>
    </div>
  `;
}

/* =========================================================
   HELPERS
========================================================= */

function uniquePositiveIntegers(
  values
) {
  return [
    ...new Set(
      values
        .map(
          (value) =>
            Number.parseInt(
              value,
              10
            )
        )
        .filter(
          (value) =>
            Number.isInteger(value) &&
            value > 0
        )
    )
  ];
}

function jsonResponse(
  statusCode,
  data,
  extraHeaders = {}
) {
  return {
    statusCode,

    headers: {
      "Content-Type":
        "application/json",

      "Cache-Control":
        "no-store",

      ...extraHeaders
    },

    body:
      JSON.stringify(data)
  };
}

function formatDate(value) {
  if (!value) {
    return "Not specified";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not specified";
  }

  return date.toLocaleString(
    "en-RW",
    {
      timeZone:
        "Africa/Kigali"
    }
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
        }
