import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;

    // Gmail SMTP via an App Password - works with any recipient immediately,
    // no domain ownership/verification needed. Requires 2-Step Verification
    // enabled on the Gmail account and an App Password generated at
    // myaccount.google.com/apppasswords (a regular Gmail password won't work).
    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    return transporter;
}

// Sends the password reset email if Gmail SMTP is configured. In local dev
// without it, the link is logged instead so the flow can still be tested
// end to end without setting up email.
export async function sendPasswordResetEmail(toEmail, resetUrl) {
    const client = getTransporter();

    if (!client) {
        console.warn("Gmail SMTP not configured - password reset link (dev only):", resetUrl);
        return;
    }

    await client.sendMail({
        from: `Toukii <${process.env.GMAIL_USER}>`,
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
