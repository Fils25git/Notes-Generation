const db = require("./db");

exports.handler = async (event) => {
  try {
    const class_id = event.queryStringParameters?.class_id;
    const subject_id = event.queryStringParameters?.subject_id;
    const term_id = event.queryStringParameters?.term_id;

    // Base query: join students + marks + tests
    let query = `
      SELECT 
          s.id AS student_id,
          s.full_name,
          s.gender,
          COALESCE(SUM(m.score), 0) AS total_score,
          COUNT(m.id) AS tests_done
      FROM students s
      LEFT JOIN marks m ON s.id = m.student_id
      LEFT JOIN tests t ON m.test_id = t.id
      WHERE 1=1
    `;

    let params = [];

    // FILTER BY CLASS
    if (class_id) {
      params.push(class_id);
      query += ` AND s.class_id = $${params.length}`;
    }

    // FILTER BY SUBJECT
    if (subject_id) {
      params.push(subject_id);
      query += ` AND t.subject_id = $${params.length}`;
    }

    // FILTER BY TERM
    if (term_id) {
      params.push(term_id);
      query += ` AND t.term_id = $${params.length}`;
    }

    query += `
      GROUP BY s.id
      ORDER BY total_score DESC
    `;

    const result = await db.query(query, params);

    // FORMAT RESULTS
    const formatted = result.rows.map((r, index) => {
      const percent = r.total_score; // adjust later if you use "out of"

      let category = "Fail";
      if (percent >= 80) category = "Excellent";
      else if (percent >= 70) category = "Very Good";
      else if (percent >= 60) category = "Good";
      else if (percent >= 50) category = "Pass";

      return {
        rank: index + 1,
        student_id: r.student_id,
        full_name: r.full_name,
        gender: r.gender,
        total: r.total_score,
        tests_done: r.tests_done,
        percentage: percent,
        category
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(formatted)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
