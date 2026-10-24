/**
 * Deterministic checks on every crawled row (2026-10-25, Danny: "be very
 * strict and critical"). The model reads the page; these rules decide whether
 * what it read can be a directory row. Pure, so every rule is tested.
 *
 * A row is REJECTED (never written) when:
 *   - the name does not look like a person: 2 to 4 words once suffixes (Jr.,
 *     III) and particles (van, de) are set aside, letters only, no firm words
 *   - the title has no role from the known vocabulary, or names an
 *     out-of-scope job (operations, assistant, marketing, CFO of the firm)
 *   - no US office with a city and a real state
 *   - the bio URL is not on the firm's own domain (or an approved one)
 *   - any field holds an email address or a phone number
 *   - the firm domain is not the source's
 *   - the trade is not one this source produces
 * A row is FLAGGED (written, listed in the QA report) when:
 *   - a practice tag is outside the trade's vocabulary (it is dropped)
 *   - the city is not one of the directory's known markets
 *   - the office came from the firm's single-office default, not the page
 *   - the bio URL is shared with other people (a team page, not a bio)
 *   - the name was ALL CAPS on the page (it is re-cased)
 */
import { CATEGORIES, isClientFocusId, isPracticeId, isRepresentsId, type CategoryId } from '../taxonomy'
import { CITIES, cityOf, stateCode, type Office } from '../places'
import type { Education } from '../people'
import type { Candidate, DirectoryRow, PersonSource, SourceRow } from './types'

// ── Vocabulary ──────────────────────────────────────────────────────────────

/**
 * Roles a title must contain (whole words, case-insensitive). Longest first is
 * not needed: any match passes, and the out-of-scope list is checked first.
 */
export const TITLE_ROLES = [
  'partner', 'managing partner', 'senior partner', 'equity partner', 'income partner', 'founding partner', 'general partner',
  'principal', 'managing principal',
  'managing director', 'senior managing director', 'executive director', 'director', 'senior director', 'associate director',
  'vice president', 'senior vice president', 'executive vice president', 'first vice president', 'assistant vice president',
  'associate', 'senior associate', 'analyst', 'senior analyst',
  'counsel', 'of counsel', 'senior counsel', 'special counsel',
  'shareholder', 'member',
  'senior advisor', 'advisor', 'adviser', 'senior adviser', 'operating partner',
  'head', 'chair', 'chairman', 'chairwoman', 'co-chair', 'vice chair', 'vice chairman',
  'founder', 'co-founder', 'cofounder',
  'chief executive officer', 'ceo', 'president', 'chief investment officer', 'cio',
  'senior manager', 'manager', 'tax manager', 'audit manager',
  'leader', 'lead', 'relationship manager', 'banker',
] as const

/** Jobs that are never a directory profile even at a firm we cover: the firm's own back office. */
export const OUT_OF_SCOPE_TITLE =
  /\b(chief (financial|operating|compliance|marketing|people|technology|information|administrative) officer|cfo|coo|cco|cto|operations|office manager|assistant|coordinator|receptionist|secretary|paralegal|marketing|human resources|recruit(er|ing)|talent|business development manager|it manager|controller|bookkeeper|intern|librarian|investor relations associate)\b/i

const ROLE_RE = new RegExp(
  `\\b(${[...TITLE_ROLES].sort((a, b) => b.length - a.length).map((r) => r.replace(/[-]/g, '[- ]?')).join('|')})\\b`,
  'i',
)

/** Words that make a "name" a firm, a team or a page heading. */
export const FIRM_WORDS = new Set([
  'llp', 'llc', 'lp', 'inc', 'ltd', 'plc', 'pllc', 'pc', 'corp', 'co', 'company', 'capital', 'partners', 'group', 'bank', 'banking',
  'advisors', 'advisers', 'advisory', 'associates', 'team', 'office', 'offices', 'fund', 'funds', 'management', 'holdings', 'securities',
  'investments', 'private', 'equity', 'global', 'international', 'the', 'contact', 'our', 'people', 'professionals', 'leadership',
  'services', 'solutions', 'department', 'practice', 'about', 'us', 'news', 'insights', 'careers', 'and', '&',
])

const SUFFIXES = /^(jr|sr|ii|iii|iv|v)\.?$/i
const PARTICLES = new Set(['van', 'von', 'der', 'den', 'de', 'del', 'della', 'da', 'di', 'du', 'la', 'le', 'bin', 'al', 'el', 'dos', 'st.', 'ter', 'y'])
const POST_NOMINALS = /,?\s+(esq|cpa|cfa|caia|frm|cfp|pe|phd|ph\.d|jd|j\.d|llm|ll\.m|mba|mst|cpa\/abv|abv)\.?$/i
const LETTERS = "A-Za-zÀ-ÖØ-öø-ÿĀ-ž"
const NAME_TOKEN = new RegExp(`^([${LETTERS}]\\.|[${LETTERS}][${LETTERS}'’.-]*)$`)
const INITIAL = new RegExp(`^[${LETTERS}]\\.?$`)

