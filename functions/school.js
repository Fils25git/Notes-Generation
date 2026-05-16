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
                `SELECT *
                 FROM subjects
                 ORDER BY id ASC`
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
                `SELECT *
                 FROM classes
                 ORDER BY id ASC`
            );

            return {
                statusCode: 200,
                body: JSON.stringify(result.rows)
            };
        }

        // =========================
        // GET MARKS
        // =========================
        if (action === "getMarks") {

            const {
                class_id,
                subject_id
            } = event.queryStringParameters;

            // =========================
            // CURRENT ACADEMIC YEAR
            // =========================
            const currentYearRes = await db.query(
                `SELECT *
                 FROM academic_years
                 WHERE is_current = true
                 LIMIT 1`
            );

            const currentYear =
                currentYearRes.rows[0];

            if (!currentYear) {

                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        error: "No active academic year"
                    })
                };
            }

            // =========================
            // CURRENT TERM
            // =========================
            const currentTermRes = await db.query(
                `SELECT *
                 FROM terms
                 WHERE is_current = true
                 LIMIT 1`
            );

            const currentTerm =
                currentTermRes.rows[0];

            if (!currentTerm) {

                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        error: "No active term set"
                    })
                };
            }

            // =========================
            // LEARNERS
            // =========================
            const learnersRes = await db.query(
                `SELECT *
                 FROM learners
                 WHERE class_id = $1
                 AND academic_year_id = $2
                 ORDER BY full_name ASC`,
                [
                    class_id,
                    currentYear.id
                ]
            );

            // =========================
            // MARKS
            // =========================
            const marksRes = await db.query(
                `SELECT *
                 FROM marks
                 WHERE class_id = $1
                 AND subject_id = $2
                 AND academic_year_id = $3
                 AND term_id = $4`,
                [
                    class_id,
                    subject_id,
                    currentYear.id,
                    currentTerm.id
                ]
            );

            // =========================
            // ASSESSMENT TYPES
            // =========================
            const assessmentTypes = [
                "Test 1",
                "Test 2",
                "Exam"
            ];

            // =========================
            // CREATE MARKS MAP
            // =========================
            const marksMap = {};

            for (const mark of marksRes.rows) {

                const key =
                    `${mark.learner_id}_${mark.assessment_type}`;

                marksMap[key] = mark;
            }

            // =========================
            // FINAL DATA
            // =========================
            const data = learnersRes.rows.map(
                learner => {

                const marks =
                    assessmentTypes.map(type => {

                    const found =
                        marksMap[
                            `${learner.id}_${type}`
                        ];

                    return {
                        assessment_type: type,
                        score: found?.score || "",
                        max_score:
                            found?.max_score || 100
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
        // SAVE MARK
        // =========================
        if (action === "saveMark") {

            const {
                learner_id,
                subject_id,
                class_id,
                teacher_id,
                assessment_type,
                score,
                max_score
            } = JSON.parse(event.body);

            // =========================
            // CURRENT ACADEMIC YEAR
            // =========================
            const currentYearRes = await db.query(
                `SELECT *
                 FROM academic_years
                 WHERE is_current = true
                 LIMIT 1`
            );

            const currentYear =
                currentYearRes.rows[0];

            if (!currentYear) {

                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        error:
                        "No active academic year"
                    })
                };
            }

            // =========================
            // CURRENT TERM
            // =========================
            const currentTermRes = await db.query(
                `SELECT *
                 FROM terms
                 WHERE is_current = true
                 LIMIT 1`
            );

            const currentTerm =
                currentTermRes.rows[0];

            if (!currentTerm) {

                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        error:
                        "No active term"
                    })
                };
            }

            // =========================
            // CHECK EXISTING MARK
            // =========================
            const existing = await db.query(
                `SELECT id
                 FROM marks
                 WHERE learner_id = $1
                 AND subject_id = $2
                 AND class_id = $3
                 AND academic_year_id = $4
                 AND term_id = $5
                 AND assessment_type = $6`,
                [
                    learner_id,
                    subject_id,
                    class_id,
                    currentYear.id,
                    currentTerm.id,
                    assessment_type
                ]
            );

            // =========================
            // UPDATE
            // =========================
            if (existing.rows.length > 0) {

                await db.query(
                    `UPDATE marks
                     SET score = $1,
                         max_score = $2
                     WHERE id = $3`,
                    [
                        score,
                        max_score || 100,
                        existing.rows[0].id
                    ]
                );

            }

            // =========================
            // INSERT
            // =========================
            else {

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

                    VALUES (
                        $1,$2,$3,$4,$5,$6,$7,$8,$9
                    )`,
                    [

                        learner_id,
                        subject_id,
                        class_id,
                        currentYear.id,
                        currentTerm.id,
                        teacher_id || null,
                        assessment_type,
                        score,
                        max_score || 100

                    ]
                );
            }

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message:
                    "Mark saved successfully"
                })
            };
        }

        // =========================
        // ADD TEST
        // =========================
        if (action === "addTest") {

            const {
                test_name,
                subject_id,
                total_marks
            } = JSON.parse(event.body);

            const result = await db.query(
                `INSERT INTO tests (

                    test_name,
                    subject_id,
                    total_marks

                )

                VALUES ($1,$2,$3)

                RETURNING *`,
                [
                    test_name,
                    subject_id,
                    total_marks
                ]
            );

            return {
                statusCode: 200,
                body: JSON.stringify(
                    result.rows[0]
                )
            };
        }

        // =========================
        // INVALID ACTION
        // =========================
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Invalid action"
            })
        };

    }

    // =========================
    // ERROR
    // =========================
    catch (error) {

        console.log(error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};
