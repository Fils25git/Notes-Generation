import { Resend } from "resend";
import { Pool } from "pg";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });

export async function handler(event) {
  try {
    const { email } = JSON.parse(event.body);

    // Check if user exists
    const userRes = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
    if (!userRes.rows.length) {
      return { statusCode: 404, body: 'User not found' };
    }

    const user = userRes.rows[0];

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600 * 1000); // 1 hour

    // Save token in DB
    await pool.query('UPDATE users SET reset_token=$1, reset_token_expiry=$2 WHERE id=$3', [token, expiry, user.id]);

    // Send email
    const resetUrl = `https://fleduacademy.com/reset-password.html?token=${token}&email=${encodeURIComponent(email)}`;
    await resend.emails.send({
      from: "Fila Assistant <fila@fleduacademy.com>",
      to: email,
      subject: "🔑 Reset Your Fila Assistant Password",
      html: `
        <div style="font-family: Arial; padding:20px;">
          <h2>Hello ${user.name}</h2>
          <p>You requested a password reset. Click below to create a new password:</p>
          <a href="${resetUrl}" style="background:#2196f3; color:white; padding:10px 15px; text-decoration:none; border-radius:5px;">
            Reset Password
          </a>
          <p>This link expires in 1 hour.</p>
        </div>
      `
    });

    return { statusCode: 200, body: JSON.stringify({ message: 'Reset email sent' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
                                 }
