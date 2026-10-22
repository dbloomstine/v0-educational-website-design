/**
 * The shell of the founder's notes: the welcome note (welcome-email.ts) and the welcome series (welcome-series.ts),
 * lifted out of welcome-email.ts on 2026-10-22 so both render from one place. Navy masthead with an eyebrow strip
 * and the wordmark, a cream body, Danny's signature block, and the navy footer with the follow line, Unsubscribe and
 * "Choose what you follow". The welcome note renders byte-for-byte as it did before the lift.
 *
 * Same email-client gotchas as lib/newsletter/email-template.ts:
 *  - Inline CSS + system fonts only (no @font-face / Google Fonts).
 *  - Color-scheme meta tags + media query to opt out of Gmail iOS
 *    dark-mode auto-inversion of the navy masthead/footer.
 *  - Inline `color` on every <a>: class color loses to Gmail's
 *    user-agent `a:link` cascade.
 */
import { followLineHtml } from './follow-line'

export const NAVY = '#1E3A5F'
export const NAVY_DEEP = '#0F1E33'
export const CREAM = '#F8F5EC'
export const AMBER = '#E6B045'
export const INK = '#1E3A5F'
export const INK_MUTED = '#5A6B82'
export const HAIRLINE = '#D8D0BC'
export const HAIRLINE_DARK = 'rgba(248,245,236,0.18)'

export const FONT_SERIF = `Georgia, 'Times New Roman', Times, serif`
export const FONT_SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif`
export const FONT_MONO = `ui-monospace, Menlo, Consolas, 'Courier New', monospace`

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Hidden preview text (the line a mail app shows beside the subject); nothing when there is none. */
function preheaderHtml(text: string | undefined): string {
  if (!text) return ''
  return `  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${NAVY_DEEP};opacity:0;">${escapeHtml(text)}</div>\n`
}

/** Danny's signature: headshot, name, "Founder · FundOpsHQ". */
export const SIGNATURE_HTML = `              <!-- Signature -->
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
`

export interface NoteShell {
  /** The <title> (plain text). */
  title: string
  /** The eyebrow strip's two labels (HTML, already safe). */
  eyebrowLeft: string
  eyebrowRight: string
  /** Hidden preview text. */
  preheader?: string
  /** Everything inside the cream body cell (HTML, already safe), signature included. */
  body: string
  /** The footer's "why you are getting this" sentence (HTML, already safe). */
  footerReason: string
  unsubscribeUrl: string
  /** Absent, the footer has no "Choose what you follow" link. */
  preferencesUrl?: string
}

export function renderNoteShell(o: NoteShell): string {
  return `<!DOCTYPE html>
<html lang="en" style="color-scheme:only light;supported-color-schemes:only light;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="only light">
  <meta name="supported-color-schemes" content="only light">
  <title>${escapeHtml(o.title)}</title>
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
${preheaderHtml(o.preheader)}  <table cellpadding="0" cellspacing="0" border="0" width="100%" class="fops-bg-navy-deep" style="background-color:${NAVY_DEEP};">
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
                          ${o.eyebrowLeft}
                        </td>
                        <td align="right" style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2px;color:${AMBER};text-transform:uppercase;">
                          ${o.eyebrowRight}
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

${o.body}            </td>
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
                    <p style="margin:0 0 10px;">
                      ${followLineHtml()}
                    </p>
                    <p style="margin:0;">
                      ${o.footerReason}
                    </p>
                    <p style="margin:6px 0 0;">
                      <a href="${escapeHtml(o.unsubscribeUrl)}" style="color:rgba(248,245,236,0.65);text-decoration:underline;">Unsubscribe</a>
                      &nbsp;&middot;&nbsp;${
                        o.preferencesUrl
                          ? `
                      <a href="${escapeHtml(o.preferencesUrl)}" style="color:rgba(248,245,236,0.65);text-decoration:underline;">Choose what you follow</a>
                      &nbsp;&middot;&nbsp;`
                          : ''
                      }
                      <a href="https://fundopshq.com" style="color:rgba(248,245,236,0.65);text-decoration:underline;">Visit FundOpsHQ</a>
                      &nbsp;&middot;&nbsp;
                      <a href="https://fundopshq.com/about" style="color:rgba(248,245,236,0.65);text-decoration:underline;">About</a>
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
