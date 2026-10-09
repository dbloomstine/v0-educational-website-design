/**
 * The emails of the sponsorship desk: to a prospect (we have your request;
 * you are booked; not this time) and to the owner (a request to approve; a
 * reader looked at the sponsor page; a request still waiting).
 *
 * Plain on purpose. They are letters, not editions, and each has one thing to
 * say. Every value a stranger typed is escaped before it goes in.
 */
import { packageOf, longDay, usd } from './packages'

const INK = '#1E3A5F'
const CREAM = '#F8F5EC'
const AMBER = '#E6B045'
const MUTED = '#5A6B82'
const SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif`
const SERIF = `Georgia, 'Times New Roman', Times, serif`
const SITE = 'https://fundopshq.com'

export const OWNER_EMAIL = () => process.env.SPONSOR_NOTIFY_EMAIL || process.env.PIPELINE_ALERT_EMAIL || 'dbloomstine@gmail.com'
const FROM = 'FundOps Daily Sponsorship <sponsor@fundopshq.com>'

export const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export interface RequestRow {
  id: string
  created_at: string
  status: string
  package: string
  price_usd: number
  starts_on: string
  ends_on: string
  company: string
  contact_name: string
  email: string
  website: string
  tagline: string | null
  blurb: string
  cta_url: string
  cta_text: string | null
  logo_link: string | null
  logo_width?: number | null
  notes: string | null
  arrived_from: string | null
  action_token: string
  decided_at: string | null
  booking_id: string | null
  reminded_at: string | null
}

const p = (html: string) => `<p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK};">${html}</p>`
const button = (href: string, label: string, solid = true) =>
  `<a href="${esc(href)}" style="display:inline-block;font-family:${SANS};font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;padding:12px 20px;border-radius:2px;margin:0 8px 8px 0;${solid ? `background:${AMBER};color:#13233A;` : `background:#fff;color:${INK};border:1px solid ${INK};`}">${esc(label)}</a>`
const row = (label: string, value: string) =>
  `<tr><td style="padding:6px 14px 6px 0;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${MUTED};vertical-align:top;white-space:nowrap;">${esc(label)}</td><td style="padding:6px 0;font-family:${SANS};font-size:14.5px;line-height:1.5;color:${INK};">${value}</td></tr>`

function letter(title: string, body: string): string {
  return `<!doctype html><html lang="en"><body style="margin:0;padding:0;background:${CREAM};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFDF8;border:1px solid #DDD5C3;">
<tr><td style="background:${INK};border-left:4px solid ${AMBER};padding:12px 20px;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${CREAM};">FundOps Daily &nbsp;·&nbsp; Sponsorship</td></tr>
<tr><td style="padding:24px 24px 14px;">
<h1 style="margin:0 0 16px;font-family:${SERIF};font-size:24px;line-height:1.2;font-weight:700;color:${INK};">${title}</h1>
${body}
</td></tr>
<tr><td style="padding:0 24px 22px;font-family:${SANS};font-size:12px;line-height:1.5;color:${MUTED};">FundOpsHQ · <a href="${SITE}/sponsor" style="color:${MUTED};">fundopshq.com/sponsor</a></td></tr>
</table></td></tr></table></body></html>`
}

