/**
 * The welcome series' four emails (and the Day 6 alternative), HTML and plain text (2026-10-22, Danny: "Yes, as
 * drafted"). Copy from ~/fundopshq-workspace/docs/newsletter/2026-10-22-welcome-series.md, the lead subject of each.
 * Schedule and rules: welcome-series-schedule.ts. Send: welcome-series-send.ts.
 *
 * Same look as the welcome note (note-shell.ts): navy masthead, cream body, Danny's signature, the footer with the
 * follow line, Unsubscribe and "Choose what you follow". Email 3b is plain text only, with no masthead: it should
 * read as a note from a person. No first names are held, so every note opens "Hey —", as the welcome does.
 *
 * Two changes from the draft, both corrections: Email 3 said the league tables rank "the month, the quarter and the
 * year", but the page's periods are the past 30 days, the past 90 days and the year to date (lib/news/league.ts);
 * and the audience phrase is written "GPs, LPs, and fund service providers" throughout.
 */
import { EMAIL_FOLLOW_ROW } from './interests'
import { interestLink } from './interest-link'
import { FOLLOW } from '@/lib/brand/social'
import { AMBER, FONT_SANS, FONT_SERIF, CREAM, INK, INK_MUTED, FONT_MONO, SIGNATURE_HTML, escapeHtml, renderNoteShell } from './note-shell'
import type { WelcomeEmailKey } from './welcome-series-schedule'

export interface SeriesContext {
  unsubscribeUrl: string
  preferencesUrl: string
  /** The reader's signed token for the one-click follow row (interest-link.ts). Null: Email 1 shows only the preferences link. */
  interestToken?: string | null
  /** Live counts from computeAudience() (lib/sponsor/stats.ts). Either one missing, Email 4 leaves the sentence out. */
  audience?: { readers: number | null; firms: number | null } | null
  /** True only while the Monday events email is live (lib/events/weekly-mode.ts): Email 3 then mentions it. */
  eventsMondayLive?: boolean
}

export interface RenderedSeriesEmail {
  subject: string
  preheader: string
  /** Null for the plain-text-only email (3b). */
  html: string | null
  text: string
}

export const SERIES_COPY: Record<WelcomeEmailKey, { subject: string; preheader: string }> = {
  '1': { subject: 'What do you follow?', preheader: 'Tick the markets you cover and each edition groups those stories for you.' },
  '2': { subject: 'How to read FundOps Daily in two minutes', preheader: 'Top stories, the ranked lists, the sections, and what Monday adds.' },
  '3': { subject: 'Between editions: league tables, firm pages, events', preheader: 'Ranked closes by market, every firm’s record, and a verified events calendar.' },
  '3b': { subject: 'Is FundOps Daily reaching you?', preheader: 'One line back helps more than you’d think.' },
  '4': { subject: 'Who else on your team should see this?', preheader: 'FundOps Daily grows by forwards. Plus how to send us your own news.' },
}

const UTM = (campaign: string) => `utm_source=welcome&utm_medium=email&utm_campaign=${campaign}`
export const LEAGUE_URL = `https://fundopshq.com/league-tables?${UTM('welcome3')}`
export const JOIN_URL = `https://fundopshq.com/join?${UTM('welcome4')}`

/** Email 4's button: a mailto that writes the forward (the daily's `shareMailto` pattern, pointed at /join). */
export function shareMailto(): string {
  const body = `I read this every morning: the day's private markets news for GPs, LPs, and fund service providers, in one email. Sign up here:\n\n${JOIN_URL}`
  return `mailto:?subject=${encodeURIComponent('Thought this was worth passing along')}&body=${encodeURIComponent(body)}`
}

// ─── HTML pieces ──────────────────────────────────────────────────────────

const P = `margin:0 0 16px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};`
const A = `color:${INK};text-decoration:underline;font-weight:600;`
const p = (html: string) => `              <p style="${P}">\n                ${html}\n              </p>\n`
const a = (href: string, label: string) => `<a href="${escapeHtml(href)}" style="${A}">${label}</a>`
const site = (path: string, label = `fundopshq.com${path}`) => a(`https://fundopshq.com${path}`, label)

