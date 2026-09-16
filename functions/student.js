import { pool } from "./db.js";

export const handler = async (event) => {

    try {

        const action =
            event.queryStringParameters?.action;

        // =====================================================
        // GET TEACHER ID
        // =====================================================

        let teacherId;

        if (event.httpMethod === "GET") {

            teacherId = Number(
                event.queryStringParameters?.teacher_id
            );

        } else {

            const body =
                JSON.parse(event.body || "{}");

            teacherId = Number(
                body.teacher_id
            );
        }

        if (!teacherId) {

            return {
                statusCode: 401,
                body: JSON.stringify({
                    success: false,
                    message: "Teacher ID is required"
                })
            };

        }


        // =====================================================
        // CHECK TEACHER EXISTS
        // =====================================================

        const teacherRes = await pool.query(
            `
            SELECT id, name, role
            FROM users
            WHERE id = $1
            `,
            [teacherId]
        );

        if (!teacherRes.rows.length) {

            return {
                statusCode: 404,
                body: JSON.stringify({
                    success: false,
                    message: "Teacher not found"
                })
            };

        }


        // =====================================================
        // GET CURRENT ACADEMIC YEAR
        // =====================================================

        const yearRes = await pool.query(
            `
            SELECT *
            FROM academic_years
            WHERE is_current = true
            ORDER BY start_date DESC, id DESC
            LIMIT 1
            `
        );

        const currentYear =
            yearRes.rows[0] || null;


        if (!currentYear) {

            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message:
                        "No active academic year is available"
                })
            };

        }


        // =====================================================
        // GET CLASSES
        // =====================================================

        if (action === "getClasses") {

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        class_name,
                        teacher_id,
                        created_at
                    FROM classes
                    WHERE teacher_id = $1
                    ORDER BY id ASC
                    `,
                    [teacherId]
                );


            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    classes: result.rows
                })
            };

        }


        // =====================================================
        // GET STUDENTS
        // =====================================================

        if (action === "getStudents") {

            const classId =
                Number(
                    event.queryStringParameters?.class_id
                );


            // -------------------------------------------------
            // If class was supplied, make sure it belongs
            // to this teacher
            // -------------------------------------------------

            if (classId) {

                const classRes =
                    await pool.query(
                        `
                        SELECT id
                        FROM classes
                        WHERE id = $1
                        AND teacher_id = $2
                        `,
                        [
                            classId,
                            teacherId
                        ]
                    );


                if (!classRes.rows.length) {

                    return {
                        statusCode: 403,
                        body: JSON.stringify({
                            success: false,
                            message:
                                "You do not have access to this class"
                        })
                    };

                }

            }


            let result;


            // -------------------------------------------------
            // STUDENTS OF ONE CLASS
            // -------------------------------------------------

            if (classId) {

                result =
                    await pool.query(
                        `
                        SELECT
                            id,
                            full_name,
                            gender,
                            class_id,
                            academic_year_id,
                            teacher_id,
                            created_at
                        FROM learners
                        WHERE teacher_id = $1
                        AND class_id = $2
                        AND academic_year_id = $3
                        ORDER BY id ASC
                        `,
                        [
                            teacherId,
                            classId,
                            currentYear.id
                        ]
                    );

            }


            // -------------------------------------------------
            // ALL STUDENTS OF TEACHER
            // -------------------------------------------------

            else {

                result =
                    await pool.query(
                        `
                        SELECT
                            id,
                            full_name,
                            gender,
                            class_id,
                            academic_year_id,
                            teacher_id,
                            created_at
                        FROM learners
                        WHERE teacher_id = $1
                        AND academic_year_id = $2
                        ORDER BY id ASC
                        `,
                        [
                            teacherId,
                            currentYear.id
                        ]
                    );

            }


            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    students: result.rows
                })
            };

        }


        // =====================================================
        // ADD STUDENT
        // =====================================================

        if (action === "addStudent") {

            const body =
                JSON.parse(event.body || "{}");


            const fullName =
                String(
                    body.full_name || ""
                ).trim();


            const gender =
                String(
                    body.gender || ""
                ).trim();


            const classId =
                Number(
                    body.class_id
                );


            if (!fullName) {

                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "Student name is required"
                    })
                };

            }


            if (!gender) {

                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "Gender is required"
                    })
                };

            }


            if (!classId) {

                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "Class is required"
                    })
                };

            }


            // -------------------------------------------------
            // VERIFY CLASS BELONGS TO TEACHER
            // -------------------------------------------------

            const classRes =
                await pool.query(
                    `
                    SELECT id, class_name
                    FROM classes
                    WHERE id = $1
                    AND teacher_id = $2
                    `,
                    [
                        classId,
                        teacherId
                    ]
                );


            if (!classRes.rows.length) {

                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "You cannot add a student to this class"
                    })
                };

            }


            // -------------------------------------------------
            // INSERT STUDENT
            // -------------------------------------------------

            const result =
                await pool.query(
                    `
                    INSERT INTO learners
                    (
                        teacher_id,
                        full_name,
                        gender,
                        class_id,
                        academic_year_id
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5
                    )
                    RETURNING *
                    `,
                    [
                        teacherId,
                        fullName,
                        gender,
                        classId,
                        currentYear.id
                    ]
                );


            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message:
                        "Student added successfully",
                    learner:
                        result.rows[0]
                })
            };

        }


        // =====================================================
        // UPDATE STUDENT
        // =====================================================

        if (action === "updateStudent") {

            const body =
                JSON.parse(event.body || "{}");


            const id =
                Number(body.id);


            const fullName =
                String(
                    body.full_name || ""
                ).trim();


            const gender =
                String(
                    body.gender || ""
                ).trim();


            const classId =
                Number(
                    body.class_id
                );


            if (!id) {

                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "Student ID is required"
                    })
                };

            }


            if (!fullName) {

                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "Student name is required"
                    })
                };

            }


            if (!gender) {

                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "Gender is required"
                    })
                };

            }


            if (!classId) {

                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "Class is required"
                    })
                };

            }


            // -------------------------------------------------
            // VERIFY NEW CLASS BELONGS TO TEACHER
            // -------------------------------------------------

            const classRes =
                await pool.query(
                    `
                    SELECT id
                    FROM classes
                    WHERE id = $1
                    AND teacher_id = $2
                    `,
                    [
                        classId,
                        teacherId
                    ]
                );


            if (!classRes.rows.length) {

                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "You cannot move the student to this class"
                    })
                };

            }


            // -------------------------------------------------
            // UPDATE ONLY TEACHER'S STUDENT
            // -------------------------------------------------

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
                    RETURNING *
                    `,
                    [
                        fullName,
                        gender,
                        classId,
                        id,
                        teacherId,
                        currentYear.id
                    ]
                );


            if (!result.rows.length) {

                return {
                    statusCode: 404,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "Student not found or you do not have access"
                    })
                };

            }


            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message:
                        "Student updated successfully",
                    learner:
                        result.rows[0]
                })
            };

        }


        // =====================================================
        // DELETE STUDENT
        // =====================================================

        if (action === "deleteStudent") {

            const body =
                JSON.parse(event.body || "{}");


            const id =
                Number(body.id);


            if (!id) {

                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "Student ID is required"
                    })
                };

            }


            // -------------------------------------------------
            // CHECK STUDENT BELONGS TO TEACHER
            // -------------------------------------------------

            const learnerRes =
                await pool.query(
                    `
                    SELECT id
                    FROM learners
                    WHERE id = $1
                    AND teacher_id = $2
                    `,
                    [
                        id,
                        teacherId
                    ]
                );


            if (!learnerRes.rows.length) {

                return {
                    statusCode: 404,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "Student not found or you do not have access"
                    })
                };

            }


            // -------------------------------------------------
            // REMOVE LINKED MARKS
            // -------------------------------------------------

            await pool.query(
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


            // -------------------------------------------------
            // DELETE STUDENT
            // -------------------------------------------------

            const result =
                await pool.query(
                    `
                    DELETE FROM learners
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

                return {
                    statusCode: 404,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "Student could not be deleted"
                    })
                };

            }


            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message:
                        "Student deleted successfully"
                })
            };

        }


        // =====================================================
        // INVALID ACTION
        // =====================================================

        return {
            statusCode: 400,
            body: JSON.stringify({
                success: false,
                message:
                    "Invalid student action"
            })
        };


    } catch (error) {

        console.error(
            "Student System Error:",
            error
        );


        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };

    }

};
