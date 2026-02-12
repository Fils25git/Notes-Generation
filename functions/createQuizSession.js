const { Client } = require("pg");

exports.handler = async (event) => {
  const db = new Client({ connectionString: process.env.NEON_DATABASE_URL });
  await db.connect();

  const body = JSON.parse(event.body);

  // STEP 1: ask AI only for PLAN
  const plan = await generateQuizPlan(body); // reuse your step1 prompt

  const result = await db.query(
    `INSERT INTO quiz_sessions
    (email,title,level,class,subject,quiz_type,sequence_rule,total_questions,total_marks,quiz_plan)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING id`,
    [
      body.email,
      body.title,
      body.level,
      body.classLevel,
      body.subject,
      body.quizType,
      body.questionSequence,
      body.numberOfQuestions,
      body.marks,
      JSON.stringify(plan)
    ]
  );

  await db.end();

  return {
    statusCode: 200,
    body: JSON.stringify({ sessionId: result.rows[0].id })
  };
};
