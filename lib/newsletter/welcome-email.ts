/**
 * Welcome email for new FundOps Daily subscribers.
 *
 * Single opt-in: the user is already confirmed by the time this sends.
 * This is a courtesy confirmation + expectation-setter, not a gate.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderWelcomeEmail(unsubscribeUrl: string): string {
  const safeUnsub = escapeHtml(unsubscribeUrl)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're in — FundOps Daily</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0f172a;">
    <tr>
      <td align="center" style="padding:40px 10px;">
        <table cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:24px;background-color:#1e293b;border-radius:8px 8px 0 0;text-align:center;">
              <span style="font-size:22px;font-weight:700;color:#f8fafc;letter-spacing:-0.5px;">FundOps</span><span style="font-size:22px;font-weight:700;color:#3b82f6;letter-spacing:-0.5px;">Daily</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 28px;background-color:#1e293b;">
              <h1 style="margin:0 0 16px;color:#f8fafc;font-size:22px;font-weight:600;line-height:1.3;">You're in.</h1>
              <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px;line-height:1.6;">
                Welcome to <strong style="color:#f8fafc;">FundOps Daily</strong> — the morning brief for GPs, LPs, and fund service providers. Starting tomorrow, you'll get a concise rundown of fund closes, launches, LP commitments, exec moves, and deals every weekday before 6am ET.
              </p>
              <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px;line-height:1.6;">
                What to expect:
              </p>
              <ul style="margin:0 0 20px;padding-left:20px;color:#cbd5e1;font-size:14px;line-height:1.7;">
                <li>Top fund news sorted by strategy — PE, VC, credit, real estate, infrastructure, hedge</li>
                <li>Dedicated LP Commitments section tracking pension and institutional allocations</li>
                <li>People Moves and M&amp;A rounding out the brief</li>
                <li>Links out to the original reporting from 200+ trade publications</li>
              </ul>
              <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;line-height:1.6;">
                Catch the full live news feed anytime at <a href="https://fundopshq.com/#news" style="color:#60a5fa;text-decoration:none;">fundopshq.com</a>, and tune into <a href="https://fundopshq.com/#show" style="color:#60a5fa;text-decoration:none;">FundOpsHQ Live</a> every Thursday at 11am ET on YouTube.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 24px;background-color:#0f172a;border-radius:0 0 8px 8px;text-align:center;">
              <p style="margin:0 0 6px;color:#475569;font-size:11px;">
                <a href="https://fundopshq.com" style="color:#475569;text-decoration:none;">FundOpsHQ</a> &middot; <a href="${safeUnsub}" style="color:#475569;text-decoration:underline;">Unsubscribe</a>
              </p>
              <p style="margin:0;color:#334155;font-size:10px;">
                You're receiving this because you signed up at fundopshq.com.
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
