
import { pool } from "./db.js";

/*
    Fila Assistant - Academic System

    Academic calendar:

    1 September 2026  -> 2026-2027 Term 1
    1 January 2027    -> 2026-2027 Term 2
    10 April 2027     -> 2026-2027 Term 3
    1 September 2027  -> 2027-2028 Term 1

    The same pattern continues every academic year.
*/

export const handler = async (event) => {
    try {
        const action = event.queryStringParameters?.action;

        // =========================================================
        // HELPER: Get today's date in Rwanda
        // =========================================================
        const getRwandaDate = () => {
            return new Intl.DateTimeFormat("en-CA", {
                timeZone: "Africa/Kigali",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }).format(new Date());
        };

        // =========================================================
        // HELPER: Automatically create academic year + terms
        // =========================================================
        const prepareAcademicSystem = async () => {

            const today = getRwandaDate();

            const todayDate = new Date(`${today}T00:00:00`);

            const year = todayDate.getFullYear();
            const month = todayDate.getMonth() + 1;
            const day = todayDate.getDate();

            /*
                Academic year starts on 1 September.

                Example:
                September 2026 -> 2026-2027
                August 2027    -> 2026-2027
            */

            let startYear;

            if (month >= 9) {
                startYear = year;
            } else {
                startYear = year - 1;
            }

            const endYear = startYear + 1;

            const yearName = `${startYear}-${endYear}`;

            const yearStart = `${startYear}-09-01`;
            const yearEnd = `${endYear}-08-31`;

            // -----------------------------------------------------
            // Determine current term
            // -----------------------------------------------------

            let termNumber;
            let termStart;
            let termEnd;

            if (month >= 9) {

                // September - December
                termNumber = 1;
                termStart = `${startYear}-09-01`;
                termEnd = `${startYear}-12-31`;

            } else if (month === 1 || month === 2 || month === 3) {

                // January - March
                termNumber = 2;
                termStart = `${endYear}-01-01`;
                termEnd = `${endYear}-04-09`;

            } else if (month === 4 && day < 10) {

                // 1 April - 9 April
                termNumber = 2;
                termStart = `${endYear}-01-01`;
                termEnd = `${endYear}-04-09`;

            } else {

                // 10 April - 31 August
                termNumber = 3;
                termStart = `${endYear}-04-10`;
                termEnd = `${endYear}-08-31`;
            }

            // -----------------------------------------------------
            // Create academic year if it does not exist
            // -----------------------------------------------------

            const yearResult = await pool.query(
                `
                INSERT INTO academic_years
                    (
                        year_name,
                        start_date,
                        end_date,
                        is_current
                    )
                VALUES
                    ($1, $2, $3, false)
                ON CONFLICT (year_name)
                DO UPDATE SET
                    start_date = EXCLUDED.start_date,
                    end_date = EXCLUDED.end_date
                RETURNING *
                `,
                [
                    yearName,
                    yearStart,
                    yearEnd
                ]
            );

            const academicYear = yearResult.rows[0];

            // -----------------------------------------------------
            // Create Term 1
            // -----------------------------------------------------

            await pool.query(
                `
                INSERT INTO terms
                    (
                        academic_year_id,
                        term_name,
                        term_number,
                        start_date,
                        end_date,
                        is_current
                    )
                VALUES
                    (
                        $1,
                        'Term 1',
                        1,
                        $2,
                        $3,
                        false
                    )
                ON CONFLICT (academic_year_id, term_number) DO NOTHING
                `,
                [
                    academicYear.id,
                    `${startYear}-09-01`,
                    `${startYear}-12-31`
                ]
            );

            // -----------------------------------------------------
            // Create Term 2
            // -----------------------------------------------------

            await pool.query(
                `
                INSERT INTO terms
                    (
                        academic_year_id,
                        term_name,
                        term_number,
                        start_date,
                        end_date,
                        is_current
                    )
                VALUES
                    (
                        $1,
                        'Term 2',
                        2,
                        $2,
                        $3,
                        false
                    )
                ON CONFLICT (academic_year_id, term_number) DO NOTHING
                `,
                [
                    academicYear.id,
                    `${endYear}-01-01`,
                    `${endYear}-04-09`
                ]
            );

            // -----------------------------------------------------
            // Create Term 3
            // -----------------------------------------------------

            await pool.query(
                `
                INSERT INTO terms
                    (
                        academic_year_id,
                        term_name,
                        term_number,
                        start_date,
                        end_date,
                        is_current
                    )
                VALUES
                    (
                        $1,
                        'Term 3',
                        3,
                        $2,
                        $3,
                        false
                    )
                ON CONFLICT (academic_year_id, term_number) DO NOTHING
                `,
                [
                    academicYear.id,
                    `${endYear}-04-10`,
                    `${endYear}-08-31`
                ]
            );

            // -----------------------------------------------------
            // Automatically update the GLOBAL current year
            // -----------------------------------------------------

            await pool.query(`
                UPDATE academic_years
                SET is_current = false
                WHERE id <> $1
            `, [academicYear.id]);

            await pool.query(
                `
                UPDATE academic_years
                SET is_current = true
                WHERE id = $1
                `,
                [academicYear.id]
            );

            // -----------------------------------------------------
            // Automatically update the GLOBAL current term
            // -----------------------------------------------------

            await pool.query(`
                UPDATE terms
                SET is_current = false
                WHERE academic_year_id = $1
            `, [academicYear.id]);

            await pool.query(
                `
                UPDATE terms
                SET is_current = true
                WHERE academic_year_id = $1
                AND term_number = $2
                `,
                [
                    academicYear.id,
                    termNumber
                ]
            );

            // Get the actual term record
            const termResult = await pool.query(
                `
                SELECT *
                FROM terms
                WHERE academic_year_id = $1
                AND term_number = $2
                LIMIT 1
                `,
                [
                    academicYear.id,
                    termNumber
                ]
            );

            return {
                year: academicYear,
                term: termResult.rows[0] || null
            };
        };

        // =========================================================
        // GET CURRENT ACADEMIC YEAR + TERM
        // =========================================================

        if (action === "getCurrent") {

            const current = await prepareAcademicSystem();

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    year: current.year,
                    term: current.term
                })
            };
        }

        // =========================================================
        // GET ALL ACADEMIC YEARS
        // =========================================================

        if (action === "getYears") {

            // Make sure the current academic year exists
            await prepareAcademicSystem();

            const result = await pool.query(`
                SELECT *
                FROM academic_years
                ORDER BY start_date DESC, id DESC
            `);

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    years: result.rows
                })
            };
        }

        // =========================================================
        // GET TERMS FOR ONE ACADEMIC YEAR
        // =========================================================

        if (action === "getTerms") {

            const academicYearId =
                Number(
                    event.queryStringParameters?.academic_year_id
                );

            if (!academicYearId) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message: "Academic year ID is required"
                    })
                };
            }

            const result = await pool.query(
                `
                SELECT *
                FROM terms
                WHERE academic_year_id = $1
                ORDER BY term_number
                `,
                [academicYearId]
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    terms: result.rows
                })
            };
        }

        // =========================================================
        // ADD ACADEMIC YEAR MANUALLY
        // =========================================================

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

            /*
                Expecting format like:

                2027-2028
            */

            const match = year_name.match(
                /^(\d{4})-(\d{4})$/
            );

            if (!match) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "Use the format YYYY-YYYY, for example 2027-2028"
                    })
                };
            }

            const startYear = Number(match[1]);
            const endYear = Number(match[2]);

            if (endYear !== startYear + 1) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "The academic year must cover two consecutive years"
                    })
                };
            }

            const yearStart = `${startYear}-09-01`;
            const yearEnd = `${endYear}-08-31`;

            // -----------------------------------------------------
            // Create year
            // -----------------------------------------------------

            const yearResult = await pool.query(
                `
                INSERT INTO academic_years
                    (
                        year_name,
                        start_date,
                        end_date,
                        is_current
                    )
                VALUES
                    ($1, $2, $3, false)
                ON CONFLICT (year_name)
                DO UPDATE SET
                    start_date = EXCLUDED.start_date,
                    end_date = EXCLUDED.end_date
                RETURNING *
                `,
                [
                    year_name,
                    yearStart,
                    yearEnd
                ]
            );

            const academicYear = yearResult.rows[0];

            // -----------------------------------------------------
            // Create all three terms
            // -----------------------------------------------------

            await pool.query(
                `
                INSERT INTO terms
                    (
                        academic_year_id,
                        term_name,
                        term_number,
                        start_date,
                        end_date,
                        is_current
                    )
                VALUES
                    ($1, 'Term 1', 1, $2, $3, false)
               ON CONFLICT (academic_year_id, term_number) DO NOTHING
                `,
                [
                    academicYear.id,
                    `${startYear}-09-01`,
                    `${startYear}-12-31`
                ]
            );

            await pool.query(
                `
                INSERT INTO terms
                    (
                        academic_year_id,
                        term_name,
                        term_number,
                        start_date,
                        end_date,
                        is_current
                    )
                VALUES
                    ($1, 'Term 2', 2, $2, $3, false)
               ON CONFLICT (academic_year_id, term_number) DO NOTHING
                `,
                [
                    academicYear.id,
                    `${endYear}-01-01`,
                    `${endYear}-04-09`
                ]
            );

            await pool.query(
                `
                INSERT INTO terms
                    (
                        academic_year_id,
                        term_name,
                        term_number,
                        start_date,
                        end_date,
                        is_current
                    )
                VALUES
                    ($1, 'Term 3', 3, $2, $3, false)
                ON CONFLICT (academic_year_id, term_number) DO NOTHING
                `,
                [
                    academicYear.id,
                    `${endYear}-04-10`,
                    `${endYear}-08-31`
                ]
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message:
                        `Academic year ${year_name} created successfully`,
                    year: academicYear
                })
            };
        }

        // =========================================================
        // MANUALLY ACTIVATE YEAR + TERM
        // =========================================================

        if (action === "setActive") {

            const body = JSON.parse(
                event.body || "{}"
            );

            const academicYearId =
                Number(body.academic_year_id);

            const termId =
                Number(body.term_id);

            if (!academicYearId || !termId) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "Academic year and term are required"
                    })
                };
            }

            // -----------------------------------------------------
            // Verify year
            // -----------------------------------------------------

            const yearResult = await pool.query(
                `
                SELECT *
                FROM academic_years
                WHERE id = $1
                `,
                [academicYearId]
            );

            if (!yearResult.rows.length) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({
                        success: false,
                        message: "Academic year not found"
                    })
                };
            }

            // -----------------------------------------------------
            // Verify term belongs to selected year
            // -----------------------------------------------------

            const termResult = await pool.query(
                `
                SELECT *
                FROM terms
                WHERE id = $1
                AND academic_year_id = $2
                `,
                [
                    termId,
                    academicYearId
                ]
            );

            if (!termResult.rows.length) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message:
                            "The selected term does not belong to this academic year"
                    })
                };
            }

            // -----------------------------------------------------
            // Set selected year active
            // -----------------------------------------------------

            await pool.query(`
                UPDATE academic_years
                SET is_current = false
            `);

            await pool.query(
                `
                UPDATE academic_years
                SET is_current = true
                WHERE id = $1
                `,
                [academicYearId]
            );

            // -----------------------------------------------------
            // Set selected term active
            // -----------------------------------------------------

            await pool.query(`
                UPDATE terms
                SET is_current = false
            `);

            await pool.query(
                `
                UPDATE terms
                SET is_current = true
                WHERE id = $1
                `,
                [termId]
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message:
                        "Academic year and term activated",
                    year: yearResult.rows[0],
                    term: termResult.rows[0]
                })
            };
        }

        // =========================================================
        // INVALID ACTION
        // =========================================================

        return {
            statusCode: 400,
            body: JSON.stringify({
                success: false,
                message: "Invalid action"
            })
        };

    } catch (error) {

        console.error(
            "Academic System Error:",
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
