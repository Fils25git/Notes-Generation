import { Client } from "pg";
import jwt from "jsonwebtoken";

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  const token = event.headers.authorization?.split(" ")[1];
  if (!token) return { statusCode: 401 };

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = Number(decoded.userId);

  const { sender_id } = JSON.parse(event.body);

  const client = new Client({
    connectionString: process.env.NEON_DATABASE,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  await client.query(`
    UPDATE messages
    SET read_at = NOW()
    WHERE sender_id = $1
      AND receiver_id = $2
      AND read_at IS NULL
  `, [sender_id, userId]);

  await client.end();

  return { statusCode: 200 };
}
