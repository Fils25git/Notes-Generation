const { Client } = require("pg");

exports.handler = async (event) => {
  const sessionId = event.queryStringParameters.id;

  const db = new Client({ connectionString: process.env.NEON_DATABASE_URL });
  await db.connect();

  const session = await db.query(
    `SELECT generated_count,total_questions,status FROM quiz_sessions WHERE id=$1`,
    [sessionId]
  );

  const questions = await db.query(
    `SELECT question_html FROM quiz_questions WHERE session_id=$1 ORDER BY id`,
    [sessionId]
  );

  await db.end();

  return {
    statusCode: 200,
    body: JSON.stringify({
      progress: session.rows[0],
      html: questions.rows.map(q=>q.question_html).join("")
    })
  };
};
