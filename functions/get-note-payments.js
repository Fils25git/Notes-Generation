import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: false,
        message: "Method not allowed"
      })
    };
  }

  const status =
    event.queryStringParameters?.status ||
    "initiated";

  const allowedStatuses = [
    "initiated",
    "approved",
    "rejected",
    "downloaded"
  ];

  if (!allowedStatuses.includes(status)) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: false,
        message: "Invalid payment status"
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

    const result = await client.query(
      `
        SELECT
          np.id,
          np.user_id,

          u.name AS full_name,
          u.email,
          u.phone,

          np.category,
          np.class_level,
          np.subject,
          np.note_version,
          np.academic_year,

          np.school_name,
          np.district,
          np.sector,

          np.amount,
          np.payment_reference,
          np.status,

          np.download_count,
          np.download_limit,

          np.approved_at,
          np.downloaded_at,
          np.created_at

        FROM note_payments np

        INNER JOIN users u
          ON u.id = np.user_id

        WHERE np.status = $1

        ORDER BY np.created_at DESC
      `,
      [status]
    );

    return {
      statusCode: 200,

      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },

      body: JSON.stringify(
        result.rows
      )
    };
  } catch (error) {
    console.error(
      "Get note payments error:",
      error
    );

    return {
      statusCode: 500,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        success: false,
        message: "Server error"
      })
    };
  } finally {
    try {
      await client.end();
    } catch (error) {
      console.error(
        "Database connection closing error:",
        error
      );
    }
  }
}
