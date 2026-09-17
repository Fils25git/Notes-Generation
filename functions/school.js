import db from "./db.js";


export const handler = async (event) => {

    try {

        const action =
            event.queryStringParameters?.action;


        // =====================================================
        // GET TEACHER ID
        // =====================================================

        let teacher_id;


        if (event.httpMethod === "GET") {

            teacher_id =
                Number(
                    event.queryStringParameters?.teacher_id
                );

        } else {

            const body =
                JSON.parse(
                    event.body || "{}"
                );

            teacher_id =
                Number(body.teacher_id);

        }


        // =====================================================
        // CHECK TEACHER
        // =====================================================

        if (!teacher_id) {

            return response(
                401,
                {
                    success: false,
                    message: "Teacher ID is required"
                }
            );

        }


        const teacherCheck =
            await db.query(
                `
                SELECT id
                FROM users
                WHERE id = $1
                `,
                [teacher_id]
            );


        if (!teacherCheck.rows.length) {

            return response(
                404,
                {
                    success: false,
                    message: "Teacher not found"
                }
            );

        }


        // =====================================================
        // GET CLASSES
        // =====================================================

        if (action === "getClasses") {

            const {
                academic_year_id
            } =
                event.queryStringParameters;


            /*
             * Only return classes where the teacher has
             * a teaching assignment for the selected year.
             *
             * teacher_class_subjects uses subject_name.
             */

            const result =
                await db.query(
                    `
                    SELECT DISTINCT
                        c.id,
                        c.class_name

                    FROM classes c

                    INNER JOIN teacher_class_subjects tcs
                        ON tcs.class_id = c.id

                    WHERE c.teacher_id = $1
                      AND tcs.teacher_id = $1
                      AND (
                            $2::INTEGER IS NULL
                            OR tcs.academic_year_id = $2
                          )

                    ORDER BY c.class_name
                    `,
                    [
                        teacher_id,
                        academic_year_id
                            ? Number(academic_year_id)
                            : null
                    ]
                );


            return response(
                200,
                result.rows
            );

        }


        // =====================================================
        // GET SUBJECTS FOR SELECTED CLASS
        // =====================================================

        if (action === "getSubjectsForClass") {

            const {
                class_id,
                academic_year_id
            } =
                event.queryStringParameters;


            if (!class_id || !academic_year_id) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Class and academic year are required"
                    }
                );

            }


            /*
             * IMPORTANT:
             *
             * teacher_class_subjects does NOT contain subject_id.
             *
             * It contains subject_name.
             *
             * We therefore connect it to subjects by:
             *
             * teacher_id + subject_name
             */

            const result =
                await db.query(
                    `
                    SELECT DISTINCT
                        s.id,
                        s.subject_name

                    FROM teacher_class_subjects tcs

                    INNER JOIN subjects s
                        ON s.teacher_id = tcs.teacher_id
                       AND LOWER(TRIM(s.subject_name))
                           =
                           LOWER(TRIM(tcs.subject_name))

                    WHERE tcs.teacher_id = $1
                      AND tcs.class_id = $2
                      AND tcs.academic_year_id = $3

                    ORDER BY s.subject_name
                    `,
                    [
                        teacher_id,
                        Number(class_id),
                        Number(academic_year_id)
                    ]
                );


            return response(
                200,
                result.rows
            );

        }


        // =====================================================
        // GET ALL SUBJECTS
        // =====================================================

        if (action === "getSubjects") {

            const result =
                await db.query(
                    `
                    SELECT
                        id,
                        subject_name

                    FROM subjects

                    WHERE teacher_id = $1

                    ORDER BY subject_name
                    `,
                    [teacher_id]
                );


            return response(
                200,
                result.rows
            );

        }


        // =====================================================
        // VERIFY TEACHING ASSIGNMENT
        // =====================================================

        async function verifyTeachingAssignment(
            classId,
            subjectId,
            academicYearId
        ) {

            const result =
                await db.query(
                    `
                    SELECT
                        tcs.id

                    FROM teacher_class_subjects tcs

                    INNER JOIN subjects s
                        ON s.teacher_id = tcs.teacher_id
                       AND LOWER(TRIM(s.subject_name))
                           =
                           LOWER(TRIM(tcs.subject_name))

                    WHERE tcs.teacher_id = $1
                      AND tcs.class_id = $2
                      AND tcs.academic_year_id = $3
                      AND s.id = $4

                    LIMIT 1
                    `,
                    [
                        teacher_id,
                        Number(classId),
                        Number(academicYearId),
                        Number(subjectId)
                    ]
                );


            return result.rows.length > 0;

        }


        // =====================================================
        // GET TESTS
        // =====================================================

        if (action === "getTests") {

            const {
                class_id,
                subject_id,
                academic_year_id,
                term_id
            } =
                event.queryStringParameters;


            if (
                !class_id ||
                !subject_id ||
                !academic_year_id ||
                !term_id
            ) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Class, subject, academic year and term are required"
                    }
                );

            }


            const allowed =
                await verifyTeachingAssignment(
                    class_id,
                    subject_id,
                    academic_year_id
                );


            if (!allowed) {

                return response(
                    403,
                    {
                        success: false,
                        message:
                            "This subject is not assigned to this class"
                    }
                );

            }


            const result =
                await db.query(
                    `
                    SELECT
                        id,
                        test_name,
                        max_score,
                        is_exam,
                        created_at

                    FROM subject_tests

                    WHERE teacher_id = $1
                      AND class_id = $2
                      AND subject_id = $3
                      AND academic_year_id = $4
                      AND term_id = $5

                    ORDER BY
                        is_exam ASC,
                        id ASC
                    `,
                    [
                        teacher_id,
                        Number(class_id),
                        Number(subject_id),
                        Number(academic_year_id),
                        Number(term_id)
                    ]
                );


            return response(
                200,
                result.rows
            );

        }


        // =====================================================
        // ADD TEST
        // =====================================================

        if (action === "addTest") {

            const body =
                JSON.parse(
                    event.body || "{}"
                );


            const {
                subject_id,
                class_id,
                academic_year_id,
                term_id,
                test_name,
                max_score,
                is_exam
            } = body;


            if (
                !subject_id ||
                !class_id ||
                !academic_year_id ||
                !term_id ||
                !test_name ||
                !max_score
            ) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "All test information is required"
                    }
                );

            }


            const max =
                Number(max_score);


            if (
                !Number.isFinite(max) ||
                max <= 0
            ) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Maximum marks must be greater than 0"
                    }
                );

            }


            const allowed =
                await verifyTeachingAssignment(
                    class_id,
                    subject_id,
                    academic_year_id
                );


            if (!allowed) {

                return response(
                    403,
                    {
                        success: false,
                        message:
                            "This subject is not assigned to this class"
                    }
                );

            }


            const result =
                await db.query(
                    `
                    INSERT INTO subject_tests (
                        teacher_id,
                        subject_id,
                        class_id,
                        academic_year_id,
                        term_id,
                        test_name,
                        max_score,
                        is_exam
                    )

                    VALUES (
                        $1,$2,$3,$4,$5,$6,$7,$8
                    )

                    RETURNING *
                    `,
                    [
                        teacher_id,
                        Number(subject_id),
                        Number(class_id),
                        Number(academic_year_id),
                        Number(term_id),
                        test_name.trim(),
                        max,
                        Boolean(is_exam)
                    ]
                );


            return response(
                200,
                {
                    success: true,
                    message:
                        "Test created successfully",
                    test:
                        result.rows[0]
                }
            );

        }


        // =====================================================
        // UPDATE TEST
        // =====================================================

        if (action === "updateTest") {

            const body =
                JSON.parse(
                    event.body || "{}"
                );


            const {
                id,
                test_name,
                max_score
            } = body;


            if (
                !id ||
                !test_name ||
                !max_score
            ) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Test name and maximum marks are required"
                    }
                );

            }


            const max =
                Number(max_score);


            if (
                !Number.isFinite(max) ||
                max <= 0
            ) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Maximum marks must be greater than 0"
                    }
                );

            }


            const result =
                await db.query(
                    `
                    UPDATE subject_tests

                    SET
                        test_name = $1,
                        max_score = $2

                    WHERE id = $3
                      AND teacher_id = $4

                    RETURNING *
                    `,
                    [
                        test_name.trim(),
                        max,
                        Number(id),
                        teacher_id
                    ]
                );


            if (!result.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Test not found or access denied"
                    }
                );

            }


            /*
             * Keep marks.max_score synchronized with
             * the test maximum.
             */

            await db.query(
                `
                UPDATE marks

                SET max_score = $1

                WHERE test_id = $2
                  AND teacher_id = $3
                `,
                [
                    max,
                    Number(id),
                    teacher_id
                ]
            );


            return response(
                200,
                {
                    success: true,
                    message:
                        "Test updated successfully",
                    test:
                        result.rows[0]
                }
            );

        }


        // =====================================================
        // DELETE TEST
        // =====================================================

        if (action === "deleteTest") {

            const {
                test_id
            } =
                JSON.parse(
                    event.body || "{}"
                );


            if (!test_id) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Test ID is required"
                    }
                );

            }


            /*
             * marks.test_id has ON DELETE CASCADE,
             * so deleting the test also deletes its marks.
             */

            const result =
                await db.query(
                    `
                    DELETE FROM subject_tests

                    WHERE id = $1
                      AND teacher_id = $2

                    RETURNING id
                    `,
                    [
                        Number(test_id),
                        teacher_id
                    ]
                );


            if (!result.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Test not found or access denied"
                    }
                );

            }


            return response(
                200,
                {
                    success: true,
                    message:
                        "Test deleted successfully"
                }
            );

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
            } =
                event.queryStringParameters;


            const allowed =
                await verifyTeachingAssignment(
                    class_id,
                    subject_id,
                    academic_year_id
                );


            if (!allowed) {

                return response(
                    403,
                    {
                        success: false,
                        message:
                            "This subject is not assigned to this class"
                    }
                );

            }


            // -------------------------------------------------
            // LEARNERS
            // -------------------------------------------------

            const learners =
                await db.query(
                    `
                    SELECT
                        id,
                        full_name,
                        gender

                    FROM learners

                    WHERE class_id = $1
                      AND academic_year_id = $2
                      AND teacher_id = $3

                    ORDER BY full_name
                    `,
                    [
                        Number(class_id),
                        Number(academic_year_id),
                        teacher_id
                    ]
                );


            // -------------------------------------------------
            // TESTS
            // -------------------------------------------------

            const tests =
                await db.query(
                    `
                    SELECT
                        id,
                        test_name,
                        max_score,
                        is_exam

                    FROM subject_tests

                    WHERE subject_id = $1
                      AND class_id = $2
                      AND academic_year_id = $3
                      AND term_id = $4
                      AND teacher_id = $5

                    ORDER BY
                        is_exam ASC,
                        id ASC
                    `,
                    [
                        Number(subject_id),
                        Number(class_id),
                        Number(academic_year_id),
                        Number(term_id),
                        teacher_id
                    ]
                );


            // -------------------------------------------------
            // MARKS
            // -------------------------------------------------

            const marks =
                await db.query(
                    `
                    SELECT
                        id,
                        learner_id,
                        test_id,
                        score,
                        max_score

                    FROM marks

                    WHERE class_id = $1
                      AND subject_id = $2
                      AND academic_year_id = $3
                      AND term_id = $4
                      AND teacher_id = $5
                    `,
                    [
                        Number(class_id),
                        Number(subject_id),
                        Number(academic_year_id),
                        Number(term_id),
                        teacher_id
                    ]
                );


            const marksMap = {};


            marks.rows.forEach(mark => {

                marksMap[
                    `${mark.learner_id}_${mark.test_id}`
                ] = mark;

            });


            const finalData =
                learners.rows.map(
                    learner => {

                        const learnerMarks =
                            tests.rows.map(
                                test => {

                                    const found =
                                        marksMap[
                                            `${learner.id}_${test.id}`
                                        ];


                                    return {

                                        test_id:
                                            test.id,

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

                                }
                            );


                        return {

                            id:
                                learner.id,

                            full_name:
                                learner.full_name,

                            marks:
                                learnerMarks

                        };

                    }
                );


            return response(
                200,
                finalData
            );

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
            } =
                event.queryStringParameters;


            const result =
                await db.query(
                    `
                    SELECT *

                    FROM grading_settings

                    WHERE subject_id = $1
                      AND class_id = $2
                      AND academic_year_id = $3
                      AND term_id = $4
                      AND teacher_id = $5
                    `,
                    [
                        Number(subject_id),
                        Number(class_id),
                        Number(academic_year_id),
                        Number(term_id),
                        teacher_id
                    ]
                );


            if (result.rows.length) {

                return response(
                    200,
                    result.rows[0]
                );

            }


            return response(
                200,
                {
                    overall_test_max: 100,
                    overall_exam_max: 100
                }
            );

        }


        // =====================================================
        // SAVE GRADING SETTINGS
        // =====================================================

        if (action === "saveGradingSettings") {

            const body =
                JSON.parse(
                    event.body || "{}"
                );


            const {
                subject_id,
                class_id,
                academic_year_id,
                term_id,
                overall_test_max,
                overall_exam_max
            } = body;


            const existing =
                await db.query(
                    `
                    SELECT id

                    FROM grading_settings

                    WHERE subject_id = $1
                      AND class_id = $2
                      AND academic_year_id = $3
                      AND term_id = $4
                      AND teacher_id = $5
                    `,
                    [
                        Number(subject_id),
                        Number(class_id),
                        Number(academic_year_id),
                        Number(term_id),
                        teacher_id
                    ]
                );


            if (existing.rows.length) {

                await db.query(
                    `
                    UPDATE grading_settings

                    SET
                        overall_test_max = $1,
                        overall_exam_max = $2

                    WHERE id = $3
                      AND teacher_id = $4
                    `,
                    [
                        Number(overall_test_max),
                        Number(overall_exam_max),
                        existing.rows[0].id,
                        teacher_id
                    ]
                );

            } else {

                await db.query(
                    `
                    INSERT INTO grading_settings (
                        teacher_id,
                        subject_id,
                        class_id,
                        academic_year_id,
                        term_id,
                        overall_test_max,
                        overall_exam_max
                    )

                    VALUES (
                        $1,$2,$3,$4,$5,$6,$7
                    )
                    `,
                    [
                        teacher_id,
                        Number(subject_id),
                        Number(class_id),
                        Number(academic_year_id),
                        Number(term_id),
                        Number(overall_test_max),
                        Number(overall_exam_max)
                    ]
                );

            }


            return response(
                200,
                {
                    success: true,
                    message:
                        "Grading settings saved"
                }
            );

        }


        // =====================================================
        // SAVE MARK
        // =====================================================

        if (action === "saveMark") {

            const body =
                JSON.parse(
                    event.body || "{}"
                );


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


            const numericScore =
                Number(score);


            const numericMax =
                Number(max_score);


            if (
                !learner_id ||
                !subject_id ||
                !class_id ||
                !academic_year_id ||
                !term_id ||
                !test_id
            ) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Incomplete mark information"
                    }
                );

            }


            if (
                !Number.isFinite(numericScore) ||
                numericScore < 0 ||
                numericScore > numericMax
            ) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            `Score must be between 0 and ${numericMax}`
                    }
                );

            }


            // -------------------------------------------------
            // VERIFY TEACHING ASSIGNMENT
            // -------------------------------------------------

            const allowed =
                await verifyTeachingAssignment(
                    class_id,
                    subject_id,
                    academic_year_id
                );


            if (!allowed) {

                return response(
                    403,
                    {
                        success: false,
                        message:
                            "This subject is not assigned to this class"
                    }
                );

            }


            // -------------------------------------------------
            // VERIFY LEARNER
            // -------------------------------------------------

            const learnerCheck =
                await db.query(
                    `
                    SELECT id

                    FROM learners

                    WHERE id = $1
                      AND teacher_id = $2
                      AND class_id = $3
                      AND academic_year_id = $4
                    `,
                    [
                        Number(learner_id),
                        teacher_id,
                        Number(class_id),
                        Number(academic_year_id)
                    ]
                );


            if (!learnerCheck.rows.length) {

                return response(
                    403,
                    {
                        success: false,
                        message:
                            "You do not have access to this learner"
                    }
                );

            }


            // -------------------------------------------------
            // VERIFY TEST
            // -------------------------------------------------

            const testCheck =
                await db.query(
                    `
                    SELECT id, max_score

                    FROM subject_tests

                    WHERE id = $1
                      AND teacher_id = $2
                      AND subject_id = $3
                      AND class_id = $4
                      AND academic_year_id = $5
                      AND term_id = $6
                    `,
                    [
                        Number(test_id),
                        teacher_id,
                        Number(subject_id),
                        Number(class_id),
                        Number(academic_year_id),
                        Number(term_id)
                    ]
                );


            if (!testCheck.rows.length) {

                return response(
                    403,
                    {
                        success: false,
                        message:
                            "You do not have access to this test"
                    }
                );

            }


            const actualMax =
                Number(
                    testCheck.rows[0].max_score
                );


            if (
                numericScore > actualMax
            ) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            `Score cannot exceed ${actualMax}`
                    }
                );

            }


            // -------------------------------------------------
            // UPSERT MARK
            // -------------------------------------------------

            const existing =
                await db.query(
                    `
                    SELECT id

                    FROM marks

                    WHERE learner_id = $1
                      AND test_id = $2
                    `,
                    [
                        Number(learner_id),
                        Number(test_id)
                    ]
                );


            if (existing.rows.length) {

                await db.query(
                    `
                    UPDATE marks

                    SET
                        score = $1,
                        max_score = $2

                    WHERE id = $3
                      AND teacher_id = $4
                    `,
                    [
                        numericScore,
                        actualMax,
                        existing.rows[0].id,
                        teacher_id
                    ]
                );

            } else {

                await db.query(
                    `
                    INSERT INTO marks (
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

                    VALUES (
                        $1,$2,$3,$4,$5,$6,$7,$8,$9
                    )
                    `,
                    [
                        teacher_id,
                        Number(learner_id),
                        Number(subject_id),
                        Number(class_id),
                        Number(academic_year_id),
                        Number(term_id),
                        Number(test_id),
                        numericScore,
                        actualMax
                    ]
                );

            }


            return response(
                200,
                {
                    success: true,
                    message:
                        "Mark saved"
                }
            );

        }


        // =====================================================
        // INVALID ACTION
        // =====================================================

        return response(
            400,
            {
                success: false,
                message:
                    "Invalid action"
            }
        );


    }

    catch (error) {

        console.error(
            "School Marks Error:",
            error
        );


        return response(
            500,
            {
                success: false,
                error:
                    error.message
            }
        );

    }

};


// ============================================================
// RESPONSE HELPER
// ============================================================

function response(
    statusCode,
    body
) {

    return {

        statusCode,

        headers: {

            "Content-Type":
                "application/json",

            "Cache-Control":
                "no-store"

        },

        body:
            JSON.stringify(body)

    };

}
