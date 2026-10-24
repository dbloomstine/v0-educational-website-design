/**
 * The crawler's only way onto the network (2026-10-25). Polite by construction:
 *
 *   - robots.txt is read first for every origin, and a disallowed URL is never fetched
 *   - our own user agent, FundOpsHQ-directory-bot (+https://fundopshq.com/about)
 *   - at most one request a second per host (longer when robots.txt asks, up to 10 s)
 *   - an on-disk cache; a stale entry is revalidated with ETag / Last-Modified, so a
 *     page that has not changed costs the firm a 304
 *   - headless Chrome (`--headless=new --dump-dom`) only when a source needs it and
 *     only where Chrome exists (never in CI)
 *
 * Server-only (node:fs, node:child_process): imported by scripts, never by a page.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { BOT_UA, parseRobots, robotsAllows, type Robots } from './parse'

export const CHROME_PATH = process.env.DIRECTORY_CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
/** Some sites refuse a non-browser agent outright; the rendered path keeps our bot name in the string. */
const RENDER_UA = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36 ${BOT_UA}`

export interface FetchResult {
  url: string
  /** HTTP status, or 'robots' (disallowed, not fetched), 'error' (network), 'no-chrome'. */
  status: number | 'robots' | 'error' | 'no-chrome'
  final_url: string
  body: string
  /** Where the body came from. */
  via: 'network' | 'cache' | 'revalidated'
  error?: string
}

export interface FetchOptions {
  method?: 'GET' | 'POST'
  body?: string
  headers?: Record<string, string>
  render?: boolean
}

interface CacheEntry {
  status: number
  final_url: string
  body: string
  etag?: string | null
  last_modified?: string | null
  stored_at: number
}

export interface FetcherStats {
  requests: number
  cache: number
  revalidated: number
  robots_blocked: number
  errors: number
  rendered: number
  by_status: Record<string, number>
}

export class PoliteFetcher {
  readonly stats: FetcherStats = { requests: 0, cache: 0, revalidated: 0, robots_blocked: 0, errors: 0, rendered: 0, by_status: {} }
  private robots = new Map<string, Promise<Robots>>()
  private hostChain = new Map<string, Promise<void>>()
  private lastHit = new Map<string, number>()

  constructor(
    readonly opts: {
      cacheDir?: string
      /** Days a cached page is used without asking the site again (default 6: a weekly refresh asks). */
      maxAgeDays?: number
      /** Allow headless Chrome (false in CI). */
      allowRender?: boolean
      /** Minimum milliseconds between two requests to one host (default 1100). */
      minGapMs?: number
      log?: (s: string) => void
    } = {},
  ) {}

  get cacheDir() {
    return this.opts.cacheDir ?? process.env.DIRECTORY_CRAWL_CACHE ?? join(homedir(), '.cache', 'fundopshq-directory')
  }

  private cachePath(key: string, host: string) {
    const dir = join(this.cacheDir, host.replace(/[^a-z0-9.-]/gi, '_'))
    mkdirSync(dir, { recursive: true })
    return join(dir, createHash('sha1').update(key).digest('hex') + '.json')
  }

  private readCache(key: string, host: string): CacheEntry | null {
    const p = this.cachePath(key, host)
    if (!existsSync(p)) return null
    try {
      return JSON.parse(readFileSync(p, 'utf8')) as CacheEntry
    } catch {
      return null
    }
  }

  private writeCache(key: string, host: string, e: CacheEntry) {
    writeFileSync(this.cachePath(key, host), JSON.stringify(e))
  }

  /** Serialize requests per host, at least `gap` ms apart. */
  private async slot(host: string, gap: number) {
    const prev = this.hostChain.get(host) ?? Promise.resolve()
    let release!: () => void
    const mine = new Promise<void>((r) => (release = r))
    this.hostChain.set(host, prev.then(() => mine))
    await prev
    const wait = (this.lastHit.get(host) ?? 0) + gap - Date.now()
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    this.lastHit.set(host, Date.now())
    release()
  }

  async robotsFor(origin: string): Promise<Robots> {
    let p = this.robots.get(origin)
    if (!p) {
      p = (async () => {
        const host = new URL(origin).host
        const key = `robots:${origin}`
        const c = this.readCache(key, host)
        if (c && Date.now() - c.stored_at < 86400e3) return parseRobots(c.status === 200 ? c.body : '')
        await this.slot(host, this.opts.minGapMs ?? 1100)
        try {
          this.stats.requests++
          const r = await fetch(`${origin}/robots.txt`, { headers: { 'user-agent': BOT_UA }, signal: AbortSignal.timeout(20000) })
          const body = r.ok ? await r.text() : ''
          this.writeCache(key, host, { status: r.status, final_url: r.url, body, stored_at: Date.now() })
          // 4xx: no rules (allowed). 5xx: treat as disallow-all, as Google does.
          if (r.status >= 500) return { disallow: ['/'], allow: [], crawlDelay: 0, sitemaps: [] }
          return parseRobots(body)
        } catch {
          return { disallow: [], allow: [], crawlDelay: 0, sitemaps: [] }
        }
      })()
      this.robots.set(origin, p)
    }
    return p
  }

  async allowed(url: string): Promise<boolean> {
    return robotsAllows(await this.robotsFor(new URL(url).origin), url)
  }

  private async gapFor(url: string) {
    const r = await this.robotsFor(new URL(url).origin)
    return Math.max(this.opts.minGapMs ?? 1100, Math.min(r.crawlDelay, 10) * 1000)
  }

  async get(url: string, o: FetchOptions = {}): Promise<FetchResult> {
    const method = o.method ?? 'GET'
    const host = new URL(url).host
    const key = `${o.render ? 'render' : 'fetch'}:${method}:${url}:${o.body ?? ''}`
    const maxAge = (this.opts.maxAgeDays ?? 6) * 86400e3
    const cached = this.readCache(key, host)
    if (cached && Date.now() - cached.stored_at < maxAge) {
      this.stats.cache++
      return { url, status: cached.status, final_url: cached.final_url, body: cached.body, via: 'cache' }
    }
    if (!(await this.allowed(url))) {
      this.stats.robots_blocked++
      return { url, status: 'robots', final_url: url, body: '', via: 'network' }
    }
    if (o.render) return this.render(url, key, host, cached)
    await this.slot(host, await this.gapFor(url))
    const headers: Record<string, string> = {
      'user-agent': BOT_UA,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.9,*/*;q=0.8',
      ...(method === 'POST' ? { 'content-type': 'application/json' } : {}),
      ...(o.headers ?? {}),
    }
    if (cached && method === 'GET') {
      if (cached.etag) headers['if-none-match'] = cached.etag
      if (cached.last_modified) headers['if-modified-since'] = cached.last_modified
    }
    try {
      this.stats.requests++
      const r = await fetch(url, { method, body: method === 'POST' ? (o.body ?? '') : undefined, headers, redirect: 'follow', signal: AbortSignal.timeout(30000) })
      this.stats.by_status[r.status] = (this.stats.by_status[r.status] ?? 0) + 1
      if (r.status === 304 && cached) {
        this.stats.revalidated++
        this.writeCache(key, host, { ...cached, stored_at: Date.now() })
        return { url, status: cached.status, final_url: cached.final_url, body: cached.body, via: 'revalidated' }
      }
      const body = await r.text()
      if (r.status === 200) this.writeCache(key, host, { status: 200, final_url: r.url, body, etag: r.headers.get('etag'), last_modified: r.headers.get('last-modified'), stored_at: Date.now() })
      return { url, status: r.status, final_url: r.url, body, via: 'network' }
    } catch (e) {
      this.stats.errors++
      return { url, status: 'error', final_url: url, body: '', via: 'network', error: e instanceof Error ? e.message : String(e) }
    }
  }

  private async render(url: string, key: string, host: string, cached: CacheEntry | null): Promise<FetchResult> {
    if (!this.opts.allowRender || !existsSync(CHROME_PATH)) return { url, status: 'no-chrome', final_url: url, body: cached?.body ?? '', via: 'network' }
    await this.slot(host, await this.gapFor(url))
    this.stats.requests++
    this.stats.rendered++
    const args = [
      '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
      '--blink-settings=imagesEnabled=false', `--user-agent=${RENDER_UA}`, '--virtual-time-budget=15000', '--dump-dom', url,
    ]
    const body = await new Promise<string | null>((resolve) => {
      execFile(CHROME_PATH, args, { timeout: 90000, maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => resolve(err && !stdout ? null : stdout))
    })
    if (!body || body.length < 200) {
      this.stats.errors++
      return { url, status: 'error', final_url: url, body: '', via: 'network', error: 'headless render returned nothing' }
    }
    this.writeCache(key, host, { status: 200, final_url: url, body, stored_at: Date.now() })
    return { url, status: 200, final_url: url, body, via: 'network' }
  }
}
