/**
 * Runs the welcome series (welcome-series-schedule.ts for the rules, welcome-series.ts for the copy). Called by
 * /api/pipeline/welcome-series, hourly through the early afternoon Tuesday to Friday, and by
 * scripts/welcome-series-dry-run.ts.
 *
 *   dry   reads only: who would get which email today, and why the others would not. No send, no write.
 *   live  sends what is due, one email per reader per run at most, and records each step in welcome_series_sends
 *         (supabase/migrations/20261023_welcome_series_sends.sql). Without the table it refuses to send.
 *
 * Idempotency: a step's row is written ('sending') before its email goes, under a unique (subscriber_id, step), so
 * two runs cannot both send it; the row becomes 'sent' (with Resend's id) or 'failed' (retried on a later run, up to
 * three attempts). A row left 'sending' by a run that died part-way stops that reader's series until a person looks.
 *
 * Right before each send the subscriber row is read again: anyone no longer confirmed gets an 'unsubscribed' skip
 * that ends the series. A bounce or a spam complaint on the reader's latest edition or series email (Resend's
 * last_event for it) ends it too.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { makeInterestToken } from './interest-link'
import { renderSeriesEmail, type SeriesContext } from './welcome-series'
import {
  SERIES_LOOKBACK_DAYS,
  WELCOME_SERIES_START,
  decideStep,
  extraExclusions,
  hasSignOfReading,
  nextAction,
  nyDate,
  seriesPlan,
  type ReaderEvent,
  type SeriesRow,
  type SeriesSubscriber,
  type SkipReason,
  type WelcomeEmailKey,
  type WelcomeStep,
} from './welcome-series-schedule'
import { readerFromEmail, readerReplyTo } from './sender'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any, any>

export const SERIES_TABLE = 'welcome_series_sends'
const MIGRATION = 'supabase/migrations/20261023_welcome_series_sends.sql'

interface Subscriber extends SeriesSubscriber {
  unsubscribe_token: string
}

export interface SeriesAction {
  subscriberId: string
  email: string
  signupDate: string
  step: WelcomeStep
  dueOn: string
  /** What is (or would be) sent, or why the step is skipped. */
  send?: WelcomeEmailKey
  skip?: SkipReason
  subject?: string
  /** live only: what happened. */
  result?: 'sent' | 'skipped' | 'failed' | 'taken'
  error?: string
}

export interface SeriesRunResult {
  ok: boolean
  mode: 'dry' | 'live'
  today: string
  readers: number
  actions: SeriesAction[]
  /** Readers with nothing due today: their next step and its day. */
  waiting: Array<{ email: string; signupDate: string; step: WelcomeStep; dueOn: string; plan: Record<WelcomeStep, string> }>
  /** Readers whose series is over or stopped, and why. */
  done: Array<{ email: string; reason: string }>
  warnings: string[]
  error?: string
}

export interface SeriesDeps {
  db: DbClient
  mode: 'dry' | 'live'
  now?: Date
  resendApiKey?: string
  fetchFn?: typeof fetch
  env?: Record<string, string | undefined>
  /** Live reader and firm counts for Email 4 (computeAudience in lib/sponsor/stats.ts). */
  audience?: () => Promise<{ readers: number | null; firms: number | null }>
  /** Resend's last_event for one email id ('bounced', 'complained', 'delivered', ...), or null. */
  lastEvent?: (id: string) => Promise<string | null>
  eventsMondayLive?: boolean
  start?: string
}

const unsubscribeUrl = (token: string) => `https://fundopshq.com/api/newsletter/unsubscribe?token=${token}`
const preferencesUrl = (token: string) => `https://fundopshq.com/preferences?token=${token}`

async function readSubscribers(db: DbClient, now: Date, start: string): Promise<{ subs: Subscriber[]; error?: string }> {
  const since = new Date(Math.max(Date.parse(start), now.getTime() - SERIES_LOOKBACK_DAYS * 86_400_000)).toISOString()
  const { data, error } = await db
    .from('newsletter_subscribers')
    .select('id, email, status, unsubscribe_token, interests, confirmed_at, created_at')
    .eq('status', 'confirmed')
    .gte('confirmed_at', since)
    .gte('created_at', start)
  if (error) return { subs: [], error: error.message }
  return { subs: (data ?? []) as Subscriber[] }
}

