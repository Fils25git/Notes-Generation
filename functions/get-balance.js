import { Client } from "pg";

// Function to fetch user balance by email or phone
export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Get email or phone from query parameters
  const email = event.queryStringParameters?.email;
  const phone = event.queryStringParameters?.phone;

  if (!email && !phone) {
    return { statusCode: 400, body: "Missing email or phone" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false } // required for Neon
  });

  try {
    await client.connect();

    let res;
    if (email) {
      res = await client.query(
        "SELECT phone, email, balance FROM users WHERE email = $1",
        [email]
      );
    } else {
      res = await client.query(
        "SELECT phone, email, balance FROM users WHERE phone = $1",
        [phone]
      );
    }

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
