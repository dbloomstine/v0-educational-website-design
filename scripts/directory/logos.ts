/**
 * Fetch the directory's firm logos (2026-10-24 night). Run by hand or by the refresh job after a crawl loads:
 *
 *   npx tsx --env-file=.env.local scripts/directory/logos.ts                 every firm in directory_people (read only)
 *   npx tsx scripts/directory/logos.ts --domains evercore.com=Evercore,lazard.com=Lazard
 *   npx tsx scripts/directory/logos.ts --file crawl.jsonl                    the firms a crawl file names
 *   options: --refresh (fetch again even when a mark is on file)  --retry-misses (ask again now for firms with none)
 *            --dry (look, write nothing)
 *
 * The rule (the social desk's, Danny 2026-10-11 and 2026-10-24): a firm's mark comes ONLY from its own website, at
 * the domain on file (the logo in the page header, a picture or an inline SVG; else its apple-touch-icon or an SVG or
 * PNG icon of 96 px or more), or from Wikimedia Commons when Wikidata gives the firm's own domain as its official
 * website and Commons holds the logo as public domain. Nothing else: no logo services, no other publisher's copy.
 *
 * What it keeps: public/logos/directory/<domain>.png, cropped to the mark, at most 360 x 112, and an entry in
 * lib/directory/logos.json with where it came from (page, file URL, how found) and when. A firm already on file is
 * skipped; one with no mark is asked again after 30 days; one a person rejected ("rejected": true, with a reason) is
 * never fetched again without --refresh. Ends with a report of what was found and what was missed, and why.
 *
 * Read-only on the database. The pure half (finding and judging candidates) is lib/directory/logo-lookup.ts, tested.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { candidatesOn, domainOf, drawMode, notAMark, pageNamesFirm, pixelStats, plainlyMoved, type Candidate } from '@/lib/directory/logo-lookup'

const ROOT = process.cwd()
const MANIFEST = join(ROOT, 'lib/directory/logos.json')
const DIR = join(ROOT, 'public/logos/directory')
const UA = { 'user-agent': 'FundOpsHQ-Directory/1.0 (https://fundopshq.com/directory; firm logo lookup)' }
const MISS_RECHECK_DAYS = 30
const MAX_BYTES = 3_000_000

export interface Entry {
  name: string
  file: string | null
  width?: number
  height?: number
  mode?: 'ink' | 'plate' | 'own'
  via?: string
  page?: string
  source_url?: string
  moved_to?: string
  fetched_at: string
  why?: string
  rejected?: boolean
}
interface Manifest {
  note?: string
  firms: Record<string, Entry>
}

const args = process.argv.slice(2)
const flag = (f: string) => args.includes(f)
const opt = (f: string) => {
  const i = args.indexOf(f)
  return i >= 0 ? args[i + 1] : undefined
}
const today = new Date().toISOString().slice(0, 10)

async function firmsToLookUp(): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const domains = opt('--domains')
  if (domains) {
    for (const pair of domains.split(',')) {
      const [d, ...name] = pair.split('=')
      if (d) out.set(d.trim().toLowerCase(), name.join('=').trim() || d.trim())
    }
    return out
  }
  const file = opt('--file')
  if (file) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      try {
        const j = JSON.parse(line)
        if (j.firm_domain && !out.has(j.firm_domain.toLowerCase())) out.set(j.firm_domain.toLowerCase(), j.firm_name ?? j.firm_domain)
      } catch {
        /* not a line of data */
      }
    }
    return out
  }
  const { createClient } = await import('@supabase/supabase-js')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('No database: pass --domains or --file, or run with --env-file=.env.local')
  const db = createClient(url, key, { auth: { persistSession: false } })
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('directory_people').select('firm_domain, firm_name').neq('status', 'removed').range(from, from + 999)
    if (error) throw new Error(error.message)
    for (const r of data ?? []) if (r.firm_domain && !out.has(r.firm_domain.toLowerCase())) out.set(r.firm_domain.toLowerCase(), r.firm_name)
    if (!data || data.length < 1000) break
  }
  return out
}

