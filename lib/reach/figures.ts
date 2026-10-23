/**
 * The audience beyond the email list, as pure functions: the website's traffic
 * and the social posts' views. Fetching lives in ./index.ts; everything that
 * decides what a figure is, or whether to show it, lives here and is tested.
 *
 * THE RULE (same as lib/sponsor/stats.ts): never print a number we cannot back
 * up. Each figure is nullable, and a null hides its line. No figure is
 * remembered or guessed; the one hand-entered figure (the manual website
 * number) has to carry its own "as of" date and goes stale by itself.
 */

/** A figure as printed: rounded DOWN to two significant figures, with "+" when anything was cut. 163 → "160+", 54,264 → "54,000+". */
export function atLeast(n: number): string {
  const whole = Math.floor(n)
  if (whole < 20) return whole.toLocaleString('en-US')
  const step = 10 ** (Math.floor(Math.log10(whole)) - 1)
  const floor = Math.floor(whole / step) * step
  return floor < whole ? `${floor.toLocaleString('en-US')}+` : floor.toLocaleString('en-US')
}

// ─── The website ─────────────────────────────────────────────────────────────

export interface SiteTraffic {
  /** Visitors as the source counts them (Vercel: one per person per day; the manual figure: as read off the dashboard). */
  visitors: number | null
  pageviews: number | null
  /** ISO date the period ends (API: today; manual: the date it was read). */
  asOf: string
  /** Where it came from, for the quiet note. */
  source: 'vercel-api' | 'manual'
}

/**
 * Vercel's Web Analytics count endpoint (`GET /v1/query/web-analytics/visits/count`):
 * `{ data: { pageviews, visitors } }`. Anything else → null, never zero.
 */
export function parseVercelCount(body: unknown, asOf: string): SiteTraffic | null {
  const data = (body as { data?: { pageviews?: unknown; visitors?: unknown } } | null)?.data
  if (!data || typeof data !== 'object') return null
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null)
  const pageviews = num(data.pageviews)
  const visitors = num(data.visitors)
  if (pageviews == null && visitors == null) return null
  return { pageviews, visitors, asOf, source: 'vercel-api' }
}

/** How long a hand-entered website figure is shown after the date it was read. */
export const MANUAL_MAX_AGE_DAYS = 75

/**
 * The hand-entered fallback, used only while the API token is not set or the
 * API fails: SITE_MONTHLY_VISITORS (and optionally SITE_MONTHLY_PAGEVIEWS),
 * both read off the Vercel Analytics dashboard's last-30-days view, with
 * SITE_MONTHLY_AS_OF (YYYY-MM-DD, the day it was read). Empty by default,
 * which hides the line. Without a valid date, or once the date is more than
 * MANUAL_MAX_AGE_DAYS old, it is not shown.
 */
export function manualSiteTraffic(env: Record<string, string | undefined>, today: string): SiteTraffic | null {
  const int = (v: string | undefined) => {
    const n = Number(String(v ?? '').replace(/[,_\s]/g, ''))
    return v && Number.isInteger(n) && n > 0 ? n : null
  }
  const visitors = int(env.SITE_MONTHLY_VISITORS)
  const pageviews = int(env.SITE_MONTHLY_PAGEVIEWS)
  const asOf = (env.SITE_MONTHLY_AS_OF ?? '').trim()
  if (visitors == null && pageviews == null) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || Number.isNaN(Date.parse(`${asOf}T12:00:00Z`))) return null
  const age = (Date.parse(`${today}T12:00:00Z`) - Date.parse(`${asOf}T12:00:00Z`)) / 86_400_000
  if (age < 0 || age > MANUAL_MAX_AGE_DAYS) return null
  return { visitors, pageviews, asOf, source: 'manual' }
}

// ─── Social video views ──────────────────────────────────────────────────────

export interface SocialPostRow {
  id: string
  channel: string
  /** When it went out. */
  scheduled_for: string | null
}

export interface SocialReading {
  post_id: string
  captured_at: string
  /** The `views` number of the reading, if it had one. */
  views: number | null
}

