import pkg from "pg";
const { Client } = pkg;

export async function handler(event) {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const data = JSON.parse(event.body);

        const {
            id,
            full_name,
            username,
            password,
            school,
            class_name,
            subject,
            role
        } = data;

        if (!id) {
            await client.end();
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "User ID is required" })
            };
        }

        // ================= UPDATE USERS TABLE =================
        let query = `
            UPDATE users
            SET full_name = $1,
                username = $2,
                school = $3,
                class_name = $4,
                subject = $5
        `;

        let params = [full_name, username, school, class_name, subject];

        if (password && password.trim() !== "") {
            query += `, password = $6 WHERE id = $7`;
            params.push(password, id);
        } else {
            query += ` WHERE id = $6`;
            params.push(id);
        }

        await client.query(query, params);

        // ================= UPDATE TEACHER SUBJECTS =================
        if (role === "teacher") {

            // first remove old record
            await client.query(
                `DELETE FROM teacher_subjects WHERE teacher_id = $1`,
                [id]
            );

            // insert updated record
            if (subject && class_name) {
                await client.query(
                    `INSERT INTO teacher_subjects(teacher_id, class_name, subject, school_name)
                     VALUES($1,$2,$3,$4)`,
                    [id, class_name, subject, school]
                );
            }
        }

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "User updated successfully"
            })
        };

    } catch (err) {
        await client.end();

        return {
            statusCode: 500,
            body: JSON.stringify({ message: err.message })
        };
    }
            }
