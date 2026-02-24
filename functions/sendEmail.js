import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  try {
    const { email, name } = JSON.parse(event.body);

    const data = await resend.emails.send({
      from: "Fila Assistant <fila@fleduacademy.com>",
      to: email,
      subject: "🎉 Welcome to Fila Assistant!",
      html: `
        <div style="font-family: Arial; padding:20px;">
          <h2 style="color:#2196f3;">Welcome ${name} 🎉</h2>
          <p>We’re excited to have you on Fila Assistant Family.</p>
          <p>You can now generate professional lesson plans in seconds.</p>
          <a href="https://fleduacademy.com/index" 
             style="background:#2196f3; color:white; padding:10px 15px; text-decoration:none; border-radius:5px;">
             Go to Dashboard
          </a>
        </div>
      `
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email sent successfully", data })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
      }
