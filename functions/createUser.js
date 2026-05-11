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
            full_name,
            username,
            password,
            role,
            school,
            class_name,
            subjects   // ✅ CHANGED HERE
        } = data;

        // ================= CHECK USER =================
        const existing = await client.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if(existing.rows.length > 0){
            await client.end();
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Username already exists" })
            };
        }

        // ================= INSERT USER =================
        const userResult = await client.query(
            `INSERT INTO users(full_name, username, password, role, school, class_name, subject)
             VALUES($1,$2,$3,$4,$5,$6,$7)
             RETURNING id`,
            [
                full_name,
                username,
                password,
                role,
                school || null,
                class_name || null,
                subjects ? JSON.stringify(subjects) : null   // ✅ FIXED
            ]
        );

        const teacherId = userResult.rows[0].id;

        // ================= INSERT TEACHER SUBJECT =================
        if(role === "teacher" && subjects && subjects.length > 0){

            for(const subject of subjects){

                await client.query(
                    `INSERT INTO teacher_subjects(teacher_id, class_name, subject, school_name)
                     VALUES($1,$2,$3,$4)`,
                    [
                        teacherId,
                        class_name,
                        subject,
                        school
                    ]
                );
            }
        }

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: role + " created successfully"
            })
        };

    } catch(err){
        await client.end();

        return {
            statusCode: 500,
            body: JSON.stringify({ message: err.message })
        };
    }
}
