/**
 * Finding a firm's mark on its own website: the pure half of scripts/directory/logos.ts (tested in
 * lib/directory/__tests__/logo-lookup.test.ts). Ported from the social desk's proven lookup
 * (social/engine/logos.mjs: headerLogos, headerSvgs, iconLinks, chooseIcons, standaloneSvg), cut down to what the
 * directory needs: the firm's domain is already on file, so there is no guessing which site is the firm's.
 *
 * The rule (Danny, 2026-10-24 night; the same as the social desk's): a mark comes ONLY from the firm's own website
 * (the logo in its page header, as a picture or drawn inline as SVG; else the icons it publishes for itself, an
 * apple-touch-icon or an SVG or PNG icon of 96 px or more) or from Wikimedia Commons when Commons holds it as public
 * domain. Never a logo-scraping service, another publisher's copy, an og:image of a photo, or a person's picture.
 */

export interface Candidate {
  /** Where the file is (for an inline SVG: the page it was drawn on). */
  href: string
  via: 'header' | 'inline-svg' | 'apple-touch-icon' | 'svg-icon' | 'png-icon' | 'commons'
  /** An inline drawing, written out as a file of its own. */
  svg?: string
  /** A declared icon size, when the page gives one. */
  size?: number | null
  /** For a Commons file: its description page (the licence is stated there). */
  page?: string
}

/** The attributes of one tag. */
export const attrs = (tag: string): Record<string, string> =>
  Object.fromEntries(
    [...tag.matchAll(/([a-z][a-z0-9:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)].map((m) => [m[1].toLowerCase(), (m[2] ?? m[3] ?? m[4] ?? '').replace(/&amp;/g, '&').trim()]),
  )

const TWO_PART = new Set(['co', 'com', 'org', 'net', 'gov', 'ac', 'edu', 'or', 'ne', 'go'])
/** "www.blackstone.com" → "blackstone.com"; "www.ardian.co.uk" → "ardian.co.uk". */
export function registrable(host: string): string {
  const p = host.toLowerCase().replace(/\.$/, '').split('.')
  if (p.length <= 2) return p.join('.')
  return (p[p.length - 1].length === 2 && TWO_PART.has(p[p.length - 2]) ? p.slice(-3) : p.slice(-2)).join('.')
}
export const domainOf = (url: string) => {
  try {
    return registrable(new URL(url).hostname)
  } catch {
    return ''
  }
}

/** Words that never tell one firm from another. */
const GENERIC = new Set(['the', 'and', 'capital', 'partners', 'group', 'global', 'first', 'american', 'national', 'general', 'investment', 'management', 'asset', 'equity', 'fund', 'new', 'bank', 'llp', 'llc', 'lp', 'inc', 'co', 'company', 'pc', 'associates', 'advisors', 'advisory', 'usa', 'us'])
const flat = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '')
const telling = (name: string) =>
  name
    .replace(/\(.*?\)/g, ' ')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w.length >= 2 && !GENERIC.has(w))

/**
 * A domain the firm has plainly moved to (saxllp.com → saxadvisorygroup.com): its name carries a distinctive word of
 * the firm's name, the one on file or the one in brackets ("Sax LLP (Sax Advisory Group)").
 */
export function plainlyMoved(firmName: string, url: string): boolean {
  const label = flat(domainOf(url).split('.')[0] ?? '')
  const words = telling(firmName.replace(/[()]/g, ' '))
  return label.length > 2 && words.some((w) => w.length >= 3 && label.includes(flat(w)))
}

/** Does the home page speak of the firm: its address or its title carries a distinctive word of the name? */
export function pageNamesFirm(firmName: string, url: string, html: string): boolean {
  const metas = (html.match(/<meta\b[^>]*>/gi) ?? []).map(attrs).filter((a) => /^(og:site_name|og:title|application-name|apple-mobile-web-app-title)$/i.test(a.property ?? a.name ?? '')).map((a) => a.content)
  const hay = flat(new URL(url).hostname) + ' ' + flat([/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '', ...metas].join(' '))
  const words = telling(firmName.replace(/[()]/g, ' ')).filter((w) => w.length >= 2)
  return (words.length ? words : [flat(firmName)]).some((w) => hay.includes(flat(w)))
}

/** The page above the end of its header (or, with none, its navigation): the only part where a "logo" is the firm's own. */
function headerPart(html: string): string | null {
  const text = html.replace(/<!--[\s\S]*?-->/g, '')
  const h = text.search(/<\/header>/i)
  const n = text.search(/<\/nav>/i)
  const end = h >= 0 ? h : n
  if (end < 0) return null
  return text.slice(Math.max(0, text.search(/<body\b/i)), end)
}

