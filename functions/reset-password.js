import { Client } from "pg";
import bcrypt from "bcryptjs";

export async function handler(event) {
  const { email, answer, newPassword } = JSON.parse(event.body || "{}");

  if (!email || !answer) {
    return { 
      statusCode: 400, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: "Missing fields" }) 
    };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Fetch the secret answer hash
    const res = await client.query(
      "SELECT secret_answer_hash FROM users WHERE email=$1",
      [email]
    );

    if (res.rowCount === 0) {
      return { 
        statusCode: 404, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "User not found" }) 
      };
    }

    const isCorrect = await bcrypt.compare(
      answer.toLowerCase(),
      res.rows[0].secret_answer_hash
    );

    if (!isCorrect) {
      return { 
        statusCode: 401, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "Incorrect answer" }) 
      };
    }

    // If newPassword is provided, update it
    if (newPassword) {
      const newHash = await bcrypt.hash(newPassword, 10);
      await client.query(
        "UPDATE users SET password=$1 WHERE email=$2",
        [newHash, email]
      );
      return { 
        statusCode: 200, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, message: "Password reset successful" }) 
      };
    }

    // If no newPassword, just verifying the secret answer
    return { 
      statusCode: 200, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, message: "Answer correct" }) 
    };

  } catch (err) {
    return { 
      statusCode: 500, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: err.message }) 
    };
  } finally {
    await client.end();
  }
    }
