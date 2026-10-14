/**
 * Where a mock-up's logo may come from (2026-10-14): the firm's own website,
 * never anywhere else. A logo file on the firm's domain (or a subdomain) is
 * taken as it is; one served from elsewhere (a site builder's CDN) is taken
 * only when the firm's homepage itself links to that exact file. Given only
 * the domain, the logo is looked for on the homepage: an <img> whose name
 * says logo, else the site's touch icon.
 *
 * Pure: the fetching is in app/api/sponsor/logo/route.ts.
 */

const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/

/** A public web domain, not an address or a local name. */
export function cleanSite(site: string | null | undefined): string | null {
  const s = (site ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0]
  if (!DOMAIN.test(s)) return null
  if (/^\d+(\.\d+)+$/.test(s)) return null
  if (/(^|\.)(localhost|local|internal|vercel\.app)$/.test(s)) return null
  return s
}

export const onSite = (host: string, site: string) => {
  const h = host.toLowerCase().replace(/^www\./, '')
  return h === site || h.endsWith(`.${site}`)
}

/** An https URL with a public host, or null. */
export function cleanLogoUrl(value: string | null | undefined): URL | null {
  try {
    const u = new URL((value ?? '').trim())
    if (u.protocol !== 'https:' || u.username || u.password) return null
    if (!cleanSite(u.hostname)) return null
    return u
  } catch {
    return null
  }
}

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1] ?? null

/** True when the homepage HTML refers to this exact file (absolute, or relative to the page). */
export function homepageLinksTo(html: string, pageUrl: string, logo: URL): boolean {
  const target = logo.href.split('#')[0]
  for (const m of html.matchAll(/(?:src|href|content|srcset)\s*=\s*["']([^"']+)["']/gi)) {
    for (const part of m[1].split(',')) {
      const raw = part.trim().split(/\s+/)[0]
      if (!raw) continue
      try {
        if (new URL(raw.replace(/&amp;/g, '&'), pageUrl).href.split('#')[0] === target) return true
      } catch {
        // not a URL
      }
    }
  }
  return false
}

/** The logo a homepage shows, best guess: an <img> whose src, alt, class or id says logo; else the apple-touch-icon. */
export function findLogoInHomepage(html: string, pageUrl: string): URL | null {
  const resolve = (raw: string | null) => {
    if (!raw) return null
    try {
      const u = new URL(raw.replace(/&amp;/g, '&'), pageUrl)
      return u.protocol === 'https:' ? u : null
    } catch {
      return null
    }
  }
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0]
    const hint = `${attr(tag, 'src') ?? ''} ${attr(tag, 'alt') ?? ''} ${attr(tag, 'class') ?? ''} ${attr(tag, 'id') ?? ''}`
    if (/logo/i.test(hint)) {
      const u = resolve(attr(tag, 'src'))
      if (u && !u.href.startsWith('data:')) return u
    }
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0]
    if (/apple-touch-icon/i.test(attr(tag, 'rel') ?? '')) {
      const u = resolve(attr(tag, 'href'))
      if (u) return u
    }
  }
  return null
}
