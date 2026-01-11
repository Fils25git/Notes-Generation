import { Client } from "pg";
import bcrypt from "bcryptjs";

export async function handler(event) {
  const { email, answer, newPassword } = JSON.parse(event.body || "{}");

  if (!email || !answer || !newPassword) {
    return { statusCode: 400, body: "Missing fields" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const res = await client.query(
    "SELECT secret_answer_hash FROM users WHERE email=$1",
    [email]
  );

  if (res.rowCount === 0) {
    await client.end();
    return { statusCode: 404, body: "User not found" };
  }

  const isCorrect = await bcrypt.compare(
    answer.toLowerCase(),
    res.rows[0].secret_answer_hash
  );

  if (!isCorrect) {
    await client.end();
    return { statusCode: 401, body: "Incorrect answer" };
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await client.query(
    "UPDATE users SET password=$1 WHERE email=$2",
    [newHash, email]
  );

  await client.end();

  return { statusCode: 200, body: "Password reset successful" };
}
