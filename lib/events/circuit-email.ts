import { getSupabaseAdmin } from '@/lib/supabase/client'
import { formatEventDates, formatEventLocation, COST_LABELS } from './constants'
import type { IndustryEvent } from './types'

// "The Circuit" — weekly events digest. Sections: This Week, Next Week,
// Fresh on the Board. Rendered per the newsletter template rules in
// CLAUDE.md: every <a> carries an inline color + text-decoration, sizes stay
// far under the ~102KB Gmail clip line (this email is a fraction of it).
//
// SHIPS DARK: send mode is gated by CIRCUIT_ENABLED in the route. Until
// Danny flips it, each weekly cron delivers a [PREVIEW] to his inbox only.

interface CircuitContent {
  thisWeek: IndustryEvent[]
  nextWeek: IndustryEvent[]
  freshAdds: IndustryEvent[]
  totalUpcoming: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): IndustryEvent {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    eventUrl: row.event_url,
    registrationUrl: row.registration_url,
    organizerName: row.organizer_name,
    organizerType: row.organizer_type,
    startDate: row.start_date,
    endDate: row.end_date,
    timeNote: row.time_note,
    city: row.city,
    stateRegion: row.state_region,
    country: row.country,
    venue: row.venue,
    eventFormat: row.event_format,
    eventKind: row.event_kind,
    costType: row.cost_type,
    priceNote: row.price_note,
    fundCategories: row.fund_categories ?? [],
    topics: row.topics ?? [],
    opsRelevance: row.ops_relevance,
    region: row.region,
    isFeatured: row.is_featured ?? false,
    expectedAttendance: row.expected_attendance ?? null,
  }
}

