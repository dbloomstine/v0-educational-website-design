/**
 * The database side of outreach v2: the mode and halt flag, the do-not-contact
 * checks, the caps, and the message rows. Server only.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { filterSuppressed } from '@/lib/outreach/suppression'
import { BOUNCE_HALT_RATE, BOUNCE_MIN_SENT, BOUNCE_WINDOW_DAYS, DAILY_SEND_CAP, RECONTACT_DAYS, envMode, nyDay, nyDayStart, type Mode, type Program } from './config'
import { isIqeqEmail } from './exclusions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbClient = SupabaseClient<any, any>

const DAY_MS = 86_400_000
const lower = (e: string) => e.trim().toLowerCase()

export interface MessageRow {
  id: string
  program: Program
  kind: 'initial' | 'followup'
  parent_id: string | null
  batch: string
  email: string
  first_name: string | null
  last_name: string | null
  title: string | null
  company: string
  domain: string | null
  apollo_person_id: string | null
  country: string | null
  hook: string | null
  source_url: string | null
  logo_url: string | null
  ad_line: string | null
  mockup_url: string | null
  news_item_id: string | null
  /** An organizer note's event (industry_events.id). */
  event_id?: string | null
  story_url: string | null
  story_headline: string | null
  subject: string
  body_text: string
  body_html: string | null
  hook_date: string | null
  status: 'preview' | 'queued' | 'sending' | 'sent' | 'failed' | 'skipped' | 'cancelled'
  skip_reason: string | null
  unsub_token: string
  message_id_header: string | null
  resend_id: string | null
  error: string | null
  created_at: string
  queued_at: string | null
  sent_at: string | null
  replied_at: string | null
  bounced_at: string | null
  complained_at: string | null
  unsubscribed_at: string | null
}

/* ───────────────────────── mode and halt ───────────────────────── */

export interface HaltState {
  halted: boolean
  halted_reason: string | null
  halted_at: string | null
}

export async function readHalt(db: DbClient): Promise<HaltState> {
  const { data, error } = await db.from('outreach_v2_state').select('halted, halted_reason, halted_at').eq('id', 1).maybeSingle()
  // If the flag cannot be read, assume the worst: a send that should not happen cannot be taken back.
  if (error) return { halted: true, halted_reason: `state unreadable: ${error.message}`, halted_at: null }
  return (data as HaltState | null) ?? { halted: false, halted_reason: null, halted_at: null }
}

/** OUTREACH_V2_MODE, forced to `off` while the halt flag is set. */
export async function effectiveMode(db: DbClient, env: string | undefined = process.env.OUTREACH_V2_MODE): Promise<{ mode: Mode; halted: HaltState | null }> {
  const mode = envMode(env)
  if (mode === 'off') return { mode, halted: null }
  const halt = await readHalt(db)
  return halt.halted ? { mode: 'off', halted: halt } : { mode, halted: null }
}

export async function setHalt(db: DbClient, reason: string): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await db.from('outreach_v2_state').upsert({ id: 1, halted: true, halted_reason: reason, halted_at: now, updated_at: now })
  if (error) throw new Error(`setHalt: ${error.message}`)
}

/* ───────────────────────── do-not-contact ───────────────────────── */

export type ScreenReason =
  | 'iqeq'
  | 'lead_desk_suppressed'
  | 'unsubscribed'
  | 'bounced'
  | 'complained'
  | 'asked_to_stop'
  | 'suppressed'
  | 'contacted_recently'
  | 'already_subscribed'
  | 'replied'

/**
 * Why each address may not be written to, or nothing. Every list Danny named:
 * the Lead Desk hashes and iqeq.com, our own unsubscribes/bounces/complaints,
 * the old pipeline's opt-outs and bounces, anyone either program (or the old
 * one) emailed inside RECONTACT_DAYS, and, for news notes, people who already
 * subscribe. `threadRootId` lets a follow-up through its own thread's 90 days.
 */
