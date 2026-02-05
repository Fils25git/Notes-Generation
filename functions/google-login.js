// google-login.js
import fetch from "node-fetch";

export async function handler(event, context) {
    try {
        const body = JSON.parse(event.body);
        const { credential } = body;

        if (!credential) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing credential" }) };
        }

        // Verify credential with Google
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        const googleData = await googleRes.json();

        if (googleData.error_description || !googleData.email_verified) {
            return { statusCode: 401, body: JSON.stringify({ error: "Invalid Google token" }) };
        }

        // Here you can check database for existing user or create new one
        const userEmail = googleData.email;

        // Generate simple token (for demo, can be JWT later)
        const token = btoa(`${userEmail}:${Date.now()}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                email: userEmail,
                token
            })
        };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
}