/** Pictures in the header that the page itself calls a logo or its brand; the one drawn for a dark ground last. */
export function headerImages(html: string, pageUrl: string): Candidate[] {
  const top = headerPart(html)
  if (!top) return []
  const out: Candidate[] = []
  for (const tag of top.match(/<img\b[^>]*>/gi) ?? []) {
    const a = attrs(tag)
    const src = a.src || a['data-src'] || (a.srcset ?? '').split(',')[0]?.trim().split(/\s+/)[0]
    if (!src || /^data:/i.test(src)) continue
    if (!/logo|brand/i.test(`${a.class ?? ''} ${a.id ?? ''} ${a.alt ?? ''} ${src}`)) continue
    let href: string
    try {
      href = new URL(src, pageUrl).href
    } catch {
      continue
    }
    if (!/^https?:/.test(href) || !/\.(svg|png|jpe?g|webp)(\?|$)/i.test(href)) continue
    out.push({ href, via: 'header' })
  }
  const reversed = (c: Candidate) => /reversed|inverse|inverted|negative|white|light|footer/i.test(c.href)
  return [...out.filter((c) => !reversed(c)), ...out.filter(reversed)].slice(0, 2)
}

const NOT_A_LOGO = /linkedin|twitter|facebook|instagram|youtube|tiktok|social|\bshare\b|search|\bmenu\b|hamburger|toggle|\bclose\b|arrow|chevron|caret|\bplay\b/i

/**
 * A logo drawn into the header as inline SVG: taken when the drawing (or the box right round it) is called a logo or a
 * brand, or it is the drawing inside the header's link to the home page. Never one inside a link to another site,
 * never one called a menu, a search or a social network, never one of favicon size, never one that could run code.
 */
export function headerSvgs(html: string, pageUrl: string): Candidate[] {
  const top = headerPart(html)
  if (!top) return []
  const out: Candidate[] = []
  const re = /<svg\b[^>]*>[\s\S]*?<\/svg>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(top))) {
    const markup = m[0]
    const before = top.slice(Math.max(0, m.index - 600), m.index)
    const own = attrs(/<svg\b[^>]*>/i.exec(markup)![0])
    const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(markup)?.[1] ?? ''
    const said = `${own.class ?? ''} ${own.id ?? ''} ${own['aria-label'] ?? ''} ${title}`
    const lastA = [...before.matchAll(/<a\b[^>]*>/gi)].pop()
    const closedA = lastA ? /<\/a>/i.test(before.slice(lastA.index! + lastA[0].length)) : true
    const link = lastA && !closedA ? attrs(lastA[0]) : null
    if (link?.href) {
      try {
        const to = new URL(link.href, pageUrl)
        if (/^https?:/.test(to.protocol) && domainOf(to.href) !== domainOf(pageUrl)) continue
      } catch {
        /* a link we cannot read says nothing */
      }
    }
    if (NOT_A_LOGO.test(said) || NOT_A_LOGO.test(`${link?.['aria-label'] ?? ''} ${link?.class ?? ''}`)) continue
    const boxed = /class\s*=\s*["'][^"']*(logo|brand)[^"']*["'][^<]*>\s*(<[^>]+>\s*)?$/i.test(before)
    const home = Boolean(link?.href && /^(\/|\.\/|https?:\/\/[^/]+\/?)(index\.html?|home)?$/i.test(link.href.trim()))
    if (!/logo|brand/i.test(said) && !boxed && !home) continue
    const svg = standaloneSvg(markup)
    if (svg) out.push({ href: pageUrl, via: 'inline-svg', svg })
  }
  return out.slice(0, 2)
}

