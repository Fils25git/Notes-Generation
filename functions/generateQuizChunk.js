const { Client } = require("pg");

exports.handler = async (event) => {

  const { sessionId } = JSON.parse(event.body);
  const db = new Client({ connectionString: process.env.NEON_DATABASE_URL });
  await db.connect();

  // get session
  const { rows } = await db.query(
    `SELECT * FROM quiz_sessions WHERE id=$1`,
    [sessionId]
  );

  if (!rows.length) return { statusCode: 404 };

  const session = rows[0];
  const plan = session.quiz_plan;

  // stop if finished
  if (session.generated_count >= session.total_questions) {
    await db.query(`UPDATE quiz_sessions SET status='completed' WHERE id=$1`,[sessionId]);
    await db.end();
    return { statusCode: 200 };
  }

  // next 5 questions
  const chunk = plan.slice(session.generated_count, session.generated_count + 5);

  const html = await generateQuestions(chunk, session); // your step2 prompt

  await db.query(
    `INSERT INTO quiz_questions(session_id,question_html) VALUES ($1,$2)`,
    [sessionId, html]
  );

  await db.query(
    `UPDATE quiz_sessions SET generated_count = generated_count + $1 WHERE id=$2`,
    [chunk.length, sessionId]
  );

  await db.end();

  return { statusCode: 200 };
};
