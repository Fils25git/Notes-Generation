import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const token = event.headers.authorization?.split(' ')[1];
  if (!token) return { statusCode: 401 };

  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
  catch { return { statusCode: 401 }; }

  const { receiver_id, message } = JSON.parse(event.body);

  if (!receiver_id || !message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing data' }) };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: decoded.userId,
      receiver_id,
      message,
      is_read: false,
      delivered_at: null,
      read_at: null
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ messageRow: data }) };
}
