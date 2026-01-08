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
    await client.query("BEGIN");

    // 1️⃣ Find user
    const userRes = email
      ? await client.query("SELECT id FROM users WHERE email=$1 FOR UPDATE", [email])
      : await client.query("SELECT id FROM users WHERE phone=$1 FOR UPDATE", [phone]);

    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { statusCode: 404, body: "User not found" };
    }

    const userId = userRes.rows[0].id;

    // 2️⃣ Get total purchased lessons
    const paymentRes = await client.query(
      `SELECT COALESCE(SUM(lessons),0) AS total
       FROM payments
       WHERE user_id=$1 AND status='approved'`,
      [userId]
    );

    const totalPurchased = parseInt(paymentRes.rows[0].total, 10);

    // 3️⃣ Get total used lessons
    const usageRes = await client.query(
      `SELECT COALESCE(SUM(lessons_used),0) AS used
       FROM lesson_usage
       WHERE user_id=$1`,
      [userId]
    );

    const totalUsed = parseInt(usageRes.rows[0].used, 10);
    const available = totalPurchased - totalUsed;

    // 4️⃣ Check balance
    if (available < 1) {
      await client.query("ROLLBACK");
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, balance: 0 }),
      };
    }

    // 5️⃣ Deduct exactly 1 lesson
    await client.query(
      `INSERT INTO lesson_usage (user_id, lessons_used, used_at)
       VALUES ($1, 1, NOW())`,
      [userId]
    );

    await client.query("COMMIT");
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        balance: available - 1,
      }),
    };

  } catch (err) {
    await client.query("ROLLBACK");
    await client.end();
    console.error(err);

    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
      }
