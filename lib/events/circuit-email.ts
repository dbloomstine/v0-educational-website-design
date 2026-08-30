import { getSupabaseAdmin } from '@/lib/supabase/client'
import { formatEventDates, formatEventLocation } from './constants'
import type { IndustryEvent } from './types'

// "The Circuit" — weekly events digest. Sections: This Week, Next Week,
// Just Announced. Rendered per the newsletter template rules in
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

  // Per Danny (2026-08-29): the email is the NORTH AMERICA edition for now —
  // the board stays global, but the weekly digest covers US/Canada (+ virtual
  // events from NA organizers, which share the region). Widen deliberately
  // later, not by accident.
  const base = () =>
    supabase
      .from('industry_events')
      .select('*')
      .eq('status', 'published')
      .eq('region', 'north_america')
      .order('start_date', { ascending: true })

  const [thisWeekRes, nextWeekRes, freshRes, countRes] = await Promise.all([
    base().gte('start_date', today).lte('start_date', plus(7)).limit(30),
    base().gt('start_date', plus(7)).lte('start_date', plus(14)).limit(30),
    // "Just Announced" = added in the last week but happening beyond the two-week
    // window (near-term adds already show in the sections above)
    supabase
      .from('industry_events')
      .select('*')
      .eq('status', 'published')
      .eq('region', 'north_america')
      .gt('start_date', plus(14))
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('industry_events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('region', 'north_america')
      .gte('start_date', today),
  ])

  const thisWeek = (thisWeekRes.data ?? []).map(mapRow)
  const nextWeek = (nextWeekRes.data ?? []).map(mapRow)
  const nearIds = new Set([...thisWeek, ...nextWeek].map((e) => e.id))
  const freshAdds = (freshRes.data ?? []).map(mapRow).filter((e) => !nearIds.has(e.id)).slice(0, 8)

  return { thisWeek, nextWeek, freshAdds, totalUpcoming: countRes.count ?? 0 }
}

// Gary's Guide idiom, per Danny's direction: dense three-column rows
// (date | price | linked title + one detail line), no hero, no cards, no
// background colors — plain text that Gmail dark mode inverts naturally.
const TEXT = '#222222'
const MUTED = '#666666'
const LINK = '#2b6cb0'

const COST_SHORT: Record<string, string> = {
  free: 'Free',
  paid: 'Paid',
  member_only: 'Mmbr',
  invite_only: 'Inv',
  mixed: 'Mixed',
}

// Verbose time notes ("8:15 AM registration; 8:30-9:30 AM session") wreck the
// date column — compress to a start time + timezone ("8:15am ET"), or nothing.
function compactTime(timeNote: string | null): string | null {
  if (!timeNote) return null
  const m = timeNote.match(/(\d{1,2})(?::(\d{2}))?\s?(am|pm)/i)
  if (!m) return null
  const tz = timeNote.match(/\b(ET|EST|EDT|CT|PT|PST|PDT|GMT|BST|CET|CEST|HKT|SGT|JST|AEST)\b/i)
  return `${m[1]}${m[2] ? `:${m[2]}` : ''}${m[3].toLowerCase()}${tz ? ` ${tz[1].toUpperCase()}` : ''}`
}

function eventLine(e: IndustryEvent): string {
  const dates = formatEventDates(e.startDate, e.endDate)
  const where = e.eventFormat === 'virtual' ? 'Virtual' : formatEventLocation(e)
  const time = compactTime(e.timeNote)
  return `
    <tr>
      <td style="padding:6px 8px 6px 0;border-bottom:1px solid #dddddd;vertical-align:top;white-space:nowrap;font-size:11px;color:${MUTED};width:76px;">${dates}${time ? `<br><span style="font-size:10px;">${time}</span>` : ''}</td>
      <td style="padding:6px 8px 6px 0;border-bottom:1px solid #dddddd;vertical-align:top;white-space:nowrap;font-size:11px;color:${MUTED};width:36px;">${COST_SHORT[e.costType] ?? 'Paid'}</td>
      <td style="padding:6px 0;border-bottom:1px solid #dddddd;vertical-align:top;font-size:13px;line-height:1.3;">
        <a href="https://fundopshq.com/events/${e.slug}" style="color:${LINK};text-decoration:none;font-weight:bold;">${escapeHtml(e.name)}</a><br>
        <span style="font-size:11px;color:${MUTED};"><b style="font-weight:600;color:${TEXT};">${escapeHtml(e.organizerName)}</b> · ${escapeHtml(where)}</span>
      </td>
    </tr>`
}

function section(title: string, events: IndustryEvent[]): string {
  if (events.length === 0) return ''
  return `
    <tr><td style="padding:14px 0 3px 0;font-size:13px;font-weight:bold;color:${TEXT};border-bottom:1px solid #999999;">${title}</td></tr>
    <tr><td style="padding:2px 0 0 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${events.map(eventLine).join('')}</table></td></tr>`
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function renderCircuitEmail(content: CircuitContent, unsubscribeUrl: string): string {
  const dateLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>The Circuit</title>
</head>
<body style="margin:0;padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td align="center" style="padding:8px 4px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;">
<tr><td style="font-family:Arial,Helvetica,sans-serif;color:${TEXT};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td style="font-size:13px;font-weight:bold;color:${TEXT};padding-bottom:2px;">FundOpsHQ — The Circuit</td>
      <td align="right" style="font-size:12px;color:${MUTED};">${dateLabel}</td>
    </tr>
  </table>
  <div style="font-size:12px;color:${MUTED};border-bottom:2px solid #999999;padding-bottom:5px;">
    The week ahead in private markets events. ${content.totalUpcoming} verified events on
    <a href="https://fundopshq.com/events" style="color:${LINK};text-decoration:none;font-weight:bold;">the board</a>
    · <a href="https://fundopshq.com/events/submit" style="color:${LINK};text-decoration:none;font-weight:bold;">submit an event</a>
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    ${section('THIS WEEK', content.thisWeek)}
    ${section('NEXT WEEK', content.nextWeek)}
    ${section('JUST ANNOUNCED', content.freshAdds)}
  </table>
  <div style="margin-top:14px;padding:8px 10px;border:1px solid #999999;font-size:12px;line-height:1.45;color:${TEXT};">
    <b>Hosting an event?</b> Listings are free and dates get verified before publishing —
    <a href="https://fundopshq.com/events/submit" style="color:${LINK};text-decoration:none;font-weight:bold;">submit it here</a>.
  </div>
  <div style="margin-top:10px;border-top:1px solid #999999;padding-top:8px;font-size:11px;line-height:1.5;color:${MUTED};">
    You get The Circuit because you subscribe to FundOps Daily.
    <a href="${unsubscribeUrl}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a>
    · FundOpsHQ
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
