import type { EmailMessage } from "../types";

export interface OtpEmailParams {
  to: string;
  otp: string;
  expiresInMinutes?: number;
}

function generateDigitCells(otp: string): string {
  return otp
    .split("")
    .map(
      (digit) =>
        `<td style="width: 40px; height: 52px; background-color: #ffffff; border: 2px solid #1a365d; border-radius: 6px; text-align: center; vertical-align: middle; font-size: 28px; font-weight: 700; color: #1a365d; font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;">${digit}</td>`
    )
    .join('<td style="width: 8px;"></td>');
}

export function createOtpEmail({ to, otp, expiresInMinutes = 10 }: OtpEmailParams): EmailMessage {
  const digitCells = generateDigitCells(otp);

  return {
    to,
    subject: `${otp} is your Democracy Direct code`,
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
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background-color: #f0f4f8; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f0f4f8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 400px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(26, 54, 93, 0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 28px 24px; text-align: center;">
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="width: 36px; height: 36px; background-color: #d69e2e; border-radius: 8px; text-align: center; vertical-align: middle;">
                    <span style="font-weight: 800; color: #1a365d; font-size: 20px; line-height: 36px;">D</span>
                  </td>
                  <td style="padding-left: 12px;">
                    <span style="color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: -0.5px;">Democracy Direct</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 36px 24px 32px 24px;">
              <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #1a365d; text-align: center; letter-spacing: -0.5px;">
                Your verification code
              </h1>
              <p style="margin: 0 0 28px 0; font-size: 15px; color: #64748b; line-height: 1.5; text-align: center;">
                Enter this code to sign in:
              </p>

              <!-- OTP Code Display -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 20px auto; background-color: #f8fafc; border-radius: 10px; padding: 16px;">
                <tr>
                  ${digitCells}
                </tr>
              </table>

              <!-- Copyable OTP (hidden visually but selectable) -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding: 0 0 24px 0;">
                    <a href="#" style="display: inline-block; background-color: #1a365d; color: #ffffff; font-size: 18px; font-weight: 700; font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace; letter-spacing: 4px; padding: 14px 28px; border-radius: 8px; text-decoration: none; -webkit-user-select: all; user-select: all;">${otp}</a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #fef3c7; border-radius: 8px; padding: 12px 16px;">
                <tr>
                  <td style="font-size: 13px; color: #92400e; text-align: center;">
                    ⏱ Expires in <strong>${expiresInMinutes} minutes</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.5;">
                Didn't request this? You can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #94a3b8; text-align: center;">
                🔒 We never store your email address
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8; text-align: center;">
                <a href="mailto:hello@democracy-direct.com" style="color: #64748b; text-decoration: none;">Contact</a>
                <span style="color: #cbd5e1; padding: 0 8px;">•</span>
                <a href="https://democracy-direct.com/privacy" style="color: #64748b; text-decoration: none;">Privacy</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Sub-footer -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 400px; padding-top: 16px;">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Your Voice, Your Representatives
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
