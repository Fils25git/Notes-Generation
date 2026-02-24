import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });

export async function handler(event) {
  try {
    const { email, token, password } = JSON.parse(event.body);

    const userRes = await pool.query('SELECT id, reset_token, reset_token_expiry FROM users WHERE email=$1', [email]);
    if (!userRes.rows.length) throw new Error("User not found");

    const user = userRes.rows[0];
    if (user.reset_token !== token || new Date() > user.reset_token_expiry) {
      throw new Error("Invalid or expired token");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password=$1, reset_token=NULL, reset_token_expiry=NULL WHERE id=$2',
      [hashedPassword, user.id]
    );

    return { statusCode: 200, body: JSON.stringify({ message: "Password updated" }) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
        }