/** One GET, following at most three redirects, each on the firm's own domain or one it has plainly moved to. */
async function getOwn(url: string, domain: string, name: string, accept: string): Promise<{ res: Response; url: string }> {
  let at = url
  for (let hop = 0; hop <= 3; hop++) {
    if (domainOf(at) !== domain && !plainlyMoved(name, at)) throw new Error(`leaves ${domain} for ${new URL(at).hostname}`)
    const res = await fetch(at, { headers: { ...UA, accept }, redirect: 'manual', signal: AbortSignal.timeout(15_000) })
    const to = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && to) {
      at = new URL(to, at).href
      continue
    }
    if (!res.ok) throw new Error(`${res.status} from ${new URL(at).host}`)
    return { res, url: at }
  }
  throw new Error('too many redirects')
}

/** Any GET for a file (a firm's header logo often sits on its CDN), size-capped. */
async function getFile(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { ...UA, accept: 'image/*,*/*' }, signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length > MAX_BYTES) throw new Error('file too large')
  return buf
}

/** The mark, cropped to what is drawn, at most 360 x 112, as PNG; judged on its pixels. */
async function makeMark(input: Buffer, minIcon: number | null): Promise<{ png: Buffer; width: number; height: number; mode: Entry['mode'] } | { why: string }> {
  const text = input.length < 400_000 ? input.toString('utf8') : ''
  if (/<svg[\s>]/i.test(text) && /<script|<foreignObject|\son[a-z]+\s*=/i.test(text)) return { why: 'the SVG holds script' }
  let img = sharp(input, { density: 300, limitInputPixels: 40_000_000 }).ensureAlpha()
  const meta = await img.metadata()
  if (minIcon && meta.format !== 'svg' && Math.min(meta.width ?? 0, meta.height ?? 0) < minIcon) return { why: `the icon is only ${meta.width}x${meta.height}` }
  try {
    img = sharp(await img.png().toBuffer()).trim({ threshold: 10 })
  } catch {
    /* nothing to trim */
  }
  const out = await img.resize({ width: 360, height: 112, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9, palette: true }).toBuffer({ resolveWithObject: true })
  const raw = await sharp(out.data).ensureAlpha().raw().toBuffer()
  const stats = pixelStats(raw)
  const bad = notAMark(stats)
  if (bad) return { why: bad }
  return { png: out.data, width: out.info.width, height: out.info.height, mode: drawMode(stats) }
}

/** Wikimedia Commons: only when Wikidata's entity for this name gives this very domain as its official website. */
async function commonsCandidate(name: string, domain: string): Promise<Candidate | null> {
  const get = async (u: string) => (await fetch(u, { headers: UA, signal: AbortSignal.timeout(15_000) })).json()
  const search = (await get(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name.replace(/\(.*?\)/g, '').trim())}&language=en&type=item&limit=5&format=json`)).search ?? []
  if (!search.length) return null
  const ents = (await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${search.map((s: { id: string }) => s.id).join('|')}&props=claims&format=json`)).entities ?? {}
  const hits = Object.values(ents as Record<string, { claims?: Record<string, { mainsnak?: { datavalue?: { value?: string } } }[]> }>).filter((e) =>
    (e.claims?.P856 ?? []).some((c) => domainOf(String(c.mainsnak?.datavalue?.value ?? '')) === domain),
  )
  if (hits.length !== 1) return null
  const title = hits[0].claims?.P154?.[0]?.mainsnak?.datavalue?.value
  if (!title) return null
  const q = await get(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + title)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=960&format=json`)
  const info = (Object.values(q.query?.pages ?? {})[0] as { imageinfo?: { thumburl?: string; url: string; descriptionurl?: string; extmetadata?: { LicenseShortName?: { value?: string } } }[] })?.imageinfo?.[0]
  const licence = String(info?.extmetadata?.LicenseShortName?.value ?? '').replace(/<[^>]+>/g, '')
  if (!info || !/^(public domain|pd\b|pd-|cc0|cc-zero|no restrictions)/i.test(licence)) return null
  return { href: (info.thumburl ?? info.url).replace(/\?.*$/, ''), via: 'commons', page: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title)}` }
}

