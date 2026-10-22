/**
 * When each email of the FundOps Daily welcome series is due, and what happens when it is (2026-10-22, approved by
 * Danny that day: "Yes, as drafted", with the no-clicks Day 6 branch, the sponsor P.S. without a price, and new
 * subscribers only). The copy is in welcome-series.ts and the send in welcome-series-send.ts; the plan and its
 * reasons are in ~/fundopshq-workspace/docs/newsletter/2026-10-22-welcome-series.md.
 *
 *   Step 1  Day 1   "What do you follow?"            skipped when story interests are on file at send time
 *   Step 2  Day 3   "How to read FundOps Daily…"
 *   Step 3  Day 6   "Between editions…" (3), or "Is FundOps Daily reaching you?" (3b) for a reader with no sign
 *                   of reading
 *   Step 4  Day 10  "Who else on your team should see this?"
 *
 * The rules, as the draft has them:
 *  - "Day N" is calendar days after the signup date (confirmed_at), in New York time.
 *  - Sends go out at 12:30pm ET, Tuesday to Friday only. A step that falls on a Saturday, Sunday or Monday slides
 *    to the next Tuesday, and the steps after it keep a two-day minimum gap from the last email actually sent.
 *  - At most one series email a day (the gap makes sure), and none on the day of the welcome note (Day 1 at the
 *    earliest).
 *  - Only readers who first signed up on or after WELCOME_SERIES_START. A reader gets the series once, ever.
 *
 * Pure: no database, no clock of its own.
 */
import { sanitizeInterests } from './interests'
import { countHumanClicks, type EngagementEvent } from './engagement-events'

/** Launch: readers who first signed up (and confirmed) from this moment on get the series; nobody before it. */
export const WELCOME_SERIES_START = '2026-10-23T00:00:00-04:00'

/** The kill switch (Vercel env). Off unless set to true; an env change needs a redeploy to reach the cron. */
export const WELCOME_SERIES_ENV = 'WELCOME_SERIES_ENABLED'

export function welcomeSeriesEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return ['true', '1', 'yes', 'on'].includes((env[WELCOME_SERIES_ENV] ?? '').trim().toLowerCase())
}

export type WelcomeStep = 1 | 2 | 3 | 4
export type WelcomeEmailKey = '1' | '2' | '3' | '3b' | '4'
export const WELCOME_STEPS: WelcomeStep[] = [1, 2, 3, 4]

/** Calendar days after signup each step is meant for. */
export const STEP_DAY: Record<WelcomeStep, number> = { 1: 1, 2: 3, 3: 6, 4: 10 }

/** At least this many days between two series emails. */
export const MIN_GAP_DAYS = 2

/** A step that could not go on its day may still go on this many send days after it; later than that it is skipped. */
export const LATE_SEND_DAYS = 2

/** Readers are looked at for this long after they confirm (step 4 can slide to about Day 15). */
export const SERIES_LOOKBACK_DAYS = 30

/** The send time readers would see, and the window the hourly cron sends in (minutes after midnight, New York). */
export const SERIES_SEND_TIME_ET = { hour: 12, minute: 30 } as const
export const SERIES_WINDOW_ET = { opens: 12 * 60 + 15, closes: 17 * 60 } as const

/** Reasons a step is recorded as skipped. The first three end the series for that reader. */
export type SkipReason = 'unsubscribed' | 'bounced' | 'complained' | 'has_interests' | 'late'
export const EXIT_REASONS: ReadonlySet<string> = new Set(['unsubscribed', 'bounced', 'complained'])

// ─── Dates (ISO yyyy-mm-dd, New York) ─────────────────────────────────────

