import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ success: false }) };
  }

  const { email, phone } = JSON.parse(event.body || "{}");

  if (!email && !phone) {
    return { statusCode: 400, body: JSON.stringify({ success: false }) };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const userRes = await client.query(
      email
        ? "SELECT id FROM users WHERE LOWER(email)=LOWER($1)"
        : "SELECT id FROM users WHERE phone=$1",
      [email || phone]
    );

    if (userRes.rowCount === 0) {
      return { statusCode: 404, body: JSON.stringify({ success: false }) };
    }

    const userId = userRes.rows[0].id;

    const purchased = await client.query(
      `SELECT COALESCE(SUM(lessons),0) total FROM payments
       WHERE user_id=$1 AND status='approved'`,
      [userId]
    );

    const used = await client.query(
      `SELECT COALESCE(SUM(lessons_used),0) total FROM lesson_usage
       WHERE user_id=$1`,
      [userId]
    );

    const available =
      Number(purchased.rows[0].total) -
      Number(used.rows[0].total);

    if (available < 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, balance: 0 })
      };
    }

    await client.query(
      `INSERT INTO lesson_usage (user_id, lessons_used, used_at)
       VALUES ($1,1,NOW())`,
      [userId]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        balance: available - 1
      })
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ success: false }) };
  } finally {
    try { await client.end(); } catch {}
  }
}
