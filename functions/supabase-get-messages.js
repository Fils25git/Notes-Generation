import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export async function handler(event) {
  if (event.httpMethod !== 'GET') return { statusCode: 405 };

  const token = event.headers.authorization?.split(' ')[1];
  if (!token) return { statusCode: 401 };

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return { statusCode: 401 };
  }

  const myId = decoded.userId;
  const receiverId = event.queryStringParameters?.receiver_id;
  if (!receiverId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing receiver_id' }) };

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    // Fetch all messages between current user and receiver
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase fetch error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    // Optional: mark messages as delivered if they were sent to me and not yet delivered
    const toUpdate = messages
      .filter(m => m.receiver_id === myId && !m.delivered_at)
      .map(m => m.id);

    if (toUpdate.length > 0) {
      await supabase
        .from('messages')
        .update({ delivered_at: new Date().toISOString() })
        .in('id', toUpdate);
    }

    return { statusCode: 200, body: JSON.stringify({ messages }) };
  } catch (err) {
    console.error('Server error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
