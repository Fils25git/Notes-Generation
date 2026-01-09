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
      const res = await client.query("SELECT * FROM payments WHERE id=$1 AND status='pending'", [id]);
      if (!res.rowCount) continue;

      const payment = res.rows[0];

      await client.query(
        "UPDATE users SET balance = balance + $1 WHERE id=$2",
        [payment.lessons, payment.user_id]
      );

      await client.query(
        "UPDATE payments SET status='approved', approved_at=NOW() WHERE id=$1",
        [id]
      );
    }

    return { statusCode: 200, body: "Payments approved successfully." };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  } finally {
    await client.end();
  }
    }
