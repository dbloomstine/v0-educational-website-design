import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { cleanLogoUrl, cleanSite, findLogoInHomepage, homepageLinksTo, onSite } from '@/lib/sponsor/logo-source'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

/**
 * GET /api/sponsor/logo?site=<firm domain>&logo=<file URL, optional>
 *
 * A logo already resolved from the firm's homepage header and hosted by us
 * (outreach_v2_logos, scripts/outreach-v2/resolve-logos.ts) is served first;
 * a firm resolved to "none" gets its name in type. Otherwise:
 * The logo for an outreach mock-up of the /sponsor ad builder, fetched from the
 * firm's own website only (rules in lib/sponsor/logo-source.ts) and handed to
 * the builder, which redraws it as a PNG. 404 when there is none: the ad then
 * shows the firm's name.
 */

const MAX_IMAGE = 2_000_000
const MAX_PAGE = 1_500_000
const TIMEOUT = 6_000

async function readCapped(res: Response, max: number): Promise<Uint8Array | null> {
  const reader = res.body?.getReader()
  if (!reader) return null
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const out = new Uint8Array(size)
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.byteLength
  }
  return out
}

const get = (url: string, accept: string) =>
  fetch(url, { headers: { Accept: accept, 'User-Agent': 'FundOpsHQ mock-up (fundopshq.com/sponsor)' }, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT) })

async function homepage(site: string): Promise<{ html: string; url: string } | null> {
  for (const url of [`https://${site}/`, `https://www.${site}/`]) {
    try {
      const res = await get(url, 'text/html')
      if (!res.ok || !onSite(new URL(res.url || url).hostname, site)) continue
      const bytes = await readCapped(res, MAX_PAGE)
      if (bytes) return { html: new TextDecoder().decode(bytes), url: res.url || url }
    } catch {
      // try the next form
    }
  }
  return null
}

const none = () => NextResponse.json({ error: 'no logo' }, { status: 404, headers: { 'Cache-Control': 'public, s-maxage=3600' } })

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  const site = cleanSite(q.get('site'))
  if (!site) return none()
  // Resolved and hosted by us (from the firm's own homepage header): that, and nothing else.
  const { data: kept } = await getSupabaseAdmin().from('outreach_v2_logos').select('public_url, source_kind, tone').eq('domain', site).maybeSingle()
  if (kept) {
    if (!kept.public_url || kept.source_kind === 'none') return none()
    try {
      const res = await get(kept.public_url, 'image/png')
      const bytes = res.ok ? await readCapped(res, MAX_IMAGE) : null
      if (!bytes) return none()
      return new NextResponse(Buffer.from(bytes), {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, s-maxage=300', 'X-Content-Type-Options': 'nosniff', 'X-Logo-Tone': String(kept.tone ?? '') },
      })
    } catch {
      return none()
    }
  }
  const asked = q.get('logo')
  let logo = asked && /^https:\/\//i.test(asked) ? cleanLogoUrl(asked) : null

  if (!logo || !onSite(logo.hostname, site)) {
    const page = await homepage(site)
    if (!page) return none()
    // A file elsewhere counts only when the firm's own homepage uses it; with no file named, find the one it shows.
    logo = logo ? (homepageLinksTo(page.html, page.url, logo) ? logo : null) : findLogoInHomepage(page.html, page.url)
    if (!logo) return none()
  }

  try {
    const res = await get(logo.href, 'image/*')
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    if (!res.ok || !type.startsWith('image/')) return none()
    const bytes = await readCapped(res, MAX_IMAGE)
    if (!bytes) return none()
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff',
        // An SVG served from our origin must never run as a page.
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    })
  } catch {
    return none()
  }
}
