import db from "./db.js";

export const handler = async (event) => {
    try {
        const {
            id,
            full_name,
            gender,
            class_id
        } = JSON.parse(event.body || "{}");

        await db.query(
            `
            UPDATE learners
            SET
                full_name = $1,
                gender = $2,
                class_id = $3
            WHERE id = $4
            `,
            [
                full_name,
                gender,
                class_id,
                id
            ]
        );

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Student updated"
            })
        };

    } catch (error) {
        console.error("Update learner error:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};
