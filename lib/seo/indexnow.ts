/**
 * IndexNow: telling Bing, and the engines that share its submissions (Yandex,
 * Seznam, Naver), that a page is new or has changed, so it is crawled within
 * minutes instead of whenever the sitemap is next read (2026-10-22, the day
 * Danny set up Bing Webmaster Tools). Bing's index is what ChatGPT search and
 * Copilot read.
 *
 * The protocol (indexnow.org/documentation): one POST of up to 10,000 URLs,
 * all on one host, with a key. The engine proves the key is ours by fetching
 * `https://fundopshq.com/<key>.txt`, which holds the key and nothing else
 * (public/<key>.txt). The key is public by design: it only says "this host may
 * submit these URLs", and anyone could read it from that file anyway.
 *
 * Best effort, always. A ping that fails costs a few minutes of crawl delay;
 * the sitemap still has every page. So `pingIndexNow` never throws into the
 * job that called it, logs the HTTP status, and does nothing at all outside
 * production (a preview deploy or a laptop must never submit, and a preview's
 * pages are not ours to submit anyway).
 *
 * Volume: submit a page when it appears or changes, never the whole site on a
 * timer. An engine that sees the same unchanged URLs again and again answers
 * 429 and trusts the host less.
 */

export const INDEXNOW_HOST = 'fundopshq.com'
const SITE = `https://${INDEXNOW_HOST}`

/** The key, and the file that proves it (public/<key>.txt; a test checks the two agree). */
export const INDEXNOW_KEY = '27f6b0be0c2111d1baea1dee6e43e70d'
export const INDEXNOW_KEY_LOCATION = `${SITE}/${INDEXNOW_KEY}.txt`

/** The shared endpoint: one submission reaches every participating engine. */
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/** The protocol's limit for one POST. */
export const INDEXNOW_MAX_URLS = 10_000

/** How long to wait for the engine before giving up: the caller is a cron job with its own budget. */
const TIMEOUT_MS = 10_000

type Env = Record<string, string | undefined>

/**
 * Whether this deployment may submit. Only the production deploy on Vercel
 * (VERCEL_ENV is "production" there, "preview" on a branch deploy, unset on a
 * laptop and in tests). INDEXNOW_ENABLED=false is the kill switch; it needs a
 * redeploy to take effect, like every Vercel env change.
 */
export function indexNowEnabled(env: Env = process.env): boolean {
  if ((env.INDEXNOW_ENABLED ?? '').trim().toLowerCase() === 'false') return false
  return env.VERCEL_ENV === 'production'
}

/**
 * The URLs to send: each path made absolute on fundopshq.com, anything on
 * another host dropped (the engine refuses a whole batch with a 422 for one
 * stray host), the fragment cut, duplicates removed, order kept, capped.
 */
export function indexNowUrls(pathsOrUrls: Iterable<string | null | undefined>, cap: number = INDEXNOW_MAX_URLS): string[] {
  const limit = Math.max(0, Math.min(cap, INDEXNOW_MAX_URLS))
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of pathsOrUrls) {
    if (out.length >= limit) break
    const p = (raw ?? '').trim()
    if (!p) continue
    let url: URL
    try {
      url = new URL(p, SITE)
    } catch {
      continue
    }
    if (url.protocol !== 'https:' || url.hostname !== INDEXNOW_HOST) continue
    url.hash = ''
    const s = url.toString()
    if (seen.has(s)) continue
    seen.add(s)
    out.push(s)
  }
  return out
}

export interface IndexNowPayload {
  host: string
  key: string
  keyLocation: string
  urlList: string[]
}

/** The body of the POST, exactly as the protocol names its fields. */
export function indexNowPayload(urls: string[]): IndexNowPayload {
  return { host: INDEXNOW_HOST, key: INDEXNOW_KEY, keyLocation: INDEXNOW_KEY_LOCATION, urlList: urls }
}

export interface PingResult {
  /** URLs sent (0 when skipped). */
  sent: number
  /** The engine's HTTP status: 200 taken, 202 taken pending the key check; null when nothing was sent or the request failed. */
  status: number | null
  /** Why nothing was sent, when nothing was. */
  skipped?: 'not_production' | 'no_urls' | 'error'
}

export interface PingOptions {
  /** A word for the log line: which job pinged. */
  label?: string
  /** At most this many URLs (never more than 10,000). */
  cap?: number
  env?: Env
  fetch?: typeof fetch
}

/**
 * Submit pages to IndexNow. Takes paths ("/story/…") or full fundopshq.com URLs.
 * Never throws: every outcome is a PingResult and one log line.
 */
export async function pingIndexNow(pathsOrUrls: Iterable<string | null | undefined>, opts: PingOptions = {}): Promise<PingResult> {
  const label = opts.label ?? 'indexnow'
  try {
    if (!indexNowEnabled(opts.env ?? process.env)) return { sent: 0, status: null, skipped: 'not_production' }
    const urls = indexNowUrls(pathsOrUrls, opts.cap)
    if (urls.length === 0) return { sent: 0, status: null, skipped: 'no_urls' }
    const doFetch = opts.fetch ?? fetch
    const res = await doFetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(indexNowPayload(urls)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const ok = res.status === 200 || res.status === 202
    const line = `[indexnow] ${label}: ${urls.length} URL(s), HTTP ${res.status}`
    if (ok) console.log(line)
    else console.error(`${line} (not accepted)`)
    return { sent: urls.length, status: res.status }
  } catch (err) {
    console.error(`[indexnow] ${label}: submission failed:`, err instanceof Error ? err.message : err)
    return { sent: 0, status: null, skipped: 'error' }
  }
}
