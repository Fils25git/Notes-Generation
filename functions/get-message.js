import { Client } from "pg";
import jwt from "jsonwebtoken";

export async function handler(event) {
  if (event.httpMethod !== "GET") return { statusCode: 405 };

  const token = event.headers.authorization?.split(" ")[1];
  if (!token) return { statusCode: 401 };

  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
  catch { return { statusCode: 401 }; }

  const receiver_id = event.queryStringParameters?.receiver_id;
  if (!receiver_id) return { statusCode: 400, body: JSON.stringify({ error: "Missing receiver_id" }) };

  const client = new Client({ connectionString: process.env.NEON_DATABASE, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query(
      `SELECT * FROM messages 
       WHERE (sender_id=$1 AND receiver_id=$2) 
          OR (sender_id=$2 AND receiver_id=$1)
       ORDER BY created_at ASC`,
      [decoded.userId, receiver_id]
    );
    return { statusCode: 200, body: JSON.stringify({ messages: res.rows }) };
  } finally { await client.end(); }
                                                                   }
