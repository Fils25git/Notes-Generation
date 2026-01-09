import { Client } from "pg";

export async function handler(event) {
  const token = event.queryStringParameters?.token;

  if (!token) {
    return {
      statusCode: 400,
      body: "Invalid verification link"
    };
  }

  try {
    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const result = await client.query(
      `UPDATE users
       SET email_verified = true,
           email_verify_token = NULL,
           email_verify_expires = NULL
       WHERE email_verify_token = $1
         AND email_verify_expires > NOW()
       RETURNING id`,
      [token]
    );

    await client.end();

    if (result.rows.length === 0) {
      return {
        statusCode: 400,
        body: "Verification link expired or invalid"
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `
        <h2>Email verified successfully 🎉</h2>
        <p>You can now log in to Fila Assistant.</p>
        <a href="${process.env.APP_BASE_URL}/login.html">
          Go to Login
        </a>
      `
    };

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return {
      statusCode: 500,
      body: "Server error"
    };
  }
  }