export async function screenEmails(
  db: DbClient,
  emails: string[],
  opts: { program: Program; threadRootId?: string | null; now?: Date } = { program: 'news_note' },
): Promise<Map<string, ScreenReason>> {
  const out = new Map<string, ScreenReason>()
  const list = [...new Set(emails.map(lower).filter(Boolean))]
  if (!list.length) return out
  const now = opts.now ?? new Date()

  for (const e of list) if (isIqeqEmail(e)) out.set(e, 'iqeq')

  const hashed = await filterSuppressed(db, list.filter((e) => !out.has(e)).map((email) => ({ email })))
  for (const d of hashed.dropped) out.set(lower(d.email), d.reason === 'iqeq_domain' ? 'iqeq' : 'lead_desk_suppressed')

  const open = () => list.filter((e) => !out.has(e))

  if (open().length) {
    const { data, error } = await db.from('outreach_v2_suppressions').select('email, reason').in('email', open())
    if (error) throw new Error(`suppressions lookup: ${error.message}`)
    for (const r of data ?? []) {
      const reason = String(r.reason)
      out.set(lower(String(r.email)), (['unsubscribed', 'bounced', 'complained', 'asked_to_stop'].includes(reason) ? reason : 'suppressed') as ScreenReason)
    }
  }

  if (open().length) {
    // The dormant Gmail pipeline's log: its opt-outs and bounces are forever, its sends count toward 90 days.
    const since = new Date(now.getTime() - RECONTACT_DAYS * DAY_MS).toISOString()
    const { data, error } = await db.from('cold_outreach_sent').select('email, status, created_at, sent_at').in('email', open())
    if (error) throw new Error(`cold_outreach_sent lookup: ${error.message}`)
    for (const r of data ?? []) {
      const e = lower(String(r.email))
      if (r.status === 'opted_out') out.set(e, 'unsubscribed')
      else if (r.status === 'bounced') out.set(e, 'bounced')
      else if (['sent', 'replied', 'replied_positive'].includes(String(r.status)) && String(r.sent_at ?? r.created_at) >= since) out.set(e, 'contacted_recently')
    }
  }

  if (open().length) {
    const since = new Date(now.getTime() - RECONTACT_DAYS * DAY_MS).toISOString()
    const { data, error } = await db
      .from('outreach_v2_messages')
      .select('id, parent_id, email, sent_at, replied_at, status')
      .in('email', open())
      .gte('sent_at', since)
    if (error) throw new Error(`recent outreach lookup: ${error.message}`)
    for (const r of data ?? []) {
      const e = lower(String(r.email))
      const inThread = opts.threadRootId && (r.id === opts.threadRootId || r.parent_id === opts.threadRootId)
      if (inThread) {
        if (r.replied_at) out.set(e, 'replied')
        continue
      }
      out.set(e, 'contacted_recently')
    }
  }

  if (open().length) {
    // Anyone who has written to us from that address stops getting outreach.
    const { data, error } = await db.from('outreach_v2_replies').select('from_address').in('from_address', open())
    if (error) throw new Error(`replies lookup: ${error.message}`)
    for (const r of data ?? []) out.set(lower(String(r.from_address)), 'replied')
  }

  if (opts.program === 'news_note' && open().length) {
    const { data, error } = await db.from('newsletter_subscribers').select('email').in('email', open())
    if (error) throw new Error(`subscribers lookup: ${error.message}`)
    for (const r of data ?? []) out.set(lower(String(r.email)), 'already_subscribed')
  }

  return out
}

export async function suppress(
  db: DbClient,
  email: string,
  reason: 'unsubscribed' | 'bounced' | 'complained' | 'asked_to_stop' | 'manual',
  messageId: string | null,
): Promise<void> {
  const { error } = await db
    .from('outreach_v2_suppressions')
    .upsert({ email: lower(email), reason, message_id: messageId }, { onConflict: 'email', ignoreDuplicates: true })
  if (error) throw new Error(`suppress: ${error.message}`)
  // Nothing still waiting to go to that address goes.
  await db.from('outreach_v2_messages').update({ status: 'cancelled', skip_reason: reason }).eq('email', lower(email)).in('status', ['queued', 'preview'])
}