/** The New York calendar date of an instant. */
export function nyDate(at: Date | string): string {
  const d = typeof at === 'string' ? new Date(at) : at
  return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** Tuesday to Friday. */
export function isSendDay(iso: string): boolean {
  const w = weekdayOf(iso)
  return w >= 2 && w <= 5
}

/** The date itself when it is a send day, otherwise the next Tuesday. */
export function nextSendDay(iso: string): string {
  let d = iso
  while (!isSendDay(d)) d = addDays(d, 1)
  return d
}

/** `n` send days after a send day (Friday + 1 = Tuesday). */
export function addSendDays(iso: string, n: number): string {
  let d = nextSendDay(iso)
  for (let i = 0; i < n; i++) d = nextSendDay(addDays(d, 1))
  return d
}

const later = (a: string, b: string) => (a > b ? a : b)

/**
 * The day a step is due: Day N after signup, or two days after the last series email that was sent, whichever is
 * later, moved to the next Tuesday when it lands on a Saturday, Sunday or Monday.
 */
export function dueOn(step: WelcomeStep, signupDate: string, lastSentDate: string | null): string {
  const nominal = addDays(signupDate, STEP_DAY[step])
  return nextSendDay(lastSentDate ? later(nominal, addDays(lastSentDate, MIN_GAP_DAYS)) : nominal)
}

/** The four dates a reader who is sent every step gets them on (for the dry run and the tests). */
export function seriesPlan(signupDate: string): Record<WelcomeStep, string> {
  const out = {} as Record<WelcomeStep, string>
  let last: string | null = null
  for (const s of WELCOME_STEPS) {
    out[s] = dueOn(s, signupDate, last)
    last = out[s]
  }
  return out
}

/** Minutes after midnight in New York, and the New York weekday. */
export function newYorkClock(now: Date): { minutes: number; date: string } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return { minutes: h * 60 + m, date: nyDate(now) }
}

/**
 * True when an hourly fire at `now` may send: a Tuesday-to-Friday in New York, from 12:15 to 17:00. The cron fires at
 * :30 past each hour from 16:30 to 20:30 UTC, so 12:30 ET is the first fire either side of daylight saving (16:30 UTC
 * in EDT, 17:30 UTC in EST) and the later fires are retries. A fire a few minutes early still sends.
 */
export function seriesWindowOpen(now: Date): boolean {
  const { minutes, date } = newYorkClock(now)
  return isSendDay(date) && minutes >= SERIES_WINDOW_ET.opens && minutes < SERIES_WINDOW_ET.closes
}

// ─── Who is in the series ────────────────────────────────────────────────

export interface SeriesSubscriber {
  id: string
  email: string
  status: string
  confirmed_at: string | null
  created_at: string | null
  interests?: string[] | null
}

/** One row of welcome_series_sends, as the planner needs it. */
export interface SeriesRow {
  step: number
  email_key?: string | null
  status: 'sending' | 'sent' | 'skipped' | 'failed'
  skip_reason?: string | null
  attempts?: number | null
  created_at: string
  sent_at?: string | null
  resend_email_id?: string | null
}

/** A failed step is tried again on later runs, up to this many attempts in all. */
export const MAX_ATTEMPTS = 3

/** Danny's own addresses, the site's own domain and test domains never get the series. */
const HOUSE = [/^dbloomstine(\+[^@]*)?@gmail\.com$/, /^danny\.bloomstine@iqeq\.com$/, /@fundopshq\.com$/, /@(example\.(com|org|net)|[^@]+\.(test|invalid|example|localhost))$/]

export function isHouseAddress(email: string, extra: string[] = []): boolean {
  const e = email.trim().toLowerCase()
  return HOUSE.some((r) => r.test(e)) || extra.map((x) => x.trim().toLowerCase()).filter(Boolean).includes(e)
}