export interface SocialViews {
  views: number
  /** Posts that had a reading with views. */
  posts: number
  /** Networks that contributed views, most views first: 'tiktok', 'instagram', … */
  networks: string[]
  /** ISO date of the newest reading: the period is the 30 days up to it. */
  through: string
}

export const SOCIAL_WINDOW_DAYS = 30
/** Readings older than this and the line is hidden: the social job has stopped reporting. */
export const SOCIAL_MAX_STALENESS_DAYS = 10

/**
 * Views across the social posts published in the 30 days up to the newest
 * reading, each post counted once at its latest reading. The social job reads
 * a post's numbers about once, two days after it goes out, so this is a floor:
 * views after that reading are not counted.
 */
export function sumSocialViews(posts: SocialPostRow[], readings: SocialReading[], now: number): SocialViews | null {
  const latest = new Map<string, SocialReading>()
  for (const r of readings) {
    if (r.views == null || !Number.isFinite(r.views) || r.views < 0) continue
    const had = latest.get(r.post_id)
    if (!had || Date.parse(r.captured_at) > Date.parse(had.captured_at)) latest.set(r.post_id, r)
  }
  if (latest.size === 0) return null
  const newest = Math.max(...[...latest.values()].map((r) => Date.parse(r.captured_at)))
  if (now - newest > SOCIAL_MAX_STALENESS_DAYS * 86_400_000) return null
  const from = newest - SOCIAL_WINDOW_DAYS * 86_400_000

  let views = 0, counted = 0
  const byNetwork = new Map<string, number>()
  for (const p of posts) {
    const r = latest.get(p.id)
    if (!r || !p.scheduled_for) continue
    const out = Date.parse(p.scheduled_for)
    if (!(out >= from && out <= newest)) continue
    views += r.views as number
    counted++
    byNetwork.set(p.channel, (byNetwork.get(p.channel) ?? 0) + (r.views as number))
  }
  if (views <= 0) return null
  const networks = [...byNetwork.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k]) => k)
  return { views, posts: counted, networks, through: new Date(newest).toISOString().slice(0, 10) }
}

const NETWORK_NAMES: Record<string, string> = { tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', linkedin: 'LinkedIn' }

/** "TikTok, Instagram and YouTube". */
export function networkList(networks: string[]): string {
  const names = networks.map((n) => NETWORK_NAMES[n] ?? n)
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

// ─── The block as printed ────────────────────────────────────────────────────

export interface ReachLine {
  key: 'email' | 'site' | 'video'
  text: string
  note: string
}

const shortDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** The lines we can stand behind, in order; a figure we lack is simply absent. */
export function reachLines(input: {
  subscribers: number | null
  firms: number | null
  site: SiteTraffic | null
  video: SocialViews | null
}): ReachLine[] {
  const out: ReachLine[] = []
  if (input.subscribers != null && input.subscribers > 0) {
    const firms = input.firms != null && input.firms > 0 ? ` at ${atLeast(input.firms)} firms` : ''
    out.push({ key: 'email', text: `${atLeast(input.subscribers)} email readers${firms}`, note: 'Confirmed subscribers today' })
  }
  const s = input.site
  if (s && (s.visitors != null || s.pageviews != null)) {
    const parts = [s.visitors != null ? `${atLeast(s.visitors)} site visitors` : null, s.pageviews != null ? `${atLeast(s.pageviews)} page views` : null].filter(Boolean)
    out.push({
      key: 'site',
      text: `${parts.join(' and ')} a month`,
      note: s.source === 'vercel-api'
        ? `Vercel Web Analytics, 30 days to ${shortDate(s.asOf)}`
        : `Vercel Web Analytics, the 30 days to ${shortDate(s.asOf)}, as last read`,
    })
  }
  const v = input.video
  if (v) {
    out.push({
      key: 'video',
      text: `${atLeast(v.views)} video views a month on ${networkList(v.networks)}`,
      note: `Posts from the 30 days to ${shortDate(v.through)}, each counted once, about two days after it went out`,
    })
  }
  return out
}