export const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+/
/** US/intl phone shapes: (212) 555-1234, 212.555.1234, +1 212 555 1234, +44 20 7946 0958. */
export const PHONE_RE = /(\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]\d{3,4}[\s.-]\d{4}\b/

// ── Helpers ─────────────────────────────────────────────────────────────────

const clean = (s: unknown): string => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '')

/** Strip post-nominals and honorifics; re-case ALL CAPS. */
export function cleanName(raw: string): { name: string; wasCaps: boolean } {
  // "(née Jerez-Fernandez)", nicknames in quotes or brackets: not part of the displayed name.
  let s = clean(raw).replace(/\s*\([^)]*\)/g, ' ').replace(/\s*["“][^"”]*["”]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^(mr|ms|mrs|dr|prof)\.?\s+/i, '')
  for (let i = 0; i < 4 && POST_NOMINALS.test(s); i++) s = s.replace(POST_NOMINALS, '')
  s = s.replace(/,\s*$/, '').trim()
  const wasCaps = s === s.toUpperCase() && /[A-Z]{3}/.test(s)
  if (wasCaps) s = s.toLowerCase().replace(/(^|[\s'’-])([a-zà-ÿ])/g, (_m, p: string, c: string) => p + c.toUpperCase())
  return { name: s, wasCaps }
}

/** Why a string is not a person's name, or null when it is one. */
export function nameProblem(name: string): string | null {
  if (!name) return 'empty name'
  if (/\d/.test(name)) return 'name has digits'
  if (/[@/\\|:;()[\]{}<>#*+=_]/.test(name)) return 'name has symbols'
  const toks = name.replace(/,/g, ' ').split(/\s+/).filter(Boolean)
  for (const t of toks) if (FIRM_WORDS.has(t.toLowerCase().replace(/[.,]$/, ''))) return `firm word "${t}" in name`
  // A particle is a particle only before the surname: "Cindy Le", "Maria Da" end in a surname.
  const named = toks.filter((t) => !SUFFIXES.test(t))
  const core = named.filter((t, i) => i === named.length - 1 || i === 0 || !PARTICLES.has(t.toLowerCase()))
  if (core.length < 2) return 'fewer than two names'
  if (core.length > 4) return 'more than four names'
  for (const t of core) if (!NAME_TOKEN.test(t)) return `"${t}" is not a name`
  const full = core.filter((t) => !INITIAL.test(t))
  if (full.length < 1) return 'initials only'
  // Lower-case words that are not particles: a sentence, not a name.
  if (core.some((t) => /^[a-zà-ÿ]/.test(t))) return 'lower-case word in name'
  return null
}

/** Why a title is not a directory title, or null when it is one. */
export function titleProblem(title: string): string | null {
  if (!title) return 'no title'
  if (title.length > 160) return 'title too long'
  if (OUT_OF_SCOPE_TITLE.test(title)) return `out-of-scope title "${title}"`
  if (!ROLE_RE.test(title)) return `title "${title}" has no known role`
  return null
}

export function hostOf(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    return u.hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Is the URL on the domain or one of its subdomains? */
export const onDomain = (url: string, domain: string): boolean => {
  const h = hostOf(url)
  const d = domain.toLowerCase().replace(/^www\./, '')
  return !!h && (h === d || h.endsWith(`.${d}`))
}

/** Every string anywhere in a value. */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v)
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out))
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out))
  return out
}

/** A contact detail in any field (URLs are checked without their path digits). */
export function contactProblem(row: Record<string, unknown>): string | null {
  for (const [k, v] of Object.entries(row)) {
    for (const s of strings(v)) {
      const text = /^https?:\/\//.test(s) ? '' : s
      if (EMAIL_RE.test(text) || /^mailto:/i.test(s)) return `email in ${k}`
      if (PHONE_RE.test(text) || /^tel:/i.test(s)) return `phone number in ${k}`
    }
  }
  return null
}

const ALIASES: Record<string, string> = { private_equity_funds: 'buyout_funds', pe_funds: 'buyout_funds', fund_tax: 'tax_funds', partnership_tax: 'tax_funds' }

/**
 * A state the page left out, from the city alone: only for the directory's known markets whose
 * name is one US city (never Portland, Richmond, Columbus, Wilmington, Kansas City, Newark...).
 */
const AMBIGUOUS_CITY = new Set(['portland', 'richmond', 'columbus', 'wilmington', 'kansas city', 'newark', 'princeton', 'washington', 'orange county', 'greenwich'])
export function stateFromCity(city: string): string | null {
  const key = city.toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!key || AMBIGUOUS_CITY.has(key)) return null
  const c = CITIES.find((x) => x.name.toLowerCase() === key || x.aliases?.includes(key))
  return c?.state ?? null
}

