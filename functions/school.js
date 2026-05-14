const db = require("./db");

exports.handler = async (event) => {

    try {

        const action =
            event.queryStringParameters?.action;

        // =========================
        // GET SUBJECTS
        // =========================
        if (action === "getSubjects") {

            const result = await db.query(
                "SELECT * FROM subjects ORDER BY id ASC"
            );

            return {
                statusCode: 200,
                body: JSON.stringify(result.rows)
            };
        }

        // =========================
        // GET CLASSES
        // =========================
        if (action === "getClasses") {

            const result = await db.query(
                "SELECT * FROM classes ORDER BY id ASC"
            );

            return {
                statusCode: 200,
                body: JSON.stringify(result.rows)
            };
        }

        // =========================
        // GET MARKS (FIXED FOR YOUR TABLE)
        // =========================
        if (action === "getMarks") {

    const { class_id, subject_id } =
        event.queryStringParameters;

    const learnersRes = await db.query(
        `SELECT *
         FROM learners
         WHERE class_id = $1
         ORDER BY full_name ASC`,
        [class_id]
    );

    const marksRes = await db.query(
        `SELECT *
         FROM marks
         WHERE class_id = $1
         AND subject_id = $2`,
        [class_id, subject_id]
    );

    const assessmentTypes = ["Test 1", "Test 2", "Exam"];

    const marksMap = {};

    for (const m of marksRes.rows) {
        const key = `${m.learner_id}_${m.assessment_type}`;
        marksMap[key] = m;
    }

    const data = learnersRes.rows.map(learner => {

        const marks = assessmentTypes.map(type => {

            const found = marksMap[`${learner.id}_${type}`];

            return {
                assessment_type: type,
                score: found?.score || "",
                max_score: found?.max_score || 100
            };

        });

        return {
            id: learner.id,
            full_name: learner.full_name,
            marks
        };

    });

    return {
        statusCode: 200,
        body: JSON.stringify(data)
    };
            }
        // =========================
        // SAVE MARK (FIXED)
        // =========================
        if (action === "saveMark") {

            const {
                learner_id,
                subject_id,
                class_id,
                academic_year_id,
                term_id,
                teacher_id,
                assessment_type,
                score,
                max_score
            } = JSON.parse(event.body);

            // check existing
            const existing = await db.query(
                `SELECT id FROM marks
                 WHERE learner_id = $1
                 AND subject_id = $2
                 AND class_id = $3
                 AND assessment_type = $4`,
                [learner_id, subject_id, class_id, assessment_type]
            );

            if (existing.rows.length > 0) {

                await db.query(
                    `UPDATE marks
                     SET score = $1,
                         max_score = $2
                     WHERE id = $3`,
                    [score, max_score || 100, existing.rows[0].id]
                );

            } else {

                await db.query(
                    `INSERT INTO marks (
                        learner_id,
                        subject_id,
                        class_id,
                        academic_year_id,
                        term_id,
                        teacher_id,
                        assessment_type,
                        score,
                        max_score
                    )
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                    [
                        learner_id,
                        subject_id,
                        class_id,
                        academic_year_id || 1,
                        term_id || null,
                        teacher_id || null,
                        assessment_type,
                        score,
                        max_score || 100
                    ]
                );

            }

            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Saved successfully" })
            };
        }

        // =========================
        // ADD TEST (OPTIONAL TABLE SUPPORT)
        // =========================
        if (action === "addTest") {

            const {
                test_name,
                subject_id,
                total_marks
            } = JSON.parse(event.body);

            const result = await db.query(
                `INSERT INTO tests (test_name, subject_id, total_marks)
                 VALUES ($1,$2,$3)
                 RETURNING *`,
                [test_name, subject_id, total_marks]
            );

            return {
                statusCode: 200,
                body: JSON.stringify(result.rows[0])
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid action" })
        };

    } catch (error) {

        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };

    }
};
