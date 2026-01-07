import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Get user identifier from request body
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
      userRes = await client.query("SELECT id, phone, email FROM users WHERE email=$1", [email]);
    } else {
      userRes = await client.query("SELECT id, phone, email FROM users WHERE phone=$1", [phone]);
    }

    if (userRes.rows.length === 0) {
      await client.end();
      return { statusCode: 404, body: "User not found" };
    }

    const user = userRes.rows[0];

    // 2️⃣ Calculate total approved lesson plans from payments
    const balanceRes = await client.query(
      `SELECT COALESCE(SUM(lessons),0) as total_lessons
       FROM payments
       WHERE user_id=$1 AND status='approved'`,
      [user.id]
    );

    let balance = parseInt(balanceRes.rows[0].total_lessons, 10);

    // 3️⃣ Check if user has at least 1 lesson plan
    if (balance < 1) {
      await client.end();
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Insufficient lesson plans", balance: 0 }),
      };
    }

    // 4️⃣ Deduct 1 lesson plan (record in a transaction table or update a usage table)
    // Here, we'll subtract by inserting a "used lesson" record in a new table `lesson_usage`
    await client.query(
      `INSERT INTO lesson_usage(user_id, used_at, lessons_used)
       VALUES($1, NOW(), 1)`,
      [user.id]
    );

    // 5️⃣ Calculate new balance after deduction
    const usageRes = await client.query(
      `SELECT COALESCE(SUM(lessons_used),0) as total_used
       FROM lesson_usage
       WHERE user_id=$1`,
      [user.id]
    );

    const totalUsed = parseInt(usageRes.rows[0].total_used, 10);
    const newBalance = balance - totalUsed;

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Lesson plan used successfully",
        balance: newBalance > 0 ? newBalance : 0,
      }),
    };
  } catch (err) {
    if (client) await client.end();
    console.error(err);
    return { statusCode: 500, body: "Server error: " + err.message };
  }
};