/* ───────────────────────── caps ───────────────────────── */

export async function sentToday(db: DbClient, now: Date = new Date()): Promise<number> {
  const start = nyDayStart(nyDay(now)).toISOString()
  const { count, error } = await db
    .from('outreach_v2_messages')
    .select('id', { count: 'exact', head: true })
    .gte('sent_at', start)
    .in('status', ['sent', 'sending'])
  if (error) throw new Error(`sentToday: ${error.message}`)
  return count ?? 0
}

export async function remainingSendsToday(db: DbClient, now: Date = new Date()): Promise<number> {
  return Math.max(0, DAILY_SEND_CAP - (await sentToday(db, now)))
}

/** New sponsor pitches (not follow-ups) sent so far this New York day. */
export async function sponsorPitchesSentToday(db: DbClient, now: Date = new Date()): Promise<number> {
  const start = nyDayStart(nyDay(now)).toISOString()
  const { count, error } = await db
    .from('outreach_v2_messages')
    .select('id', { count: 'exact', head: true })
    .eq('program', 'sponsor_pitch')
    .eq('kind', 'initial')
    .gte('sent_at', start)
    .in('status', ['sent', 'sending'])
  if (error) throw new Error(`sponsorPitchesSentToday: ${error.message}`)
  return count ?? 0
}

/** Pure: should sending stop for bounces? Only once enough went out for the share to mean something. */
export function bounceVerdict(sent: number, bounced: number): { halt: boolean; reason: string | null } {
  if (sent < BOUNCE_MIN_SENT) return { halt: false, reason: null }
  const rate = bounced / sent
  return rate > BOUNCE_HALT_RATE
    ? { halt: true, reason: `bounces: ${bounced} of the last ${sent} sends (${(rate * 100).toFixed(1)}%) in ${BOUNCE_WINDOW_DAYS} days, over ${(BOUNCE_HALT_RATE * 100).toFixed(0)}%` }
    : { halt: false, reason: null }
}

/** Sends and bounces over the last BOUNCE_WINDOW_DAYS, and the verdict. */
export async function bounceCheck(db: DbClient, now: Date = new Date()): Promise<{ sent: number; bounced: number; halt: boolean; reason: string | null }> {
  const since = new Date(now.getTime() - BOUNCE_WINDOW_DAYS * 86_400_000).toISOString()
  const { data, error } = await db.from('outreach_v2_messages').select('bounced_at').gte('sent_at', since).eq('status', 'sent')
  if (error) throw new Error(`bounceCheck: ${error.message}`)
  const rows = (data ?? []) as { bounced_at: string | null }[]
  const bounced = rows.filter((r) => r.bounced_at).length
  return { sent: rows.length, bounced, ...bounceVerdict(rows.length, bounced) }
}

export async function creditsUsedToday(db: DbClient, program: Program, now: Date = new Date()): Promise<number> {
  const { data, error } = await db.from('outreach_v2_runs').select('credits_used').eq('run_day', nyDay(now)).eq('program', program)
  if (error) throw new Error(`creditsUsedToday: ${error.message}`)
  return (data ?? []).reduce((n, r) => n + Number(r.credits_used ?? 0), 0)
}

export async function logRun(db: DbClient, program: Program, mode: Mode, creditsUsed: number, stats: Record<string, unknown>, now: Date = new Date()): Promise<void> {
  const { error } = await db.from('outreach_v2_runs').insert({ program, run_day: nyDay(now), mode, credits_used: creditsUsed, stats })
  if (error) console.error('[outreach-v2] logRun failed', error.message)
}

/** A message's unsubscribe token: 32 random hex characters, made before the row so the email can be rendered whole. */
export const newToken = () => crypto.randomUUID().replace(/-/g, '')

/** Live: a new message waits for the dispatcher. Preview: it is stored for reading and never sent. */
export const statusForMode = (mode: Mode): 'queued' | 'preview' => (mode === 'live' ? 'queued' : 'preview')
