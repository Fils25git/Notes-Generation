import { Resend } from "resend";
import { Pool } from "pg";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email is required" })
      };
    }

    // Check if user exists
    const userRes = await pool.query(
      "SELECT id, name FROM users WHERE email = $1",
      [email]
    );

    if (userRes.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" })
      };
    }

    const user = userRes.rows[0];

    // Generate secure token and expiry (1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600 * 1000);

    // Save token in DB
    await pool.query(
      "UPDATE users SET reset_token=$1, reset_token_expiry=$2 WHERE id=$3",
      [token, expiry, user.id]
    );

    // Construct reset URL
    const resetUrl = `https://fleduacademy.com/reset-password.html?token=${token}&email=${encodeURIComponent(email)}`;

    // Send reset email
    await resend.emails.send({
      from: "Fila Assistant <fila@fleduacademy.com>",
      to: email,
      subject: "🔑 Reset Your Fila Assistant Password",
      html: `
        <div style="font-family: Arial, sans-serif; padding:20px; line-height:1.5;">
          <h2 style="color:#2196f3;">Hello ${user.name},</h2>
          <p>You requested a password reset for your Fila Assistant account.</p>
          <p>Click the button below to create a new password. This link will expire in 1 hour.</p>
          <a href="${resetUrl}" style="
            display:inline-block;
            background:#2196f3;
            color:white;
            padding:12px 18px;
            text-decoration:none;
            border-radius:6px;
            margin-top:10px;
          ">Reset Password</a>
          <p style="margin-top:15px; color:#555;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Reset email sent" })
    };
  } catch (err) {
    console.error("Reset email error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong. Please try again later." })
    };
  }
      }
