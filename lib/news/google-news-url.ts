/**
 * Google News redirect URLs → the publisher's URL.
 *
 * Google News RSS items link to `https://news.google.com/rss/articles/<id>`
 * rather than to the article. Half of what the pipeline ingests arrives this
 * way (49% in the 2026-10-12 audit), and until 2026-10-16 none of it resolved:
 * the enricher skipped the host, so the row was headline-only, its story page
 * linked to Google, and the publisher's own feed could not be matched against
 * it by URL. Three ways to the real address, tried in this order:
 *
 *   1. The id itself. Until mid-2024 the id was a base64 protobuf that carried
 *      the URL as a string ("CBMiK2h0dHBz…" decodes to "https://…"). Costs
 *      nothing; still true of some old links.
 *   2. The `batchexecute` endpoint (what the open-source googlenewsdecoder
 *      tools do). The article page carries a signature and a timestamp
 *      (`data-n-a-sg`, `data-n-a-ts`) which, posted to
 *      `/_/DotsSplashUi/data/batchexecute` as a `garturlreq`, answer with a
 *      `garturlres` holding the URL. One GET (about 1 MB of HTML) and one POST.
 *   3. The page itself: a server redirect, a `data-n-au` attribute, a meta
 *      refresh, a `location.replace`, or a link out to a non-Google host.
 *
 * Everything that parses is a pure function with tests; `resolveGoogleNewsUrl`
 * is the only one that touches the network and takes `fetch` as a parameter.
 */

export const GOOGLE_NEWS_HOST = 'news.google.com'

const ARTICLE_PATH = /^\/(?:rss\/)?articles\/([A-Za-z0-9_-]+)\/?$/

export type GoogleNewsResolution = {
  url: string
  method: 'not-google' | 'payload' | 'batchexecute' | 'redirect' | 'html' | 'unresolved'
}

export function isGoogleNewsUrl(url: string | null | undefined): boolean {
  return googleNewsArticleId(url) !== null
}

/** The article id of a Google News link, or null when the link is not one. */
export function googleNewsArticleId(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname !== GOOGLE_NEWS_HOST) return null
    const m = ARTICLE_PATH.exec(u.pathname)
    return m ? m[1] : null
  } catch {
    return null
  }
}

function base64UrlDecode(s: string): Uint8Array | null {
  try {
    const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)
    return new Uint8Array(Buffer.from(padded, 'base64'))
  } catch {
    return null
  }
}

/** Every length-delimited field (wire type 2) in a protobuf message, in order. */
function protobufStrings(bytes: Uint8Array): string[] {
  const out: string[] = []
  let i = 0
  const varint = (): number | null => {
    let shift = 0
    let value = 0
    while (i < bytes.length) {
      const b = bytes[i++]
      value += (b & 0x7f) * 2 ** shift
      if ((b & 0x80) === 0) return value
      shift += 7
      if (shift > 35) return null
    }
    return null
  }
  while (i < bytes.length) {
    const key = varint()
    if (key === null) break
    const wire = key & 7
    if (wire === 0) {
      if (varint() === null) break
    } else if (wire === 1) {
      i += 8
    } else if (wire === 5) {
      i += 4
    } else if (wire === 2) {
      const len = varint()
      if (len === null || i + len > bytes.length) break
      out.push(Buffer.from(bytes.subarray(i, i + len)).toString('utf8'))
      i += len
    } else {
      break
    }
  }
  return out
}

/**
 * The publisher URL carried inside an old-style article id, else null. New
 * ids (since mid-2024) carry an opaque "AU_yqL…" token instead and need
 * the batchexecute call.
 */
export function decodeArticleIdPayload(id: string): string | null {
  const bytes = base64UrlDecode(id)
  if (!bytes) return null
  const strings = protobufStrings(bytes)
  // Field 4 is the URL and field 3, when present, an AMP copy; prefer the
  // non-AMP one. Anything that is not a URL (the new opaque token) is skipped.
  const urls = strings.filter((s) => /^https?:\/\/\S+$/.test(s))
  if (urls.length === 0) return null
  const plain = urls.find((u) => !/\/amp\b|[?&]amp\b|\bamp\./i.test(u))
  return plain ?? urls[0]
}

/** The signature and timestamp the article page carries for batchexecute. */
export function readSignature(html: string): { signature: string; timestamp: number } | null {
  const sg = /data-n-a-sg="([^"]+)"/.exec(html)?.[1]
  const ts = /data-n-a-ts="(\d+)"/.exec(html)?.[1]
  if (!sg || !ts) return null
  return { signature: sg, timestamp: Number(ts) }
}

