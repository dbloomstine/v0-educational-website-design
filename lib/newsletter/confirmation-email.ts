/**
 * Double opt-in confirmation email for FundOps Daily.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderConfirmationEmail(confirmUrl: string): string {
  const safeUrl = escapeHtml(confirmUrl)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your FundOps Daily subscription</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0f172a;">
    <tr>
      <td align="center" style="padding:40px 10px;">
        <table cellpadding="0" cellspacing="0" border="0" width="480" style="max-width:480px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:24px;background-color:#1e293b;border-radius:8px 8px 0 0;text-align:center;">
              <span style="font-size:22px;font-weight:700;color:#f8fafc;letter-spacing:-0.5px;">FundOps</span><span style="font-size:22px;font-weight:700;color:#3b82f6;letter-spacing:-0.5px;">Daily</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 24px;background-color:#1e293b;text-align:center;">
              <h1 style="margin:0 0 16px;color:#f8fafc;font-size:20px;font-weight:600;">Confirm your subscription</h1>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                You're one click away from getting daily fund operations intelligence delivered to your inbox every morning.
              </p>
              <a href="${safeUrl}" style="display:inline-block;background-color:#3b82f6;color:#ffffff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:6px;text-decoration:none;">Confirm Subscription</a>
              <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.5;">
                If you didn't sign up for FundOps Daily, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;background-color:#0f172a;border-radius:0 0 8px 8px;text-align:center;">
              <p style="margin:0;color:#475569;font-size:11px;">
                <a href="https://fundopshq.com" style="color:#475569;text-decoration:none;">FundOpsHQ</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