const runLine = (r: RequestRow) => {
  const pkg = packageOf(r.package)
  return `${esc(pkg?.name ?? r.package)}, ${esc(longDay(r.starts_on))} to ${esc(longDay(r.ends_on))} · ${esc(usd(r.price_usd))}`
}
const adTable = (r: RequestRow) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 16px;border-top:1px solid #DDD5C3;border-bottom:1px solid #DDD5C3;width:100%;">
${row('Run', runLine(r))}
${row('Firm', esc(r.company))}
${r.tagline ? row('One line', esc(r.tagline)) : ''}
${row('Copy', esc(r.blurb))}
${row('Link', `<a href="${esc(r.cta_url)}" style="color:${INK};">${esc(r.cta_url)}</a>${r.cta_text ? ` &nbsp;(button: ${esc(r.cta_text)})` : ''}`)}
${row('Logo', r.logo_link ? `<a href="${esc(r.logo_link)}" style="color:${INK};">uploaded</a>` : 'none sent: the firm’s name is set as a wordmark')}
</table>`

/** How a sponsor pays for a package, if a payment link has been set for it (a Stripe Payment Link, in the environment). */
export function payUrl(packageId: string): string | null {
  const v = process.env[`SPONSOR_PAY_URL_${packageId.toUpperCase()}`]
  return v && /^https:\/\//.test(v) ? v : null
}

export interface Mail {
  to: string
  subject: string
  html: string
  replyTo: string
}

/** To the prospect, the moment they submit. */
export function receivedMail(r: RequestRow): Mail {
  return {
    to: r.email,
    replyTo: OWNER_EMAIL(),
    subject: `We have your sponsorship request: ${r.company}`,
    html: letter(
      'We have your request.',
      `${p(`Hi ${esc(r.contact_name.split(' ')[0])},`)}
${p('Thanks for asking to sponsor FundOps Daily. This is what you sent:')}
${adTable(r)}
${p('<b>What happens next.</b> We read every ad before it runs, and you will have a yes or a no within one business day. Nothing is charged and nothing runs until then. If we say yes, the dates are yours and we send an invoice.')}
${p('To change anything, just reply to this email.')}
${p('Danny Bloomstine<br>FundOpsHQ')}`,
    ),
  }
}

/** To the owner: everything needed to decide, and the two links that decide it. */
export function decideMail(r: RequestRow): Mail {
  const link = `${SITE}/sponsor/decide?token=${r.action_token}`
  return {
    to: OWNER_EMAIL(),
    replyTo: r.email,
    subject: `Sponsor request: ${r.company}, ${packageOf(r.package)?.name.toLowerCase() ?? r.package} from ${longDay(r.starts_on)} (${usd(r.price_usd)})`,
    html: letter(
      `${esc(r.company)} wants to sponsor.`,
      `${p(`${esc(r.contact_name)} &lt;<a href="mailto:${esc(r.email)}" style="color:${INK};">${esc(r.email)}</a>&gt; · <a href="${esc(r.website)}" style="color:${INK};">${esc(r.website)}</a>`)}
${adTable(r)}
${r.notes ? p(`<b>Their note:</b> ${esc(r.notes)}`) : ''}
${r.arrived_from ? p(`<span style="color:${MUTED};font-size:13px;">Reached the site from: ${esc(r.arrived_from)}</span>`) : ''}
${p('Open the request to see the ad as it would run, then approve or decline. Approving books the dates and tells them; declining tells them politely. Nothing happens until you press one.')}
<p style="margin:6px 0 10px;">${button(link, 'Review, then approve or decline')}</p>
${p(`<span style="color:${MUTED};font-size:13px;">Replying to this email writes to ${esc(r.contact_name)} directly.</span>`)}`,
    ),
  }
}

/** To the prospect, on a yes. */
export function approvedMail(r: RequestRow): Mail {
  const pay = payUrl(r.package)
  return {
    to: r.email,
    replyTo: OWNER_EMAIL(),
    subject: `You are booked: FundOps Daily, from ${longDay(r.starts_on)}`,
    html: letter(
      'You are booked.',
      `${p(`Hi ${esc(r.contact_name.split(' ')[0])},`)}
