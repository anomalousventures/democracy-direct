import type { EmailMessage } from "../types";

export interface OtpEmailParams {
  to: string;
  otp: string;
  expiresInMinutes?: number;
}

export function createOtpEmail({ to, otp, expiresInMinutes = 10 }: OtpEmailParams): EmailMessage {
  const formattedOtp = otp.split("").join(" ");

  return {
    to,
    subject: "Your Democracy Direct verification code",
    text: `Your verification code is: ${otp}

This code will expire in ${expiresInMinutes} minutes.

If you didn't request this code, you can safely ignore this email.

---
Democracy Direct
Your Voice, Your Representatives

Contact: hello@democracy-direct.com
Privacy: https://democracy-direct.com/privacy`,

    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a365d; padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display: inline-block; width: 32px; height: 32px; background-color: #d69e2e; text-align: center; line-height: 32px; font-weight: bold; color: #1a365d; font-size: 18px;">D</span>
                    <span style="color: #ffffff; font-size: 18px; font-weight: 600; margin-left: 12px; vertical-align: middle;">Democracy Direct</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #1a365d;">
                Your verification code
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #4a5568; line-height: 1.5;">
                Enter this code to sign in to Democracy Direct:
              </p>

              <!-- OTP Code -->
              <div style="background-color: #f7fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a365d; font-family: 'Courier New', monospace;">
                  ${formattedOtp}
                </span>
              </div>

              <p style="margin: 0 0 8px 0; font-size: 14px; color: #718096;">
                This code will expire in <strong>${expiresInMinutes} minutes</strong>.
              </p>
              <p style="margin: 0; font-size: 14px; color: #718096;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #a0aec0; text-align: center;">
                We never store your email address on our servers.
              </p>
              <p style="margin: 0; font-size: 12px; color: #a0aec0; text-align: center;">
                <a href="mailto:hello@democracy-direct.com" style="color: #4a5568; text-decoration: underline;">Contact</a>
                &nbsp;·&nbsp;
                <a href="https://democracy-direct.com/privacy" style="color: #4a5568; text-decoration: underline;">Privacy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}