/** Words that make an office sentence a coverage area, not where the person sits. */
export const COVERAGE_WORDS = /\b(cover(s|ed|ing|age)?|clients? (in|across|throughout)|client acquisition|responsible for|serv(e|es|ed|ing)|across|throughout|region(al)?|markets?|territory|investors in)\b/i

/** An explicit office phrase: "based in New York and covering North America" is an office. */
export const OFFICE_WORDS = /\b(based (in|out of)|offices?|located in|works? (in|from|out of)|sits in)\b/i

/** US offices from what the model read: real state codes, cities named, deduplicated. */
export function usOffices(raw: { city?: string; state?: string; country?: string }[]): { offices: Office[]; dropped: string[] } {
  const offices: Office[] = []
  const dropped: string[] = []
  for (const o of raw ?? []) {
    const city = clean(o.city).replace(/^New York City$/i, 'New York')
    const country = clean(o.country).toLowerCase()
    const code = stateCode(clean(o.state)) ?? (clean(o.state) ? null : stateFromCity(city))
    const us = !country || /^(us|usa|u\.s\.|u\.s\.a\.|united states( of america)?)$/.test(country)
    if (!city || !code || !us) {
      dropped.push([city, clean(o.state), clean(o.country)].filter(Boolean).join(', ') || '(blank)')
      continue
    }
    if (!offices.some((x) => x.city.toLowerCase() === city.toLowerCase() && x.state === code)) offices.push({ city, state: code })
  }
  return { offices, dropped }
}

// ── The check ───────────────────────────────────────────────────────────────

export interface Verdict {
  ok: boolean
  /** The row as it would be written (present when ok). */
  row?: DirectoryRow
  /** Why it is refused. */
  errors: string[]
  /** What QA should look at. */
  flags: string[]
}

export interface ValidateContext {
  source: Pick<SourceRow, 'key' | 'firm_name' | 'firm_domain' | 'category' | 'selectors' | 'source'>
  /** The slug it would get (made by the caller, which knows the other rows). */
  slug: string
}

/** The trade a candidate is for: the model's pick when the source has several, else the source's. */
export function tradeOf(c: Candidate, source: ValidateContext['source']): CategoryId | null {
  const allowed = source.selectors.categories?.length ? source.selectors.categories : [source.category]
  if (allowed.length === 1) return allowed[0]
  return (allowed as string[]).includes(c.person.trade) ? (c.person.trade as CategoryId) : null
}