${p(`${esc(r.company)} is the sponsor of FundOps Daily from <b>${esc(longDay(r.starts_on))}</b> to <b>${esc(longDay(r.ends_on))}</b>: at the top and the foot of every edition, and on every news page of the site. The dates are yours alone.`)}
${adTable(r)}
${
  pay
    ? `${p(`<b>Payment.</b> ${esc(usd(r.price_usd))}, by card, before the first edition:`)}<p style="margin:0 0 14px;">${button(pay, `Pay ${usd(r.price_usd)}`)}</p>`
    : p(`<b>Payment.</b> ${esc(usd(r.price_usd))}, by invoice. Danny will send it to this address; there is nothing you need to do now, and your run starts on its date either way.`)
}
${p(r.logo_link ? 'Your logo is in place.' : '<b>Your logo.</b> Reply with a PNG and we will place it; until then your firm’s name is set as a wordmark.')}
${p('Want to change the copy before or during the run? Reply with the new wording. At the end of the run you get a short report: editions sent, opens and clicks.')}
${p('Thank you for backing the brief.')}
${p('Danny Bloomstine<br>FundOpsHQ')}`,
    ),
  }
}

/** To the prospect, on a no. */
export function declinedMail(r: RequestRow): Mail {
  return {
    to: r.email,
    replyTo: OWNER_EMAIL(),
    subject: `Your FundOps Daily sponsorship request`,
    html: letter(
      'Not this time.',
      `${p(`Hi ${esc(r.contact_name.split(' ')[0])},`)}
${p(`Thank you for asking to sponsor FundOps Daily. We are not able to run this one for the dates you asked for (${esc(longDay(r.starts_on))}). Nothing has been charged.`)}
${p('If different dates or different copy would work for you, reply to this email and we will look again.')}
${p('Danny Bloomstine<br>FundOpsHQ')}`,
    ),
  }
}

/** To the owner: a request has waited a day. */
export function reminderMail(rows: RequestRow[]): Mail {
  return {
    to: OWNER_EMAIL(),
    replyTo: OWNER_EMAIL(),
    subject: `${rows.length} sponsor request${rows.length === 1 ? '' : 's'} waiting for you`,
    html: letter(
      'Still waiting for a yes or a no.',
      rows
        .map((r) => `${p(`<b>${esc(r.company)}</b> · ${runLine(r)}<br><span style="color:${MUTED};font-size:13px;">sent ${esc(new Date(r.created_at).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))} ET</span>`)}<p style="margin:0 0 18px;">${button(`${SITE}/sponsor/decide?token=${r.action_token}`, 'Review')}</p>`)
        .join(''),
    ),
  }
}

/** To the owner: one of the readers opened the sponsor page from their own copy of the email. */
export function interestMail(reader: { email: string; role: string | null; since: string | null }, visits: number): Mail {
  const domain = reader.email.split('@')[1] ?? ''
  return {
    to: OWNER_EMAIL(),
    replyTo: OWNER_EMAIL(),
    subject: `A reader at ${domain} looked at the sponsor page`,
    html: letter(
      'A reader is looking at sponsorship.',
      `${p(`<b>${esc(reader.email)}</b> opened the sponsor page from the link in their own copy of FundOps Daily.`)}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 16px;">
${row('Firm', esc(domain))}
${reader.role ? row('Says they are', esc(reader.role.replace('_', ' '))) : ''}
${reader.since ? row('Subscribed', esc(new Date(reader.since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))) : ''}
${row('Visits on record', String(visits))}
</table>
${p(`<span style="color:${MUTED};font-size:13px;">A forwarded copy would show the person who forwarded it. You are told at most once a week about the same reader.</span>`)}`,
    ),
  }
}

/** Sends one letter through Resend. Never throws: a letter that fails is logged, and what it reported on still stands. */
export async function send(mail: Mail, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.error('[sponsor mail] RESEND_API_KEY is not set; not sent:', mail.subject)
    return false
  }
  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: mail.to, reply_to: mail.replyTo, subject: mail.subject, html: mail.html }),
    })
    if (!res.ok) console.error('[sponsor mail] Resend said', res.status, (await res.text()).slice(0, 200))
    return res.ok
  } catch (err) {
    console.error('[sponsor mail] could not be sent:', err instanceof Error ? err.message : err)
    return false
  }
}
