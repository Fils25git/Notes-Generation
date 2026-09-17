
import db from "./db.js";


/* ============================================================
   RESPONSE HELPERS
   ============================================================ */

function response(statusCode, data) {

    return {
        statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
        },
        body: JSON.stringify(data)
    };
}


function getTeacherId(event, body = {}) {

    const queryTeacherId =
        event.queryStringParameters?.teacher_id;

    const teacherId =
        queryTeacherId ||
        body.teacher_id;

    const id = Number(teacherId);

    return Number.isInteger(id) && id > 0
        ? id
        : null;
}


async function getBody(event) {

    if (!event.body) {
        return {};
    }

    try {
        return JSON.parse(event.body);
    } catch {
        throw new Error("Invalid JSON request body.");
    }
}


/* ============================================================
   TEACHER VALIDATION
   ============================================================ */

async function teacherExists(teacherId) {

    const result = await db.query(
        `
        SELECT id, name, email, phone
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [teacherId]
    );

    return result.rows[0] || null;
}


/* ============================================================
   ACADEMIC YEAR VALIDATION
   ============================================================ */

async function academicYearExists(
    academicYearId
) {

    const result = await db.query(
        `
        SELECT *
        FROM academic_years
        WHERE id = $1
        LIMIT 1
        `,
        [academicYearId]
    );

    return result.rows[0] || null;
}


/* ============================================================
   TERM VALIDATION
   ============================================================ */

async function termBelongsToYear(
    termId,
    academicYearId
) {

    const result = await db.query(
        `
        SELECT *
        FROM terms
        WHERE id = $1
          AND academic_year_id = $2
        LIMIT 1
        `,
        [
            termId,
            academicYearId
        ]
    );

    return result.rows[0] || null;
}


/* ============================================================
   CLASS OWNERSHIP
   ============================================================ */

async function getTeacherClass(
    teacherId,
    classId
) {

    const result = await db.query(
        `
        SELECT *
        FROM classes
        WHERE id = $1
          AND teacher_id = $2
        LIMIT 1
        `,
        [
            classId,
            teacherId
        ]
    );

    return result.rows[0] || null;
}


/* ============================================================
   SUBJECT OWNERSHIP
   ============================================================ */

async function getTeacherSubject(
    teacherId,
    subjectId
) {

    const result = await db.query(
        `
        SELECT *
        FROM subjects
        WHERE id = $1
          AND teacher_id = $2
        LIMIT 1
        `,
        [
            subjectId,
            teacherId
        ]
    );

    return result.rows[0] || null;
}


/* ============================================================
   TEACHING ASSIGNMENT VALIDATION
   ============================================================

   IMPORTANT:

   Your actual database stores:

       teacher_class_subjects.subject_name

   NOT:

       teacher_class_subjects.subject_id

   Therefore we match the subject using its name.
   ============================================================ */

async function teachingAssignmentExists(
    teacherId,
    classId,
    subjectName,
    academicYearId
) {

    const result = await db.query(
        `
        SELECT tcs.*
        FROM teacher_class_subjects tcs
        WHERE tcs.teacher_id = $1
          AND tcs.class_id = $2
          AND tcs.academic_year_id = $3
          AND LOWER(TRIM(tcs.subject_name))
              = LOWER(TRIM($4))
        LIMIT 1
        `,
        [
            teacherId,
            classId,
            academicYearId,
            subjectName
        ]
    );

    return result.rows[0] || null;
}


/* ============================================================
   GET CLASSES
   ============================================================

   Only classes that the teacher actually has teaching
   assignments for in the selected academic year are returned.
   ============================================================ */

async function getClasses(
    teacherId,
    academicYearId
) {

    if (!academicYearId) {
        return [];
    }

    const result = await db.query(
        `
        SELECT DISTINCT
            c.id,
            c.class_name,
            c.teacher_id,
            c.created_at
        FROM classes c
        INNER JOIN teacher_class_subjects tcs
            ON tcs.class_id = c.id
           AND tcs.teacher_id = c.teacher_id
           AND tcs.academic_year_id = $2
        WHERE c.teacher_id = $1
        ORDER BY
            c.class_name ASC,
            c.id ASC
        `,
        [
            teacherId,
            academicYearId
        ]
    );

    return result.rows;
}


/* ============================================================
   GET SUBJECTS FOR CLASS
   ============================================================

   The assignment table contains subject_name.

   The marks system needs subject_id because subject_tests
   references subjects(id).

   Therefore we join subjects by teacher + normalized name.
   ============================================================ */

async function getSubjectsForClass(
    teacherId,
    classId,
    academicYearId
) {

    const result = await db.query(
        `
        SELECT DISTINCT
            s.id,
            s.subject_name,
            s.teacher_id
        FROM teacher_class_subjects tcs
        INNER JOIN subjects s
            ON s.teacher_id = tcs.teacher_id
           AND LOWER(TRIM(s.subject_name))
               = LOWER(TRIM(tcs.subject_name))
        INNER JOIN classes c
            ON c.id = tcs.class_id
           AND c.teacher_id = tcs.teacher_id
        WHERE tcs.teacher_id = $1
          AND tcs.class_id = $2
          AND tcs.academic_year_id = $3
        ORDER BY
            s.subject_name ASC
        `,
        [
            teacherId,
            classId,
            academicYearId
        ]
    );

    return result.rows;
}


/* ============================================================
   GET ALL TEACHER SUBJECTS
   ============================================================ */

async function getSubjects(teacherId) {

    const result = await db.query(
        `
        SELECT *
        FROM subjects
        WHERE teacher_id = $1
        ORDER BY subject_name ASC
        `,
        [teacherId]
    );

    return result.rows;
}


/* ============================================================
   GET TESTS
   ============================================================ */

async function getTests(
    teacherId,
    classId,
    subjectId,
    academicYearId,
    termId
) {

    const classRow =
        await getTeacherClass(
            teacherId,
            classId
        );

    if (!classRow) {
        throw new Error("You do not have access to this class.");
    }


    const subjectRow =
        await getTeacherSubject(
            teacherId,
            subjectId
        );

    if (!subjectRow) {
        throw new Error("You do not have access to this subject.");
    }


    const yearRow =
        await academicYearExists(
            academicYearId
        );

    if (!yearRow) {
        throw new Error("Academic year not found.");
    }


    const termRow =
        await termBelongsToYear(
            termId,
            academicYearId
        );

    if (!termRow) {
        throw new Error(
            "The selected term does not belong to the selected academic year."
        );
    }


    const assignment =
        await teachingAssignmentExists(
            teacherId,
            classId,
            subjectRow.subject_name,
            academicYearId
        );

    if (!assignment) {
        throw new Error(
            "This subject is not assigned to you for this class."
        );
    }


    const result = await db.query(
        `
        SELECT
            id,
            teacher_id,
            subject_id,
            class_id,
            academic_year_id,
            term_id,
            test_name,
            max_score,
            is_exam,
            created_at
        FROM subject_tests
        WHERE teacher_id = $1
          AND subject_id = $2
          AND class_id = $3
          AND academic_year_id = $4
          AND term_id = $5
        ORDER BY
            is_exam ASC,
            id ASC
        `,
        [
            teacherId,
            subjectId,
            classId,
            academicYearId,
            termId
        ]
    );

    return result.rows;
}


/* ============================================================
   ADD TEST
   ============================================================ */

async function addTest(
    teacherId,
    data
) {

    const {
        test_name,
        max_score,
        is_exam,
        class_id,
        subject_id,
        academic_year_id,
        term_id
    } = data;


    if (!test_name?.trim()) {
        throw new Error("Test name is required.");
    }


    const maxScore =
        Number(max_score);

    if (
        !Number.isFinite(maxScore) ||
        maxScore <= 0
    ) {
        throw new Error(
            "Maximum marks must be greater than 0."
        );
    }


    const classRow =
        await getTeacherClass(
            teacherId,
            Number(class_id)
        );

    if (!classRow) {
        throw new Error(
            "You do not have access to this class."
        );
    }


    const subjectRow =
        await getTeacherSubject(
            teacherId,
            Number(subject_id)
        );

    if (!subjectRow) {
        throw new Error(
            "You do not have access to this subject."
        );
    }


    const yearRow =
        await academicYearExists(
            Number(academic_year_id)
        );

    if (!yearRow) {
        throw new Error(
            "Academic year not found."
        );
    }


    const termRow =
        await termBelongsToYear(
            Number(term_id),
            Number(academic_year_id)
        );

    if (!termRow) {
        throw new Error(
            "Invalid term for the selected academic year."
        );
    }


    const assignment =
        await teachingAssignmentExists(
            teacherId,
            Number(class_id),
            subjectRow.subject_name,
            Number(academic_year_id)
        );

    if (!assignment) {
        throw new Error(
            "This subject is not assigned to you for this class."
        );
    }


    const result = await db.query(
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
            teacherId,
            Number(subject_id),
            Number(class_id),
            Number(academic_year_id),
            Number(term_id),
            test_name.trim(),
            maxScore,
            Boolean(is_exam)
        ]
    );


    return result.rows[0];
}


/* ============================================================
   UPDATE TEST
   ============================================================ */

async function updateTest(
    teacherId,
    data
) {

    const {
        id,
        test_name,
        max_score,
        is_exam
    } = data;


    const testId =
        Number(id);

    if (!testId) {
        throw new Error(
            "Test ID is required."
        );
    }


    const maxScore =
        Number(max_score);

    if (
        !Number.isFinite(maxScore) ||
        maxScore <= 0
    ) {
        throw new Error(
            "Maximum marks must be greater than 0."
        );
    }


    if (!test_name?.trim()) {
        throw new Error(
            "Test name is required."
        );
    }


    const existing =
        await db.query(
            `
            SELECT *
            FROM subject_tests
            WHERE id = $1
              AND teacher_id = $2
            LIMIT 1
            `,
            [
                testId,
                teacherId
            ]
        );


    const test =
        existing.rows[0];

    if (!test) {
        throw new Error(
            "Test not found or you do not have permission to edit it."
        );
    }


    const result =
        await db.query(
            `
            UPDATE subject_tests
            SET
                test_name = $1,
                max_score = $2,
                is_exam = $3
            WHERE id = $4
              AND teacher_id = $5
            RETURNING *
            `,
            [
                test_name.trim(),
                maxScore,
                Boolean(is_exam),
                testId,
                teacherId
            ]
        );


    /*
     * Keep max_score on existing marks synchronized.
     */
    await db.query(
        `
        UPDATE marks
        SET max_score = $1
        WHERE test_id = $2
          AND teacher_id = $3
        `,
        [
            maxScore,
            testId,
            teacherId
        ]
    );


    return result.rows[0];
}


/* ============================================================
   DELETE TEST
   ============================================================ */

async function deleteTest(
    teacherId,
    testId
) {

    const result =
        await db.query(
            `
            DELETE FROM subject_tests
            WHERE id = $1
              AND teacher_id = $2
            RETURNING id
            `,
            [
                Number(testId),
                teacherId
            ]
        );


    if (!result.rows.length) {
        throw new Error(
            "Test not found or you do not have permission to delete it."
        );
    }


    return {
        deleted: true,
        id: result.rows[0].id
    };
}


/* ============================================================
   GET MARKS
   ============================================================ */

async function getMarks(
    teacherId,
    classId,
    subjectId,
    academicYearId,
    termId
) {

    const classRow =
        await getTeacherClass(
            teacherId,
            classId
        );

    if (!classRow) {
        throw new Error(
            "You do not have access to this class."
        );
    }


    const subjectRow =
        await getTeacherSubject(
            teacherId,
            subjectId
        );

    if (!subjectRow) {
        throw new Error(
            "You do not have access to this subject."
        );
    }


    const assignment =
        await teachingAssignmentExists(
            teacherId,
            classId,
            subjectRow.subject_name,
            academicYearId
        );

    if (!assignment) {
        throw new Error(
            "This subject is not assigned to you for this class."
        );
    }


    const termRow =
        await termBelongsToYear(
            termId,
            academicYearId
        );

    if (!termRow) {
        throw new Error(
            "Invalid term for the selected academic year."
        );
    }


    /*
     * Learners
     */
    const learnersResult =
        await db.query(
            `
            SELECT
                id,
                full_name,
                gender,
                class_id,
                academic_year_id
            FROM learners
            WHERE teacher_id = $1
              AND class_id = $2
              AND (
                    academic_year_id = $3
                    OR academic_year_id IS NULL
                  )
            ORDER BY
                full_name ASC,
                id ASC
            `,
            [
                teacherId,
                classId,
                academicYearId
            ]
        );


    /*
     * Tests
     */
    const testsResult =
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
              AND subject_id = $2
              AND class_id = $3
              AND academic_year_id = $4
              AND term_id = $5
            ORDER BY
                is_exam ASC,
                id ASC
            `,
            [
                teacherId,
                subjectId,
                classId,
                academicYearId,
                termId
            ]
        );


    /*
     * Marks
     */
    const marksResult =
        await db.query(
            `
            SELECT
                m.id,
                m.learner_id,
                m.test_id,
                m.score,
                m.max_score,
                m.remarks
            FROM marks m
            INNER JOIN subject_tests st
                ON st.id = m.test_id
            WHERE m.teacher_id = $1
              AND m.subject_id = $2
              AND m.class_id = $3
              AND m.academic_year_id = $4
              AND m.term_id = $5
              AND st.teacher_id = $1
            `,
            [
                teacherId,
                subjectId,
                classId,
                academicYearId,
                termId
            ]
        );


    /*
     * Convert marks into:
     *
     * {
     *   learnerId: {
     *      testId: score
     *   }
     * }
     */

    const marks = {};


    marksResult.rows.forEach(mark => {

        const learnerKey =
            String(mark.learner_id);

        const testKey =
            String(mark.test_id);


        if (!marks[learnerKey]) {
            marks[learnerKey] = {};
        }


        marks[learnerKey][testKey] =
            mark.score;
    });


    return {
        learners: learnersResult.rows,
        tests: testsResult.rows,
        marks
    };
}


