import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { email, phone } = JSON.parse(event.body);

  if (!email && !phone) {
    return { statusCode: 400, body: "Missing user identifier" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1️⃣ Get user
    const res = email
      ? await client.query("SELECT id, balance FROM users WHERE email=$1", [email])
      : await client.query("SELECT id, balance FROM users WHERE phone=$1", [phone]);

    if (res.rows.length === 0) {
      return { statusCode: 404, body: "User not found" };
    }

    const user = res.rows[0];

    // 2️⃣ Check balance
    if (user.balance < 1) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "NO_BALANCE"
        })
      };
    }

    // 3️⃣ Deduct ONE lesson plan
    await client.query(
      "UPDATE users SET balance = balance - 1 WHERE id = $1",
      [user.id]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  } finally {
    await client.end();
  }
}
