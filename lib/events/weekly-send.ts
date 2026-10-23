/**
 * Sends the Monday events email (lib/events/weekly-email.ts) through Resend, behind EVENTS_WEEKLY_MODE
 * (lib/events/weekly-mode.ts). Called by /api/pipeline/events-weekly.
 *
 *   off      returns at once: no read, no send.
 *   preview  ONE email to the owner, marked [PREVIEW], drawn for the city most of the opted-in readers follow,
 *            with a line saying how many readers it would have gone to. Nothing to readers.
 *   live     every confirmed subscriber whose interests carry the events tag, each with their city first.
 *
 * A week's send is recorded in `events_weekly_sends` (supabase/migrations/20261022_events_weekly_sends.sql), one
 * row per Monday and mode; a second run that week is turned away unless the first failed outright. Without the
 * table the run refuses to send.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { IndustryEvent } from './types'
import { queryEventFeed } from './api'
import { newYorkToday } from './highlights'
import type { EventsWeeklyMode } from './weekly-mode'
import {
  cityKey,
  mondayOf,
  planForReader,
  renderWeeklyEmail,
  renderWeeklyText,
  selectWeeklyEvents,
  weeklySubject,
} from './weekly-email'
import { readerCitySlugs, wantsEventsEmail } from '@/lib/newsletter/interests'
import { readerFromEmail, readerReplyTo } from '@/lib/newsletter/sender'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

export const WEEKLY_SENDS_TABLE = 'events_weekly_sends'
export const OWNER_EMAIL = 'dbloomstine@gmail.com'

export interface WeeklyReader {
  id?: string
  email: string
  unsubscribe_token: string
  interests?: string[] | null
}

export interface WeeklyRunResult {
  ok: boolean
  mode: EventsWeeklyMode
  weekOf?: string
  skipped?: string
  readers?: number
  sent?: number
  thisWeek?: number
  nextWeek?: number
  errors?: string[]
  error?: string
}

export function eventsUnsubscribeUrl(token: string): string {
  return `https://fundopshq.com/api/newsletter/events-unsubscribe?token=${encodeURIComponent(token)}`
}

export function unsubscribeAllUrl(token: string): string {
  return `https://fundopshq.com/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`
}

/** The readers who asked for the events, of the rows read (the query already narrows; this is the rule). */
export function pickWeeklyReaders<T extends { interests?: unknown; email?: unknown; unsubscribe_token?: unknown }>(rows: T[]): T[] {
  const seen = new Set<string>()
  return rows.filter((r) => {
    const email = typeof r.email === 'string' ? r.email.trim().toLowerCase() : ''
    if (!email || typeof r.unsubscribe_token !== 'string' || !r.unsubscribe_token) return false
    if (!wantsEventsEmail(r.interests) || seen.has(email)) return false
    seen.add(email)
    return true
  })
}

/** The city slug most opted-in readers follow (ties: alphabetical), for the owner's preview; null when none follows one. */
export function commonestCity(readers: WeeklyReader[]): string | null {
  const counts = new Map<string, number>()
  for (const r of readers) for (const c of readerCitySlugs(r.interests)) counts.set(c, (counts.get(c) ?? 0) + 1)
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  return ranked[0]?.[0] ?? null
}

/** The board's upcoming events for the next two weeks (the email cuts them to this week and next). */
export async function loadUpcomingEvents(): Promise<IndustryEvent[]> {
  const feed = await queryEventFeed({ when: '2w', limit: 200 })
  return feed.events
}

async function readReaders(db: DbClient): Promise<{ readers: WeeklyReader[]; error?: string }> {
  const { data, error } = await db
    .from('newsletter_subscribers')
    .select('id, email, unsubscribe_token, interests')
    .eq('status', 'confirmed')
    .contains('interests', ['events'])
  if (error) return { readers: [], error: error.message }
  return { readers: pickWeeklyReaders((data ?? []) as WeeklyReader[]) }
}

/**
 * Takes this week's row for the mode. 'ok' to go on; 'taken' when a run already sent (or is sending); an error
 * string when the table cannot be written (most likely the migration is not applied).
 */
async function claimWeek(db: DbClient, weekOf: string, mode: 'preview' | 'live'): Promise<'ok' | 'taken' | { error: string }> {
  const ins = await db.from(WEEKLY_SENDS_TABLE).insert({ week_of: weekOf, mode, status: 'sending' })
  if (!ins.error) return 'ok'
  if (ins.error.code !== '23505') {
    return { error: `${WEEKLY_SENDS_TABLE} could not be written (apply supabase/migrations/20261022_events_weekly_sends.sql): ${ins.error.message}` }
  }
  const { data } = await db.from(WEEKLY_SENDS_TABLE).select('status').eq('week_of', weekOf).eq('mode', mode).maybeSingle()
  if ((data as { status?: string } | null)?.status !== 'failed') return 'taken'
  const up = await db.from(WEEKLY_SENDS_TABLE).update({ status: 'sending', error_message: null }).eq('week_of', weekOf).eq('mode', mode).eq('status', 'failed')
  return up.error ? { error: up.error.message } : 'ok'
}

interface OutgoingEmail {
  from: string
  to: string
  reply_to: string
  subject: string
  html: string
  text: string
  headers?: Record<string, string>
}

