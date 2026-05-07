import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
    try {
        const data = JSON.parse(event.body);

        const {
            student_name,
            school_name,
            class_name
        } = data;

        if (!student_name || !school_name || !class_name) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Student name, school and class are required"
                })
            };
        }

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        // CHECK DUPLICATE
        const existing = await client.query(
            `SELECT id FROM students 
             WHERE student_name = $1 
             AND school_name = $2 
             AND class_name = $3`,
            [student_name, school_name, class_name]
        );

        if (existing.rows.length > 0) {
            await client.end();
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Student already exists in this class"
                })
            };
        }

        // INSERT STUDENT (marks stay default 0)
        await client.query(
            `INSERT INTO students(
                student_name,
                school_name,
                class_name
            )
            VALUES($1,$2,$3)`,
            [student_name, school_name, class_name]
        );

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Student registered successfully"
            })
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: err.message
            })
        };
    }
          }
