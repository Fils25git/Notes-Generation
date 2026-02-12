const { Client } = require("pg");
const { generateQuizPlan } = require("./utils/ai"); // ✅ new helper
exports.handler = async (event) => {
  const db = new Client({ connectionString: process.env.NEON_DATABASE_URL });
  await db.connect();

  try {
    const body = JSON.parse(event.body);
    console.log("CreateQuizSession received body:", body);

    // STEP 1: ask AI only for PLAN
    const plan = await generateQuizPlan(body);
    console.log("Quiz plan generated:", plan);

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

    if (!result.rows[0]?.id) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No session ID returned" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: result.rows[0].id })
    };

  } catch (err) {
    console.error("createQuizSession error:", err);
    if (db) await db.end();
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
