import { Client } from "pg";
import jwt from "jsonwebtoken";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const token = event.headers.authorization?.split(" ")[1];
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
  catch { return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) }; }

  const { receiver_id, message } = JSON.parse(event.body || "{}");
  if (!receiver_id || !message) return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };

  const client = new Client({ connectionString: process.env.NEON_DATABASE, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(
      `INSERT INTO messages (sender_id, receiver_id, message) VALUES ($1, $2, $3)`,
      [decoded.userId, receiver_id, message]
    );
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } finally { await client.end(); }
}
