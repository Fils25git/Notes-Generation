import { pool } from "./db.js";

export const handler = async (event) => {
    try {
        const action = event.queryStringParameters?.action;

        // --------------------------------
        // GET CURRENT ACADEMIC YEAR + TERM
        // --------------------------------
        if (action === "getCurrent") {

            const year = await pool.query(`
                SELECT *
                FROM academic_years
                WHERE is_current = true
                ORDER BY id DESC
                LIMIT 1
            `);

            const term = await pool.query(`
                SELECT *
                FROM terms
                ORDER BY term_number DESC
                LIMIT 1
            `);

            return {
                statusCode: 200,
                body: JSON.stringify({
                    year: year.rows[0] || null,
                    term: term.rows[0] || null
                })
            };
        }

        // --------------------------------
        // GET ALL ACADEMIC YEARS
        // --------------------------------
        if (action === "getYears") {

            const result = await pool.query(`
                SELECT *
                FROM academic_years
                ORDER BY id DESC
            `);

            return {
                statusCode: 200,
                body: JSON.stringify(result.rows)
            };
        }

        // --------------------------------
        // GET ALL TERMS
        // --------------------------------
        if (action === "getTerms") {

            const result = await pool.query(`
                SELECT *
                FROM terms
                ORDER BY term_number
            `);

            return {
                statusCode: 200,
                body: JSON.stringify(result.rows)
            };
        }

        // --------------------------------
        // ADD ACADEMIC YEAR
        // --------------------------------
        if (action === "addYear") {

            const { year_name } = JSON.parse(
                event.body || "{}"
            );

            if (!year_name) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message: "Academic year is required"
                    })
                };
            }

            const result = await pool.query(
                `
                INSERT INTO academic_years
                    (year_name, is_current)
                VALUES
                    ($1, false)
                RETURNING *
                `,
                [year_name]
            );

            return {
                statusCode: 200,
                body: JSON.stringify(result.rows[0])
            };
        }

        // --------------------------------
        // SET ACTIVE ACADEMIC YEAR
        // --------------------------------
        if (action === "setActive") {

            const { id } = JSON.parse(
                event.body || "{}"
            );

            if (!id) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message: "Academic year ID is required"
                    })
                };
            }

            // Make all years inactive
            await pool.query(`
                UPDATE academic_years
                SET is_current = false
            `);

            // Make selected year active
            await pool.query(
                `
                UPDATE academic_years
                SET is_current = true
                WHERE id = $1
                `,
                [id]
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: "Academic year updated"
                })
            };
        }

        // --------------------------------
        // INVALID ACTION
        // --------------------------------
        return {
            statusCode: 400,
            body: JSON.stringify({
                success: false,
                message: "Invalid action"
            })
        };

    } catch (error) {

        console.error("Academic Error:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};
