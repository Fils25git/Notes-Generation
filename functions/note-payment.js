import { Client } from "pg";
import jwt from "jsonwebtoken";

const NOTE_PRICE = 500;
const MAX_NOTE_VERSION = 5;

const ALLOWED_CATEGORIES = [
  "primary",
  "ordinary"
];

const ALLOWED_STATUSES = [
  "initiated",
  "approved",
  "rejected",
  "downloaded"
];

export async function handler(event) {
  const action =
    String(
      event.queryStringParameters?.action || ""
    )
      .trim()
      .toLowerCase();

  try {
    if (action === "create") {
      return await createNotePayment(event);
    }

    if (action === "check") {
      return await checkNotePayment(event);
    }

    if (action === "download") {
      return await authorizeNoteDownload(event);
    }

    return jsonResponse(400, {
      success: false,
      message:
        "Invalid action. Use create, check, or download."
    });
  } catch (error) {
    console.error(
      "Note payment handler error:",
      error
    );

    return jsonResponse(500, {
      success: false,
      message: "Server error"
    });
  }
}

/* =========================================================
   CREATE NOTE PAYMENT
   POST: /.netlify/functions/note-payment?action=create
========================================================= */

async function createNotePayment(event) {
  if (event.httpMethod !== "POST") {
    return methodNotAllowed("POST");
  }

  const authenticatedUser =
    authenticateUser(event);

  if (!authenticatedUser.success) {
    return authenticatedUser.response;
  }

  const bodyResult =
    parseRequestBody(event);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const body = bodyResult.body;

  const category =
    normalizeLowercase(body.category);

  const classLevel =
    normalizeLowercase(body.classLevel);

  const subject =
    normalizeLowercase(body.subject);

  const academicYear =
    normalizeText(body.academicYear);

  const schoolName =
    normalizeText(body.schoolName);

  const district =
    normalizeText(body.district);

  const sector =
    normalizeText(body.sector);

  const paymentReference =
    normalizeOptionalText(
      body.paymentReference
    );

  const noteVersion =
    Number.parseInt(
      body.noteVersion,
      10
    );

  if (
    !category ||
    !classLevel ||
    !subject ||
    !academicYear ||
    !schoolName ||
    !district ||
    !sector
  ) {
    return jsonResponse(400, {
      success: false,
      message:
        "Category, class, subject, academic year, school, district and sector are required."
    });
  }

  if (
    !ALLOWED_CATEGORIES.includes(
      category
    )
  ) {
    return jsonResponse(400, {
      success: false,
      message:
        "Invalid note category."
    });
  }

  if (
    !Number.isInteger(noteVersion) ||
    noteVersion < 1 ||
    noteVersion > MAX_NOTE_VERSION
  ) {
    return jsonResponse(400, {
      success: false,
      message:
        `Note version must be between 1 and ${MAX_NOTE_VERSION}.`
    });
  }

  const client =
    createDatabaseClient();

  try {
    await client.connect();
    await client.query("BEGIN");

    const user =
      await findAuthenticatedUser(
        client,
        authenticatedUser.payload
      );

    if (!user) {
      await client.query("ROLLBACK");

      return jsonResponse(404, {
        success: false,
        message:
          "Logged-in user was not found."
      });
    }

    /*
      Look for an existing pending or approved
      payment for the same exact generated note.
    */
    const existingResult =
      await client.query(
        `
          SELECT
            id,
            status,
            amount,
            download_count,
            download_limit,
            created_at,
            approved_at
          FROM note_payments
          WHERE user_id = $1
            AND category = $2
            AND class_level = $3
            AND subject = $4
            AND note_version = $5
            AND academic_year = $6
            AND school_name = $7
            AND district = $8
            AND sector = $9
            AND status IN (
              'initiated',
              'approved'
            )
          ORDER BY created_at DESC
          LIMIT 1
          FOR UPDATE
        `,
        [
          user.id,
          category,
          classLevel,
          subject,
          noteVersion,
          academicYear,
          schoolName,
          district,
          sector
        ]
      );

    if (
      existingResult.rows.length > 0
    ) {
      const existing =
        existingResult.rows[0];

      await client.query("COMMIT");

      return jsonResponse(200, {
        success: true,
        existing: true,
        paymentId: existing.id,
        status: existing.status,
        amount: Number(existing.amount),
        downloadCount:
          existing.download_count,
        downloadLimit:
          existing.download_limit,
        message:
          existing.status === "approved"
            ? "This note payment is already approved."
            : "A pending payment already exists for these notes."
      });
    }

    const insertResult =
      await client.query(
        `
          INSERT INTO note_payments (
            user_id,
            category,
            class_level,
            subject,
            note_version,
            academic_year,
            school_name,
            district,
            sector,
            amount,
            payment_reference,
            status,
            download_count,
            download_limit,
            created_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            'initiated',
            0,
            1,
            NOW()
          )
          RETURNING
            id,
            user_id,
            category,
            class_level,
            subject,
            note_version,
            academic_year,
            school_name,
            district,
            sector,
            amount,
            payment_reference,
            status,
            download_count,
            download_limit,
            created_at
        `,
        [
          user.id,
          category,
          classLevel,
          subject,
          noteVersion,
          academicYear,
          schoolName,
          district,
          sector,
          NOTE_PRICE,
          paymentReference
        ]
      );

    await client.query("COMMIT");

    const payment =
      insertResult.rows[0];

    return jsonResponse(201, {
      success: true,
      existing: false,
      paymentId: payment.id,
      status: payment.status,
      amount: Number(payment.amount),
      payment,
      message:
        "Payment request created. Pay 500 RWF and wait for admin approval."
    });
  } catch (error) {
    await safeRollback(client);

    console.error(
      "Create note payment error:",
      error
    );

    if (
      error.code === "23503"
    ) {
      return jsonResponse(400, {
        success: false,
        message:
          "The selected user does not exist."
      });
    }

    if (
      error.code === "42P01"
    ) {
      return jsonResponse(500, {
        success: false,
        message:
          "The note_payments table does not exist."
      });
    }

    return jsonResponse(500, {
      success: false,
      message:
        "The note payment could not be created."
    });
  } finally {
    await safeClose(client);
  }
}