function heading(title: string): string {
  return `              <div style="font-family:${FONT_MONO};font-size:10px;font-weight:700;letter-spacing:2px;color:${INK_MUTED};text-transform:uppercase;margin-bottom:14px;">
                From the Editor
              </div>

              <h1 style="margin:0 0 24px;font-family:${FONT_SERIF};font-size:24px;font-weight:700;color:${INK};line-height:1.25;">
                ${title}
              </h1>

`
}

function button(href: string, label: string): string {
  return `              <table cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
                <tr>
                  <td style="background-color:${INK};border-radius:2px;">
                    <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;font-family:${FONT_MONO};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${CREAM};text-decoration:none;">${label} &rarr;</a>
                  </td>
                </tr>
              </table>
`
}

function followRowHtml(token: string): string {
  const links = EMAIL_FOLLOW_ROW.map(
    (f) => `<a href="${escapeHtml(interestLink(token, f.id))}" style="color:${INK};font-family:${FONT_MONO};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-decoration:underline;white-space:nowrap;">${escapeHtml(f.label)}</a>`,
  )
  return `              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 20px;">
                <tr>
                  <td style="border-left:3px solid ${AMBER};padding:6px 0 6px 16px;line-height:2.1;">
                    ${links.join(` <span style="color:${INK_MUTED};">&middot;</span> `)}
                  </td>
                </tr>
              </table>
`
}

const SERIES_REASON = `You&rsquo;re receiving this because you signed up for FundOps Daily at <a href="https://fundopshq.com" style="color:rgba(248,245,236,0.75);text-decoration:none;">fundopshq.com</a>. It is one of four short notes for new readers; the morning edition carries on as before.`

/** `after` goes below the signature (Email 4's P.S.). */
function shell(key: WelcomeEmailKey, title: string, inner: string, ctx: SeriesContext, after = ''): string {
  return renderNoteShell({
    title: SERIES_COPY[key].subject,
    eyebrowLeft: 'A Note From the Founder',
    eyebrowRight: 'New Reader',
    preheader: SERIES_COPY[key].preheader,
    body: `${heading(title)}${p('Hey &mdash;')}${inner}\n${SIGNATURE_HTML}${after}\n`,
    footerReason: SERIES_REASON,
    unsubscribeUrl: ctx.unsubscribeUrl,
    preferencesUrl: ctx.preferencesUrl,
  })
}

// ─── Plain-text pieces ───────────────────────────────────────────────────

function textFooter(ctx: SeriesContext): string[] {
  return [
    '',
    '----------------------------------------',
    'FundOps Daily, by FundOpsHQ',
    `Through the day: ${FOLLOW.map((f) => `${f.label} ${f.href}`).join(' · ')}`,
    'You’re receiving this because you signed up for FundOps Daily at fundopshq.com. It is one of four short notes for new readers; the morning edition carries on as before.',
    `Unsubscribe: ${ctx.unsubscribeUrl}`,
    `Choose what you follow: ${ctx.preferencesUrl}`,
    'Visit FundOpsHQ: https://fundopshq.com',
    '',
  ]
}

const textNote = (lines: string[], ctx: SeriesContext) => ['Hey —', '', ...lines, '', 'Danny', ...textFooter(ctx)].join('\n')

// ─── The emails ───────────────────────────────────────────────────────────

function email1(ctx: SeriesContext): RenderedSeriesEmail {
  const token = ctx.interestToken || null
  const prefs = `Prefer to set it all at once, including whether you sit at a GP, an LP or a service provider? Use ${a(ctx.preferencesUrl, 'your preferences page')}. You can change it from the foot of any edition.`
  const inner =
    p('This morning&rsquo;s edition covered every market we track, in the same order for everyone.') +
    p('Tell us what you follow and each edition adds a block called <strong>&ldquo;What you follow&rdquo;</strong> with just those stories. You still get the whole edition.') +
    (token ? p('One tap each:') + followRowHtml(token) : '') +
    p(prefs)
  const text = textNote(
    [
      'This morning’s edition covered every market we track, in the same order for everyone.',
      '',
      'Tell us what you follow and each edition adds a block called “What you follow” with just those stories. You still get the whole edition.',
      '',
      ...(token ? ['One tap each:', ...EMAIL_FOLLOW_ROW.map((f) => `- ${f.label}: ${interestLink(token, f.id)}`), ''] : []),
      `Prefer to set it all at once, including whether you sit at a GP, an LP or a service provider? Use your preferences page: ${ctx.preferencesUrl}`,
      'You can change it from the foot of any edition.',
    ],
    ctx,
  )
  return { ...SERIES_COPY['1'], html: shell('1', 'What do you follow?', inner, ctx), text }
}

