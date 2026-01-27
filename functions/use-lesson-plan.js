import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  const { email, phone } = JSON.parse(event.body || "{}");

  if (!email && !phone) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Missing email or phone" })
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1️⃣ Find user
    const userRes = await client.query(
      email
        ? "SELECT id, weekly_plan FROM users WHERE email=$1"
        : "SELECT id, weekly_plan FROM users WHERE phone=$1",
      [email || phone]
    );

    if (userRes.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: "User not found" })
      };
    }

    const userId = userRes.rows[0].id;
    let weeklyPlanBalance = userRes.rows[0].weekly_plan || 0;

    // 2️⃣ Total approved lesson plans from payments
    const purchasedRes = await client.query(
      `SELECT COALESCE(SUM(lessons), 0) AS total_purchased
       FROM payments
       WHERE user_id=$1 AND status='approved'`,
      [userId]
    );
    const totalPurchased = parseInt(purchasedRes.rows[0].total_purchased, 10);

    // 3️⃣ Total used lesson plans
    const usedRes = await client.query(
      `SELECT COALESCE(SUM(lessons_used), 0) AS total_used
       FROM lesson_usage
       WHERE user_id=$1`,
      [userId]
    );
    const totalUsed = parseInt(usedRes.rows[0].total_used, 10);

    // 4️⃣ Total approved weekly plans
    const purchasedWeeklyRes = await client.query(
      `SELECT COALESCE(SUM(lessons), 0) AS total_weekly_purchased
       FROM weekly_plan_payments
       WHERE user_id=$1 AND status='approved'`,
      [userId]
    );
    const totalWeeklyPurchased = parseInt(purchasedWeeklyRes.rows[0].total_weekly_purchased, 10);

    // 5️⃣ Total used weekly plans
    const usedWeeklyRes = await client.query(
      `SELECT COALESCE(SUM(lessons_used), 0) AS total_weekly_used
       FROM weekly_p_lesson_usage
       WHERE user_id=$1`,
      [userId]
    );
    const totalWeeklyUsed = parseInt(usedWeeklyRes.rows[0].total_weekly_used, 10);

    // 6️⃣ Calculate available balances
    const availableLessonPlans = totalPurchased - totalUsed;
    const availableWeeklyPlans = totalWeeklyPurchased - totalWeeklyUsed + weeklyPlanBalance;

    // 7️⃣ Decide which plan to use
    if (availableLessonPlans > 0) {
      // Use a regular lesson plan
      await client.query(
        `INSERT INTO lesson_usage (user_id, lessons_used, used_at)
         VALUES ($1, 1, NOW())`,
        [userId]
      );
      await client.end();
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Lesson plan used successfully",
          balance: availableLessonPlans - 1
        })
      };
    } else if (availableWeeklyPlans > 0) {
      // Use a weekly plan
      await client.query(
        `INSERT INTO weeklyP_lesson_usage (user_id, lessons_used, used_at)
         VALUES ($1, 1, NOW())`,
        [userId]
      );
      // Decrement the weekly_plan column if stored there
      await client.query(
        `UPDATE users SET weekly_plan = weekly_plan - 1 WHERE id=$1`,
        [userId]
      );
      await client.end();
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Weekly plan used successfully",
          balance: availableWeeklyPlans - 1
        })
      };
    } else {
      await client.end();
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "No lesson or weekly plans available",
          balance: 0
        })
      };
    }

  } catch (err) {
    console.error("use-lesson-plan error:", err);
    try { await client.end(); } catch {}
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Server error"
      })
    };
  }
  }    const usedRes = await client.query(
      `SELECT COALESCE(SUM(lessons_used), 0) AS total_used
       FROM lesson_usage
       WHERE user_id=$1`,
      [userId]
    );

    const totalUsed = parseInt(usedRes.rows[0].total_used, 10);

    /* ===============================
       4️⃣ CHECK AVAILABLE BALANCE
    =============================== */
    const available = totalPurchased - totalUsed;

    if (available < 1) {
      await client.end();
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "No lesson plans available",
          balance: 0
        })
      };
    }

    /* ===============================
       5️⃣ DEDUCT ONE LESSON PLAN
    =============================== */
    await client.query(
      `INSERT INTO lesson_usage (user_id, lessons_used, used_at)
       VALUES ($1, 1, NOW())`,
      [userId]
    );

    const newBalance = available - 1;

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Lesson plan used successfully",
        balance: newBalance
      })
    };

  } catch (err) {
    console.error("use-lesson-plan error:", err);
    try { await client.end(); } catch {}

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Server error"
      })
    };
  }
          }