/* =========================================================
   CHECK NOTE PAYMENT
   GET:
   /.netlify/functions/note-payment?action=check&paymentId=5
========================================================= */

async function checkNotePayment(event) {
  if (event.httpMethod !== "GET") {
    return methodNotAllowed("GET");
  }

  const authenticatedUser =
    authenticateUser(event);

  if (!authenticatedUser.success) {
    return authenticatedUser.response;
  }

  const paymentId =
    Number.parseInt(
      event.queryStringParameters
        ?.paymentId,
      10
    );

  if (
    !Number.isInteger(paymentId) ||
    paymentId <= 0
  ) {
    return jsonResponse(400, {
      success: false,
      message:
        "A valid payment ID is required."
    });
  }

  const client =
    createDatabaseClient();

  try {
    await client.connect();

    const user =
      await findAuthenticatedUser(
        client,
        authenticatedUser.payload
      );

    if (!user) {
      return jsonResponse(404, {
        success: false,
        message:
          "Logged-in user was not found."
      });
    }

    const result =
      await client.query(
        `
          SELECT
            id,
            user_id,
            category,
            class_level,
            subject,
            note_version,
            academic_year,
            amount,
            payment_reference,
            status,
            download_count,
            download_limit,
            approved_at,
            downloaded_at,
            created_at
          FROM note_payments
          WHERE id = $1
            AND user_id = $2
          LIMIT 1
        `,
        [
          paymentId,
          user.id
        ]
      );

    if (
      result.rows.length === 0
    ) {
      return jsonResponse(404, {
        success: false,
        message:
          "Note payment was not found."
      });
    }

    const payment =
      result.rows[0];

    if (
      !ALLOWED_STATUSES.includes(
        payment.status
      )
    ) {
      return jsonResponse(500, {
        success: false,
        message:
          "The payment has an invalid status."
      });
    }

    const canDownload =
      payment.status === "approved" &&
      Number(payment.download_count) <
        Number(payment.download_limit);

    return jsonResponse(200, {
      success: true,
      paymentId: payment.id,
      status: payment.status,
      amount: Number(payment.amount),
      downloadCount:
        Number(payment.download_count),
      downloadLimit:
        Number(payment.download_limit),
      canDownload,
      payment
    });
  } catch (error) {
    console.error(
      "Check note payment error:",
      error
    );

    return jsonResponse(500, {
      success: false,
      message:
        "The note payment status could not be checked."
    });
  } finally {
    await safeClose(client);
  }
}

/* =========================================================
   AUTHORIZE AND CONSUME ONE DOWNLOAD
   POST: /.netlify/functions/note-payment?action=download

   Body:
   {
     "paymentId": 5
   }
========================================================= */