/* ============================================================
   SAVE MARK
   ============================================================ */

async function saveMark(
    teacherId,
    data
) {

    const {
        learner_id,
        test_id,
        score,
        class_id,
        subject_id,
        academic_year_id,
        term_id
    } = data;


    const learnerId =
        Number(learner_id);

    const testId =
        Number(test_id);

    const classId =
        Number(class_id);

    const subjectId =
        Number(subject_id);

    const academicYearId =
        Number(academic_year_id);

    const termId =
        Number(term_id);


    if (
        !learnerId ||
        !testId ||
        !classId ||
        !subjectId ||
        !academicYearId ||
        !termId
    ) {
        throw new Error(
            "Incomplete mark information."
        );
    }


    const testResult =
        await db.query(
            `
            SELECT *
            FROM subject_tests
            WHERE id = $1
              AND teacher_id = $2
              AND subject_id = $3
              AND class_id = $4
              AND academic_year_id = $5
              AND term_id = $6
            LIMIT 1
            `,
            [
                testId,
                teacherId,
                subjectId,
                classId,
                academicYearId,
                termId
            ]
        );


    const test =
        testResult.rows[0];

    if (!test) {
        throw new Error(
            "The selected assessment is invalid."
        );
    }


    const learnerResult =
        await db.query(
            `
            SELECT id
            FROM learners
            WHERE id = $1
              AND teacher_id = $2
              AND class_id = $3
            LIMIT 1
            `,
            [
                learnerId,
                teacherId,
                classId
            ]
        );


    if (!learnerResult.rows.length) {
        throw new Error(
            "The selected learner is not in this class."
        );
    }


    /*
     * Empty mark:
     * remove an existing mark.
     */

    if (
        score === null ||
        score === "" ||
        score === undefined
    ) {

        await db.query(
            `
            DELETE FROM marks
            WHERE learner_id = $1
              AND test_id = $2
              AND teacher_id = $3
            `,
            [
                learnerId,
                testId,
                teacherId
            ]
        );


        return {
            saved: true,
            deleted: true
        };
    }


    const numericScore =
        Number(score);


    if (
        !Number.isFinite(numericScore)
    ) {
        throw new Error(
            "Mark must be a valid number."
        );
    }


    if (numericScore < 0) {
        throw new Error(
            "Mark cannot be negative."
        );
    }


    if (
        numericScore >
        Number(test.max_score)
    ) {
        throw new Error(
            `Mark cannot be greater than ${test.max_score}.`
        );
    }


    /*
     * UPSERT.
     *
     * UNIQUE(learner_id, test_id)
     * already exists in your database.
     */

    const result =
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
            ON CONFLICT (
                learner_id,
                test_id
            )
            DO UPDATE SET
                score = EXCLUDED.score,
                max_score = EXCLUDED.max_score,
                remarks = EXCLUDED.remarks
            RETURNING *
            `,
            [
                teacherId,
                learnerId,
                subjectId,
                classId,
                academicYearId,
                termId,
                testId,
                numericScore,
                Number(test.max_score),
                null
            ]
        );


    return {
        saved: true,
        mark: result.rows[0]
    };
}


/* ============================================================
   GET GRADING SETTINGS
   ============================================================ */

async function getGradingSettings(
    teacherId,
    subjectId,
    classId,
    academicYearId,
    termId
) {

    const result =
        await db.query(
            `
            SELECT *
            FROM grading_settings
            WHERE teacher_id = $1
              AND subject_id = $2
              AND class_id = $3
              AND academic_year_id = $4
              AND term_id = $5
            LIMIT 1
            `,
            [
                teacherId,
                subjectId,
                classId,
                academicYearId,
                termId
            ]
        );


    if (!result.rows.length) {

        return {
            overall_test_max: 100,
            overall_exam_max: 100
        };
    }


    return result.rows[0];
}


/* ============================================================
   SAVE GRADING SETTINGS
   ============================================================ */

async function saveGradingSettings(
    teacherId,
    data
) {

    const {
        subject_id,
        class_id,
        academic_year_id,
        term_id,
        overall_test_max,
        overall_exam_max
    } = data;


    const subjectId =
        Number(subject_id);

    const classId =
        Number(class_id);

    const academicYearId =
        Number(academic_year_id);

    const termId =
        Number(term_id);


    const subject =
        await getTeacherSubject(
            teacherId,
            subjectId
        );

    if (!subject) {
        throw new Error(
            "Invalid subject."
        );
    }


    const classRow =
        await getTeacherClass(
            teacherId,
            classId
        );

    if (!classRow) {
        throw new Error(
            "Invalid class."
        );
    }


    const assignment =
        await teachingAssignmentExists(
            teacherId,
            classId,
            subject.subject_name,
            academicYearId
        );

    if (!assignment) {
        throw new Error(
            "This subject is not assigned to you for this class."
        );
    }


    const testMax =
        Number(overall_test_max);

    const examMax =
        Number(overall_exam_max);


    if (
        !Number.isFinite(testMax) ||
        testMax <= 0
    ) {
        throw new Error(
            "Overall test maximum must be greater than 0."
        );
    }


    if (
        !Number.isFinite(examMax) ||
        examMax <= 0
    ) {
        throw new Error(
            "Overall exam maximum must be greater than 0."
        );
    }


    const result =
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
            ON CONFLICT (
                teacher_id,
                subject_id,
                class_id,
                academic_year_id,
                term_id
            )
            DO UPDATE SET
                overall_test_max =
                    EXCLUDED.overall_test_max,
                overall_exam_max =
                    EXCLUDED.overall_exam_max
            RETURNING *
            `,
            [
                teacherId,
                subjectId,
                classId,
                academicYearId,
                termId,
                testMax,
                examMax
            ]
        );


    return result.rows[0];
}


