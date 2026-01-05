import { Client } from "pg";

// Function to fetch user balance by login token
export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Get token from query parameters
  const token = event.queryStringParameters?.token;
  if (!token) return { statusCode: 400, body: "Missing token" };

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false } // required for Neon
  });

  try {
    await client.connect();

    // Find user by token
    const res = await client.query(
      "SELECT phone, email, balance FROM users WHERE login_token = $1",
      [token]
    );

    await client.end();

    if (res.rows.length === 0) {
      return { statusCode: 404, body: "User not found" };
    }

    // Return user balance and phone/email
    return {
      statusCode: 200,
      body: JSON.stringify({
        phone: res.rows[0].phone,
        email: res.rows[0].email,
        balance: res.rows[0].balance
      })
    };
  } catch (err) {
    if (client) await client.end();
    return { statusCode: 500, body: "Server error: " + err.message };
  }
      }