/** The extra excluded addresses from the env (comma-separated), for test inboxes. */
export function extraExclusions(env: Record<string, string | undefined> = process.env): string[] {
  return (env.WELCOME_SERIES_EXCLUDE ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}

/** New subscribers only: first signed up, and confirmed, on or after the launch. */
export function isNewSubscriber(sub: Pick<SeriesSubscriber, 'created_at' | 'confirmed_at'>, start = WELCOME_SERIES_START): boolean {
  const t0 = Date.parse(start)
  const created = Date.parse(sub.created_at ?? '')
  const confirmed = Date.parse(sub.confirmed_at ?? '')
  return !Number.isNaN(created) && !Number.isNaN(confirmed) && created >= t0 && confirmed >= t0
}

export type NextAction =
  | { kind: 'done'; reason: 'complete' | 'exited' | 'reentry' | 'not_eligible' | 'stuck' }
  | { kind: 'wait'; step: WelcomeStep; dueOn: string }
  | { kind: 'due'; step: WelcomeStep; dueOn: string; late: boolean; retry: boolean }

/**
 * What the series does for one reader today. Rows are this reader's welcome_series_sends; `today` is the New York
 * date of the run.
 *  - done: every step has a row; or an exit (unsubscribed, bounced, complained) is on record; or the reader came
 *    back after leaving (a row older than the current confirmed_at: the subscribe route resets confirmed_at on a
 *    re-subscribe, and the series is never started twice); or a step is stuck in 'sending' (a run died mid-send,
 *    so whether it went out is unknown: a person looks rather than risk a second copy).
 *  - wait: the next step is not due yet.
 *  - due: the next step is due today (late when it is past its last allowed send day: the runner records a skip).
 */
export function nextAction(sub: SeriesSubscriber, rows: SeriesRow[], today: string, opts: { start?: string; exclude?: string[] } = {}): NextAction {
  if (sub.status !== 'confirmed' || !isNewSubscriber(sub, opts.start) || isHouseAddress(sub.email, opts.exclude)) {
    return { kind: 'done', reason: 'not_eligible' }
  }
  if (rows.some((r) => r.status === 'skipped' && r.skip_reason && EXIT_REASONS.has(r.skip_reason))) return { kind: 'done', reason: 'exited' }
  const confirmed = Date.parse(sub.confirmed_at as string)
  if (rows.some((r) => Date.parse(r.created_at) < confirmed)) return { kind: 'done', reason: 'reentry' }
  if (rows.some((r) => r.status === 'sending')) return { kind: 'done', reason: 'stuck' }

  const byStep = new Map(rows.map((r) => [r.step, r]))
  const step = WELCOME_STEPS.find((s) => {
    const r = byStep.get(s)
    return !r || (r.status === 'failed' && (r.attempts ?? 1) < MAX_ATTEMPTS)
  })
  if (!step) return { kind: 'done', reason: 'complete' }
  // A step that failed for good stops the series where it is, rather than skipping ahead past it.
  const blocked = WELCOME_STEPS.some((s) => s < step && byStep.get(s)?.status === 'failed')
  if (blocked) return { kind: 'done', reason: 'stuck' }

  const sentDates = rows.filter((r) => r.status === 'sent' && r.sent_at).map((r) => nyDate(r.sent_at as string)).sort()
  const lastSent = sentDates[sentDates.length - 1] ?? null
  const due = dueOn(step, nyDate(sub.confirmed_at as string), lastSent)
  if (today < due || !isSendDay(today) || (lastSent && today < addDays(lastSent, MIN_GAP_DAYS))) return { kind: 'wait', step, dueOn: due }
  return { kind: 'due', step, dueOn: due, late: today > addSendDays(due, LATE_SEND_DAYS), retry: byStep.has(step) }
}

// ─── The branch and the skip rules ───────────────────────────────────────

/** Has the reader said what they follow? Story interests only: an events opt-in is not an answer (as in subscribe). */
export function hasStoryInterests(interests: unknown): boolean {
  return sanitizeInterests(interests).length > 0
}

/** A reader's engagement events, each with the time the email it belongs to was sent. */
export interface ReaderEvent extends EngagementEvent {
  /** When the edition (or series email) this event belongs to went out. */
  sent_at: string
}

/**
 * At least one human click (lib/newsletter/engagement-events.ts: not within a minute of delivery, not within two
 * seconds of an open) on any FundOps Daily email this reader was sent since they signed up. Opens are not used.
 */
export function hasHumanClick(events: ReaderEvent[]): boolean {
  const byEmail = new Map<string, ReaderEvent[]>()
  for (const e of events) {
    const list = byEmail.get(e.resend_email_id) ?? []
    list.push(e)
    byEmail.set(e.resend_email_id, list)
  }
  for (const list of byEmail.values()) {
    if (countHumanClicks(list, list[0].sent_at).human > 0) return true
  }
  return false
}

/**
 * The Day 6 branch: "a sign of reading" is a human click on an edition (or an earlier series email), or interests
 * saved. A reply would count too, but replies go to Danny's Gmail and nothing the site stores sees them, so they
 * cannot be read here: a reader who only replies gets 3b, whose copy is written to be fine for them.
 */
export function hasSignOfReading(interests: unknown, events: ReaderEvent[]): boolean {
  return hasStoryInterests(interests) || hasHumanClick(events)
}

export type StepDecision = { send: WelcomeEmailKey } | { skip: SkipReason }

/** Which email a due step sends, or why it is skipped. Checked when the step is due, never at signup. */
export function decideStep(step: WelcomeStep, ctx: { interests: unknown; signOfReading: boolean; late?: boolean }): StepDecision {
  if (ctx.late) return { skip: 'late' }
  if (step === 1) return hasStoryInterests(ctx.interests) ? { skip: 'has_interests' } : { send: '1' }
  if (step === 3) return { send: ctx.signOfReading ? '3' : '3b' }
  return { send: String(step) as WelcomeEmailKey }
}
