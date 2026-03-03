import { Client } from "pg";
import jwt from "jsonwebtoken";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return { statusCode: 401, body: JSON.stringify({ message: "Invalid token" }) };
        }

        const authUserId = decoded.userId;

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

        // --------------------- FIND MATCHES ---------------------
        const matchesRes = await client.query(
            `
            SELECT * FROM teacher_profiles
            WHERE auth_user_id != $1
              AND position = $2
              AND (
                current_province = ANY($3::text[])
                OR current_district = ANY($4::text[])
              )
              AND (
                $5 = ANY(preferred_provinces)
                OR $6 = ANY(preferred_districts)
              )
            `,
            [
                authUserId,
                position,
                preferred_provinces,
                preferred_districts,
                current_province,
                current_district
            ]
        );

        const matches = matchesRes.rows;

        // --------------------- SEND EMAIL TO MATCHED TEACHERS ---------------------
       for (const match of matches) {
            if (!match.email) continue;

            await resend.emails.send({
                from: "Fila Assistant <fila@fleduacademy.com>",
                to: match.email,
                subject: "New Teacher Match Found! 🎉",
                html: `
                    <h2>Hello ${match.full_name} 👋</h2>
                    <p>A new teacher matches your swap preferences:</p>
                    <ul>
                        <li><strong>Name:</strong> ${full_name}</li>
                        <li><strong>School:</strong> ${current_school}</li>
                        <li><strong>Location:</strong> ${current_sector}, ${current_district}, ${current_province}</li>
                    </ul>
                    <p>Login to your dashboard to connect.</p>
                `
            });
        }

        // --------------------- NOTIFY NEW TEACHER ---------------------
        /*if (matches.length > 0 && email) {
            await resend.emails.send({
                from: "Fila Assistant <fila@fleduacademy.com>",
                to: email,
                subject: "You Have New Swap Matches! 🎉",
                html: `
                    <h2>Hello ${full_name} 👋</h2>
                    <p>We found ${matches.length} teacher(s) matching your preferences.</p>
                    <p>Login to your dashboard to see them.</p>
                `
            });
        }*/

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Profile saved successfully",
                auth_user_id: authUserId,
                matches_found: matches.length
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