async function sendBatches(
  emails: OutgoingEmail[],
  resendApiKey: string,
  fetchFn: typeof fetch,
): Promise<{ sent: number; ids: Record<string, string>; errors: string[] }> {
  let sent = 0
  const ids: Record<string, string> = {}
  const errors: string[] = []
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100)
    try {
      const res = await fetchFn('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      })
      if (!res.ok) {
        errors.push(`Resend batch error ${res.status}: ${(await res.text()).slice(0, 200)}`)
        continue
      }
      sent += batch.length
      const data = (await res.json().catch(() => null)) as { data?: Array<{ id?: string }> } | null
      data?.data?.forEach((d, j) => {
        if (d?.id && batch[j]) ids[batch[j].to] = d.id
      })
    } catch (err) {
      errors.push(`Resend batch exception: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  return { sent, ids, errors }
}

export async function runEventsWeekly(opts: {
  db: DbClient
  mode: EventsWeeklyMode
  resendApiKey: string
  now?: Date
  loadEvents?: () => Promise<IndustryEvent[]>
  fetchFn?: typeof fetch
}): Promise<WeeklyRunResult> {
  const { db, mode, resendApiKey } = opts
  if (mode === 'off') return { ok: true, mode, skipped: 'off' }

  const now = opts.now ?? new Date()
  const fetchFn = opts.fetchFn ?? fetch
  const todayIso = newYorkToday(now)
  const weekOf = mondayOf(todayIso)

  const week = selectWeeklyEvents(await (opts.loadEvents ?? loadUpcomingEvents)(), todayIso)
  const counts = { thisWeek: week.thisWeek.length, nextWeek: week.nextWeek.length }
  if (counts.thisWeek + counts.nextWeek === 0) return { ok: true, mode, weekOf, skipped: 'no_events', ...counts }

  const { readers, error: readError } = await readReaders(db)
  if (readError) return { ok: false, mode, weekOf, error: `reading subscribers: ${readError}`, ...counts }
  if (mode === 'live' && readers.length === 0) return { ok: true, mode, weekOf, skipped: 'no_readers', readers: 0, ...counts }

  const claim = await claimWeek(db, weekOf, mode)
  if (claim === 'taken') return { ok: true, mode, weekOf, skipped: 'already_sent', readers: readers.length, ...counts }
  if (claim !== 'ok') return { ok: false, mode, weekOf, error: claim.error, readers: readers.length, ...counts }

  const fromEmail = readerFromEmail()
  const from = `FundOpsHQ Events <${fromEmail}>`
  const EVENTS_UNSUB = '__FUNDOPS_EVENTS_UNSUB__'
  const ALL_UNSUB = '__FUNDOPS_ALL_UNSUB__'

  let emails: OutgoingEmail[]
  let firstSubject = ''
  if (mode === 'preview') {
    const city = commonestCity(readers)
    const plan = planForReader(week, city ? [city] : [])
    const cityCount = city ? readers.filter((r) => readerCitySlugs(r.interests).includes(city)).length : 0
    const params = {
      plan,
      todayIso,
      eventsUnsubscribeUrl: 'https://fundopshq.com/events',
      unsubscribeAllUrl: 'https://fundopshq.com/events',
      previewNote: `Preview (EVENTS_WEEKLY_MODE=preview): in live mode this would go to ${readers.length} reader${readers.length === 1 ? '' : 's'}; drawn for ${city ? `${city}, followed by ${cityCount}` : 'a reader with no city'}. The links at the foot are placeholders.`,
    }
    firstSubject = weeklySubject(plan)
    emails = [{ from, to: OWNER_EMAIL, reply_to: OWNER_EMAIL, subject: `[PREVIEW] ${firstSubject}`, html: renderWeeklyEmail(params), text: renderWeeklyText(params) }]
  } else {
    // One render per set of cities, then each reader's own links swapped in (the daily's pattern).
    const renders = new Map<string, { subject: string; html: string; text: string }>()
    emails = readers.map((r) => {
      const cities = readerCitySlugs(r.interests)
      const key = cityKey(cities)
      let render = renders.get(key)
      if (!render) {
        const plan = planForReader(week, key ? key.split(',') : [])
        const params = { plan, todayIso, eventsUnsubscribeUrl: EVENTS_UNSUB, unsubscribeAllUrl: ALL_UNSUB }
        render = { subject: weeklySubject(plan), html: renderWeeklyEmail(params), text: renderWeeklyText(params) }
        renders.set(key, render)
      }
      const eventsUnsub = eventsUnsubscribeUrl(r.unsubscribe_token)
      const allUnsub = unsubscribeAllUrl(r.unsubscribe_token)
      const personal = (body: string) => body.replaceAll(EVENTS_UNSUB, eventsUnsub).replaceAll(ALL_UNSUB, allUnsub)
      firstSubject ||= render.subject
      return {
        from,
        to: r.email,
        reply_to: readerReplyTo(),
        subject: render.subject,
        html: personal(render.html), // the two URLs carry one query parameter and no &, so they need no escaping in an attribute
        text: personal(render.text),
        // One click in the mail app stops this email only (RFC 8058: the route takes a POST).
        headers: { 'List-Unsubscribe': `<${eventsUnsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      }
    })
  }

  const { sent, ids, errors } = await sendBatches(emails, resendApiKey, fetchFn)
  await db
    .from(WEEKLY_SENDS_TABLE)
    .update({
      status: sent > 0 ? 'sent' : 'failed',
      finished_at: new Date().toISOString(),
      subject: firstSubject,
      recipient_count: sent,
      event_count: counts.thisWeek + counts.nextWeek,
      resend_email_ids: Object.keys(ids).length ? ids : null,
      error_message: errors.length ? errors.join('; ').slice(0, 2000) : null,
    })
    .eq('week_of', weekOf)
    .eq('mode', mode)

  return { ok: sent > 0, mode, weekOf, readers: readers.length, sent, errors, ...counts }
}