async function lookUp(domain: string, name: string): Promise<Entry> {
  const miss = (why: string): Entry => ({ name, file: null, why, fetched_at: today })
  let home: { res: Response; url: string } | null = null
  let lastErr = ''
  for (const start of [`https://${domain}/`, `https://www.${domain}/`]) {
    try {
      home = await getOwn(start, domain, name, 'text/html')
      break
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e)
    }
  }
  const tried: string[] = []
  const candidates: Candidate[] = []
  let page = ''
  if (home) {
    page = home.url
    const html = (await home.res.text()).slice(0, 800_000)
    if (!pageNamesFirm(name, home.url, html)) tried.push(`the home page (${new URL(home.url).hostname}) does not name ${name}`)
    else candidates.push(...candidatesOn(html, home.url))
  } else tried.push(`its own site gave nothing (${lastErr})`)
  try {
    const c = await commonsCandidate(name, domain)
    if (c) candidates.push(c)
  } catch {
    /* Commons is a second chance only */
  }
  for (const c of candidates) {
    try {
      const buf = c.svg ? Buffer.from(c.svg) : await getFile(c.href)
      const mark = await makeMark(buf, c.via === 'apple-touch-icon' ? 120 : c.via === 'png-icon' ? 96 : null)
      if ('why' in mark) {
        tried.push(`${c.via}: ${mark.why}`)
        continue
      }
      const file = `/logos/directory/${domain}.png`
      if (!flag('--dry')) writeFileSync(join(ROOT, 'public', file), mark.png)
      const moved = page && domainOf(page) !== domain ? domainOf(page) : undefined
      return {
        name,
        file,
        width: mark.width,
        height: mark.height,
        mode: mark.mode,
        via: c.via === 'header' ? 'the logo in its header' : c.via === 'inline-svg' ? 'the logo drawn in its header (inline SVG)' : c.via === 'commons' ? 'Wikimedia Commons (public domain)' : c.via,
        page: c.via === 'commons' ? (c.page ?? c.href) : page,
        source_url: c.svg ? page : c.href,
        ...(moved ? { moved_to: moved } : {}),
        fetched_at: today,
      }
    } catch (e) {
      tried.push(`${c.via}: ${e instanceof Error ? e.message : e}`)
    }
  }
  return miss(tried.length ? tried.slice(0, 3).join('; ') : 'the home page shows no logo in its header and publishes no icon of 96 px or more')
}

async function main() {
  const manifest: Manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { firms: {} }
  mkdirSync(DIR, { recursive: true })
  const firms = await firmsToLookUp()
  const due = [...firms].filter(([d]) => {
    const e = manifest.firms[d]
    if (!e || flag('--refresh')) return true
    if (e.rejected) return false
    if (e.file) return false
    if (flag('--retry-misses')) return true
    return (Date.now() - new Date(`${e.fetched_at}T00:00:00Z`).getTime()) / 86_400_000 >= MISS_RECHECK_DAYS
  })
  console.log(`${firms.size} firms; ${due.length} to look up (${firms.size - due.length} on file or recently missed)`)
  const found: string[] = []
  const missed: string[] = []
  let i = 0
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (i < due.length) {
        const [domain, name] = due[i++]
        const prev = manifest.firms[domain]
        const e = await lookUp(domain, name)
        if (!e.file && prev?.file && !flag('--dry')) {
          // A refresh that finds nothing keeps the mark on file: a bad night is not an answer.
          missed.push(`${domain}: kept the mark on file (${e.why})`)
          continue
        }
        if (!flag('--dry')) manifest.firms[domain] = e
        if (e.file) found.push(`${domain}: ${e.via} ${e.width}x${e.height} ${e.mode}`)
        else missed.push(`${domain}: ${e.why}`)
      }
    }),
  )
  if (!flag('--dry')) {
    manifest.firms = Object.fromEntries(Object.entries(manifest.firms).sort(([a], [b]) => a.localeCompare(b)))
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n')
  }
  console.log(`\nFound ${found.length}:\n  ${found.join('\n  ')}`)
  console.log(`\nMissed ${missed.length}:\n  ${missed.join('\n  ')}`)
  console.log('\nLook at every new mark before it ships (a wrong firm’s logo is worse than none); set "rejected": true with a "why" to refuse one.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
