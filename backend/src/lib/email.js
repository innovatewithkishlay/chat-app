import { Resend } from "resend";

let resendClient = null;

function getClient() {
    if (resendClient) return resendClient;
    if (!process.env.RESEND_API_KEY) return null;

    resendClient = new Resend(process.env.RESEND_API_KEY);
    return resendClient;
}

// Sends the password reset email via Resend if an API key is configured. In
// local dev without one, the link is logged instead so the flow can still be
// tested end to end without an email provider.
export async function sendPasswordResetEmail(toEmail, resetUrl) {
    const client = getClient();

    if (!client) {
        console.warn("RESEND_API_KEY not set - password reset link (dev only):", resetUrl);
        return;
    }

    // Resend's sandbox sender ("onboarding@resend.dev") only delivers to the
    // email address the Resend account itself is registered with, until a
    // custom domain is verified. Set RESEND_FROM_EMAIL once you've verified
    // a domain to send to any recipient.
    const from = process.env.RESEND_FROM_EMAIL || "Toukii <onboarding@resend.dev>";

    const { error } = await client.emails.send({
        from,
        to: toEmail,
        subject: "Reset your Toukii password",
        text: `Someone requested a password reset for your Toukii account.\n\nReset your password: ${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, you can ignore this email.`,
        html: `
            <p>Someone requested a password reset for your Toukii account.</p>
            <p><a href="${resetUrl}">Click here to reset your password</a></p>
            <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
        `,
    });

    if (error) {
        console.error("Resend failed to send password reset email:", error);
        throw new Error("Failed to send password reset email");
    }
}