function email2(ctx: SeriesContext): RenderedSeriesEmail {
  const inner =
    p('You&rsquo;ve had a few editions now. Here is how each one is put together, so you know what to read first and what you can skip.') +
    p('<strong>Top stories.</strong> The morning&rsquo;s biggest news across all markets, each with the fund, its size and its stage where the reporting gives them.') +
    p('<strong>Today&rsquo;s biggest.</strong> Three ranked lists with a cut-off: fund closes of $500M or more, deals of $1B or more, and notable senior hires. A close counts only if it is money actually closed, not a target. Every row links to the story.') +
    p('<strong>The sections.</strong> Everything else, by market: private equity, venture, credit, real estate, infrastructure and secondaries, then LP commitments, people moves, deals and regulation. Each headline links to the original reporting.') +
    p('<strong>Mondays</strong> add last week&rsquo;s largest closes, ranked under the same rules as our league tables. <strong>Events</strong> at the foot: the week ahead, a couple a day, with the full calendar a click away.') +
    p('One practical thing: if this landed in Promotions or a filtered folder, drag it to your main inbox once. Most mail apps remember.') +
    p('And one question: <strong>is anything missing that you need for your job?</strong> Hit reply. One line is plenty, and I read every one.')
  const text = textNote(
    [
      'You’ve had a few editions now. Here is how each one is put together, so you know what to read first and what you can skip.',
      '',
      'TOP STORIES. The morning’s biggest news across all markets, each with the fund, its size and its stage where the reporting gives them.',
      '',
      'TODAY’S BIGGEST. Three ranked lists with a cut-off: fund closes of $500M or more, deals of $1B or more, and notable senior hires. A close counts only if it is money actually closed, not a target. Every row links to the story.',
      '',
      'THE SECTIONS. Everything else, by market: private equity, venture, credit, real estate, infrastructure and secondaries, then LP commitments, people moves, deals and regulation. Each headline links to the original reporting.',
      '',
      'MONDAYS add last week’s largest closes, ranked under the same rules as our league tables. EVENTS at the foot: the week ahead, a couple a day, with the full calendar a click away.',
      '',
      'One practical thing: if this landed in Promotions or a filtered folder, drag it to your main inbox once. Most mail apps remember.',
      '',
      'And one question: is anything missing that you need for your job? Hit reply. One line is plenty, and I read every one.',
    ],
    ctx,
  )
  return { ...SERIES_COPY['2'], html: shell('2', 'How to read FundOps Daily in two minutes', inner, ctx), text }
}

function email3(ctx: SeriesContext): RenderedSeriesEmail {
  const monday = ctx.eventsMondayLive
    ? ' If you go to events, you can also get your city&rsquo;s week every Monday morning; there is a box for it on the board.'
    : ''
  const inner =
    p('The email is the morning&rsquo;s news. Three things on the site go further than an email can:') +
    p(`<strong>League tables.</strong> Fund closes ranked by size, for the past 30 days, the past 90 days and the year to date, overall and by market (private equity, credit, real estate, infrastructure and the rest), under the same rules as &ldquo;Today&rsquo;s biggest&rdquo;.`) +
    p(`<strong>Firm pages.</strong> Every firm we cover has a page with its closes, deals and people moves from the past year, each linked to the report it came from. Search a name at ${site('/firms')}.`) +
    p(`<strong>Events board.</strong> Conferences, forums and networking events, every date checked with the organizer, filterable by city and topic. ${site('/events')}${monday}`) +
    button(LEAGUE_URL, 'See the league tables')
  const text = textNote(
    [
      'The email is the morning’s news. Three things on the site go further than an email can:',
      '',
      'LEAGUE TABLES. Fund closes ranked by size, for the past 30 days, the past 90 days and the year to date, overall and by market (private equity, credit, real estate, infrastructure and the rest), under the same rules as “Today’s biggest”.',
      `See the league tables: ${LEAGUE_URL}`,
      '',
      'FIRM PAGES. Every firm we cover has a page with its closes, deals and people moves from the past year, each linked to the report it came from. Search a name at https://fundopshq.com/firms',
      '',
      `EVENTS BOARD. Conferences, forums and networking events, every date checked with the organizer, filterable by city and topic. https://fundopshq.com/events${ctx.eventsMondayLive ? ' If you go to events, you can also get your city’s week every Monday morning; there is a box for it on the board.' : ''}`,
    ],
    ctx,
  )
  return { ...SERIES_COPY['3'], html: shell('3', 'Between editions', inner, ctx), text }
}