/* ============================================================
   MAIN HANDLER
   ============================================================ */

export async function handler(event) {

    /*
     * CORS preflight
     */

    if (event.httpMethod === "OPTIONS") {
        return response(200, {
            success: true
        });
    }


    let body = {};

    try {

        body =
            await getBody(event);

    } catch (error) {

        return response(
            400,
            {
                success: false,
                message: error.message
            }
        );
    }


    const action =
        event.queryStringParameters?.action;


    if (!action) {

        return response(
            400,
            {
                success: false,
                message: "Action is required."
            }
        );
    }


    const teacherId =
        getTeacherId(
            event,
            body
        );


    if (!teacherId) {

        return response(
            400,
            {
                success: false,
                message: "Teacher ID is required."
            }
        );
    }


    try {

        const teacher =
            await teacherExists(
                teacherId
            );


        if (!teacher) {

            return response(
                403,
                {
                    success: false,
                    message: "Teacher account not found."
                }
            );
        }


        /* =====================================================
           GET CLASSES
        ====================================================== */

        if (action === "getClasses") {

            const academicYearId =
                Number(
                    event.queryStringParameters?.academic_year_id ||
                    body.academic_year_id
                );


            const classes =
                await getClasses(
                    teacherId,
                    academicYearId
                );


            return response(
                200,
                {
                    success: true,
                    classes
                }
            );
        }


        /* =====================================================
           GET SUBJECTS
        ====================================================== */

        if (action === "getSubjects") {

            const subjects =
                await getSubjects(
                    teacherId
                );


            return response(
                200,
                {
                    success: true,
                    subjects
                }
            );
        }


        /* =====================================================
           GET SUBJECTS FOR CLASS
        ====================================================== */

        if (
            action ===
            "getSubjectsForClass"
        ) {

            const classId =
                Number(
                    event.queryStringParameters?.class_id ||
                    body.class_id
                );

            const academicYearId =
                Number(
                    event.queryStringParameters?.academic_year_id ||
                    body.academic_year_id
                );


            if (
                !classId ||
                !academicYearId
            ) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Class and academic year are required."
                    }
                );
            }


            const classRow =
                await getTeacherClass(
                    teacherId,
                    classId
                );


            if (!classRow) {

                return response(
                    403,
                    {
                        success: false,
                        message:
                            "You do not have access to this class."
                    }
                );
            }


            const subjects =
                await getSubjectsForClass(
                    teacherId,
                    classId,
                    academicYearId
                );


            return response(
                200,
                {
                    success: true,
                    subjects
                }
            );
        }


        /* =====================================================
           GET TESTS
        ====================================================== */

        if (action === "getTests") {

            const tests =
                await getTests(
                    teacherId,
                    Number(body.class_id),
                    Number(body.subject_id),
                    Number(body.academic_year_id),
                    Number(body.term_id)
                );


            return response(
                200,
                {
                    success: true,
                    tests
                }
            );
        }


        /* =====================================================
           ADD TEST
        ====================================================== */

        if (action === "addTest") {

            const test =
                await addTest(
                    teacherId,
                    body
                );


            return response(
                200,
                {
                    success: true,
                    test
                }
            );
        }


        /* =====================================================
           UPDATE TEST
        ====================================================== */

        if (action === "updateTest") {

            const test =
                await updateTest(
                    teacherId,
                    body
                );


            return response(
                200,
                {
                    success: true,
                    test
                }
            );
        }


        /* =====================================================
           DELETE TEST
        ====================================================== */

        if (action === "deleteTest") {

            const result =
                await deleteTest(
                    teacherId,
                    Number(body.id)
                );


            return response(
                200,
                {
                    success: true,
                    ...result
                }
            );
        }


        /* =====================================================
           GET MARKS
        ====================================================== */

        if (action === "getMarks") {

            const result =
                await getMarks(
                    teacherId,
                    Number(body.class_id),
                    Number(body.subject_id),
                    Number(body.academic_year_id),
                    Number(body.term_id)
                );


            return response(
                200,
                {
                    success: true,
                    ...result
                }
            );
        }


        /* =====================================================
           SAVE MARK
        ====================================================== */

        if (action === "saveMark") {

            const result =
                await saveMark(
                    teacherId,
                    body
                );


            return response(
                200,
                {
                    success: true,
                    ...result
                }
            );
        }


        /* =====================================================
           GET GRADING SETTINGS
        ====================================================== */

        if (
            action ===
            "getGradingSettings"
        ) {

            const settings =
                await getGradingSettings(
                    teacherId,
                    Number(body.subject_id),
                    Number(body.class_id),
                    Number(body.academic_year_id),
                    Number(body.term_id)
                );


            return response(
                200,
                {
                    success: true,
                    settings
                }
            );
        }


        /* =====================================================
           SAVE GRADING SETTINGS
        ====================================================== */

        if (
            action ===
            "saveGradingSettings"
        ) {

            const settings =
                await saveGradingSettings(
                    teacherId,
                    body
                );


            return response(
                200,
                {
                    success: true,
                    settings
                }
            );
        }


        /* =====================================================
           UNKNOWN ACTION
        ====================================================== */

        return response(
            404,
            {
                success: false,
                message:
                    `Unknown action: ${action}`
            }
        );


    } catch (error) {

        console.error(
            `school.js action "${action}" error:`,
            error
        );


        return response(
            500,
            {
                success: false,
                message:
                    error.message ||
                    "Internal server error."
            }
        );
    }
}

