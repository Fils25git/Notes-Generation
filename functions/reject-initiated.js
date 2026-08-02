import { Client } from "pg";

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
    New request format:

    {
      payments: [
        { id: 1, type: "normal" },
        { id: 2, type: "weekly" },
        { id: 3, type: "note" }
      ]
    }

    Old request format:

    {
      ids: [1, 2, 3]
    }
  */

  const suppliedPayments =
    Array.isArray(body.payments)
      ? body.payments
      : [];

  const oldIds =
    uniquePositiveIntegers(
      Array.isArray(body.ids)
        ? body.ids
        : []
    );

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
    Backward compatibility for the old admin page.

    Old IDs are checked only in the normal and weekly
    payment tables.

    They are not automatically checked in note_payments
    because the same ID can exist in multiple tables.
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
      Delete initiated lesson-plan payments.
    */
    const resPayments =
      normalIds.length > 0
        ? await client.query(
            `
              DELETE FROM payments
              WHERE id = ANY($1::int[])
                AND status = 'initiated'
              RETURNING
                id,
                user_id
            `,
            [normalIds]
          )
        : {
            rows: [],
            rowCount: 0
          };

    /*
      Delete initiated weekly-plan payments.
    */
    const resWeekly =
      weeklyIds.length > 0
        ? await client.query(
            `
              DELETE FROM weekly_plan_payments
              WHERE id = ANY($1::int[])
                AND status = 'initiated'
              RETURNING
                id,
                user_id
            `,
            [weeklyIds]
          )
        : {
            rows: [],
            rowCount: 0
          };

    /*
      Delete initiated note payments.

      Only initiated records are deleted.
      Approved or downloaded note purchases are protected.
    */
    const resNotes =
      noteIds.length > 0
        ? await client.query(
            `
              DELETE FROM note_payments
              WHERE id = ANY($1::int[])
                AND status = 'initiated'
              RETURNING
                id,
                user_id,
                subject,
                class_level,
                note_version
            `,
            [noteIds]
          )
        : {
            rows: [],
            rowCount: 0
          };

    const totalDeleted =
      resPayments.rowCount +
      resWeekly.rowCount +
      resNotes.rowCount;

    if (totalDeleted === 0) {
      await client.query("ROLLBACK");

      return jsonResponse(400, {
        success: false,
        message:
          "No initiated payments were found for the selected records"
      });
    }

    await client.query("COMMIT");

    return jsonResponse(200, {
      success: true,

      message:
        "Initiated payments cleared successfully.",

      deleted: {
        normal:
          resPayments.rowCount,

        weekly:
          resWeekly.rowCount,

        notes:
          resNotes.rowCount,

        total:
          totalDeleted
      }
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
      "Reject initiated payments error:",
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
