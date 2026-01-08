import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { email, phone } = JSON.parse(event.body || "{}");

  if (!email && !phone) {
    return { statusCode: 400, body: "Missing email or phone" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 1️⃣ Find user
    let userRes;
    if (email) {
      userRes = await client.query("SELECT id FROM users WHERE email=$1", [email]);
    } else {
      userRes = await client.query("SELECT id FROM users WHERE phone=$1", [phone]);
    }

    if (userRes.rows.length === 0) {
      await client.end();
      return { statusCode: 404, body: JSON.stringify({ message: "User not found", success: false }) };
    }

    const userId = userRes.rows[0].id;

    // 2️⃣ Total approved lessons purchased
    const paymentRes = await client.query(
      "SELECT COALESCE(SUM(lessons),0) AS total_purchased FROM payments WHERE user_id=$1 AND status='approved'",
      [userId]
    );
    const totalPurchased = parseInt(paymentRes.rows[0].total_purchased, 10);

    // 3️⃣ Total lessons used
    const usageRes = await client.query(
      "SELECT COALESCE(SUM(lessons_used),0) AS total_used FROM lesson_usage WHERE user_id=$1",
      [userId]
    );
    const totalUsed = parseInt(usageRes.rows[0].total_used, 10);

    // 4️⃣ Check balance
    const available = totalPurchased - totalUsed;
    if (available < 1) {
      await client.end();
      return { statusCode: 400, body: JSON.stringify({ message: "Insufficient lesson plans", balance: 0, success: false }) };
    }

    // 5️⃣ Deduct 1 lesson plan
    await client.query(
      "INSERT INTO lesson_usage(user_id, used_at, lessons_used) VALUES($1, NOW(), 1)",
      [userId]
    );

    const newBalance = available - 1;

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Lesson plan used successfully",
        balance: newBalance >= 0 ? newBalance : 0,
        success: true
      }),
    };
  } catch (err) {
    if (client) await client.end();
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: "Server error", success: false }) };
  }
};
