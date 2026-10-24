/**
 * Build the directory_sources seed from the first three crawlers' firm lists
 * (2026-10-24 night: lawyers, accountants, placement agents + fund-finance
 * bankers, each written its own way under ~/fundopshq-workspace/docs/directory/scripts).
 * Run once; its outputs are committed:
 *
 *   npx tsx scripts/directory/crawl/seed-sources.ts [--from ~/fundopshq-workspace/docs/directory]
 *
 *   → scripts/directory/crawl/sources.seed.json          (the registry as data; run.ts reads it with --registry)
 *   → supabase/migrations/20261025_directory_sources_seed.sql  (the same rows, insert … on conflict do nothing)
 *
 * The placement-agent and banker rows are written here by hand from what
 * worked on 2026-10-24 and what the 2026-10-25 probes found (sitemaps first:
 * PJT, Rede, Campbell Lutyens, Asante, Threadmark and Hodes Weill list every
 * bio in sitemap.xml). The lawyer and accountant rows are converted from their
 * configs as they stand; those crawls were still running and were not re-run.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { CategoryId } from '@/lib/directory/taxonomy'
import type { ListingSpec, SourceMethod, SourceRow, SourceSelectors, SourceStatus } from '@/lib/directory/crawl/types'
import { parseSource } from '@/lib/directory/crawl/sources'

const args = process.argv.slice(2)
const from = args.includes('--from') ? args[args.indexOf('--from') + 1] : join(homedir(), 'fundopshq-workspace/docs/directory')
const read = <T,>(p: string, d: T): T => (existsSync(join(from, p)) ? (JSON.parse(readFileSync(join(from, p), 'utf8')) as T) : d)

type V1Listing = { url: string; mode?: string; method?: string; body?: string; headers?: Record<string, string>; pages?: ListingSpec['pages']; slug_template?: string; scroll?: number; more?: string }
type V1Firm = { short: string; firm_name: string; firm_domain: string; base?: string; practice_page?: string; listings?: V1Listing[]; bio_pattern?: string; exclude_pattern?: string; bio_mode?: string; status: string; note?: string }

const statusOf = (s: string): SourceStatus => (s === 'ok' ? 'ok' : s === 'blocked' ? 'blocked' : 'empty')
const listingOf = (l: V1Listing): ListingSpec => ({
  url: l.url,
  ...(l.mode === 'render' ? { render: true } : {}),
  ...(l.method && l.method !== 'GET' ? { method: l.method as 'POST' } : {}),
  ...(l.body ? { body: l.body } : {}),
  ...(l.headers ? { headers: l.headers } : {}),
  ...(l.pages ? { pages: l.pages } : {}),
  ...(l.slug_template ? { slug_template: l.slug_template } : {}),
  ...(l.scroll ? { scroll: l.scroll } : {}),
  ...(l.more ? { more: l.more } : {}),
})

function fromV1(f: V1Firm, category: CategoryId, extra: Partial<SourceSelectors>, counts: Record<string, number> | null, label: string): SourceRow {
  const listings = (f.listings ?? []).map(listingOf)
  const headless = listings.some((l) => l.render) || f.bio_mode === 'render'
  const method: SourceMethod = headless ? 'headless' : 'listing'
  const notes = [f.note, headless && listings.some((l) => l.scroll || l.more) ? '--dump-dom cannot scroll or click "load more": compare counts with last_counts after a run' : null, `seeded from the ${label} crawler (2026-10-24)`].filter(Boolean).join(' | ')
  return {
    key: f.short,
    firm_name: f.firm_name,
    firm_domain: f.firm_domain.replace(/^www\./, ''),
    category,
    listing_url: listings[0]?.url || f.practice_page || f.base || null,
    method,
    person_url_pattern: f.bio_pattern ?? null,
    selectors: {
      ...(listings.length ? { listings } : {}),
      ...(f.exclude_pattern ? { exclude_pattern: f.exclude_pattern } : {}),
      ...(f.bio_mode === 'render' ? { render_bios: true } : {}),
      ...extra,
    } as SourceSelectors,
    robots_ok: null,
    status: statusOf(f.status),
    last_counts: counts,
    notes,
    source: 'firm_site',
  }
}

const candidates = (short: string) => {
  const c = read<{ urls?: string[] } | null>(`data/candidates/${short}.json`, null)
  return c?.urls ? { bio_urls: c.urls.length } : null
}

// ── Lawyers ─────────────────────────────────────────────────────────────────
const lawyers = read<V1Firm[]>('scripts/firms.config.json', []).map((f) => fromV1(f, 'fund_lawyer', { slug_suffix: f.short }, candidates(f.short), 'fund-lawyers'))

// ── Accountants (audit and tax from one site) ───────────────────────────────
const acctStats = new Map(read<Record<string, unknown>[]>('data/accountant-firms.json', []).map((r) => [r.short as string, r]))
const accountants = read<V1Firm[]>('scripts/firms.acct.all.json', []).map((f) => {
  const st = acctStats.get(f.short)
  const counts = st ? Object.fromEntries(Object.entries(st).filter(([, v]) => typeof v === 'number')) as Record<string, number> : candidates(f.short)
  return fromV1(f, 'fund_auditor', { slug_suffix: f.short.replace(/^acct-/, ''), categories: ['fund_auditor', 'fund_tax_advisor'] }, counts, 'accountants')
})

// ── Placement agents and fund-finance bankers (hand-written) ────────────────
const advStats = new Map(read<Record<string, unknown>[]>('data/adviser-firms.json', []).map((r) => [r.short as string, r]))
const advCounts = (k: string) => {
  const st = advStats.get(k)
  return st ? (Object.fromEntries(Object.entries(st).filter(([, v]) => typeof v === 'number')) as Record<string, number>) : null
}
const PA: CategoryId = 'placement_agent'
const FF: CategoryId = 'fund_finance_banker'
type Adv = Omit<SourceRow, 'robots_ok' | 'last_counts' | 'source'> & { robots_ok?: boolean | null }
const advisers: Adv[] = [
  { key: 'parkhill', firm_name: 'PJT Park Hill', firm_domain: 'pjtpartners.com', category: PA, method: 'sitemap', listing_url: 'https://www.pjtpartners.com/people', person_url_pattern: '^https://www\\.pjtpartners\\.com/people/[a-z0-9-]+$', selectors: { slug_suffix: 'pjt' }, status: 'ok', notes: 'sitemap.xml lists every PJT bio (all groups, ~280); the model keeps Park Hill / Fund Advisory people. v1 read only "Partner, Fund Advisory, Americas" names off /people.', robots_ok: true },
  { key: 'evercore', firm_name: 'Evercore', firm_domain: 'evercore.com', category: PA, method: 'listing', listing_url: 'https://www.evercore.com/our-team/investment-banking', person_url_pattern: null, selectors: { slug_suffix: 'evercore', text_filter: { line: '^Private Capital Advisory & Fundraising$', before: 2, after: 1, preface: 'Evercore Investment Banking team (filtered to Private Capital Advisory & Fundraising rows: name, title, specialty, office)' } }, status: 'ok', notes: 'One bank-wide list (426 rows) with specialty and city per row; only Private Capital Advisory & Fundraising rows are read.', robots_ok: true },
  { key: 'lazard', firm_name: 'Lazard', firm_domain: 'lazard.com', category: PA, method: 'listing', listing_url: 'https://www.lazard.com/about-lazard/locations/united-states/people', person_url_pattern: '/our-people/[a-z0-9-]+$', selectors: { slug_suffix: 'lazard', exclude_pattern: '/our-people/(leadership-board|alumni)$', listings: [{ url: 'https://www.lazard.com/about-lazard/locations/united-states/people', pages: { param: 'page', start: 1, max: 12 } }] }, status: 'ok', notes: 'All US Lazard people (no sitemap in robots.txt); Private Capital Advisory is named only in the bio, so the model filters.', robots_ok: true },
  { key: 'campbelllutyens', firm_name: 'Campbell Lutyens', firm_domain: 'campbell-lutyens.com', category: PA, method: 'sitemap', listing_url: 'https://campbell-lutyens.com/about-us/our-team/', person_url_pattern: '^https://campbell-lutyens\\.com/about-us/our-team/[a-z0-9-]+$', selectors: { slug_suffix: 'campbell', pure_play: true, origin: 'https://campbell-lutyens.com' }, status: 'ok', notes: 'xmlsitemap lists every bio worldwide (~130); bios state Location. v1 used the North America filter of the JSON team API (25).', robots_ok: true },
  { key: 'eaton', firm_name: 'Eaton Partners (Stifel)', firm_domain: 'stifelinstitutional.com', category: PA, method: 'listing', listing_url: 'https://stifelinstitutional.com/capabilities/investment-banking/product-coverage/fund-placement-gp-advisory/', person_url_pattern: 'stifelinstitutional\\.com/meet/[a-z0-9-]+$', selectors: { slug_suffix: 'eaton', origin: 'https://stifelinstitutional.com' }, status: 'ok', notes: 'eatonpartners.com is a lapsed domain; eaton-partners.com redirects to this Stifel fund placement page, which links MD bios.', robots_ok: true },
  { key: 'monument', firm_name: 'Monument Group', firm_domain: 'monumentgroup.com', category: PA, method: 'listing', listing_url: 'https://www.monumentgroup.com/team', person_url_pattern: null, selectors: { slug_suffix: 'monument', pure_play: true }, status: 'ok', notes: 'One team page with name, title and office inline.', robots_ok: true },
  { key: 'probitas', firm_name: 'Probitas Partners', firm_domain: 'probitaspartners.com', category: PA, method: 'listing', listing_url: 'https://probitaspartners.com/team', person_url_pattern: 'probitaspartners\\.com/team/[a-z0-9-]+$', selectors: { slug_suffix: 'probitas', pure_play: true, origin: 'https://probitaspartners.com' }, status: 'empty', notes: 'Bios state no office city (offices SF, NY, London, HK on the site): 0 rows on 2026-10-24.', robots_ok: true },
  { key: 'rede', firm_name: 'Rede Partners', firm_domain: 'rede-partners.com', category: PA, method: 'sitemap', listing_url: 'https://www.rede-partners.com/people', person_url_pattern: '/people-database/[a-z0-9-]+$', selectors: { slug_suffix: 'rede', pure_play: true }, status: 'ok', notes: 'sitemap.xml lists every bio (~260; London-based, includes support staff). v1 needed a headless scroll of /people.', robots_ok: true },
  { key: 'apcap', firm_name: 'Atlantic-Pacific Capital', firm_domain: 'apcap.com', category: PA, method: 'json', listing_url: 'https://www.apcap.com/team', person_url_pattern: null, selectors: { slug_suffix: 'apcap', pure_play: true, json: { slug_regex: "openTeamModel\\('([a-z0-9-]+)'", bio_url_template: 'https://www.apcap.com/team-info/{slug}', fetch: { url: 'https://www.apcap.com/team/TeamBioInfo', method: 'POST', body: '{"biourl":"{slug}","prmLocationIds":"","prmCategoryIds":"","prmIndustryIds":"","prmSearch":"","prmOrderBy":null}', headers: { 'x-requested-with': 'XMLHttpRequest', accept: 'text/html, */*' } } } }, status: 'empty', notes: 'Bios load by XHR POST; no office in the bios: 0 rows on 2026-10-24.', robots_ok: true },
  { key: 'asante', firm_name: 'Asante Capital', firm_domain: 'asantecapital.com', category: PA, method: 'sitemap', listing_url: 'https://www.asantecapital.com/our-team', person_url_pattern: '/our-team/[a-z0-9-]+$', selectors: { slug_suffix: 'asante', pure_play: true, sitemaps: ['https://www.asantecapital.com/wp-sitemap-posts-our-team-1.xml'] }, status: 'ok', notes: 'WordPress sitemap of the our-team post type.', robots_ok: true },
  { key: 'hodesweill', firm_name: 'Hodes Weill & Associates', firm_domain: 'hodesweill.com', category: PA, method: 'sitemap', listing_url: 'https://www.hodesweill.com/', person_url_pattern: '^https://www\\.hodesweill\\.com/[a-z]+-[a-z]+(-bio)?$', selectors: { slug_suffix: 'hodesweill', pure_play: true, sitemaps: ['https://www.hodesweill.com/pages-sitemap.xml'], exclude_pattern: '/(representative-transactions|market-commentaries|global-relationships|completed-transactions|capital-raised-dashboard|real-estate-allocations-monitor|infrastructure-allocations-monitor)$' }, status: 'ok', notes: 'Wix site, no team index: bios are top-level pages in pages-sitemap.xml (two-word slugs); deal pages carry a year and are excluded by the pattern.', robots_ok: true },
  { key: 'threadmark', firm_name: 'Threadmark', firm_domain: 'threadmark.com', category: PA, method: 'sitemap', listing_url: 'https://www.threadmark.com/team', person_url_pattern: 'threadmark\\.com/team-members/[a-z0-9-]+$', selectors: { slug_suffix: 'threadmark', pure_play: true }, status: 'ok', notes: 'Bios at /team-members/<slug> state the base city.', robots_ok: true },
  { key: 'ubspfg', firm_name: 'UBS', firm_domain: 'ubs.com', category: PA, method: 'listing', listing_url: 'https://www.ubs.com/microsites/private-funds-group/en/home.html', person_url_pattern: null, selectors: { slug_suffix: 'ubs' }, status: 'empty', notes: 'Private Funds Group microsite names 6 leaders without offices: 0 rows on 2026-10-24.', robots_ok: true },
  { key: 'moelis_pca', firm_name: 'Moelis & Company', firm_domain: 'moelis.com', category: PA, method: 'listing', listing_url: 'https://www.moelis.com/team/?coverage_area=private-capital-advisory', person_url_pattern: null, selectors: { slug_suffix: 'moelis' }, status: 'ok', notes: 'Team page filtered to Private Capital Advisory (people-sitemap lists the whole bank).', robots_ok: true },
  { key: 'parkmadison', firm_name: 'Park Madison Partners', firm_domain: 'parkmadisonpartners.com', category: PA, method: 'listing', listing_url: 'https://www.parkmadisonpartners.com/our-team', person_url_pattern: null, selectors: { slug_suffix: 'parkmadison', pure_play: true, default_office: { city: 'New York', state: 'NY', evidence_url: 'https://www.parkmadisonpartners.com/contact' } }, status: 'ok', notes: 'One office (New York) on the contact page; bios state none.', robots_ok: true },
  { key: 'hark', firm_name: 'Hark Capital', firm_domain: 'harkcap.com', category: FF, method: 'listing', listing_url: 'https://www.harkcap.com/about-us', person_url_pattern: null, selectors: { slug_suffix: 'hark', pure_play: true, default_office: { city: 'New York', state: 'NY', evidence_url: 'https://www.harkcap.com/contact' } }, status: 'ok', notes: 'NAV lender; Our People on the About page; one office (New York).', robots_ok: true },
  { key: '17capital', firm_name: '17Capital', firm_domain: '17capital.com', category: FF, method: 'listing', listing_url: 'https://www.17capital.com/our-people', person_url_pattern: null, selectors: { slug_suffix: '17capital', pure_play: true, team_pages: [1, 2, 3, 4, 5, 6].map((n) => ({ url: n === 1 ? 'https://www.17capital.com/our-people' : `https://www.17capital.com/our-people?5b19ae9b_page=${n}` })) }, status: 'ok', notes: 'NAV lender; 6 paginated team pages, whole firm (London, Paris, Dubai too); no personal bio pages, so bio_url is the team page.', robots_ok: true },
  { key: 'ffp', firm_name: 'Fund Finance Partners', firm_domain: 'fundfinancepartners.com', category: FF, method: 'listing', listing_url: 'https://fundfinancepartners.com/team', person_url_pattern: 'fundfinancepartners\\.com/team/[a-z0-9-]+$', selectors: { slug_suffix: 'ffp', pure_play: true, origin: 'https://fundfinancepartners.com' }, status: 'empty', notes: 'Bios state no office: 0 rows on 2026-10-24.', robots_ok: true },
  { key: 'mtb', firm_name: 'M&T Bank', firm_domain: 'mtb.com', category: FF, method: 'listing', listing_url: 'https://www.mtb.com/commercial/industry/fund-banking', person_url_pattern: 'mtb\\.com/commercial/industry/fund-banking/[a-z0-9-]+$', selectors: { slug_suffix: 'mtb' }, status: 'empty', notes: 'Bios give coverage ("client acquisition in New York"), not an office: 0 rows on 2026-10-24.', robots_ok: true },
]
// The firms the adviser crawler tried and could not use, kept so nobody re-tries them blind.
const advSkipped = read<V1Firm[]>('scripts/adv.pa1.json', [])
  .concat(read<V1Firm[]>('scripts/adv.pa2.json', []), read<V1Firm[]>('scripts/adv.ff.json', []))
  .filter((f) => f.status !== 'ok' && f.firm_domain && !advisers.some((a) => a.key === f.short))
