/**
 * Pure parsers for the crawler: robots.txt, sitemaps, and page HTML to text
 * and links. No I/O here, so each is tested on fixtures.
 */

export const BOT_UA = 'FundOpsHQ-directory-bot (+https://fundopshq.com/about)'
const BOT_TOKEN = 'fundopshq-directory-bot'

// ── robots.txt ──────────────────────────────────────────────────────────────

export interface Robots {
  disallow: string[]
  allow: string[]
  /** Seconds, as the file asks (0 when it does not). */
  crawlDelay: number
  sitemaps: string[]
}

/** The rules for our bot: its own group when the file has one, else the `*` group. */
export function parseRobots(txt: string): Robots {
  const groups: { agents: string[]; disallow: string[]; allow: string[]; delay: number }[] = []
  const sitemaps: string[] = []
  let cur: (typeof groups)[number] | null = null
  let lastWasAgent = false
  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim()
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/)
    if (!m) continue
    const k = m[1].toLowerCase()
    const v = m[2].trim()
    if (k === 'sitemap') {
      if (v) sitemaps.push(v)
      continue
    }
    if (k === 'user-agent') {
      if (!lastWasAgent || !cur) {
        cur = { agents: [], disallow: [], allow: [], delay: 0 }
        groups.push(cur)
      }
      cur.agents.push(v.toLowerCase())
      lastWasAgent = true
      continue
    }
    lastWasAgent = false
    if (!cur) continue
    if (k === 'disallow' && v) cur.disallow.push(v)
    else if (k === 'allow' && v) cur.allow.push(v)
    else if (k === 'crawl-delay') cur.delay = Number(v) || 0
  }
  const mine = groups.filter((g) => g.agents.some((a) => a !== '*' && BOT_TOKEN.includes(a)))
  const use = mine.length ? mine : groups.filter((g) => g.agents.includes('*'))
  return {
    disallow: use.flatMap((g) => g.disallow),
    allow: use.flatMap((g) => g.allow),
    crawlDelay: Math.max(0, ...use.map((g) => g.delay)),
    sitemaps,
  }
}

function ruleLength(rule: string, path: string): number {
  const re = new RegExp(
    '^' +
      rule
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\\\$$/, '$'),
  )
  return re.test(path) ? rule.length : -1
}

/** Longest match wins; on a tie, allow wins (Google's reading). */
export function robotsAllows(r: Robots, url: string): boolean {
  const u = new URL(url)
  const path = u.pathname + u.search
  let best = -1
  let allowed = true
  for (const d of r.disallow) {
    const n = ruleLength(d, path)
    if (n > best) {
      best = n
      allowed = false
    }
  }
  for (const a of r.allow) {
    const n = ruleLength(a, path)
    if (n >= 0 && n >= best) {
      best = n
      allowed = true
    }
  }
  return allowed
}

// ── Sitemaps ────────────────────────────────────────────────────────────────

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim()

/** A sitemap or a sitemap index: the page URLs and the child sitemaps it names. */
export function parseSitemap(xml: string): { urls: string[]; sitemaps: string[] } {
  const urls: string[] = []
  const sitemaps: string[] = []
  for (const m of xml.matchAll(/<sitemap\b[^>]*>([\s\S]*?)<\/sitemap>/gi)) {
    const loc = m[1].match(/<loc>([\s\S]*?)<\/loc>/i)
    if (loc) sitemaps.push(decode(loc[1]))
  }
  for (const m of xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)) {
    const loc = m[1].match(/<loc>([\s\S]*?)<\/loc>/i)
    if (loc) urls.push(decode(loc[1]))
  }
  return { urls, sitemaps }
}

/** In a large index, which child sitemaps to read first: the ones that sound like people. */
export const PEOPLE_SITEMAP = /(people|person|team|professional|lawyer|attorney|bio|leadership|our-?team|staff|member|meet|profile|executive)/i

// ── HTML ────────────────────────────────────────────────────────────────────

/** Visible text, one block a line. Nav and footer go: they repeat on every page and hold contact lines. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|iframe|template|head)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(nav|footer)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|dd|dt)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;|&#8217;|&apos;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;|&mdash;/g, '-')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/** Every link on a page, absolute, without fragments or trailing slashes; JSON bodies' url-ish strings too. */
export function extractLinks(body: string, base: string): string[] {
  const out = new Set<string>()
  const add = (raw: string) => {
    try {
      const u = new URL(raw.replace(/&amp;/g, '&').replace(/\\\//g, '/'), base)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return
      u.hash = ''
      out.add(u.href.replace(/\/$/, ''))
    } catch {
      /* not a URL */
    }
  }
  for (const m of body.matchAll(/href\s*=\s*["']([^"'#]+)["']/gi)) add(m[1])
  for (const m of body.matchAll(/"(?:url|link|href|path|permalink|Url|Link)"\s*:\s*"([^"]+)"/g)) add(m[1])
  return [...out]
}

/** Strip query and trailing slash: the form a bio URL is compared in. */
export const canonicalUrl = (u: string) => u.split('#')[0].split('?')[0].replace(/\/$/, '')

/** Long team pages: chunks of about `size` characters on line boundaries, a few lines overlapping. */
export function chunkText(text: string, size = 12000, overlap = 8): string[] {
  if (text.length <= size) return [text]
  const lines = text.split('\n')
  const out: string[] = []
  let cur: string[] = []
  let len = 0
  for (const l of lines) {
    cur.push(l)
    len += l.length + 1
    if (len > size) {
      out.push(cur.join('\n'))
      cur = cur.slice(-overlap)
      len = cur.join('\n').length
    }
  }
  if (cur.length > overlap || !out.length) out.push(cur.join('\n'))
  return out
}

/** Keep only the lines around a matching line (a firm-wide list filtered to one group). */
export function filterLines(text: string, f: { line: string; before?: number; after?: number; preface?: string }): string {
  const L = text.split('\n').map((s) => s.trim())
  const re = new RegExp(f.line)
  const keep: string[] = []
  const before = f.before ?? 2
  const after = f.after ?? 1
  for (let i = 0; i < L.length; i++) {
    if (!re.test(L[i])) continue
    keep.push(...L.slice(Math.max(0, i - before), i + after + 1), '')
  }
  return [f.preface ?? '', ...keep].filter((s, i) => i > 0 || s).join('\n')
}