/** An inline drawing as a file of its own: namespace declared, a size from its view box, `currentColor` made near-black. */
export function standaloneSvg(markup: string): string | null {
  if (/<script|<foreignObject|\son[a-z]+\s*=|<iframe|<object|<embed|<use\b[^>]*href\s*=\s*["']#/i.test(markup)) return null
  if (!/<(path|polygon|polyline|rect|circle|ellipse|line|text)\b/i.test(markup.replace(/<defs\b[\s\S]*?<\/defs>/gi, ''))) return null
  const head = /<svg\b[^>]*>/i.exec(markup)![0]
  const a = attrs(head)
  let vb = (a.viewbox ?? '').trim().split(/[\s,]+/).map(Number)
  if (vb.length !== 4 || vb.some((x) => !Number.isFinite(x)) || vb[2] <= 0 || vb[3] <= 0) {
    const w = parseFloat(a.width)
    const h = parseFloat(a.height)
    if (!(w > 0 && h > 0)) return null
    vb = [0, 0, w, h]
  }
  if (Math.max(vb[2], vb[3]) < 32) return null
  const scale = 480 / Math.max(vb[2], vb[3])
  const body = markup.replace(/^<svg\b[^>]*>/i, '').replace(/<\/svg>\s*$/i, '').replace(/currentColor/gi, '#1a1a1a')
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${vb.join(' ')}" width="${Math.round(vb[2] * scale)}" height="${Math.round(vb[3] * scale)}">${body}</svg>`
}

/** The icons a page publishes for itself, best first: apple-touch-icon (120 px or more), an SVG icon, a PNG icon of 96 px or more. */
export function iconCandidates(html: string, pageUrl: string): Candidate[] {
  const head = html.replace(/<!--[\s\S]*?-->/g, '')
  const links: { href: string; apple: boolean; type: string; size: number | null }[] = []
  for (const tag of head.match(/<link\b[^>]*>/gi) ?? []) {
    const a = attrs(tag)
    const rel = (a.rel ?? '').toLowerCase().split(/\s+/)
    if (!a.href || !rel.some((r) => r === 'icon' || r.startsWith('apple-touch-icon'))) continue
    let href: string
    try {
      href = new URL(a.href, pageUrl).href
    } catch {
      continue
    }
    if (!/^https?:/.test(href)) continue
    const sizes = [...(a.sizes ?? '').matchAll(/(\d+)x(\d+)/gi)].map((m) => Math.min(+m[1], +m[2]))
    links.push({ href, apple: rel.some((r) => r.startsWith('apple-touch-icon')), type: (a.type ?? '').toLowerCase(), size: sizes.length ? Math.max(...sizes) : null })
  }
  const isSvg = (l: (typeof links)[number]) => l.type.includes('svg') || /\.svg(\?|$)/i.test(l.href)
  const by = (x: (typeof links)[number], y: (typeof links)[number]) => (y.size ?? 0) - (x.size ?? 0)
  const apple = links.filter((l) => l.apple && (l.size === null || l.size >= 120)).sort(by)
  const svg = links.filter((l) => !l.apple && isSvg(l))
  const png = links.filter((l) => !l.apple && !isSvg(l) && /png/.test(l.type + l.href) && (l.size === null || l.size >= 96)).sort(by)
  const seen = new Set<string>()
  return [
    ...apple.map((l): Candidate => ({ href: l.href, via: 'apple-touch-icon', size: l.size })),
    ...svg.map((l): Candidate => ({ href: l.href, via: 'svg-icon', size: l.size })),
    ...png.map((l): Candidate => ({ href: l.href, via: 'png-icon', size: l.size })),
  ].filter((c) => !seen.has(c.href) && Boolean(seen.add(c.href)))
}

/** Every candidate on a home page, in the order they are tried. */
export const candidatesOn = (html: string, pageUrl: string): Candidate[] => [...headerImages(html, pageUrl), ...headerSvgs(html, pageUrl), ...iconCandidates(html, pageUrl).slice(0, 3)]

// ── Judging the pixels ──────────────────────────────────────────────────────

export interface PixelStats {
  /** Pixels with any real ink (alpha ≥ 200). */
  solid: number
  /** Of those, how many are near white. */
  light: number
  /** Near-clear pixels. */
  clear: number
  total: number
  /** Distinct colours, coarsely (4 bits a channel). */
  colours: number
}

/** Stats over RGBA pixels. */
export function pixelStats(rgba: Uint8Array | Buffer): PixelStats {
  let solid = 0
  let light = 0
  let clear = 0
  const colours = new Set<number>()
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    const a = rgba[i + 3]
    if (a < 128) clear++
    if (a < 200) continue
    solid++
    colours.add(((rgba[i] >> 4) << 8) | ((rgba[i + 1] >> 4) << 4) | (rgba[i + 2] >> 4))
    if (0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2] > 200) light++
  }
  return { solid, light, clear, total: rgba.length / 4, colours: colours.size }
}

/** Why a file is not a mark, or null when it is one. */
export function notAMark(s: PixelStats): string | null {
  if (!s.solid) return 'nothing is drawn in it'
  if (s.colours > 280) return `it looks like a photograph (${s.colours} colours), not a mark`
  if (s.clear / s.total < 0.02 && s.light / s.solid > 0.985) return 'it is all but white'
  if (s.clear / s.total < 0.02 && s.colours <= 2) return 'it is a plain block of colour'
  return null
}

/**
 * How the page draws it (lib/directory/logos.ts): `own` when the file has its own background; `ink` when it is one
 * tone (all dark or all light) on clear, so a silhouette keeps every part; `plate` when it mixes light and dark parts.
 */
export function drawMode(s: PixelStats): 'ink' | 'plate' | 'own' {
  if (s.clear / s.total < 0.02) return 'own'
  const share = s.solid ? s.light / s.solid : 0
  return share < 0.1 || share > 0.9 ? 'ink' : 'plate'
}