async function authorizeNoteDownload(
  event
) {
  if (event.httpMethod !== "POST") {
    return methodNotAllowed("POST");
  }

  const authenticatedUser =
    authenticateUser(event);

  if (!authenticatedUser.success) {
    return authenticatedUser.response;
  }

  const bodyResult =
    parseRequestBody(event);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const paymentId =
    Number.parseInt(
      bodyResult.body.paymentId,
      10
    );

  if (
    !Number.isInteger(paymentId) ||
    paymentId <= 0
  ) {
    return jsonResponse(400, {
      success: false,
      message:
        "A valid payment ID is required."
    });
  }

  const client =
    createDatabaseClient();

  try {
    await client.connect();
    await client.query("BEGIN");

    const user =
      await findAuthenticatedUser(
        client,
        authenticatedUser.payload
      );

    if (!user) {
      await client.query("ROLLBACK");

      return jsonResponse(404, {
        success: false,
        message:
          "Logged-in user was not found."
      });
    }

    /*
      Lock this payment row to stop two download
      requests from using the same payment together.
    */
    const paymentResult =
      await client.query(
        `
          SELECT
            id,
            user_id,
            category,
            class_level,
            subject,
            note_version,
            academic_year,
            amount,
            status,
            download_count,
            download_limit
          FROM note_payments
          WHERE id = $1
            AND user_id = $2
          LIMIT 1
          FOR UPDATE
        `,
        [
          paymentId,
          user.id
        ]
      );

    if (
      paymentResult.rows.length === 0
    ) {
      await client.query("ROLLBACK");

      return jsonResponse(404, {
        success: false,
        message:
          "Note payment was not found."
      });
    }

    const payment =
      paymentResult.rows[0];

    if (
      payment.status === "initiated"
    ) {
      await client.query("ROLLBACK");

      return jsonResponse(403, {
        success: false,
        status: payment.status,
        message:
          "Payment is still waiting for admin approval."
      });
    }

    if (
      payment.status === "rejected"
    ) {
      await client.query("ROLLBACK");

      return jsonResponse(403, {
        success: false,
        status: payment.status,
        message:
          "This payment was rejected."
      });
    }

    if (
      payment.status === "downloaded"
    ) {
      await client.query("ROLLBACK");

      return jsonResponse(403, {
        success: false,
        status: payment.status,
        message:
          "The one permitted download has already been used."
      });
    }

    if (
      payment.status !== "approved"
    ) {
      await client.query("ROLLBACK");

      return jsonResponse(403, {
        success: false,
        status: payment.status,
        message:
          "This payment is not approved for downloading."
      });
    }

    const downloadCount =
      Number(
        payment.download_count
      );

    const downloadLimit =
      Number(
        payment.download_limit
      );

    if (
      downloadCount >= downloadLimit
    ) {
      await client.query(
        `
          UPDATE note_payments
          SET
            status = 'downloaded',
            downloaded_at =
              COALESCE(
                downloaded_at,
                NOW()
              )
          WHERE id = $1
        `,
        [paymentId]
      );

      await client.query("COMMIT");

      return jsonResponse(403, {
        success: false,
        status: "downloaded",
        message:
          "The download limit has already been reached."
      });
    }

    const updateResult =
      await client.query(
        `
          UPDATE note_payments
          SET
            download_count =
              download_count + 1,

            status =
              CASE
                WHEN download_count + 1
                  >= download_limit
                THEN 'downloaded'
                ELSE status
              END,

            downloaded_at =
              CASE
                WHEN download_count + 1
                  >= download_limit
                THEN NOW()
                ELSE downloaded_at
              END
          WHERE id = $1
            AND user_id = $2
          RETURNING
            id,
            category,
            class_level,
            subject,
            note_version,
            academic_year,
            status,
            download_count,
            download_limit,
            downloaded_at
        `,
        [
          paymentId,
          user.id
        ]
      );

    await client.query("COMMIT");

    const updatedPayment =
      updateResult.rows[0];

    /*
      This response authorizes the frontend to download
      the already-generated PDF.

      For stronger protection, the backend should later
      return the actual PDF file itself.
    */
    return jsonResponse(200, {
      success: true,
      authorized: true,
      paymentId:
        updatedPayment.id,
      status:
        updatedPayment.status,
      downloadCount:
        Number(
          updatedPayment.download_count
        ),
      downloadLimit:
        Number(
          updatedPayment.download_limit
        ),
      note: {
        category:
          updatedPayment.category,
        classLevel:
          updatedPayment.class_level,
        subject:
          updatedPayment.subject,
        noteVersion:
          updatedPayment.note_version,
        academicYear:
          updatedPayment.academic_year
      },
      message:
        "Download authorized. This purchase has now used its permitted download."
    });
  } catch (error) {
    await safeRollback(client);

    console.error(
      "Authorize note download error:",
      error
    );

    return jsonResponse(500, {
      success: false,
      message:
        "The note download could not be authorized."
    });
  } finally {
    await safeClose(client);
  }
}

