import { pool } from "./db.js";


/* =====================================================
   COMMON RESPONSE
===================================================== */

function response(statusCode, data) {

    return {
        statusCode,

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(data)

    };

}


/* =====================================================
   GET BODY
===================================================== */

function getBody(event) {

    try {

        return JSON.parse(
            event.body || "{}"
        );

    } catch {

        return {};

    }

}


/* =====================================================
   GET TEACHER ID
===================================================== */

function getTeacherId(event, body) {

    const method =
        event.httpMethod || "GET";


    if (method === "GET") {

        return Number(
            event.queryStringParameters?.teacher_id
        );

    }


    return Number(
        body.teacher_id
    );

}


/* =====================================================
   CHECK TEACHER
===================================================== */

async function teacherExists(teacherId) {

    if (!teacherId) {

        return false;

    }


    const result =
        await pool.query(
            `
            SELECT id
            FROM users
            WHERE id = $1
            LIMIT 1
            `,
            [teacherId]
        );


    return result.rows.length > 0;

}


/* =====================================================
   GET CURRENT ACADEMIC YEAR
===================================================== */

async function getCurrentAcademicYear() {

    const result =
        await pool.query(
            `
            SELECT *
            FROM academic_years
            WHERE is_current = TRUE
            ORDER BY
                start_date DESC NULLS LAST,
                id DESC
            LIMIT 1
            `
        );


    return result.rows[0] || null;

}


/* =====================================================
   GET TEACHER SUBJECTS
===================================================== */

async function getSubjectsForTeacher(teacherId) {

    const result =
        await pool.query(
            `
            SELECT
                id,
                subject_name,
                created_at
            FROM subjects
            WHERE teacher_id = $1
            ORDER BY subject_name ASC
            `,
            [teacherId]
        );


    return result.rows;

}


/* =====================================================
   GET ACADEMIC YEARS
===================================================== */

async function getAcademicYears() {

    const result =
        await pool.query(
            `
            SELECT
                id,
                year_name,
                start_date,
                end_date,
                is_current
            FROM academic_years
            ORDER BY
                start_date DESC NULLS LAST,
                id DESC
            `
        );


    return result.rows;

}


/* =====================================================
   MAIN HANDLER
===================================================== */

