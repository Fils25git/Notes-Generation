import { Client } from "pg";

// helper to respond
function response(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return response(405, { error: "Method not allowed" });
    }

    const email = event.queryStringParameters?.email;
    if (!email) return response(400, { error: "Email is required" });

    // Connect to Neon / Postgres
    const db = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
    });
    await db.connect();

    // 1️⃣ Fetch user
    const { rows } = await db.query(
      `SELECT notes_package, last_note_date, daily_note_used 
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (!rows.length) {
      await db.end();
      return response(403, { error: "User not found" });
    }

    let user = rows[0];
    const today = new Date().toISOString().slice(0, 10);

    // 2️⃣ Reset daily usage if new day
    if (user.last_note_date !== today) {
      await db.query(
        `UPDATE users 
         SET daily_note_used = 0, last_note_date = $1 
         WHERE email = $2`,
        [today, email]
      );
      user.daily_note_used = 0;
    }

    // 3️⃣ Determine if user can fetch
    let mode = null; // package or daily free
    if (user.notes_package > 0) mode = "package";
    else if (user.daily_note_used === 0) mode = "daily";

    if (!mode) {
      await db.end();
      return response(403, { error: "Daily limit reached. Buy a package to continue." });
    }

    // 4️⃣ Return success info
    await db.end();
    return response(200, {
      mode,
      notes_package: user.notes_package,
      daily_note_used: user.daily_note_used,
    });

  } catch (err) {
    return response(500, { error: err.message });
  }
};