export function validateCandidate(c: Candidate, ctx: ValidateContext): Verdict {
  const { source } = ctx
  const errors: string[] = []
  const flags: string[] = []
  const p = c.person

  if (!p.in_scope) errors.push(`out of scope: ${clean(p.scope_evidence) || 'no reason given'}`)

  const { name, wasCaps } = cleanName(p.full_name)
  const np = nameProblem(name)
  if (np) errors.push(`name: ${np} (${JSON.stringify(p.full_name)})`)
  if (wasCaps) flags.push('name was ALL CAPS on the page; re-cased')

  const title = clean(p.title)
  const tp = titleProblem(title)
  if (tp) errors.push(`title: ${tp}`)

  const category = tradeOf(c, source)
  if (!category) errors.push(`trade "${p.trade}" is not one this source produces`)

  let { offices, dropped } = usOffices(p.offices)
  let city_basis: DirectoryRow['city_basis'] = c.page.kind === 'team' ? 'team_page' : 'person'
  let office_source_url: string | null = null
  const def = source.selectors.default_office
  if (!offices.length && def && !(p.offices ?? []).length) {
    offices = [{ city: def.city, state: def.state }]
    city_basis = 'firm_single_office'
    office_source_url = def.evidence_url
    flags.push(`office from the firm's single-office contact page (${def.evidence_url}), not the bio`)
  }
  if (!offices.length) errors.push(`no US office (read: ${dropped.join('; ') || 'none'})`)
  // The office must be where the person sits, not a coverage sentence (M&T, 2026-10-24: "client acquisition in New York").
  const ev = clean(p.office_evidence)
  if (offices.length && (p.offices ?? []).length) {
    if (ev && COVERAGE_WORDS.test(ev) && !OFFICE_WORDS.test(ev)) errors.push(`office is a coverage area, not an office ("${ev}")`)
    else if (!ev) flags.push('office not quoted from the page by the model')
  }
  for (const o of offices) if (!cityOf(o)) flags.push(`city "${o.city}, ${o.state}" is not a known market (state page only)`)

  const firm_domain = source.firm_domain.toLowerCase().replace(/^www\./, '')
  const approved = [firm_domain, ...(source.selectors.approved_domains ?? [])]
  const bio_url = clean(c.page.bio_url)
  if (!bio_url) errors.push('no bio URL')
  else if (!approved.some((d) => onDomain(bio_url, d))) errors.push(`bio URL ${bio_url} is not on ${approved.join(' / ')}`)
  const sourceKind: PersonSource = source.source ?? 'firm_site'
  const source_url = sourceKind === 'firm_site' ? null : clean(c.page.url) || null
  if (source_url && !approved.some((d) => onDomain(source_url, d))) errors.push(`source URL ${source_url} is not on an approved domain`)

  // Practice tags: the trade's own vocabulary, else dropped and flagged.
  const own = new Set<string>([...(category ? CATEGORIES[category].practices : []), 'other'])
  const practice_areas: string[] = []
  for (const raw of p.practice_areas ?? []) {
    const a = ALIASES[raw] ?? raw
    if (isPracticeId(a) && own.has(a)) {
      if (!practice_areas.includes(a)) practice_areas.push(a)
    } else flags.push(`practice tag "${raw}" dropped (not a ${category ? CATEGORIES[category].singular.toLowerCase() : '?'} practice)`)
  }
  const client_focus = [...new Set((p.client_focus ?? []).filter(isClientFocusId))]
  // GP/LP side is a lawyer's distinction only (taxonomy `sides`); for other trades the model inferred it (QA 2026-10-24).
  const represents = category && CATEGORIES[category].sides ? [...new Set((p.represents ?? []).filter(isRepresentsId))] : []
  const bar_admissions = category === 'fund_lawyer' ? [...new Set((p.bar_admissions ?? []).map(clean).filter(Boolean))].slice(0, 20) : []
  const education: Education[] = (p.education ?? [])
    .map((e) => ({ school: clean(e.school), degree: clean(e.degree) || null, year: typeof e.year === 'number' && e.year > 1900 && e.year < 2100 ? e.year : null }))
    .filter((e) => e.school)
    .slice(0, 8)

  if (!ctx.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ctx.slug)) errors.push(`bad slug ${JSON.stringify(ctx.slug)}`)

  const row: DirectoryRow = {
    category: category ?? source.category,
    full_name: name,
    title,
    firm_name: source.firm_name,
    firm_domain,
    offices,
    practice_areas,
    client_focus,
    represents,
    bar_admissions,
    education,
    bio_url,
    fetched_at: c.fetched_at,
    slug: ctx.slug,
    source: sourceKind,
    source_url,
    city_basis,
    office_source_url,
  }
  if (normalizeDomain(row.firm_domain) !== normalizeDomain(source.firm_domain)) errors.push('firm domain does not match the source')
  const contact = contactProblem(row as unknown as Record<string, unknown>)
  if (contact) errors.push(contact)

  return errors.length ? { ok: false, errors, flags } : { ok: true, row, errors, flags }
}

const normalizeDomain = (d: string) => d.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')

/** Checks across a whole source's rows: a bio URL many people share is a team page. */
export function setFlags(rows: DirectoryRow[]): Map<string, string[]> {
  const byUrl = new Map<string, number>()
  for (const r of rows) byUrl.set(r.bio_url, (byUrl.get(r.bio_url) ?? 0) + 1)
  const out = new Map<string, string[]>()
  for (const r of rows) {
    const n = byUrl.get(r.bio_url) ?? 0
    if (n > 1) out.set(r.slug, [`bio URL shared by ${n} people (a team page, not a personal bio)`])
  }
  return out
}

// ── Slugs ───────────────────────────────────────────────────────────────────

const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '')

/** "Jane Q. Smith Jr." at suffix "kirkland" → "jane-smith-kirkland": the convention every earlier build used. */
export function slugFor(fullName: string, suffix: string): string {
  const toks = fold(fullName)
    .replace(/["“”(].*?["“”)]/g, ' ')
    .replace(/[^A-Za-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !SUFFIXES.test(t) && t.replace(/[^A-Za-z]/g, '').length > 1)
  const first = toks[0] ?? 'x'
  const last = toks.length > 1 ? toks[toks.length - 1] : ''
  return [first, last, suffix]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** The key two readings of one person share: folded name letters at one firm. */
export const personKey = (fullName: string, firmDomain: string) => `${fold(fullName).toLowerCase().replace(/[^a-z]/g, '')}@${firmDomain}`
