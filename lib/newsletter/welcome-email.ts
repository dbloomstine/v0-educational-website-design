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
import { interestWords } from './interests'
import { FOLLOW } from '@/lib/brand/social'
import { firstEditionSentence } from '@/lib/newsletter/first-edition'
import { AMBER, FONT_MONO, FONT_SANS, FONT_SERIF, INK, INK_MUTED, SIGNATURE_HTML, escapeHtml, renderNoteShell } from './note-shell'

export function renderWelcomeEmail(
  unsubscribeUrl: string,
  options: { preferencesUrl?: string; interests?: string[] } = {},
): string {
  // The reader's own page for what they follow. Absent (the preview scripts),
  // the paragraph and the footer link are simply not there.
  const safePrefs = options.preferencesUrl ? escapeHtml(options.preferencesUrl) : ''
  const follows = interestWords(options.interests ?? [])
  const linkStyle = `color:${INK};text-decoration:underline;font-weight:600;`
  const tailored = !safePrefs
    ? ''
    : `
              <p style="margin:0 0 16px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                ${
                  follows
                    ? `You said you follow ${escapeHtml(follows)}, so each edition groups those stories for you under &ldquo;What you follow&rdquo;. <a href="${safePrefs}" style="${linkStyle}">Change that any time</a>.`
                    : `Want it tailored? <a href="${safePrefs}" style="${linkStyle}">Pick the strategies you follow</a> and each edition groups those stories for you.`
                }
              </p>
`

  const body = `              <div style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2px;color:${INK_MUTED};text-transform:uppercase;margin-bottom:14px;">
                From the Editor
              </div>

              <h1 style="margin:0 0 28px;font-family:${FONT_SERIF};font-size:28px;font-weight:700;color:${INK};line-height:1.2;">
                Welcome to the <span style="font-style:italic;color:${AMBER};">brief.</span>
              </h1>

              <p style="margin:0 0 16px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                Hey —
              </p>

              <p style="margin:0 0 16px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                Thanks for subscribing to <strong>FundOps Daily</strong>. ${firstEditionSentence()}
              </p>

              <p style="margin:0 0 16px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                I built FundOpsHQ to have one place for what&rsquo;s actually happening across the
                funds industry &mdash; and which events are worth the trip &mdash; without checking a dozen
                trade publications every morning.
              </p>

              <p style="margin:0 0 10px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};font-weight:700;">
                Each edition, before the open:
              </p>
              <ul style="margin:0 0 24px;padding-left:22px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                <li style="margin-bottom:8px;"><strong>News</strong> &mdash; the morning&rsquo;s headlines by strategy: launches, closes, LP commitments, people moves, M&amp;A and regulatory action, de-duplicated across 200+ publications and linked to the original reporting</li>
                <li><strong>Events</strong> &mdash; the week ahead in conferences, forums and networking events across North America, grouped by day, every date verified at the organizer</li>
              </ul>

              <p style="margin:0 0 16px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                Between editions, the newsroom runs all day at <a href="https://fundopshq.com/news" style="color:${INK};text-decoration:underline;font-weight:600;">fundopshq.com/news</a> and the full calendar lives at <a href="https://fundopshq.com/events" style="color:${INK};text-decoration:underline;font-weight:600;">fundopshq.com/events</a>.
              </p>

${tailored}
              <!-- Feedback callout -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0;">
                <tr>
                  <td style="border-left:3px solid ${AMBER};padding:4px 0 4px 16px;">
                    <p style="margin:0;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                      Reply any time with questions, story tips, or an event worth listing &mdash; I read everything.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                Thanks for being here.
              </p>

${SIGNATURE_HTML}
`
  return renderNoteShell({
    title: 'Welcome to FundOps Daily — a note from Danny',
    eyebrowLeft: 'A Note From the Founder',
    eyebrowRight: 'Welcome',
    body,
    footerReason: `You&rsquo;re receiving this because you just signed up at <a href="https://fundopshq.com" style="color:rgba(248,245,236,0.75);text-decoration:none;">fundopshq.com</a>.`,
    unsubscribeUrl,
    preferencesUrl: options.preferencesUrl,
  })
}

/**
 * The welcome note as plain text, sent beside the HTML (2026-10-14): the same
 * words, links written out in full.
 */
export function renderWelcomeText(
  unsubscribeUrl: string,
  options: { preferencesUrl?: string; interests?: string[] } = {},
): string {
  const follows = interestWords(options.interests ?? [])
  const tailored = !options.preferencesUrl
    ? []
    : [
        follows
          ? `You said you follow ${follows}, so each edition groups those stories for you under “What you follow”. Change that any time: ${options.preferencesUrl}`
          : `Want it tailored? Pick the strategies you follow and each edition groups those stories for you: ${options.preferencesUrl}`,
        '',
      ]
  return [
    'FUNDOPS DAILY',
    'Welcome to the brief.',
    '',
    'Hey —',
    '',
    `Thanks for subscribing to FundOps Daily. ${firstEditionSentence()}`,
    '',
    'I built FundOpsHQ to have one place for what’s actually happening across the funds industry, and which events are worth the trip, without checking a dozen trade publications every morning.',
    '',
    'Each edition, before the open:',
    '- News: the morning’s headlines by strategy: launches, closes, LP commitments, people moves, M&A and regulatory action, de-duplicated across 200+ publications and linked to the original reporting',
    '- Events: the week ahead in conferences, forums and networking events across North America, grouped by day, every date verified at the organizer',
    '',
    'Between editions, the newsroom runs all day at https://fundopshq.com/news and the full calendar lives at https://fundopshq.com/events',
    '',
    ...tailored,
    'Reply any time with questions, story tips, or an event worth listing. I read everything.',
    '',
    'Thanks for being here.',
    '',
    'Danny Bloomstine',
    'Founder, FundOpsHQ',
    '',
    '----------------------------------------',
    'FundOps Daily, by FundOpsHQ',
    `Through the day: ${FOLLOW.map((f) => `${f.label} ${f.href}`).join(' · ')}`,
    'You’re receiving this because you just signed up at fundopshq.com.',
    `Unsubscribe: ${unsubscribeUrl}`,
    ...(options.preferencesUrl ? [`Choose what you follow: ${options.preferencesUrl}`] : []),
    'Visit FundOpsHQ: https://fundopshq.com',
    '',
  ].join('\n')
}
