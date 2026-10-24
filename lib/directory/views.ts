/**
 * Profile views and searches that found nobody (plan B7, B9), the pure part.
 *
 * A view is counted from a beacon the profile page sends once it has loaded
 * (the page itself is cached, so the server never sees most visits). That
 * alone leaves out most crawlers, which do not run scripts; the rest are
 * filtered here by their user agent, and a prefetch or a cross-site post is
 * never counted. One upsert per view (directory_count_view). Nothing about
 * the viewer is stored: no IP, no user agent, no cookie of ours.
 */

const BOT_RE =
  /bot\b|bot\/|crawl|spider|slurp|scrape|fetch|preview|headless|phantom|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|python|curl|wget|httpclient|okhttp|java\/|go-http|node-fetch|axios|undici|facebookexternalhit|embedly|quora link|outbrain|vercel|bingpreview|google-inspectiontool|chatgpt|gptbot|claude|anthropic|perplexity|bytespider|ccbot|semrush|ahrefs|mj12|dotbot|petal|yandex|baidu|applebot|duckduck|linkedinbot|twitterbot|slackbot|discordbot|whatsapp|telegrambot|skypeuripreview/i

/** A real browser, by its user agent: present, plausibly long, a browser engine, no crawler words. */
export function isLikelyHuman(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? '').trim()
  if (ua.length < 20 || ua.length > 500) return false
  if (!/mozilla\/|opera\//i.test(ua)) return false
  return !BOT_RE.test(ua)
}

export interface ViewRequest {
  userAgent: string | null
  /** Sec-Fetch-Site, when the browser sends it. */
  fetchSite: string | null
  /** Next-Router-Prefetch / Purpose / Sec-Purpose: any prefetch marker. */
  prefetch: boolean
  /** The person the visitor's own edit session is for, if any: an owner looking at their own profile is not a view. */
  sessionPersonId: string | null
  personId: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function shouldCountView(r: ViewRequest): boolean {
  if (!UUID_RE.test(r.personId)) return false
  if (r.prefetch) return false
  if (r.fetchSite && r.fetchSite !== 'same-origin') return false
  if (r.sessionPersonId && r.sessionPersonId.toLowerCase() === r.personId.toLowerCase()) return false
  return isLikelyHuman(r.userAgent)
}

/** The headers a view or a miss is judged on. */
export function requestTraits(headers: Headers): Pick<ViewRequest, 'userAgent' | 'fetchSite' | 'prefetch'> {
  const purpose = `${headers.get('purpose') ?? ''} ${headers.get('sec-purpose') ?? ''}`.toLowerCase()
  return {
    userAgent: headers.get('user-agent'),
    fetchSite: headers.get('sec-fetch-site'),
    prefetch: Boolean(headers.get('next-router-prefetch')) || purpose.includes('prefetch'),
  }
}

/** "YYYY-MM-DD" in New York, the day a view is filed under. */
export function nyDay(d = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

export interface ViewSummary {
  last7: number
  last30: number
  thisMonth: number
  lastMonth: number
  total: number
  /** The first day anything was counted, or null when nothing was. */
  since: string | null
}

/** Totals from the daily rows (any order). Days are New York days, compared as strings. */
export function viewSummary(rows: { day: string; views: number }[], now = new Date()): ViewSummary {
  const today = nyDay(now)
  const back = (days: number) => nyDay(new Date(now.getTime() - days * 86_400_000))
  const from7 = back(6)
  const from30 = back(29)
  const month = today.slice(0, 7)
  const [y, m] = month.split('-').map(Number)
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
  const s: ViewSummary = { last7: 0, last30: 0, thisMonth: 0, lastMonth: 0, total: 0, since: null }
  for (const r of rows) {
    const v = Number(r.views) || 0
    const day = String(r.day).slice(0, 10)
    if (day > today) continue
    s.total += v
    if (day >= from7) s.last7 += v
    if (day >= from30) s.last30 += v
    if (day.startsWith(month)) s.thisMonth += v
    if (day.startsWith(prev)) s.lastMonth += v
    if (!s.since || day < s.since) s.since = day
  }
  return s
}

/** The calendar month before `now` (New York), as its first and last day and a name: for the monthly email. */
export function previousMonth(now = new Date()): { from: string; to: string; name: string } {
  const [y, m] = nyDay(now).slice(0, 7).split('-').map(Number)
  const py = m === 1 ? y - 1 : y
  const pm = m === 1 ? 12 : m - 1
  const last = new Date(Date.UTC(py, pm, 0)).getUTCDate()
  const mm = String(pm).padStart(2, '0')
  const name = new Date(Date.UTC(py, pm - 1, 15)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return { from: `${py}-${mm}-01`, to: `${py}-${mm}-${String(last).padStart(2, '0')}`, name }
}

/**
 * What an empty search is logged as, or null for nothing worth keeping. Lowercase, spaces collapsed, letters,
 * digits and a few name characters only, 2 to 60 characters. Never an email address, a phone number or a long
 * number: someone might type their own.
 */
export function normalizeMissQuery(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  if (/@/.test(raw)) return null
  if (/\d[\d\s().-]{6,}\d/.test(raw)) return null
  const q = raw
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}&'.\- ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (q.length < 2 || q.length > 60) return null
  if (!/\p{L}/u.test(q)) return null
  return q
}