/** The form body of a `garturlreq` for one article. */
export function batchexecuteBody(id: string, signature: string, timestamp: number): string {
  const req = [
    'garturlreq',
    [['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1], 'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0],
    id,
    timestamp,
    signature,
  ]
  return new URLSearchParams({ 'f.req': JSON.stringify([[['Fbv4je', JSON.stringify(req), null, 'generic']]]) }).toString()
}

/** The URL in a batchexecute answer (`)]}'` prefix, then JSON rows), else null. */
export function parseBatchexecuteResponse(text: string): string | null {
  const body = text.replace(/^\)\]\}'\s*/, '').trim()
  // The answer can be chunked: a length line, then a JSON array, repeated.
  const start = body.indexOf('[')
  if (start < 0) return null
  let outer: unknown
  try {
    outer = JSON.parse(body.slice(start))
  } catch {
    // Chunked form: find the first complete array by bracket depth.
    const chunk = firstJsonArray(body.slice(start))
    if (!chunk) return null
    try {
      outer = JSON.parse(chunk)
    } catch {
      return null
    }
  }
  if (!Array.isArray(outer)) return null
  for (const row of outer) {
    if (!Array.isArray(row) || row[1] !== 'Fbv4je' || typeof row[2] !== 'string') continue
    try {
      const inner = JSON.parse(row[2])
      const url = Array.isArray(inner) ? inner[1] : null
      if (typeof url === 'string' && /^https?:\/\//.test(url)) return url
    } catch {
      return null
    }
  }
  return null
}

function firstJsonArray(s: string): string | null {
  let depth = 0
  let inString = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inString) {
      if (c === '\\') i++
      else if (c === '"') inString = false
      continue
    }
    if (c === '"') inString = true
    else if (c === '[') depth++
    else if (c === ']') {
      depth--
      if (depth === 0) return s.slice(0, i + 1)
    }
  }
  return null
}

function decodeEmbedded(url: string): string {
  return url.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
}

function isOutsideGoogle(url: string): boolean {
  try {
    const h = new URL(url).hostname
    return !/(^|\.)google\.com$|(^|\.)googleusercontent\.com$|(^|\.)gstatic\.com$|(^|\.)youtube\.com$|(^|\.)google\.[a-z.]+$/i.test(h)
  } catch {
    return false
  }
}

/** The publisher URL embedded in the interstitial page, when there is one. */
export function findPublisherUrlInHtml(html: string): string | null {
  const dataNau = /data-n-au="([^"]+)"/.exec(html)?.[1]
  if (dataNau) {
    const u = decodeEmbedded(dataNau)
    if (isOutsideGoogle(u)) return u
  }
  const metaRefresh = /<meta[^>]+http-equiv=["']refresh["'][^>]+url=([^"'>\s]+)/i.exec(html)?.[1]
  if (metaRefresh) {
    const u = decodeEmbedded(metaRefresh)
    if (isOutsideGoogle(u)) return u
  }
  const jsRedirect = /location\.replace\(["']([^"']+)["']\)/.exec(html)?.[1]
  if (jsRedirect) {
    const u = decodeEmbedded(jsRedirect)
    if (isOutsideGoogle(u)) return u
  }
  // The "Opening …" interstitial links the article itself.
  const anchors = html.matchAll(/<a[^>]+href="(https?:\/\/[^"]+)"/gi)
  for (const a of anchors) {
    const u = decodeEmbedded(a[1])
    if (isOutsideGoogle(u) && !/policies|support|accounts|play\.google|apple\.com|chrome/i.test(u)) return u
  }
  return null
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

/**
 * Resolve a Google News link. Returns the input unchanged (method
 * 'not-google') for any other URL, and the input with method 'unresolved'
 * when every way failed, so callers can always store the result.
 */
export async function resolveGoogleNewsUrl(
  url: string,
  opts: { fetch?: FetchLike; timeoutMs?: number } = {}
): Promise<GoogleNewsResolution> {
  const id = googleNewsArticleId(url)
  if (!id) return { url, method: 'not-google' }

  const fromPayload = decodeArticleIdPayload(id)
  if (fromPayload) return { url: fromPayload, method: 'payload' }

  const doFetch = opts.fetch ?? fetch
  const timeoutMs = opts.timeoutMs ?? 10_000
  const withTimeout = (init: RequestInit): RequestInit => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), timeoutMs).unref?.()
    return { ...init, signal: controller.signal }
  }

  try {
    const res = await doFetch(
      `https://${GOOGLE_NEWS_HOST}/articles/${id}`,
      withTimeout({ method: 'GET', redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' } })
    )
    if (res.url && isOutsideGoogle(res.url)) return { url: res.url, method: 'redirect' }
    const html = await res.text()

    const sig = readSignature(html)
    if (sig) {
      const answer = await doFetch(
        `https://${GOOGLE_NEWS_HOST}/_/DotsSplashUi/data/batchexecute`,
        withTimeout({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'User-Agent': UA },
          body: batchexecuteBody(id, sig.signature, sig.timestamp),
        })
      )
      if (answer.ok) {
        const resolved = parseBatchexecuteResponse(await answer.text())
        if (resolved && isOutsideGoogle(resolved)) return { url: resolved, method: 'batchexecute' }
      }
    }

    const inHtml = findPublisherUrlInHtml(html)
    if (inHtml) return { url: inHtml, method: 'html' }
  } catch {
    // network failure, timeout, or a shape we do not know: keep the Google URL
  }
  return { url, method: 'unresolved' }
}
