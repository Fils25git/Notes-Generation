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
                    message: "Teacher ID is required."
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
                    message: "Teacher not found."
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

                    WHERE c.teacher_id = $1

                    GROUP BY
                        c.id,
                        c.class_name,
                        c.created_at

                    ORDER BY
                        c.class_name ASC
                    `,
                    [teacherId]
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


            /*
                Check duplicate class
                for this teacher.
            */

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
                    class: result.rows[0]
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


            /*
                Make sure another class
                owned by this teacher does
                not already use the name.
            */

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
                    class: result.rows[0]
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


            /*
                Verify ownership.
            */

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


            /*
                Delete inside a transaction.

                Learners have ON DELETE CASCADE
                for class_id.

                Marks reference learners with
                ON DELETE CASCADE.

                Subject tests do NOT currently
                have class_id ON DELETE CASCADE,
                so remove the related tests first.
            */

            const client =
                await pool.connect();


            try {

                await client.query(
                    "BEGIN"
                );


                /*
                    Delete marks connected
                    to tests belonging to
                    this class/teacher.
                */

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


                /*
                    Delete subject tests
                    belonging to this class.
                */

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


                /*
                    Delete grading settings
                    for this class.
                */

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
                    Delete the class.

                    Learners belonging to it
                    are removed automatically
                    because class_id uses
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


            /*
                Make sure the class
                belongs to this teacher.
            */

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
                    students: result.rows
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


            /*
                Check class ownership.
            */

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
                    student: result.rows[0]
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


            /*
                Check new class ownership.
            */

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


            /*
                Update only the student's
                current academic-year record
                belonging to this teacher.
            */

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
                    student: result.rows[0]
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


            /*
                Verify ownership and
                current academic year.
            */

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


                /*
                    Delete marks belonging
                    to this teacher/student.
                */

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


                /*
                    Delete learner.
                */

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
