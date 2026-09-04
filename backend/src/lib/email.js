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

function resetPasswordEmailHtml(resetUrl) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reset your Toukii password</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(15,23,42,0.08);">
          <tr>
            <td style="background-color:#0f172a; padding:28px 32px;">
              <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:-0.02em;">Toukii</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;">
              <h1 style="margin:0 0 12px; color:#0f172a; font-size:20px; font-weight:700;">Reset your password</h1>
              <p style="margin:0 0 24px; color:#475569; font-size:14px; line-height:1.6;">
                We received a request to reset the password for your Toukii account. Click the button below to choose a new one. This link expires in 30 minutes and can only be used once.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px; background-color:#0f172a;">
                    <a href="${resetUrl}" target="_blank" style="display:inline-block; padding:12px 28px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; border-radius:10px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0; color:#94a3b8; font-size:12px; line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br />
                <a href="${resetUrl}" style="color:#0f172a; word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px; background-color:#f8fafc; border-top:1px solid #e2e8f0;">
              <p style="margin:0; color:#94a3b8; font-size:12px; line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email — your password won't be changed.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
        text: `We received a request to reset the password for your Toukii account.\n\nReset your password: ${resetUrl}\n\nThis link expires in 30 minutes and can only be used once. If you didn't request this, you can safely ignore this email.`,
        html: resetPasswordEmailHtml(resetUrl),
    });
}
