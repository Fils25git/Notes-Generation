import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

  const body = JSON.parse(event.body || "{}");
  const ids = body.ids || [];

  if (!ids.length) return { statusCode: 400, body: "No IDs provided" };

  const client = new Client({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    for (const id of ids) {
      await client.query(
        "UPDATE payments SET status='rejected', approved_at=NOW() WHERE id=$1 AND status='pending'",
        [id]
      );
    }

    return { statusCode: 200, body: "Payments rejected successfully." };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  } finally {
    await client.end();
  }
    }
