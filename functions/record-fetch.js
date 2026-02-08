import { Client } from "pg";

function response(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return response(405, { error: "Method not allowed" });
    }

    const { email, mode } = JSON.parse(event.body || "{}");
    if (!email || !mode) return response(400, { error: "Email and mode are required" });

    const db = new Client({ connectionString: process.env.NEON_DATABASE_URL });
    await db.connect();

    let query;
    if (mode === "package") {
      query = `UPDATE users SET notes_package = notes_package - 1 WHERE email = $1 RETURNING notes_package`;
    } else if (mode === "daily") {
      query = `UPDATE users SET daily_note_used = daily_note_used + 1 WHERE email = $1 RETURNING daily_note_used`;
    } else {
      await db.end();
      return response(400, { error: "Invalid mode" });
    }

    const { rows } = await db.query(query, [email]);
    await db.end();

    return response(200, { success: true, updated: rows[0] });

  } catch (err) {
    return response(500, { error: err.message });
  }
};
