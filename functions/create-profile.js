import { Client } from "pg";

export async function handler(event, context) {
    // Only allow POST
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
            positions
        } = body;

        // Basic server-side validation
        if (!full_name || !phone || !whatsapp || !current_school || !current_province || !current_district || !current_sector || !positions?.length) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing required fields" })
            };
        }

        // Connect to PostgreSQL using Neon connection string from Netlify env
        const client = new Client({
            connectionString: process.env.NEON_DATABASE,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        // Insert user profile
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
                positions,
                created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
            RETURNING id
        `;

        const values = [
            full_name,
            phone,
            whatsapp,
            current_school,
            current_province,
            current_district,
            current_sector,
            JSON.stringify(preferred_provinces),
            JSON.stringify(preferred_districts),
            JSON.stringify(preferred_sectors),
            positions
        ];

        const result = await client.query(insertProfileQuery, values);

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Profile created successfully",
                profileId: result.rows[0].id
            })
        };

    } catch (error) {
        console.error("Error creating profile:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" })
        };
    }
}