export const handler = async (event) => {

    const method =
        event.httpMethod || "GET";


    const params =
        event.queryStringParameters || {};


    const action =
        params.action || "";


    const body =
        getBody(event);


    try {

        /* =================================================
           TEACHER
        ================================================= */

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
                    message:
                        "Teacher ID is required."
                }
            );

        }


        const exists =
            await teacherExists(
                teacherId
            );


        if (!exists) {

            return response(
                404,
                {
                    success: false,
                    message:
                        "Teacher not found."
                }
            );

        }


        /* =================================================
           GET CURRENT ACADEMIC YEAR
        ================================================= */

        const academicYear =
            await getCurrentAcademicYear();


        if (!academicYear) {

            return response(
                400,
                {
                    success: false,
                    message:
                        "No current academic year has been set."
                }
            );

        }


        /* =================================================
           GET CLASSES
        ================================================= */

        if (
            action === "getClasses"
        ) {

            const result =
                await pool.query(
                    `
                    SELECT
                        c.id,
                        c.class_name,
                        c.created_at,

                        COUNT(l.id)::INTEGER
                            AS student_count

                    FROM classes c

                    LEFT JOIN learners l
                        ON l.class_id = c.id
                        AND l.teacher_id = c.teacher_id
                        AND l.academic_year_id = $2

                    WHERE c.teacher_id = $1

                    GROUP BY
                        c.id,
                        c.class_name,
                        c.created_at

                    ORDER BY
                        c.class_name ASC
                    `,
                    [
                        teacherId,
                        academicYear.id
                    ]
                );


            return response(
                200,
                {
                    success: true,
                    classes: result.rows
                }
            );

        }


        /* =================================================
           GET SUBJECTS
        ================================================= */

        if (
            action === "getSubjects"
        ) {

            if (method !== "GET") {

                return response(
                    405,
                    {
                        success: false,
                        message:
                            "GET method required."
                    }
                );

            }


            const subjects =
                await getSubjectsForTeacher(
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


        /* =================================================
           GET ACADEMIC YEARS
        ================================================= */

        if (
            action === "getAcademicYears"
        ) {

            if (method !== "GET") {

                return response(
                    405,
                    {
                        success: false,
                        message:
                            "GET method required."
                    }
                );

            }


            const years =
                await getAcademicYears();


            return response(
                200,
                {
                    success: true,
                    years
                }
            );

        }


        /* =================================================
           GET TEACHING ASSIGNMENTS
        ================================================= */

        if (
            action === "getTeachingAssignments"
        ) {

            if (method !== "GET") {

                return response(
                    405,
                    {
                        success: false,
                        message:
                            "GET method required."
                    }
                );

            }


            const result =
                await pool.query(
                    `
                    SELECT
                        tcs.id,
                        tcs.teacher_id,

                        tcs.class_id,
                        c.class_name,

                        tcs.subject_id,
                        s.subject_name,

                        tcs.academic_year_id,
                        ay.year_name,

                        COUNT(l.id)::INTEGER
                            AS student_count

                    FROM teacher_class_subjects tcs

                    INNER JOIN classes c
                        ON c.id = tcs.class_id

                    INNER JOIN subjects s
                        ON s.id = tcs.subject_id

                    INNER JOIN academic_years ay
                        ON ay.id = tcs.academic_year_id

                    LEFT JOIN learners l
                        ON l.class_id = tcs.class_id
                        AND l.teacher_id = tcs.teacher_id
                        AND l.academic_year_id =
                            tcs.academic_year_id

                    WHERE tcs.teacher_id = $1

                    GROUP BY
                        tcs.id,
                        tcs.teacher_id,
                        tcs.class_id,
                        c.class_name,
                        tcs.subject_id,
                        s.subject_name,
                        tcs.academic_year_id,
                        ay.year_name,
                        ay.start_date

                    ORDER BY
                        ay.start_date DESC NULLS LAST,
                        c.class_name ASC,
                        s.subject_name ASC
                    `,
                    [teacherId]
                );


            return response(
                200,
                {
                    success: true,
                    assignments: result.rows
                }
            );

        }


        /* =================================================
           ADD TEACHING ASSIGNMENT
        ================================================= */

        if (
            action === "addTeachingAssignment"
        ) {

            if (method !== "POST") {

                return response(
                    405,
                    {
                        success: false,
                        message:
                            "POST method required."
                    }
                );

            }


            const classId =
                Number(body.class_id);


            const subjectId =
                Number(body.subject_id);


            const academicYearId =
                Number(body.academic_year_id);


            if (!classId) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Class is required."
                    }
                );

            }


            if (!subjectId) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Subject is required."
                    }
                );

            }


            if (!academicYearId) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Academic year is required."
                    }
                );

            }


            /* ---------------------------------------------
               CHECK CLASS OWNERSHIP
            --------------------------------------------- */

            const classCheck =
                await pool.query(
                    `
                    SELECT id
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


            if (!classCheck.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Class not found."
                    }
                );

            }


            /* ---------------------------------------------
               CHECK SUBJECT OWNERSHIP
            --------------------------------------------- */

            const subjectCheck =
                await pool.query(
                    `
                    SELECT id
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


            if (!subjectCheck.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Subject not found."
                    }
                );

            }


            /* ---------------------------------------------
               CHECK ACADEMIC YEAR
            --------------------------------------------- */

            const yearCheck =
                await pool.query(
                    `
                    SELECT id
                    FROM academic_years
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        academicYearId
                    ]
                );


            if (!yearCheck.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Academic year not found."
                    }
                );

            }


            /* ---------------------------------------------
               CHECK DUPLICATE
            --------------------------------------------- */

            const duplicate =
                await pool.query(
                    `
                    SELECT id
                    FROM teacher_class_subjects

                    WHERE teacher_id = $1
                      AND class_id = $2
                      AND subject_id = $3
                      AND academic_year_id = $4

                    LIMIT 1
                    `,
                    [
                        teacherId,
                        classId,
                        subjectId,
                        academicYearId
                    ]
                );


            if (duplicate.rows.length) {

                return response(
                    409,
                    {
                        success: false,
                        message:
                            "This subject is already assigned to this class for this academic year."
                    }
                );

            }


            const result =
                await pool.query(
                    `
                    INSERT INTO teacher_class_subjects (
                        teacher_id,
                        class_id,
                        subject_id,
                        academic_year_id
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4
                    )

                    RETURNING *
                    `,
                    [
                        teacherId,
                        classId,
                        subjectId,
                        academicYearId
                    ]
                );


            return response(
                201,
                {
                    success: true,
                    message:
                        "Teaching assignment added successfully.",
                    assignment:
                        result.rows[0]
                }
            );

        }


        /* =================================================
           UPDATE TEACHING ASSIGNMENT
        ================================================= */

        if (
            action === "updateTeachingAssignment"
        ) {

            if (method !== "POST") {

                return response(
                    405,
                    {
                        success: false,
                        message:
                            "POST method required."
                    }
                );

            }


            const id =
                Number(body.id);


            const classId =
                Number(body.class_id);


            const subjectId =
                Number(body.subject_id);


            const academicYearId =
                Number(body.academic_year_id);


            if (!id) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Assignment ID is required."
                    }
                );

            }


            if (!classId) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Class is required."
                    }
                );

            }


            if (!subjectId) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Subject is required."
                    }
                );

            }


            if (!academicYearId) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Academic year is required."
                    }
                );

            }


            /* ---------------------------------------------
               CHECK CLASS
            --------------------------------------------- */

            const classCheck =
                await pool.query(
                    `
                    SELECT id
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


            if (!classCheck.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Class not found."
                    }
                );

            }


            /* ---------------------------------------------
               CHECK SUBJECT
            --------------------------------------------- */

            const subjectCheck =
                await pool.query(
                    `
                    SELECT id
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


            if (!subjectCheck.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Subject not found."
                    }
                );

            }


            /* ---------------------------------------------
               CHECK YEAR
            --------------------------------------------- */

            const yearCheck =
                await pool.query(
                    `
                    SELECT id
                    FROM academic_years
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [
                        academicYearId
                    ]
                );


            if (!yearCheck.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Academic year not found."
                    }
                );

            }


            /* ---------------------------------------------
               CHECK DUPLICATE
            --------------------------------------------- */

            const duplicate =
                await pool.query(
                    `
                    SELECT id
                    FROM teacher_class_subjects

                    WHERE teacher_id = $1
                      AND class_id = $2
                      AND subject_id = $3
                      AND academic_year_id = $4
                      AND id <> $5

                    LIMIT 1
                    `,
                    [
                        teacherId,
                        classId,
                        subjectId,
                        academicYearId,
                        id
                    ]
                );


            if (duplicate.rows.length) {

                return response(
                    409,
                    {
                        success: false,
                        message:
                            "This subject is already assigned to this class for this academic year."
                    }
                );

            }


            const result =
                await pool.query(
                    `
                    UPDATE teacher_class_subjects

                    SET
                        class_id = $1,
                        subject_id = $2,
                        academic_year_id = $3

                    WHERE id = $4
                      AND teacher_id = $5

                    RETURNING *
                    `,
                    [
                        classId,
                        subjectId,
                        academicYearId,
                        id,
                        teacherId
                    ]
                );


            if (!result.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Teaching assignment not found."
                    }
                );

            }


            return response(
                200,
                {
                    success: true,
                    message:
                        "Teaching assignment updated successfully.",
                    assignment:
                        result.rows[0]
                }
            );

        }


        /* =================================================
           DELETE TEACHING ASSIGNMENT
        ================================================= */

        if (
            action === "deleteTeachingAssignment"
        ) {

            if (method !== "POST") {

                return response(
                    405,
                    {
                        success: false,
                        message:
                            "POST method required."
                    }
                );

            }


            const id =
                Number(body.id);


            if (!id) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Assignment ID is required."
                    }
                );

            }


            const result =
                await pool.query(
                    `
                    DELETE FROM teacher_class_subjects

                    WHERE id = $1
                      AND teacher_id = $2

                    RETURNING id
                    `,
                    [
                        id,
                        teacherId
                    ]
                );


            if (!result.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Teaching assignment not found."
                    }
                );

            }


            return response(
                200,
                {
                    success: true,
                    message:
                        "Teaching assignment deleted successfully."
                }
            );

        }


        /* =================================================
           ADD CLASS
        ================================================= */

        if (
            action === "addClass"
        ) {

            if (method !== "POST") {

                return response(
                    405,
                    {
                        success: false,
                        message:
                            "POST method required."
                    }
                );

            }


            const className =
                String(
                    body.class_name || ""
                )
                .trim();


            if (!className) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Class name is required."
                    }
                );

            }


            const duplicate =
                await pool.query(
                    `
                    SELECT id
                    FROM classes

                    WHERE teacher_id = $1

                      AND LOWER(TRIM(class_name))
                          = LOWER(TRIM($2))

                    LIMIT 1
                    `,
                    [
                        teacherId,
                        className
                    ]
                );


            if (duplicate.rows.length) {

                return response(
                    409,
                    {
                        success: false,
                        message:
                            "You already have a class with this name."
                    }
                );

            }


            const result =
                await pool.query(
                    `
                    INSERT INTO classes (
                        teacher_id,
                        class_name
                    )

                    VALUES ($1, $2)

                    RETURNING
                        id,
                        class_name,
                        created_at
                    `,
                    [
                        teacherId,
                        className
                    ]
                );


            return response(
                201,
                {
                    success: true,
                    message:
                        "Class added successfully.",
                    class:
                        result.rows[0]
                }
            );

        }


        /* =================================================
           UPDATE CLASS
        ================================================= */

        if (
            action === "updateClass"
        ) {

            if (method !== "POST") {

                return response(
                    405,
                    {
                        success: false,
                        message:
                            "POST method required."
                    }
                );

            }


            const id =
                Number(body.id);


            const className =
                String(
                    body.class_name || ""
                )
                .trim();


            if (!id) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Class ID is required."
                    }
                );

            }


            if (!className) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Class name is required."
                    }
                );

            }


            const duplicate =
                await pool.query(
                    `
                    SELECT id
                    FROM classes

                    WHERE teacher_id = $1

                      AND LOWER(TRIM(class_name))
                          = LOWER(TRIM($2))

                      AND id <> $3

                    LIMIT 1
                    `,
                    [
                        teacherId,
                        className,
                        id
                    ]
                );


            if (duplicate.rows.length) {

                return response(
                    409,
                    {
                        success: false,
                        message:
                            "You already have another class with this name."
                    }
                );

            }


            const result =
                await pool.query(
                    `
                    UPDATE classes

                    SET class_name = $1

                    WHERE id = $2
                      AND teacher_id = $3

                    RETURNING
                        id,
                        class_name,
                        created_at
                    `,
                    [
                        className,
                        id,
                        teacherId
                    ]
                );


            if (!result.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Class not found."
                    }
                );

            }


            return response(
                200,
                {
                    success: true,
                    message:
                        "Class updated successfully.",
                    class:
                        result.rows[0]
                }
            );

        }


        /* =================================================
           DELETE CLASS
        ================================================= */

        if (
            action === "deleteClass"
        ) {

            if (method !== "POST") {

                return response(
                    405,
                    {
                        success: false,
                        message:
                            "POST method required."
                    }
                );

            }


            const id =
                Number(body.id);


            if (!id) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Class ID is required."
                    }
                );

            }


            const classCheck =
                await pool.query(
                    `
                    SELECT id
                    FROM classes

                    WHERE id = $1
                      AND teacher_id = $2

                    LIMIT 1
                    `,
                    [
                        id,
                        teacherId
                    ]
                );


            if (!classCheck.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Class not found."
                    }
                );

            }


            const client =
                await pool.connect();


            try {

                await client.query(
                    "BEGIN"
                );


                await client.query(
                    `
                    DELETE FROM marks

                    WHERE teacher_id = $1
                      AND class_id = $2
                    `,
                    [
                        teacherId,
                        id
                    ]
                );


                await client.query(
                    `
                    DELETE FROM subject_tests

                    WHERE teacher_id = $1
                      AND class_id = $2
                    `,
                    [
                        teacherId,
                        id
                    ]
                );


                await client.query(
                    `
                    DELETE FROM grading_settings

                    WHERE teacher_id = $1
                      AND class_id = $2
                    `,
                    [
                        teacherId,
                        id
                    ]
                );


                /*
                    Remove teaching assignments
                    for this class first.
                */

                await client.query(
                    `
                    DELETE FROM teacher_class_subjects

                    WHERE teacher_id = $1
                      AND class_id = $2
                    `,
                    [
                        teacherId,
                        id
                    ]
                );


                /*
                    Learners are deleted by
                    ON DELETE CASCADE.
                */

                await client.query(
                    `
                    DELETE FROM classes

                    WHERE id = $1
                      AND teacher_id = $2
                    `,
                    [
                        id,
                        teacherId
                    ]
                );


                await client.query(
                    "COMMIT"
                );


            } catch (error) {

                await client.query(
                    "ROLLBACK"
                );

                throw error;

            } finally {

                client.release();

            }


            return response(
                200,
                {
                    success: true,
                    message:
                        "Class deleted successfully."
                }
            );

        }


        /* =================================================
           GET STUDENTS
        ================================================= */

        if (
            action === "getStudents"
        ) {

            const classId =
                Number(
                    params.class_id
                );


            if (!classId) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Class ID is required."
                    }
                );

            }


            const classCheck =
                await pool.query(
                    `
                    SELECT id
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


            if (!classCheck.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Class not found."
                    }
                );

            }


            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        full_name,
                        gender,
                        class_id,
                        academic_year_id,
                        created_at

                    FROM learners

                    WHERE teacher_id = $1
                      AND class_id = $2
                      AND academic_year_id = $3

                    ORDER BY
                        full_name ASC
                    `,
                    [
                        teacherId,
                        classId,
                        academicYear.id
                    ]
                );


            return response(
                200,
                {
                    success: true,
                    students:
                        result.rows
                }
            );

        }


        /* =================================================
           ADD STUDENT
        ================================================= */

        if (
            action === "addStudent"
        ) {

            if (method !== "POST") {

                return response(
                    405,
                    {
                        success: false,
                        message:
                            "POST method required."
                    }
                );

            }


            const fullName =
                String(
                    body.full_name || ""
                )
                .trim();


            const gender =
                String(
                    body.gender || ""
                )
                .trim();


            const classId =
                Number(
                    body.class_id
                );


            if (!fullName) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Student name is required."
                    }
                );

            }


            if (!gender) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Gender is required."
                    }
                );

            }


            if (!classId) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Class ID is required."
                    }
                );

            }


            const classCheck =
                await pool.query(
                    `
                    SELECT id
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


            if (!classCheck.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Class not found."
                    }
                );

            }


            const result =
                await pool.query(
                    `
                    INSERT INTO learners (
                        teacher_id,
                        full_name,
                        gender,
                        class_id,
                        academic_year_id
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5
                    )

                    RETURNING
                        id,
                        full_name,
                        gender,
                        class_id,
                        academic_year_id,
                        created_at
                    `,
                    [
                        teacherId,
                        fullName,
                        gender,
                        classId,
                        academicYear.id
                    ]
                );


            return response(
                201,
                {
                    success: true,
                    message:
                        "Student added successfully.",
                    student:
                        result.rows[0]
                }
            );

        }


        /* =================================================
           UPDATE STUDENT
        ================================================= */

        if (
            action === "updateStudent"
        ) {

            if (method !== "POST") {

                return response(
                    405,
                    {
                        success: false,
                        message:
                            "POST method required."
                    }
                );

            }


            const id =
                Number(body.id);


            const fullName =
                String(
                    body.full_name || ""
                )
                .trim();


            const gender =
                String(
                    body.gender || ""
                )
                .trim();


            const classId =
                Number(
                    body.class_id
                );


            if (!id) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Student ID is required."
                    }
                );

            }


            if (!fullName) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Student name is required."
                    }
                );

            }


            if (!gender) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Gender is required."
                    }
                );

            }


            if (!classId) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Class ID is required."
                    }
                );

            }


            const classCheck =
                await pool.query(
                    `
                    SELECT id
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


            if (!classCheck.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Class not found."
                    }
                );

            }


            const result =
                await pool.query(
                    `
                    UPDATE learners

                    SET
                        full_name = $1,
                        gender = $2,
                        class_id = $3

                    WHERE id = $4
                      AND teacher_id = $5
                      AND academic_year_id = $6

                    RETURNING
                        id,
                        full_name,
                        gender,
                        class_id,
                        academic_year_id,
                        created_at
                    `,
                    [
                        fullName,
                        gender,
                        classId,
                        id,
                        teacherId,
                        academicYear.id
                    ]
                );


            if (!result.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Student not found."
                    }
                );

            }


            return response(
                200,
                {
                    success: true,
                    message:
                        "Student updated successfully.",
                    student:
                        result.rows[0]
                }
            );

        }


        /* =================================================
           DELETE STUDENT
        ================================================= */

        if (
            action === "deleteStudent"
        ) {

            if (method !== "POST") {

                return response(
                    405,
                    {
                        success: false,
                        message:
                            "POST method required."
                    }
                );

            }


            const id =
                Number(body.id);


            if (!id) {

                return response(
                    400,
                    {
                        success: false,
                        message:
                            "Student ID is required."
                    }
                );

            }


            const studentCheck =
                await pool.query(
                    `
                    SELECT id
                    FROM learners

                    WHERE id = $1
                      AND teacher_id = $2
                      AND academic_year_id = $3

                    LIMIT 1
                    `,
                    [
                        id,
                        teacherId,
                        academicYear.id
                    ]
                );


            if (!studentCheck.rows.length) {

                return response(
                    404,
                    {
                        success: false,
                        message:
                            "Student not found."
                    }
                );

            }


            const client =
                await pool.connect();


            try {

                await client.query(
                    "BEGIN"
                );


                await client.query(
                    `
                    DELETE FROM marks

                    WHERE learner_id = $1
                      AND teacher_id = $2
                    `,
                    [
                        id,
                        teacherId
                    ]
                );


                await client.query(
                    `
                    DELETE FROM learners

                    WHERE id = $1
                      AND teacher_id = $2
                      AND academic_year_id = $3
                    `,
                    [
                        id,
                        teacherId,
                        academicYear.id
                    ]
                );


                await client.query(
                    "COMMIT"
                );


            } catch (error) {

                await client.query(
                    "ROLLBACK"
                );

                throw error;

            } finally {

                client.release();

            }


            return response(
                200,
                {
                    success: true,
                    message:
                        "Student deleted successfully."
                }
            );

        }


        /* =================================================
           INVALID ACTION
        ================================================= */

        return response(
            400,
            {
                success: false,
                message:
                    "Invalid action."
            }
        );


    } catch (error) {

        console.error(
            "Student Function Error:",
            error
        );


        return response(
            500,
            {
                success: false,
                message:
                    "Server error.",
                error:
                    error.message
            }
        );

    }

};