function email3b(ctx: SeriesContext): RenderedSeriesEmail {
  const text = [
    'Hey —',
    '',
    'You signed up for FundOps Daily last week. I can’t always tell whether it is arriving where you read mail, so a quick check:',
    '',
    '- If it has been landing in Promotions, spam or a filtered folder, moving one edition to your main inbox fixes it from then on.',
    '- If it isn’t useful, the unsubscribe link is below and works in one click. No hard feelings.',
    '- If something would make it worth opening, reply and tell me. I read every reply.',
    '',
    'Danny',
    '',
    `Unsubscribe: ${ctx.unsubscribeUrl}`,
    '',
  ].join('\n')
  return { ...SERIES_COPY['3b'], html: null, text }
}

function email4(ctx: SeriesContext): RenderedSeriesEmail {
  const r = ctx.audience?.readers
  const f = ctx.audience?.firms
  const reach = r != null && f != null && r > 0 && f > 0 ? `It now goes to ${r.toLocaleString('en-US')} readers at ${f.toLocaleString('en-US')} firms: GPs, LPs, and fund service providers.` : null
  const mailto = shareMailto()
  const inner =
    p(`Ten days in. This list grows almost entirely by one reader passing it to another, so if a colleague in ops, finance, IR, compliance or deals would use it, the button below writes the email for you. They sign up in one field at ${site('/join')}.`) +
    button(mailto, 'Forward to a colleague') +
    (reach ? p(reach) : '') +
    p('Two things you may not know:') +
    `              <ul style="margin:0 0 20px;padding-left:22px;color:${INK};font-size:15px;line-height:1.7;font-family:${FONT_SANS};">
                <li style="margin-bottom:8px;"><strong>Send us your news.</strong> A close, a hire, a launch: ${site('/submit')}. We check it and run it if it is news.</li>
                <li><strong>Replies come to me</strong>, and still will after this series ends. That&rsquo;s the last of these notes; from here it&rsquo;s just the morning edition.</li>
              </ul>
`
  const ps = `
              <p style="margin:24px 0 0;color:${INK_MUTED};font-size:14px;line-height:1.7;font-family:${FONT_SANS};">
                P.S. Want your firm in front of these readers? If it sells to GPs, LPs, and fund service providers, the email takes one sponsor a week, booked at ${site('/sponsor')}.
              </p>`
  const text = [
    'Hey —',
    '',
    'Ten days in. This list grows almost entirely by one reader passing it to another, so if a colleague in ops, finance, IR, compliance or deals would use it, forward this or send them the sign-up link. They sign up in one field:',
    JOIN_URL,
    '',
    ...(reach ? [reach, ''] : []),
    'Two things you may not know:',
    '- Send us your news. A close, a hire, a launch: https://fundopshq.com/submit. We check it and run it if it is news.',
    '- Replies come to me, and still will after this series ends. That’s the last of these notes; from here it’s just the morning edition.',
    '',
    'Danny',
    '',
    'P.S. Want your firm in front of these readers? If it sells to GPs, LPs, and fund service providers, the email takes one sponsor a week, booked at https://fundopshq.com/sponsor',
    ...textFooter(ctx),
  ].join('\n')
  return { ...SERIES_COPY['4'], html: shell('4', 'Who else on your team should see this?', inner, ctx, ps), text }
}

const RENDER: Record<WelcomeEmailKey, (ctx: SeriesContext) => RenderedSeriesEmail> = { '1': email1, '2': email2, '3': email3, '3b': email3b, '4': email4 }

export function renderSeriesEmail(key: WelcomeEmailKey, ctx: SeriesContext): RenderedSeriesEmail {
  return RENDER[key](ctx)
}
