const db = require("./db");

exports.handler = async (event) => {

    try {

        const action =
            event.queryStringParameters?.action;

        // =====================================================
        // GET TEACHER ID
        // =====================================================

        let teacher_id;

        if (event.httpMethod === "GET") {

            teacher_id =
                Number(event.queryStringParameters?.teacher_id);

        } else {

            const body =
                JSON.parse(event.body || "{}");

            teacher_id =
                Number(body.teacher_id);
        }

        // Teacher ID is required for every marks operation
        if (!teacher_id) {

            return {
                statusCode: 401,
                body: JSON.stringify({
                    success: false,
                    message: "Teacher ID is required"
                })
            };

        }


        // =====================================================
        // GET SUBJECTS
        // =====================================================

        if (action === "getSubjects") {

            const result = await db.query(`
                SELECT *
                FROM subjects
                WHERE teacher_id = $1
                ORDER BY id
            `, [teacher_id]);

            return {
                statusCode: 200,
                body: JSON.stringify(result.rows)
            };
        }


        // =====================================================
        // GET CLASSES
        // =====================================================

        if (action === "getClasses") {

            const result = await db.query(`
                SELECT *
                FROM classes
                WHERE teacher_id = $1
                ORDER BY id
            `, [teacher_id]);

            return {
                statusCode: 200,
                body: JSON.stringify(result.rows)
            };
        }


        // =====================================================
        // ADD TEST
        // =====================================================

        if (action === "addTest") {

            const body =
                JSON.parse(event.body || "{}");

            const {
                subject_id,
                class_id,
                academic_year_id,
                term_id,
                test_name,
                max_score,
                is_exam
            } = body;


            // Make sure the subject belongs to this teacher
            const subjectCheck = await db.query(`
                SELECT id
                FROM subjects
                WHERE id = $1
                AND teacher_id = $2
            `, [subject_id, teacher_id]);


            if (!subjectCheck.rows.length) {

                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        success: false,
                        message: "You do not have access to this subject"
                    })
                };

            }


            // Make sure the class belongs to this teacher
            const classCheck = await db.query(`
                SELECT id
                FROM classes
                WHERE id = $1
                AND teacher_id = $2
            `, [class_id, teacher_id]);


            if (!classCheck.rows.length) {

                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        success: false,
                        message: "You do not have access to this class"
                    })
                };

            }


            const result = await db.query(`

                INSERT INTO subject_tests(

                    teacher_id,
                    subject_id,
                    class_id,
                    academic_year_id,
                    term_id,
                    test_name,
                    max_score,
                    is_exam

                )

                VALUES(
                    $1,$2,$3,$4,$5,$6,$7,$8
                )

                RETURNING *

            `, [

                teacher_id,
                subject_id,
                class_id,
                academic_year_id,
                term_id,
                test_name,
                Number(max_score),
                is_exam || false

            ]);


            return {
                statusCode: 200,
                body: JSON.stringify(result.rows[0])
            };

        }


        // =====================================================
        // UPDATE TEST
        // =====================================================

        if (action === "updateTest") {

            const body =
                JSON.parse(event.body || "{}");

            const {
                id,
                test_name,
                max_score
            } = body;


            // Only update this teacher's test
            const result = await db.query(`

                UPDATE subject_tests

                SET
                    test_name = $1,
                    max_score = $2

                WHERE id = $3
                AND teacher_id = $4

                RETURNING id

            `, [
                test_name,
                Number(max_score),
                id,
                teacher_id
            ]);


            if (!result.rows.length) {

                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        success: false,
                        message: "Test not found or access denied"
                    })
                };

            }


            // Update max score only for marks belonging
            // to this teacher's test
            await db.query(`

                UPDATE marks

                SET max_score = $1

                WHERE test_id = $2
                AND teacher_id = $3

            `, [
                Number(max_score),
                id,
                teacher_id
            ]);


            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "updated"
                })
            };

        }


        // =====================================================
        // DELETE TEST
        // =====================================================

        if (action === "deleteTest") {

            const {
                test_id
            } = JSON.parse(event.body || "{}");


            // Because marks.test_id has ON DELETE CASCADE,
            // deleting the test will automatically delete
            // its marks.
            const result = await db.query(`

                DELETE FROM subject_tests

                WHERE id = $1
                AND teacher_id = $2

                RETURNING id

            `, [
                test_id,
                teacher_id
            ]);


            if (!result.rows.length) {

                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        success: false,
                        message: "Test not found or access denied"
                    })
                };

            }


            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Deleted"
                })
            };

        }


        // =====================================================
        // GET MARKS
        // =====================================================

        if (action === "getMarks") {

            const {
                class_id,
                subject_id,
                academic_year_id,
                term_id
            } = event.queryStringParameters;


            // ---------------------------------------------
            // GET LEARNERS
            // ---------------------------------------------

            const learners = await db.query(`

                SELECT *

                FROM learners

                WHERE class_id = $1
                AND academic_year_id = $2
                AND teacher_id = $3

                ORDER BY full_name

            `, [
                class_id,
                academic_year_id,
                teacher_id
            ]);


            // ---------------------------------------------
            // GET TESTS
            // ---------------------------------------------

            const tests = await db.query(`

                SELECT *

                FROM subject_tests

                WHERE subject_id = $1
                AND class_id = $2
                AND academic_year_id = $3
                AND term_id = $4
                AND teacher_id = $5

                ORDER BY id

            `, [
                subject_id,
                class_id,
                academic_year_id,
                term_id,
                teacher_id
            ]);


            // ---------------------------------------------
            // GET MARKS
            // ---------------------------------------------

            const marks = await db.query(`

                SELECT *

                FROM marks

                WHERE class_id = $1
                AND subject_id = $2
                AND academic_year_id = $3
                AND term_id = $4
                AND teacher_id = $5

            `, [
                class_id,
                subject_id,
                academic_year_id,
                term_id,
                teacher_id
            ]);


            const marksMap = {};


            marks.rows.forEach(m => {

                marksMap[
                    `${m.learner_id}_${m.test_id}`
                ] = m;

            });


            const finalData =

                learners.rows.map(learner => {

                    const learnerMarks =

                        tests.rows.map(test => {

                            const found =

                                marksMap[
                                    `${learner.id}_${test.id}`
                                ];


                            return {

                                test_id: test.id,

                                assessment_type:
                                    test.test_name,

                                score:
                                    found
                                        ? found.score
                                        : "",

                                max_score:
                                    test.max_score,

                                is_exam:
                                    test.is_exam

                            };

                        });


                    return {

                        id: learner.id,

                        full_name:
                            learner.full_name,

                        marks:
                            learnerMarks

                    };

                });


            return {

                statusCode: 200,

                body:
                    JSON.stringify(finalData)

            };

        }


        // =====================================================
        // GET GRADING SETTINGS
        // =====================================================

        if (action === "getGradingSettings") {

            const {
                subject_id,
                class_id,
                academic_year_id,
                term_id
            } = event.queryStringParameters;


            const result = await db.query(`

                SELECT *

                FROM grading_settings

                WHERE subject_id = $1
                AND class_id = $2
                AND academic_year_id = $3
                AND term_id = $4
                AND teacher_id = $5

            `, [
                subject_id,
                class_id,
                academic_year_id,
                term_id,
                teacher_id
            ]);


            if (result.rows.length) {

                return {

                    statusCode: 200,

                    body:
                        JSON.stringify(result.rows[0])

                };

            }


            return {

                statusCode: 200,

                body: JSON.stringify({

                    overall_test_max: 100,

                    overall_exam_max: 100

                })

            };

        }


        // =====================================================
        // SAVE GRADING SETTINGS
        // =====================================================

        if (action === "saveGradingSettings") {

            const body =
                JSON.parse(event.body || "{}");


            const {
                subject_id,
                class_id,
                academic_year_id,
                term_id,
                overall_test_max,
                overall_exam_max
            } = body;


            const existing = await db.query(`

                SELECT id

                FROM grading_settings

                WHERE subject_id = $1
                AND class_id = $2
                AND academic_year_id = $3
                AND term_id = $4
                AND teacher_id = $5

            `, [
                subject_id,
                class_id,
                academic_year_id,
                term_id,
                teacher_id
            ]);


            if (existing.rows.length) {

                await db.query(`

                    UPDATE grading_settings

                    SET
                        overall_test_max = $1,
                        overall_exam_max = $2

                    WHERE id = $3
                    AND teacher_id = $4

                `, [
                    overall_test_max,
                    overall_exam_max,
                    existing.rows[0].id,
                    teacher_id
                ]);

            } else {

                await db.query(`

                    INSERT INTO grading_settings(

                        teacher_id,
                        subject_id,
                        class_id,
                        academic_year_id,
                        term_id,
                        overall_test_max,
                        overall_exam_max

                    )

                    VALUES(
                        $1,$2,$3,$4,$5,$6,$7
                    )

                `, [
                    teacher_id,
                    subject_id,
                    class_id,
                    academic_year_id,
                    term_id,
                    overall_test_max,
                    overall_exam_max
                ]);

            }


            return {

                statusCode: 200,

                body: JSON.stringify({

                    message: "Saved"

                })

            };

        }


        // =====================================================
        // SAVE MARK
        // =====================================================

        if (action === "saveMark") {

            const body =
                JSON.parse(event.body || "{}");


            const {
                learner_id,
                subject_id,
                class_id,
                academic_year_id,
                term_id,
                test_id,
                score,
                max_score
            } = body;


            // IMPORTANT:
            // We do NOT trust teacher_id from the frontend.
            // We use teacher_id obtained above.


            // Make sure learner belongs to this teacher
            const learnerCheck = await db.query(`

                SELECT id

                FROM learners

                WHERE id = $1
                AND teacher_id = $2

            `, [
                learner_id,
                teacher_id
            ]);


            if (!learnerCheck.rows.length) {

                return {

                    statusCode: 403,

                    body: JSON.stringify({

                        success: false,

                        message:
                            "You do not have access to this learner"

                    })

                };

            }


            // Make sure test belongs to this teacher
            const testCheck = await db.query(`

                SELECT id

                FROM subject_tests

                WHERE id = $1
                AND teacher_id = $2

            `, [
                test_id,
                teacher_id
            ]);


            if (!testCheck.rows.length) {

                return {

                    statusCode: 403,

                    body: JSON.stringify({

                        success: false,

                        message:
                            "You do not have access to this test"

                    })

                };

            }


            const existing = await db.query(`

                SELECT id

                FROM marks

                WHERE learner_id = $1
                AND test_id = $2
                AND teacher_id = $3

            `, [
                learner_id,
                test_id,
                teacher_id
            ]);


            if (existing.rows.length) {

                await db.query(`

                    UPDATE marks

                    SET
                        score = $1,
                        max_score = $2

                    WHERE id = $3
                    AND teacher_id = $4

                `, [
                    score,
                    max_score,
                    existing.rows[0].id,
                    teacher_id
                ]);

            } else {

                await db.query(`

                    INSERT INTO marks(

                        teacher_id,
                        learner_id,
                        subject_id,
                        class_id,
                        academic_year_id,
                        term_id,
                        test_id,
                        score,
                        max_score

                    )

                    VALUES(
                        $1,$2,$3,$4,$5,$6,$7,$8,$9
                    )

                `, [
                    teacher_id,
                    learner_id,
                    subject_id,
                    class_id,
                    academic_year_id,
                    term_id,
                    test_id,
                    score,
                    max_score
                ]);

            }


            return {

                statusCode: 200,

                body: JSON.stringify({

                    message: "saved"

                })

            };

        }


        // =====================================================
        // INVALID ACTION
        // =====================================================

        return {

            statusCode: 400,

            body: JSON.stringify({

                message: "Invalid action"

            })

        };

    }

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
