/**
 * Welcome email for new FundOps Daily subscribers.
 *
 * Single opt-in: the user is already confirmed by the time this sends.
 * This is a personal note from Danny — first impression, sets the
 * tone, invites feedback. Matches the editorial brand system (navy /
 * cream / amber / Georgia / mono) used by the main daily edition so
 * subscribers recognize the visual language on day two.
 *
 * Same email-client gotchas as lib/newsletter/email-template.ts:
 *  - Inline CSS + system fonts only (no @font-face / Google Fonts).
 *  - Color-scheme meta tags + media query to opt out of Gmail iOS
 *    dark-mode auto-inversion of the navy masthead/footer.
 *  - Inline `color` on every <a> — class color loses to Gmail's
 *    user-agent `a:link` cascade.
 */

const NAVY = '#1E3A5F'
const NAVY_DEEP = '#0F1E33'
const CREAM = '#F8F5EC'
const AMBER = '#E6B045'
const INK = '#1E3A5F'
const INK_MUTED = '#5A6B82'
const HAIRLINE = '#D8D0BC'
const HAIRLINE_DARK = 'rgba(248,245,236,0.18)'

const FONT_SERIF = `Georgia, 'Times New Roman', Times, serif`
const FONT_SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif`
const FONT_MONO = `ui-monospace, Menlo, Consolas, 'Courier New', monospace`

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
<html lang="en" style="color-scheme:only light;supported-color-schemes:only light;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="only light">
  <meta name="supported-color-schemes" content="only light">
  <title>Welcome to FundOps Daily — a note from Danny</title>
  <style>
    :root { color-scheme: only light; supported-color-schemes: only light; }
    body, table, td, div, p, a, span { color-scheme: only light !important; }
    @media (prefers-color-scheme: dark) {
      body, table, td, div { background-color: inherit !important; }
      .fops-bg-navy { background-color: ${NAVY} !important; }
      .fops-bg-navy-deep { background-color: ${NAVY_DEEP} !important; }
      .fops-bg-cream { background-color: ${CREAM} !important; }
    }
    u + .body .fops-bg-navy { background-color: ${NAVY} !important; }
    u + .body .fops-bg-cream { background-color: ${CREAM} !important; }
    [data-ogsc] .fops-bg-navy { background-color: ${NAVY} !important; }
    [data-ogsc] .fops-bg-cream { background-color: ${CREAM} !important; }
  </style>
</head>
<body class="body" style="margin:0;padding:0;background-color:${NAVY_DEEP};font-family:${FONT_SANS};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" class="fops-bg-navy-deep" style="background-color:${NAVY_DEEP};">
    <tr>
      <td align="center" style="padding:24px 10px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- ─── Masthead ─── -->
          <tr>
            <td class="fops-bg-navy" style="padding:0;background-color:${NAVY};">

              <!-- Eyebrow strip -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:14px 32px 12px;border-bottom:1px solid ${HAIRLINE_DARK};">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2px;color:rgba(248,245,236,0.7);text-transform:uppercase;">
                          A Note From the Founder
                        </td>
                        <td align="right" style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2px;color:${AMBER};text-transform:uppercase;">
                          Welcome
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Wordmark row -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:24px 32px 22px;text-align:left;">
                    <span style="font-family:${FONT_SERIF};font-size:32px;font-weight:700;color:${CREAM};letter-spacing:-0.5px;line-height:1;">FundOps</span><span style="font-family:${FONT_SERIF};font-size:32px;font-weight:700;font-style:italic;color:${AMBER};letter-spacing:-0.5px;line-height:1;">Daily</span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ─── Body: personal note ─── -->
          <tr>
            <td class="fops-bg-cream" style="padding:40px 36px 28px;background-color:${CREAM};">

              <div style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2px;color:${INK_MUTED};text-transform:uppercase;margin-bottom:14px;">
                From the Editor
              </div>

              <h1 style="margin:0 0 28px;font-family:${FONT_SERIF};font-size:28px;font-weight:700;color:${INK};line-height:1.2;">
                Welcome to the <span style="font-style:italic;color:${AMBER};">brief.</span>
              </h1>

              <p style="margin:0 0 16px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                Hey —
              </p>

              <p style="margin:0 0 16px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                Thanks for signing up for <strong>FundOps Daily</strong>. A quick note from me before the first edition lands in your inbox tomorrow morning.
              </p>

              <p style="margin:0 0 16px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                I built FundOpsHQ because I wanted one place to keep up with what&rsquo;s actually happening across the funds industry — fund launches, closes, LP commitments, exec moves, regulatory shifts, and deals — without hopping between twelve trade publications every morning. Starting tomorrow you&rsquo;ll get a concise rundown of the biggest stories before 6am ET, every day.
              </p>

              <p style="margin:24px 0 10px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};font-weight:700;">
                What to expect in each edition:
              </p>
              <ul style="margin:0 0 24px;padding-left:22px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                <li style="margin-bottom:8px;">Top fund news sorted by strategy — PE, VC, credit, real estate, infrastructure, hedge</li>
                <li style="margin-bottom:8px;">A dedicated <strong>LP Commitments</strong> section tracking pension and institutional allocations</li>
                <li style="margin-bottom:8px;">People Moves, M&amp;A, and regulatory news rounding out the brief</li>
                <li>Links out to the original reporting from 200+ trade publications</li>
              </ul>

              <p style="margin:0 0 16px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                Beyond the morning brief, FundOpsHQ is also home to a live news feed at <a href="https://fundopshq.com/#news" style="color:${INK};text-decoration:underline;font-weight:600;">fundopshq.com</a> and <strong>FundOpsHQ Live</strong> — our weekly broadcast every Thursday at 11am ET on <a href="https://www.youtube.com/@dbloomstine/streams" style="color:${INK};text-decoration:underline;font-weight:600;">YouTube</a>.
              </p>

              <!-- Feedback callout -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0;">
                <tr>
                  <td style="border-left:3px solid ${AMBER};padding:4px 0 4px 16px;">
                    <p style="margin:0;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                      One more thing — this is still a new product and I&rsquo;d love your feedback. Hit reply or email me directly at <a href="mailto:dbloomstine@gmail.com" style="color:${INK};text-decoration:underline;font-weight:700;">dbloomstine@gmail.com</a> any time — questions, story tips, things you&rsquo;d like to see covered, or (honestly) things you&rsquo;d rather see less of. I read everything.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                Thanks for being here.
              </p>

              <!-- Signature -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
                <tr>
                  <td style="vertical-align:middle;padding-right:16px;">
                    <img src="https://fundopshq.com/danny-headshot-nobg.png" alt="Danny Bloomstine" width="60" height="60" style="width:60px;height:60px;border-radius:50%;background-color:${AMBER};display:block;border:2px solid ${AMBER};" />
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-family:${FONT_SERIF};font-size:19px;font-weight:700;color:${INK};line-height:1.2;">Danny Bloomstine</div>
                    <div style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2px;color:${INK_MUTED};text-transform:uppercase;margin-top:4px;">Founder &middot; FundOpsHQ</div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ─── Footer ─── -->
          <tr>
            <td class="fops-bg-navy" style="padding:24px 32px;background-color:${NAVY};">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom:10px;border-bottom:1px solid ${HAIRLINE_DARK};">
                    <span style="font-family:${FONT_SERIF};font-size:18px;font-weight:700;color:${CREAM};letter-spacing:-0.3px;">FundOps</span><span style="font-family:${FONT_SERIF};font-size:18px;font-weight:700;font-style:italic;color:${AMBER};letter-spacing:-0.3px;">Daily</span>
                    <span style="font-family:${FONT_MONO};font-size:10px;color:rgba(248,245,236,0.5);letter-spacing:1.5px;margin-left:10px;text-transform:uppercase;">by FundOpsHQ</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:14px;font-family:${FONT_SANS};font-size:11px;color:rgba(248,245,236,0.55);line-height:1.65;">
                    <p style="margin:0;">
                      You&rsquo;re receiving this because you just signed up at <a href="https://fundopshq.com" style="color:rgba(248,245,236,0.75);text-decoration:none;">fundopshq.com</a>.
                    </p>
                    <p style="margin:6px 0 0;">
                      <a href="${safeUnsub}" style="color:rgba(248,245,236,0.65);text-decoration:underline;">Unsubscribe</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://fundopshq.com" style="color:rgba(248,245,236,0.65);text-decoration:underline;">Visit FundOpsHQ</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://www.youtube.com/@dbloomstine/streams" style="color:rgba(248,245,236,0.65);text-decoration:underline;">Live Show</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
