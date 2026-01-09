import fetch from "node-fetch";
import { Client } from "pg";

export async function handler(event) {
  try {
    const code = event.queryStringParameters?.code;
    if (!code) {
      return { statusCode: 400, body: "Missing authorization code" };
    }

    // Exchange code for access token
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

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("TOKEN ERROR:", tokenData);
      return { statusCode: 400, body: "Token exchange failed" };
    }

    // Get Google user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    const user = await userRes.json();

    // Connect to database
    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    await client.query(
      `INSERT INTO users (email, name, email_verified, balance)
       VALUES ($1, $2, true, 0)
       ON CONFLICT (email) DO NOTHING`,
      [user.email, user.name]
    );

    await client.end();

    // Redirect to app
    return {
      statusCode: 302,
      headers: {
        Location: "/index.html"
      }
    };

  } catch (err) {
    console.error("GOOGLE CALLBACK ERROR:", err);
    return { statusCode: 500, body: "Server error" };
  }
              }