async function readRows(db: DbClient, ids: string[]): Promise<{ rows: Map<string, SeriesRow[]>; error?: string }> {
  const rows = new Map<string, SeriesRow[]>()
  if (!ids.length) return { rows }
  const { data, error } = await db
    .from(SERIES_TABLE)
    .select('subscriber_id, step, email_key, status, skip_reason, attempts, created_at, sent_at, resend_email_id')
    .in('subscriber_id', ids)
  if (error) return { rows, error: error.message }
  for (const r of (data ?? []) as Array<SeriesRow & { subscriber_id: string }>) {
    const list = rows.get(r.subscriber_id) ?? []
    list.push(r)
    rows.set(r.subscriber_id, list)
  }
  return { rows }
}

/** Each reader's engagement events since they signed up, with the send time of the email each belongs to. */
async function readEvents(db: DbClient, subs: Subscriber[], rows: Map<string, SeriesRow[]>): Promise<Map<string, ReaderEvent[]>> {
  const out = new Map<string, ReaderEvent[]>()
  if (!subs.length) return out
  const earliest = subs.map((s) => s.confirmed_at as string).sort()[0]
  const { data } = await db
    .from('newsletter_events')
    .select('resend_email_id, type, email, edition_id, occurred_at')
    .in('email', subs.map((s) => s.email.toLowerCase()))
    .gte('occurred_at', earliest)
  const events = (data ?? []) as Array<{ resend_email_id: string; type: string; email: string; edition_id: string | null; occurred_at: string }>
  const editionIds = [...new Set(events.map((e) => e.edition_id).filter((x): x is string => !!x))]
  const editionSent = new Map<string, string>()
  if (editionIds.length) {
    const { data: eds } = await db.from('newsletter_editions').select('id, sent_at').in('id', editionIds)
    for (const e of (eds ?? []) as Array<{ id: string; sent_at: string | null }>) if (e.sent_at) editionSent.set(e.id, e.sent_at)
  }
  const seriesSent = new Map<string, string>()
  for (const list of rows.values()) for (const r of list) if (r.resend_email_id && r.sent_at) seriesSent.set(r.resend_email_id, r.sent_at)
  for (const s of subs) {
    const email = s.email.toLowerCase()
    const mine: ReaderEvent[] = []
    for (const e of events) {
      if (e.email !== email || !['delivered', 'opened', 'clicked'].includes(e.type)) continue
      const sentAt = (e.edition_id && editionSent.get(e.edition_id)) || seriesSent.get(e.resend_email_id)
      if (!sentAt) continue // a welcome note or a message we cannot place
      mine.push({ resend_email_id: e.resend_email_id, type: e.type as ReaderEvent['type'], occurred_at: e.occurred_at, sent_at: sentAt })
    }
    out.set(s.id, mine)
  }
  return out
}

/** The Resend id of each reader's email in the latest few editions (newest first). */
async function latestEditionIds(db: DbClient): Promise<Array<Record<string, string>>> {
  const { data } = await db
    .from('newsletter_editions')
    .select('resend_email_ids, sent_at')
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(3)
  return ((data ?? []) as Array<{ resend_email_ids: Record<string, string> | null }>).map((e) => e.resend_email_ids ?? {})
}

/** 'bounced' or 'complained' when the reader's latest edition or series email came back that way; otherwise null. */
async function deliveryProblem(
  email: string,
  rows: SeriesRow[],
  editions: Array<Record<string, string>>,
  lastEvent: ((id: string) => Promise<string | null>) | undefined,
): Promise<'bounced' | 'complained' | null> {
  if (!lastEvent) return null
  const ids: string[] = []
  const ed = editions.find((e) => e[email.toLowerCase()])
  if (ed) ids.push(ed[email.toLowerCase()])
  const lastSeries = rows.filter((r) => r.resend_email_id && r.sent_at).sort((a, b) => String(b.sent_at).localeCompare(String(a.sent_at)))[0]
  if (lastSeries?.resend_email_id) ids.push(lastSeries.resend_email_id)
  for (const id of ids) {
    const ev = await lastEvent(id).catch(() => null)
    if (ev === 'bounced' || ev === 'complained') return ev
  }
  return null
}

type Claim = 'ok' | 'taken' | { error: string }

