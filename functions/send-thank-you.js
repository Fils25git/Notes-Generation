// functions/send-thank-you.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  try {
    const { email, name, amount, planType } = JSON.parse(event.body);

    if (!email || !name || !amount || !planType) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required data" }) };
    }

    // Email HTML content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color:#2196f3;">Hello ${name} 👋</h2>
        <p>Thank you for purchasing a <strong>${planType}</strong> on <strong>Fila Assistant</strong>!</p>
        <p><strong>Payment Details:</strong></p>
        <ul>
          <li>Plan Type: ${planType}</li>
          <li>Amount Paid: RWF ${amount.toLocaleString()}</li>
          <li>Date: ${new Date().toLocaleString()}</li>
        </ul>
        <p>You can now access your lessons or weekly plan immediately in your dashboard and you can check balance for confirmation.</p>
        <a href="https://fleduacademy.com/index" 
           style="display:inline-block; margin-top:15px; padding:10px 15px; background:#2196f3; color:white; text-decoration:none; border-radius:5px;">
           Go to Dashboard
        </a>
        <p style="margin-top:20px; font-size:12px; color:#555;">If you did not make this purchase, please contact support immediately.</p>
      </div>
    `;

    await resend.emails.send({
      from: "Fila Assistant <fila@fleduacademy.com>",
      to: email,
      subject: `🎉 Thank You for Your Purchase, ${name}!`,
      html: htmlContent
    });

    return { statusCode: 200, body: JSON.stringify({ message: "Thank-you email sent" }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
