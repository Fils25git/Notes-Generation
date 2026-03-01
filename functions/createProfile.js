import { Client } from "pg";
import jwt from "jsonwebtoken";

export async function handler(event, context) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method Not Allowed" })
        };
    }

    try {
        // --------------------- VERIFY TOKEN ---------------------
        const authHeader = event.headers.authorization || "";
        if (!authHeader.startsWith("Bearer ")) {
            return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
        }

        const token = authHeader.split(" ")[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET); // your JWT secret
        } catch (err) {
            return { statusCode: 401, body: JSON.stringify({ message: "Invalid token" }) };
        }

        const authUserId = decoded.userId; // this will be saved in auth_user_id column

        // --------------------- PARSE FORM DATA ---------------------
        const body = JSON.parse(event.body);

        const {
            full_name,
            phone,
            whatsapp,
            email,
            current_school,
            current_province,
            current_district,
            current_sector,
            preferred_provinces,
            preferred_districts,
            preferred_sectors,
            position
        } = body;

        if (!full_name || !phone || !whatsapp || !email || !current_school || !current_province || !current_district || !current_sector || !position) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing required fields or qualification" })
            };
        }

        // --------------------- CONNECT TO DB ---------------------
        const client = new Client({
            connectionString: process.env.NEON_DATABASE + "&uselibpqcompat=true&sslmode=require"
        });
        await client.connect();

        // --------------------- UPSERT PROFILE ---------------------
        const existingProfile = await client.query(
            "SELECT * FROM teacher_profiles WHERE auth_user_id = $1",
            [authUserId]
        );

        if (existingProfile.rows.length > 0) {
            // UPDATE existing profile
            await client.query(
                `UPDATE teacher_profiles
                 SET full_name=$1, phone=$2, whatsapp=$3, email=$4,
                     current_school=$5, current_province=$6, current_district=$7,
                     current_sector=$8, preferred_provinces=$9, preferred_districts=$10,
                     preferred_sectors=$11, position=$12, updated_at=NOW()
                 WHERE auth_user_id=$13`,
                [
                    full_name, phone, whatsapp, email, current_school, current_province,
                    current_district, current_sector, preferred_provinces,
                    preferred_districts, preferred_sectors, position, authUserId
                ]
            );
        } else {
            // INSERT new profile
            await client.query(
                `INSERT INTO teacher_profiles (
                    full_name, phone, whatsapp, email, current_school, current_province,
                    current_district, current_sector, preferred_provinces, preferred_districts,
                    preferred_sectors, position, auth_user_id, created_at
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())`,
                [
                    full_name, phone, whatsapp, email, current_school, current_province,
                    current_district, current_sector, preferred_provinces,
                    preferred_districts, preferred_sectors, position, authUserId
                ]
            );
        }

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Profile saved successfully",
                auth_user_id: authUserId
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
