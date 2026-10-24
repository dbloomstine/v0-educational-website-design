/**
 * Discovery (2026-10-25): from a registry row to the list of pages to read.
 *
 * Sitemap first: most firm sites list every bio URL in sitemap.xml, so a
 * sitemap source reads robots.txt's Sitemap lines (or /sitemap.xml), walks
 * the index (people-sounding children first), and keeps the URLs that match
 * the source's person_url_pattern. Then listing pages (paginated), a JSON
 * listing (slugs into a URL template), or a headless render of a listing.
 * Team pages (many people inline) are read whole, in chunks.
 */
import type { PoliteFetcher } from './fetcher'
import { PEOPLE_SITEMAP, canonicalUrl, extractLinks, parseSitemap } from './parse'
import type { ListingSpec, PageJob, SourceRow } from './types'

export interface Discovery {
  jobs: PageJob[]
  notes: string[]
  /** Listing or sitemap fetches that failed (a block shows here first). */
  failures: number
  /** True when a step needed Chrome and could not have it (CI). */
  needsHeadless: boolean
}

export function originOf(s: Pick<SourceRow, 'listing_url' | 'firm_domain' | 'selectors'>): string {
  if (s.selectors.origin) return s.selectors.origin.replace(/\/$/, '')
  if (s.listing_url) return new URL(s.listing_url).origin
  return `https://www.${s.firm_domain}`
}

/** The page URLs a listing spec stands for (pagination expanded). */
export function listingUrls(l: ListingSpec): string[] {
  if (!l.pages) return [l.url]
  const { param, start = 1, max = 60, step = 1 } = l.pages
  const out: string[] = []
  for (let p = start; p < start + max * step; p += step) {
    const u = new URL(l.url)
    u.searchParams.set(param, String(p))
    out.push(u.href)
  }
  return out
}

export async function discoverSource(s: SourceRow, f: PoliteFetcher, opt: { allowRender: boolean; log?: (m: string) => void }): Promise<Discovery> {
  const log = opt.log ?? (() => {})
  const notes: string[] = []
  let failures = 0
  let needsHeadless = false
  const pattern = s.person_url_pattern ? new RegExp(s.person_url_pattern, 'i') : null
  const exclude = s.selectors.exclude_pattern ? new RegExp(s.selectors.exclude_pattern, 'i') : null
  // Compared without query, fragment or trailing slash; stored as the site wrote it (a refresh must not churn URLs).
  const bios = new Map<string, string>()
  const keep = (u: string) => {
    const c = canonicalUrl(u)
    if (pattern && pattern.test(c) && !(exclude && exclude.test(c)) && !bios.has(c)) bios.set(c, u.split('#')[0].split('?')[0])
  }

  // 1. Sitemap.
  if (s.method === 'sitemap') {
    const origin = originOf(s)
    const robots = await f.robotsFor(origin)
    const queue = [...(s.selectors.sitemaps?.length ? s.selectors.sitemaps : robots.sitemaps.length ? robots.sitemaps : [`${origin}/sitemap.xml`])]
    const seen = new Set<string>()
    let reads = 0
    while (queue.length && reads < 60) {
      const sm = queue.shift()!
      if (seen.has(sm)) continue
      seen.add(sm)
      reads++
      const r = await f.get(sm)
      if (r.status !== 200) {
        failures++
        notes.push(`sitemap ${sm}: ${r.status}`)
        continue
      }
      const { urls, sitemaps } = parseSitemap(r.body)
      const people = sitemaps.filter((x) => PEOPLE_SITEMAP.test(x))
      // A big index: read the people-sounding children only (when it has any).
      queue.push(...(sitemaps.length > 8 && people.length ? people : sitemaps))
      const before = bios.size
      urls.forEach(keep)
      log(`  ${s.key} sitemap ${sm}: ${urls.length} urls, +${bios.size - before} bios`)
    }
    if (!bios.size) notes.push('sitemap gave no bio URLs matching person_url_pattern')
  }

  // 2. Listings (also the fallback when a sitemap found nothing).
  const listings: ListingSpec[] = s.selectors.listings?.length ? s.selectors.listings : s.listing_url && s.method !== 'json' ? [{ url: s.listing_url, render: s.method === 'headless' }] : []
  if ((s.method !== 'sitemap' || !bios.size) && pattern && s.method !== 'json') {
    for (const l of listings) {
      const render = !!l.render || s.method === 'headless'
      if (render && !opt.allowRender) {
        needsHeadless = true
        notes.push(`listing ${l.url} needs headless Chrome (local run)`)
        continue
      }
      for (const u of listingUrls(l)) {
        const r = await f.get(u, { method: l.method, body: l.body, headers: l.headers, render })
        if (r.status !== 200) {
          failures++
          notes.push(`listing ${u}: ${r.status}${r.error ? ' ' + r.error : ''}`)
          break
        }
        const before = bios.size
        extractLinks(r.body, r.final_url || u).forEach(keep)
        if (l.slug_template) for (const m of r.body.matchAll(/"slug"\s*:\s*"([^"]+)"/g)) keep(l.slug_template.replace('{slug}', m[1].replace(/^\/+/, '')))
        log(`  ${s.key} listing ${u}: +${bios.size - before}`)
        if (l.pages && bios.size === before) break
      }
    }
  }

  const jobs: PageJob[] = []
  const render = !!s.selectors.render_bios
  if (render && !opt.allowRender && bios.size) {
    needsHeadless = true
    notes.push('bios need headless Chrome (local run)')
  } else for (const [, b] of [...bios].sort((x, y) => x[0].localeCompare(y[0]))) jobs.push({ url: b, bio_url: b, kind: 'bio', render })

  // 3. JSON listing: slugs into a template.
  if (s.method === 'json' && s.selectors.json && s.listing_url) {
    const j = s.selectors.json
    const l = s.selectors.listings?.[0]
    const r = await f.get(s.listing_url, { method: l?.method, body: l?.body, headers: l?.headers })
    if (r.status !== 200) {
      failures++
      notes.push(`json listing ${s.listing_url}: ${r.status}`)
    } else {
      const slugs = [...new Set([...r.body.replace(/\\\//g, '/').matchAll(new RegExp(j.slug_regex, 'g'))].map((m) => m[1]))]
      for (const slug of slugs.sort()) {
        const bio_url = j.bio_url_template.replace('{slug}', slug)
        if (j.fetch) jobs.push({ url: j.fetch.url.replace('{slug}', slug), bio_url, kind: 'bio', method: j.fetch.method, body: j.fetch.body?.split('{slug}').join(slug), headers: j.fetch.headers })
        else jobs.push({ url: bio_url, bio_url, kind: 'bio' })
      }
      log(`  ${s.key} json listing: ${slugs.length} slugs`)
    }
  }

  // 4. Team pages: many people inline. A listing source with no person pattern reads its listing as one.
  const teams = s.selectors.team_pages?.length ? s.selectors.team_pages : !pattern && s.listing_url && s.method !== 'json' ? [{ url: s.listing_url, render: s.method === 'headless' }] : []
  for (const t of teams) {
    if ((t.render || s.method === 'headless') && !opt.allowRender) {
      needsHeadless = true
      notes.push(`team page ${t.url} needs headless Chrome (local run)`)
      continue
    }
    jobs.push({ url: t.url, bio_url: t.url, kind: 'team', render: !!t.render || s.method === 'headless' })
  }

  const cap = s.selectors.max_pages ?? 600
  if (jobs.length > cap) {
    notes.push(`capped at ${cap} pages of ${jobs.length}`)
    jobs.length = cap
  }
  return { jobs, notes, failures, needsHeadless }
}
