import { Client } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const {
      name,
      email,
      phone,
      role,
      password,
      recoveryEmail
    } = JSON.parse(event.body || "{}");

    if (!name || !email || !password || !role) {
      return { statusCode: 400, body: "Missing required fields" };
    }

    const cleanPhone = phone
      ? phone.replace(/\s+/g, "").replace(/^0/, "+250")
      : null;

    const hashedPassword = await bcrypt.hash(password, 10);

    // OPTIONAL verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    await client.query(
      `INSERT INTO users (
        name,
        email,
        phone,
        role,
        password,
        recovery_email,
        email_verified,
        email_verify_token,
        email_verify_expires
      )
      VALUES ($1,$2,$3,$4,$5,$6,false,$7,$8)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        cleanPhone,
        role,
        hashedPassword,
        recoveryEmail ? recoveryEmail.trim().toLowerCase() : null,
        verifyToken,
        verifyExpires
      ]
    );

    await client.end();

    // Send verification email (NON-BLOCKING)
    const verifyUrl =
      `${process.env.APP_BASE_URL}/.netlify/functions/verify?token=${verifyToken}`;

    sgMail.send({
      to: email,
      from: "no-reply@yourdomain.com",
      subject: "Verify your email (optional)",
      html: `
        <p>Welcome to Fila Assistant 🎉</p>
        <p>You may verify your email for better account security:</p>
        <a href="${verifyUrl}">Verify Email</a>
        <p><small>This is optional.</small></p>
      `
    }).catch(err => {
      console.warn("EMAIL FAILED (ignored):", err.message);
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        message: "Account created successfully"
      })
    };

  } catch (err) {
    console.error("CREATE USER ERROR:", err);

    if (err.code === "23505") {
      return { statusCode: 409, body: "Email or phone already exists" };
    }

    return { statusCode: 500, body: "Server error: " + err.message };
  }
  }