/** Takes the step's row before sending. Inserting is the lock; a failed row with attempts left is taken back. */
async function claimStep(db: DbClient, subscriberId: string, step: WelcomeStep, dueOn: string, key: WelcomeEmailKey, retry: boolean): Promise<Claim> {
  if (!retry) {
    const ins = await db.from(SERIES_TABLE).insert({ subscriber_id: subscriberId, step, email_key: key, due_on: dueOn, status: 'sending' })
    if (!ins.error) return 'ok'
    if (ins.error.code === '23505') return 'taken'
    return { error: `${SERIES_TABLE} could not be written (apply ${MIGRATION}): ${ins.error.message}` }
  }
  const { data: cur } = await db.from(SERIES_TABLE).select('attempts, status').eq('subscriber_id', subscriberId).eq('step', step).maybeSingle()
  const row = cur as { attempts?: number; status?: string } | null
  if (row?.status !== 'failed') return 'taken'
  const up = await db
    .from(SERIES_TABLE)
    .update({ status: 'sending', email_key: key, attempts: (row.attempts ?? 1) + 1, error_message: null })
    .eq('subscriber_id', subscriberId)
    .eq('step', step)
    .eq('status', 'failed')
    .select('step')
  if (up.error) return { error: up.error.message }
  return (up.data ?? []).length ? 'ok' : 'taken'
}

async function recordSkip(db: DbClient, subscriberId: string, step: WelcomeStep, dueOn: string, reason: SkipReason, retry: boolean): Promise<string | null> {
  const row = { status: 'skipped', skip_reason: reason, email_key: null, error_message: null }
  const res = retry
    ? await db.from(SERIES_TABLE).update(row).eq('subscriber_id', subscriberId).eq('step', step).eq('status', 'failed')
    : await db.from(SERIES_TABLE).insert({ subscriber_id: subscriberId, step, due_on: dueOn, ...row })
  if (res.error && res.error.code !== '23505') return res.error.message
  return null
}

