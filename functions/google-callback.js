import fetch from "node-fetch";
import { Client } from "pg";

export async function handler(event) {
  try {
    const code = event.queryStringParameters?.code;
    if (!code) return { statusCode: 400, body: "Missing code" };

    // Exchange code
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.APP_BASE_URL}/.netlify/functions/google-callback`,
        grant_type: "authorization_code",
        code
      })
    });

    const token = await tokenRes.json();

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });

    const googleUser = await userRes.json();

    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Insert if not exists
    const result = await client.query(
      `INSERT INTO users (email, name, email_verified, signup_complete, balance)
       VALUES ($1,$2,true,false,0)
       ON CONFLICT (email) DO NOTHING
       RETURNING signup_complete`,
      [googleUser.email, googleUser.name]
    );

    // If user already existed, fetch signup_complete
    let signupComplete = result.rows[0]?.signup_complete;

    if (signupComplete === undefined) {
      const existing = await client.query(
        `SELECT signup_complete FROM users WHERE email=$1`,
        [googleUser.email]
      );
      signupComplete = existing.rows[0].signup_complete;
    }

    await client.end();

    return {
      statusCode: 302,
      headers: {
        Location: signupComplete
          ? "/index.html"
          : "/complete-signup.html"
      }
    };

  } catch (err) {
    console.error("GOOGLE CALLBACK ERROR:", err);
    return { statusCode: 500, body: "OAuth failed" };
  }
}
