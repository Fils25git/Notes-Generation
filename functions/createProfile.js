import { Client } from "pg";

export async function handler(event, context) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method Not Allowed" })
        };
    }

    try {
        const body = JSON.parse(event.body);

        const {
            full_name,
            phone,
            whatsapp,
            current_school,
            current_province,
            current_district,
            current_sector,
            preferred_provinces,
            preferred_districts,
            preferred_sectors,
            position
        } = body;

        if (!full_name || !phone || !whatsapp || !current_school || !current_province || !current_district || !current_sector || !position) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing required fields or qualification" })
            };
        }

        const client = new Client({
            connectionString: process.env.NEON_DATABASE + "&uselibpqcompat=true&sslmode=require"
        });

        await client.connect();

        const insertProfileQuery = `
            INSERT INTO teacher_profiles (
                full_name,
                phone,
                whatsapp,
                current_school,
                current_province,
                current_district,
                current_sector,
                preferred_provinces,
                preferred_districts,
                preferred_sectors,
                position,
                created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
            RETURNING user_id
        `;

        const values = [
            full_name,
            phone,
            whatsapp,
            current_school,
            current_province,
            current_district,
            current_sector,
            preferred_provinces, // pass as array
            preferred_districts,
            preferred_sectors,
            position
        ];

        const result = await client.query(insertProfileQuery, values);

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Profile created successfully",
                profileId: result.rows[0].user_id
            })
        };

    } catch (error) {
        console.error("Error creating profile:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error", error: error.message })
        };
    }
}