const advCat = (short: string): CategoryId => (read<V1Firm[]>('scripts/adv.ff.json', []).some((f) => f.short === short) ? FF : PA)
const adviserRows: SourceRow[] = [
  ...advisers.map((a) => ({ ...a, robots_ok: a.robots_ok ?? null, last_counts: advCounts(a.key), source: 'firm_site' as const, notes: `${a.notes} | seeded 2026-10-25` })),
  ...advSkipped.map((f) => fromV1(f, advCat(f.short), { slug_suffix: f.short.replace(/[^a-z0-9]/g, '') }, advCounts(f.short), 'advisers')),
]

// ── Check, write ────────────────────────────────────────────────────────────
const all = [...adviserRows, ...lawyers, ...accountants]
const keys = new Set<string>()
for (const r of all) {
  const p = parseSource(r)
  if (!p.ok) throw new Error(`seed row ${p.key}: ${p.error}`)
  if (keys.has(r.key)) throw new Error(`duplicate key ${r.key}`)
  keys.add(r.key)
}
const root = process.cwd()
writeFileSync(join(root, 'scripts/directory/crawl/sources.seed.json'), JSON.stringify(all, null, 1) + '\n')

const q = (v: unknown) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
const j = (v: unknown) => (v == null ? 'null' : `${q(JSON.stringify(v))}::jsonb`)
const values = all.map(
  (r) => `  (${q(r.key)}, ${q(r.firm_name)}, ${q(r.firm_domain)}, ${q(r.category)}, ${q(r.listing_url)}, ${q(r.method)}, ${q(r.person_url_pattern)}, ${j(r.selectors)}, ${r.robots_ok == null ? 'null' : r.robots_ok}, ${q(r.status)}, ${j(r.last_counts)}, ${q(r.notes)}, ${q(r.source)})`,
)
const sql = `-- Seed for directory_sources (2026-10-25): every firm the three first crawlers
-- tried on 2026-10-24, with the method that worked. Generated by
-- scripts/directory/crawl/seed-sources.ts from its committed output
-- scripts/directory/crawl/sources.seed.json. Apply AFTER 20261025_directory_sources.sql.
-- NOT APPLIED when written. Re-runnable: an existing key is left as it is.

insert into public.directory_sources
  (key, firm_name, firm_domain, category, listing_url, method, person_url_pattern, selectors, robots_ok, status, last_counts, notes, source)
values
${values.join(',\n')}
on conflict (key) do nothing;
`
writeFileSync(join(root, 'supabase/migrations/20261025_directory_sources_seed.sql'), sql)
const by = (k: (r: SourceRow) => string) => Object.entries(all.reduce<Record<string, number>>((m, r) => ((m[k(r)] = (m[k(r)] ?? 0) + 1), m), {}))
console.log(`${all.length} sources`, { category: by((r) => r.category), method: by((r) => r.method), status: by((r) => r.status) })