/* =========================================================
   AUTHENTICATION
========================================================= */

function authenticateUser(event) {
  const authorizationHeader =
    event.headers?.authorization ||
    event.headers?.Authorization ||
    "";

  if (
    !authorizationHeader.startsWith(
      "Bearer "
    )
  ) {
    return {
      success: false,
      response: jsonResponse(401, {
        success: false,
        message:
          "Authentication token is required."
      })
    };
  }

  const token =
    authorizationHeader
      .slice(7)
      .trim();

  if (!token) {
    return {
      success: false,
      response: jsonResponse(401, {
        success: false,
        message:
          "Authentication token is required."
      })
    };
  }

  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error(
      "JWT_SECRET is not configured."
    );

    return {
      success: false,
      response: jsonResponse(500, {
        success: false,
        message:
          "Authentication is not configured on the server."
      })
    };
  }

  try {
    const payload =
      jwt.verify(
        token,
        jwtSecret
      );

    return {
      success: true,
      payload
    };
  } catch (error) {
    console.error(
      "Invalid token:",
      error.message
    );

    return {
      success: false,
      response: jsonResponse(401, {
        success: false,
        message:
          "Your login session is invalid or has expired."
      })
    };
  }
}

async function findAuthenticatedUser(
  client,
  tokenPayload
) {
  const tokenUserId =
    tokenPayload.id ||
    tokenPayload.userId ||
    tokenPayload.user_id ||
    tokenPayload.sub ||
    null;

  const tokenEmail =
    tokenPayload.email ||
    null;

  if (tokenUserId) {
    const numericId =
      Number.parseInt(
        tokenUserId,
        10
      );

    if (
      Number.isInteger(numericId) &&
      numericId > 0
    ) {
      const result =
        await client.query(
          `
            SELECT
              id,
              name,
              email,
              phone
            FROM users
            WHERE id = $1
            LIMIT 1
          `,
          [numericId]
        );

      if (
        result.rows.length > 0
      ) {
        return result.rows[0];
      }
    }
  }

  if (tokenEmail) {
    const result =
      await client.query(
        `
          SELECT
            id,
            name,
            email,
            phone
          FROM users
          WHERE LOWER(email) =
            LOWER($1)
          LIMIT 1
        `,
        [
          String(tokenEmail).trim()
        ]
      );

    if (
      result.rows.length > 0
    ) {
      return result.rows[0];
    }
  }

  return null;
}

/* =========================================================
   DATABASE
========================================================= */

function createDatabaseClient() {
  return new Client({
    connectionString:
      process.env.NEON_DATABASE_URL,

    ssl: {
      rejectUnauthorized: false
    }
  });
}

async function safeRollback(client) {
  try {
    await client.query(
      "ROLLBACK"
    );
  } catch {
    // Ignore rollback errors.
  }
}

async function safeClose(client) {
  try {
    await client.end();
  } catch (error) {
    console.error(
      "Database closing error:",
      error
    );
  }
}

/* =========================================================
   REQUEST AND RESPONSE HELPERS
========================================================= */

function parseRequestBody(event) {
  try {
    const body =
      JSON.parse(
        event.body || "{}"
      );

    return {
      success: true,
      body
    };
  } catch {
    return {
      success: false,
      response: jsonResponse(400, {
        success: false,
        message:
          "Invalid JSON request body."
      })
    };
  }
}

function normalizeText(value) {
  return String(value || "")
    .trim();
}

function normalizeLowercase(value) {
  return normalizeText(value)
    .toLowerCase();
}

function normalizeOptionalText(value) {
  const text =
    normalizeText(value);

  return text || null;
}

function methodNotAllowed(
  allowedMethod
) {
  return {
    statusCode: 405,
    headers: {
      "Content-Type":
        "application/json",
      "Allow":
        allowedMethod
    },
    body: JSON.stringify({
      success: false,
      message:
        `Method not allowed. Use ${allowedMethod}.`
    })
  };
}

function jsonResponse(
  statusCode,
  data
) {
  return {
    statusCode,
    headers: {
      "Content-Type":
        "application/json",
      "Cache-Control":
        "no-store"
    },
    body:
      JSON.stringify(data)
  };
}
