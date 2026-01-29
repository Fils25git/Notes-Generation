import { Client } from "pg";

export async function handler(event) {
  const id = event.queryStringParameters?.id;
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: "Payment ID required" }) };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`DELETE FROM payments WHERE id=$1 RETURNING *`, [id]);

    if (res.rowCount === 0) {
      return { statusCode: 404, body: JSON.stringify({ success: false, message: "Payment not found" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("DELETE daily payment error:", err);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: err.message }) };
  } finally {
    await client.end();
  }
}
