import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    return transporter;
}

// Sends the password reset email if SMTP is configured. In local dev
// without SMTP credentials, the link is logged instead so the flow can
// still be tested end to end without setting up an email provider.
export async function sendPasswordResetEmail(toEmail, resetUrl) {
    const client = getTransporter();

    if (!client) {
        console.warn("SMTP not configured - password reset link (dev only):", resetUrl);
        return;
    }

    await client.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject: "Reset your Toukii password",
        text: `Someone requested a password reset for your Toukii account.\n\nReset your password: ${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, you can ignore this email.`,
        html: `
            <p>Someone requested a password reset for your Toukii account.</p>
            <p><a href="${resetUrl}">Click here to reset your password</a></p>
            <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
        `,
    });
}