async function sendOne(
  fetchFn: typeof fetch,
  apiKey: string,
  sub: Subscriber,
  key: WelcomeEmailKey,
  ctx: SeriesContext,
): Promise<{ id?: string; subject: string; error?: string }> {
  const email = renderSeriesEmail(key, ctx)
  const from = `FundOps Daily <${readerFromEmail()}>`
  try {
    const res = await fetchFn('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: sub.email,
        reply_to: readerReplyTo(),
        subject: email.subject,
        ...(email.html ? { html: email.html } : {}),
        text: email.text,
        headers: { 'List-Unsubscribe': `<${ctx.unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        // Tags tell the series' own mail from the edition's in Resend (letters, digits, _ and - only).
        tags: [
          { name: 'stream', value: 'welcome' },
          { name: 'step', value: `w${key}` },
        ],
      }),
    })
    if (!res.ok) return { subject: email.subject, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` }
    const body = (await res.json().catch(() => ({}))) as { id?: string }
    return { id: body.id, subject: email.subject }
  } catch (err) {
    return { subject: email.subject, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function runWelcomeSeries(deps: SeriesDeps): Promise<SeriesRunResult> {
  const { db, mode } = deps
  const now = deps.now ?? new Date()
  const start = deps.start ?? WELCOME_SERIES_START
  const today = nyDate(now)
  const exclude = extraExclusions(deps.env ?? process.env)
  const result: SeriesRunResult = { ok: true, mode, today, readers: 0, actions: [], waiting: [], done: [], warnings: [] }

  const { subs, error: subErr } = await readSubscribers(db, now, start)
  if (subErr) return { ...result, ok: false, error: `reading subscribers: ${subErr}` }
  result.readers = subs.length
  if (!subs.length) return result

  const { rows, error: rowErr } = await readRows(db, subs.map((s) => s.id))
  if (rowErr) {
    if (mode === 'live') return { ...result, ok: false, error: `${SERIES_TABLE} could not be read (apply ${MIGRATION}): ${rowErr}` }
    result.warnings.push(`${SERIES_TABLE} could not be read (${rowErr}); planned as if nobody had been sent anything`)
  }

  type Due = { sub: Subscriber; step: WelcomeStep; dueOn: string; late: boolean; retry: boolean }
  const due: Due[] = []
  for (const sub of subs) {
    const mine = rows.get(sub.id) ?? []
    const next = nextAction(sub, mine, today, { start, exclude })
    const signupDate = nyDate(sub.confirmed_at as string)
    if (next.kind === 'done') result.done.push({ email: sub.email, reason: next.reason })
    else if (next.kind === 'wait') result.waiting.push({ email: sub.email, signupDate, step: next.step, dueOn: next.dueOn, plan: seriesPlan(signupDate) })
    else due.push({ sub, step: next.step, dueOn: next.dueOn, late: next.late, retry: next.retry })
  }
  if (!due.length) return result

  const events = due.some((d) => d.step === 3) ? await readEvents(db, due.map((d) => d.sub), rows) : new Map<string, ReaderEvent[]>()
  const editions = deps.lastEvent ? await latestEditionIds(db) : []
  if (!deps.lastEvent) result.warnings.push('no Resend key: bounces and complaints not checked (Resend still refuses suppressed addresses)')
  let audience: { readers: number | null; firms: number | null } | null | undefined

  for (const d of due) {
    const action: SeriesAction = { subscriberId: d.sub.id, email: d.sub.email, signupDate: nyDate(d.sub.confirmed_at as string), step: d.step, dueOn: d.dueOn }
    result.actions.push(action)

    // Re-read the row right before deciding (live): the batch may be minutes old.
    let sub = d.sub
    if (mode === 'live') {
      const { data: fresh } = await db.from('newsletter_subscribers').select('id, email, status, unsubscribe_token, interests, confirmed_at, created_at').eq('id', d.sub.id).maybeSingle()
      if (!fresh || (fresh as Subscriber).status !== 'confirmed') {
        action.skip = 'unsubscribed'
        const err = await recordSkip(db, d.sub.id, d.step, d.dueOn, 'unsubscribed', d.retry)
        action.result = err ? 'failed' : 'skipped'
        if (err) action.error = err
        continue
      }
      sub = fresh as Subscriber
    }

    const problem = await deliveryProblem(sub.email, rows.get(sub.id) ?? [], editions, deps.lastEvent)
    const decision = problem
      ? ({ skip: problem } as const)
      : decideStep(d.step, { interests: sub.interests, signOfReading: d.step === 3 ? hasSignOfReading(sub.interests, events.get(sub.id) ?? []) : false, late: d.late })

    if ('skip' in decision) {
      action.skip = decision.skip
      if (mode === 'live') {
        const err = await recordSkip(db, sub.id, d.step, d.dueOn, decision.skip, d.retry)
        action.result = err ? 'failed' : 'skipped'
        if (err) action.error = err
      }
      continue
    }

    const key = decision.send
    if (key === '4' && audience === undefined) audience = deps.audience ? await deps.audience().catch(() => null) : null
    const ctx: SeriesContext = {
      unsubscribeUrl: unsubscribeUrl(sub.unsubscribe_token),
      preferencesUrl: preferencesUrl(sub.unsubscribe_token),
      interestToken: makeInterestToken(sub.id),
      audience: audience ?? null,
      eventsMondayLive: deps.eventsMondayLive,
    }
    action.send = key
    action.subject = renderSeriesEmail(key, ctx).subject
    if (mode === 'dry') continue

    if (!deps.resendApiKey) return { ...result, ok: false, error: 'Missing RESEND_API_KEY' }
    const claim = await claimStep(db, sub.id, d.step, d.dueOn, key, d.retry)
    if (claim === 'taken') {
      action.result = 'taken'
      continue
    }
    if (claim !== 'ok') {
      // Most likely the migration is not applied: stop rather than send without a record.
      action.result = 'failed'
      action.error = claim.error
      return { ...result, ok: false, error: claim.error }
    }
    const sent = await sendOne(deps.fetchFn ?? fetch, deps.resendApiKey, sub, key, ctx)
    const finished = new Date().toISOString()
    const up = await db
      .from(SERIES_TABLE)
      .update(
        sent.error
          ? { status: 'failed', error_message: sent.error.slice(0, 1000), subject: sent.subject }
          : { status: 'sent', sent_at: finished, resend_email_id: sent.id ?? null, subject: sent.subject },
      )
      .eq('subscriber_id', sub.id)
      .eq('step', d.step)
    action.result = sent.error ? 'failed' : 'sent'
    if (sent.error) action.error = sent.error
    if (up.error) result.warnings.push(`recording step ${d.step} for ${sub.id}: ${up.error.message}`)
  }

  result.ok = !result.actions.some((a) => a.result === 'failed')
  return result
}