export async function queryCircuitContent(): Promise<CircuitContent> {
  const supabase = getSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  const plus = (days: number) => new Date(Date.now() + days * 86400000).toISOString().split('T')[0]

  const base = () =>
    supabase
      .from('industry_events')
      .select('*')
      .eq('status', 'published')
      .order('start_date', { ascending: true })

  const [thisWeekRes, nextWeekRes, freshRes, countRes] = await Promise.all([
    base().gte('start_date', today).lte('start_date', plus(7)).limit(30),
    base().gt('start_date', plus(7)).lte('start_date', plus(14)).limit(30),
    // "Fresh" = added in the last week but happening beyond the two-week
    // window (near-term adds already show in the sections above)
    supabase
      .from('industry_events')
      .select('*')
      .eq('status', 'published')
      .gt('start_date', plus(14))
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('industry_events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('start_date', today),
  ])

  const thisWeek = (thisWeekRes.data ?? []).map(mapRow)
  const nextWeek = (nextWeekRes.data ?? []).map(mapRow)
  const nearIds = new Set([...thisWeek, ...nextWeek].map((e) => e.id))
  const freshAdds = (freshRes.data ?? []).map(mapRow).filter((e) => !nearIds.has(e.id)).slice(0, 8)

  return { thisWeek, nextWeek, freshAdds, totalUpcoming: countRes.count ?? 0 }
}

const AMBER = '#d4a72c'
const INK = '#1a2338'
const MUTED = '#5b6577'
const GREEN = '#1a7f4f'

function eventLine(e: IndustryEvent): string {
  const dates = formatEventDates(e.startDate, e.endDate)
  const where = e.eventFormat === 'virtual' ? `Virtual${e.timeNote ? ` · ${e.timeNote}` : ''}` : formatEventLocation(e)
  const cost =
    e.costType === 'free'
      ? `<span style="color:${GREEN};font-weight:600;">Free</span>`
      : (COST_LABELS[e.costType] ?? COST_LABELS.paid).label
  return `
    <tr>
      <td style="padding:7px 0;border-bottom:1px solid #e8eaf0;vertical-align:top;white-space:nowrap;font-family:'Courier New',monospace;font-size:12px;color:${MUTED};width:86px;">${dates}</td>
      <td style="padding:7px 0 7px 12px;border-bottom:1px solid #e8eaf0;vertical-align:top;">
        <a href="https://fundopshq.com/events/${e.slug}" style="color:${INK};text-decoration:none;font-weight:600;font-size:14px;">${escapeHtml(e.name)}</a>
        <div style="font-size:12px;color:${MUTED};padding-top:1px;">${escapeHtml(e.organizerName)} · ${escapeHtml(where)} · ${cost}</div>
      </td>
    </tr>`
}

function section(title: string, events: IndustryEvent[]): string {
  if (events.length === 0) return ''
  return `
    <tr><td style="padding:26px 0 6px 0;">
      <div style="font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${AMBER};border-bottom:2px solid ${INK};padding-bottom:6px;">${title}</div>
    </td></tr>
    <tr><td><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${events.map(eventLine).join('')}</table></td></tr>`
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function renderCircuitEmail(content: CircuitContent, unsubscribeUrl: string): string {
  const dateLabel = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>The Circuit</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f5f7;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border:1px solid #e2e5ec;">
<tr><td style="padding:28px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td style="font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${MUTED};">FundOpsHQ · Section B</td>
      <td align="right" style="font-family:'Courier New',monospace;font-size:11px;color:${MUTED};">${dateLabel}</td>
    </tr>
  </table>
  <h1 style="margin:14px 0 4px 0;font-size:30px;line-height:1.1;color:${INK};font-family:Georgia,'Times New Roman',serif;">The Circuit</h1>
  <p style="margin:0 0 4px 0;font-size:14px;line-height:1.5;color:${MUTED};">
    The week ahead in private markets events — every date verified at the source.
    ${content.totalUpcoming} events on <a href="https://fundopshq.com/events" style="color:${AMBER};text-decoration:none;font-weight:600;">the board</a>.
  </p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    ${section('This Week', content.thisWeek)}
    ${section('Next Week', content.nextWeek)}
    ${section('Fresh on the Board', content.freshAdds)}
  </table>
  <p style="margin:28px 0 0 0;font-size:13px;color:${MUTED};">
    Traveling? Filter by city on <a href="https://fundopshq.com/events" style="color:${AMBER};text-decoration:none;font-weight:600;">fundopshq.com/events</a> —
    or <a href="https://fundopshq.com/events/submit" style="color:${AMBER};text-decoration:none;font-weight:600;">submit an event</a> we&#39;re missing.
  </p>
</td></tr>
<tr><td style="padding:24px 32px 28px 32px;font-family:Arial,Helvetica,sans-serif;">
  <div style="border-top:1px solid #e8eaf0;padding-top:14px;font-size:11px;line-height:1.6;color:#8b93a3;">
    You&#39;re getting The Circuit because you subscribe to FundOps Daily.
    <a href="${unsubscribeUrl}" style="color:#8b93a3;text-decoration:underline;">Unsubscribe</a>
    · FundOpsHQ · New York
  </div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

export async function sendCircuitEmail(resendApiKey: string): Promise<{
  ok: boolean
  mode: 'preview' | 'list'
  sent: number
  totalUpcoming: number
  errors: string[]
}> {
  const supabase = getSupabaseAdmin()
  const content = await queryCircuitContent()
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'feedback@fundopshq.com'
  const enabled = process.env.CIRCUIT_ENABLED === 'true'
  const subject = `The Circuit — ${content.thisWeek.length} events this week, ${content.nextWeek.length} next`
  const errors: string[] = []

  if (!enabled) {
    // Ships dark: preview to Danny only, every week, until he flips the flag.
    const html = renderCircuitEmail(content, 'https://fundopshq.com/events')
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `The Circuit <${fromEmail}>`,
        to: 'dbloomstine@gmail.com',
        reply_to: 'dbloomstine@gmail.com',
        subject: `[PREVIEW] ${subject}`,
        html,
      }),
    })
    if (!res.ok) errors.push(`Resend preview error ${res.status}: ${(await res.text()).slice(0, 200)}`)
    return { ok: errors.length === 0, mode: 'preview', sent: errors.length === 0 ? 1 : 0, totalUpcoming: content.totalUpcoming, errors }
  }

  const { data: subscribers, error: subError } = await supabase
    .from('newsletter_subscribers')
    .select('email, unsubscribe_token')
    .eq('status', 'confirmed')
  if (subError || !subscribers?.length) {
    return { ok: false, mode: 'list', sent: 0, totalUpcoming: content.totalUpcoming, errors: [subError?.message ?? 'no confirmed subscribers'] }
  }

  // Same O(1)-render pattern as send-daily: render once with a sentinel,
  // string-replace the personalized unsubscribe URL per recipient.
  const UNSUB_SENTINEL = '__FUNDOPS_CIRCUIT_UNSUB__'
  const templateHtml = renderCircuitEmail(content, UNSUB_SENTINEL)

  const emails = subscribers.map((sub) => {
    const unsubscribeUrl = `https://fundopshq.com/api/newsletter/unsubscribe?token=${sub.unsubscribe_token}`
    return {
      from: `The Circuit <${fromEmail}>`,
      to: sub.email,
      reply_to: 'dbloomstine@gmail.com',
      subject,
      html: templateHtml.replaceAll(UNSUB_SENTINEL, unsubscribeUrl),
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }
  })

  let sent = 0
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100)
    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      })
      if (!res.ok) {
        errors.push(`Resend batch error ${res.status}: ${(await res.text()).slice(0, 200)}`)
      } else {
        sent += batch.length
      }
    } catch (err) {
      errors.push(`Resend batch exception: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { ok: sent > 0, mode: 'list', sent, totalUpcoming: content.totalUpcoming, errors }
}
