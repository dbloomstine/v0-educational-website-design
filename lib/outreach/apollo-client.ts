/**
 * Apollo.io REST API wrapper for the outreach pipeline.
 *
 * Two endpoints:
 *   1. mixed_people/search — find a senior contact at a firm (no email returned)
 *   2. people/match        — enrich a person by ID/name to get the verified email
 *
 * Credit discipline: search is cheap (a few per firm), match burns a credit
 * per person enriched. The findContactForFirm() helper uses name-match
 * (one call) for exec-move stories where the person is named, and
 * search → match (two calls) for everything else.
 *
 * RULE: only use contacts with email_status === 'verified'. Never fall back
 * to 'guessed' or 'catch_all' — bounces hurt deliverability more than a
 * thinner batch does.
 */

import type { Article, Contact, FindContactResult } from './types'

const APOLLO_BASE = 'https://api.apollo.io/api/v1'

interface ApolloSearchPerson {
  id: string
  first_name?: string
  last_name_obfuscated?: string
  title?: string
  email_status?: string
  has_email?: boolean
  organization?: {
    name?: string
  }
}

interface ApolloMatchPerson {
  id: string
  first_name?: string
  last_name?: string
  name?: string
  title?: string
  email?: string | null
  email_status?: string | null
  email_domain_catchall?: boolean
  organization?: {
    name?: string
    primary_domain?: string
  }
}

// Unified target title list — passed to Apollo as `person_titles`. We don't
// specialize by story type anymore because the v4 email template is fully
// static and firm-name agnostic ("noticed an article about your firm"), so
// there's no story-specific matching to optimize for. The only thing that
// matters is the returned contact has an investment/finance function at a
// senior level.
const TARGET_TITLES = [
  'Managing Partner',
  'Managing Director',
  'General Partner',
  'Partner',
  'Principal',
  'Chief Investment Officer',
  'Chief Financial Officer',
  'CFO',
  'Chief Operating Officer',
  'COO',
  'Head of Investor Relations',
  'Investor Relations',
  'Director of Investor Relations',
  'Head of Capital Formation',
  'Head of Fundraising',
  'Head of Origination',
  'Portfolio Manager',
]

// Junior / non-relevant title patterns — hard exclude. Word-boundary
// regex instead of substring match so we don't false-positive on
// "International Partner" (matching 'intern'), "Administrative Partner"
// (matching 'admin'), etc. The 2026-04-15 Inflexion incident surfaced
// the same class of bug at the positive-whitelist layer.
const JUNIOR_TITLE_PATTERNS: RegExp[] = [
  /\banalyst/i,              // analyst, analysts, analytical
  /\bassociate/i,            // associate, associated
  /\bassistant/i,            // assistant, assisting
  /\bintern\b/i,             // word boundary — NOT 'international'
  /\bcoordinator/i,
  /\badmin\b/i,              // word boundary — NOT 'administrative'
  /\badministrator/i,
  /\bexecutive\s+assistant/i,
  /\bhr\b/i,                 // word boundary — NOT 'chair'
  /\bhuman\s+resources/i,
  /\brecruiter/i,
  /\breceptionist/i,
  /\boffice\s+manager/i,
]

// Investment-function whitelist — a returned contact's title MUST match
// at least one of these patterns to count as relevant. All patterns use
// word boundaries where needed to avoid false positives. The 2026-04-15
// Inflexion incident ("Director of Partnership Development" passed because
// `.includes('partner')` matched the substring inside 'partnership') drove
// the conversion from substring matching to word-boundary regex.
//
// Pattern design:
//   - /\bX/i is a word-boundary prefix match ("X" or "X_suffix_letters")
//   - /\bX\b/i is an exact-word match (X surrounded by non-word boundaries)
//   - /\bX\s+Y/i is an exact-phrase prefix match
const INVESTMENT_TITLE_PATTERNS: RegExp[] = [
  /\binvest/i,                  // invest, investment, investor, investor relations, investing
  /\bportfolio/i,               // portfolio, portfolios
  /\bcapital\b/i,               // capital (word) — capital formation, capital markets
  /\bpartner\b/i,               // partner (word) — NOT 'partnership'
  /\bpartners\b/i,              // partners (plural word)
  /\bprincipal\b/i,             // principal (word)
  /\bmanaging\s+director/i,     // managing director
  /\bmanaging\s+partner/i,      // managing partner
  /\bgeneral\s+partner/i,       // general partner
  /\bcfo\b/i,                   // CFO (word) — NOT inside longer acronyms
  /\bchief\s+financial/i,       // chief financial officer
  /\bchief\s+operating/i,       // chief operating officer
  /\bchief\s+investment/i,      // chief investment officer
  /\bchief\s+compliance/i,      // chief compliance officer
  /\bcoo\b/i,                   // COO (word) — NOT 'cook', 'cool'
  /\bfund/i,                    // fund*, fundraising, funds — NOT 'refund'
  /\borigination/i,             // origination, originations
  /\bacquisit/i,                // acquisition, acquisitions
]

function titleIsJunior(title: string | undefined | null): boolean {
  if (!title) return true // empty title = skip
  return JUNIOR_TITLE_PATTERNS.some((re) => re.test(title))
}

function titleIsInvestmentFunction(title: string | undefined | null): boolean {
  if (!title) return false
  return INVESTMENT_TITLE_PATTERNS.some((re) => re.test(title))
}

function titleIsAcceptable(title: string | undefined | null): boolean {
  return !titleIsJunior(title) && titleIsInvestmentFunction(title)
}

/**
 * Search Apollo for senior people at a firm. Returns raw person records
 * (no emails — use matchPerson() to enrich).
 */
async function searchPeople(params: {
  firmName: string
  titles?: string[]
  domain?: string | null
}): Promise<ApolloSearchPerson[]> {
  const apiKey = process.env.OUTREACH_APOLLO_API_KEY
  if (!apiKey) throw new Error('Missing OUTREACH_APOLLO_API_KEY')

  const body: Record<string, unknown> = {
    q_keywords: params.firmName,
    person_seniorities: ['senior', 'director', 'vp', 'c_suite'],
    contact_email_status: ['verified'],
    per_page: 10,
  }
  if (params.titles && params.titles.length > 0) {
    body.person_titles = params.titles
  }
  if (params.domain) {
    body.q_organization_domains_list = [params.domain]
  }

  // Apollo deprecated the /mixed_people/search endpoint for REST API callers
  // in 2026. The replacement is /mixed_people/api_search. Error surfaced in
  // first live run on 2026-04-15.
  const res = await fetch(`${APOLLO_BASE}/mixed_people/api_search`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Apollo search failed ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as { people?: ApolloSearchPerson[] }
  return data.people ?? []
}

/**
 * Enrich a person by Apollo ID (or name + org for the named-person branch).
 * Returns null if the person has no verified email.
 */
async function matchPerson(params: {
  personId?: string
  name?: string
  organizationName?: string
  domain?: string | null
}): Promise<ApolloMatchPerson | null> {
  const apiKey = process.env.OUTREACH_APOLLO_API_KEY
  if (!apiKey) throw new Error('Missing OUTREACH_APOLLO_API_KEY')

  const body: Record<string, unknown> = {}
  if (params.personId) body.id = params.personId
  if (params.name) body.name = params.name
  if (params.organizationName) body.organization_name = params.organizationName
  if (params.domain) body.domain = params.domain

  const res = await fetch(`${APOLLO_BASE}/people/match`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Apollo match failed ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as { person?: ApolloMatchPerson }
  return data.person ?? null
}

/**
 * Top-level helper. Takes an article and returns up to `maxContacts`
 * verified contacts at that firm, or a typed drop reason per attempted
 * contact. Supports the 5-10-per-firm scale goal without requiring
 * multiple Apollo searches — we pull the top 10 search results in one
 * call and enrich up to `maxContacts` of them with matchPerson.
 *
 * Credit discipline: 1 search call per firm, up to `maxContacts` match
 * calls per firm. The old singular implementation burned 2 search calls
 * per firm (title-filtered + no-title fallback); this one only falls
 * back if the title-filtered search returned zero people at all.
 *
 * Branch A (named-person direct match) is gone — Block G in candidates.ts
 * drops all person-move articles before they reach Apollo, so the
 * named-person code path was unreachable dead code.
 */
export async function findContactsForFirm(
  article: Article,
  maxContacts: number,
  counters?: { searchCalls: number; matchCalls: number },
): Promise<FindContactResult[]> {
  if (!article.firmName) {
    return [{ ok: false, reason: 'empty_firm_name' }]
  }
  if (maxContacts <= 0) return []

  // Search for senior people at the firm (up to 10 results per call).
  if (counters) counters.searchCalls++
  let searchResults = await searchPeople({
    firmName: article.firmName,
    titles: TARGET_TITLES,
    domain: article.firmDomain,
  })

  // Fallback: retry without the title filter if the title-filtered
  // search returned nothing. Sometimes Apollo doesn't honor the title
  // filter on smaller firms. Still post-filtered by titleIsAcceptable.
  if (searchResults.length === 0) {
    if (counters) counters.searchCalls++
    searchResults = await searchPeople({
      firmName: article.firmName,
      domain: article.firmDomain,
    })
  }

  // Pre-filter at the search layer: must have an email AND a title that
  // passes both junior-exclusion and investment-function whitelist.
  const viableSearchHits = searchResults.filter(
    (p) => p.has_email && titleIsAcceptable(p.title),
  )

  if (viableSearchHits.length === 0) {
    return [{ ok: false, reason: 'apollo_no_match' }]
  }

  // Iterate through viable search hits, enriching each via matchPerson
  // and applying all post-match guards, until we hit `maxContacts`
  // successes or exhaust the search results. Failures accumulate into
  // the results array too so the caller can log each drop reason.
  const results: FindContactResult[] = []
  let successCount = 0
  for (const searchPerson of viableSearchHits) {
    if (successCount >= maxContacts) break
    if (counters) counters.matchCalls++
    const person = await matchPerson({ personId: searchPerson.id })
    const result = applyPostMatchGuards(article, person)
    results.push(result)
    if (result.ok) successCount++
  }

  return results
}

/**
 * Backwards-compatible singular wrapper. Returns the first successful
 * contact from findContactsForFirm, or the first failure reason if
 * nothing succeeded.
 */
export async function findContactForFirm(
  article: Article,
  counters?: { searchCalls: number; matchCalls: number },
): Promise<FindContactResult> {
  const results = await findContactsForFirm(article, 1, counters)
  const success = results.find((r) => r.ok)
  if (success) return success
  return results[0] ?? { ok: false, reason: 'apollo_no_match' }
}

/**
 * Run all post-match guards on an Apollo person record and either
 * return a verified Contact or a typed drop reason. Extracted from
 * findContactForFirm so findContactsForFirm can iterate over multiple
 * search results and run the same guard stack on each.
 *
 * Guards (in order):
 *   - null person (Apollo returned nothing)
 *   - email_status !== 'verified' or email missing
 *   - empty first_name
 *   - title not acceptable (junior or non-investment-function)
 *   - org_name_mismatch (Apollo's org.name doesn't normalize-match article firm)
 *   - missing_firm_domain (article had no firm_domain — can't verify)
 *   - email_domain_mismatch (returned email domain != article firm domain)
 */
function applyPostMatchGuards(
  article: Article,
  person: ApolloMatchPerson | null,
): FindContactResult {
  if (!person) return { ok: false, reason: 'apollo_no_match' }

  if (person.email_status !== 'verified' || !person.email) {
    return { ok: false, reason: 'no_verified_email' }
  }

  if (!person.first_name || !person.first_name.trim()) {
    return { ok: false, reason: 'empty_first_name' }
  }

  if (!titleIsAcceptable(person.title)) {
    console.warn(
      `[outreach] title not acceptable — dropped ${person.email}: ` +
        `title="${person.title ?? '<empty>'}"`,
    )
    return { ok: false, reason: 'title_not_acceptable' }
  }

  if (person.organization?.name) {
    const apolloNorm = normalizeFirmName(person.organization.name)
    const articleNorm = normalizeFirmName(article.firmName!)
    const orgMatches =
      apolloNorm === articleNorm ||
      apolloNorm.includes(articleNorm) ||
      articleNorm.includes(apolloNorm)
    if (!orgMatches) {
      console.warn(
        `[outreach] org-name mismatch — dropped ${person.email}: ` +
          `article.firm="${article.firmName}" vs apollo.org="${person.organization.name}"`,
      )
      return { ok: false, reason: 'org_name_mismatch' }
    }
  }

  if (!article.firmDomain) {
    console.warn(
      `[outreach] no article firm domain — dropped ${person.email}`,
    )
    return { ok: false, reason: 'missing_firm_domain' }
  }
  const emailDom = emailDomain(person.email)
  const targetDom = normalizeDomain(article.firmDomain)
  if (!domainsMatch(emailDom, targetDom)) {
    console.warn(
      `[outreach] email-domain mismatch — dropped ${person.email}: ` +
        `target="${targetDom}" emailDom="${emailDom}"`,
    )
    return { ok: false, reason: 'email_domain_mismatch' }
  }

  // Source-of-truth rule: the Contact's firm is ALWAYS the article's firm.
  // Apollo's organization record is used for the match checks above but
  // never overrides downstream subject/body composition.
  const contact: Contact = {
    email: person.email,
    firstName: person.first_name,
    lastName: person.last_name ?? '',
    title: person.title ?? '',
    firmName: article.firmName!,
    firmDomain: article.firmDomain,
    personId: person.id,
    article,
  }
  return { ok: true, contact }
}

/**
 * Extract the domain from an email address, lowercased and with any
 * leading "www." stripped. Returns empty string if the email is
 * malformed.
 */
function emailDomain(email: string): string {
  const at = email.lastIndexOf('@')
  if (at < 0) return ''
  return email.slice(at + 1).toLowerCase().replace(/^www\./, '')
}

/**
 * Normalize a firm domain for comparison: lowercase, strip "www.",
 * strip any trailing slash or path component.
 */
function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .trim()
}

/**
 * Domain match check. Exact match, or email domain is a subdomain of
 * target (or vice versa). Used to verify that Apollo's returned person
 * actually reads email at the firm we're targeting.
 */
function domainsMatch(emailDom: string, targetDom: string): boolean {
  if (!emailDom || !targetDom) return false
  if (emailDom === targetDom) return true
  if (emailDom.endsWith('.' + targetDom)) return true
  if (targetDom.endsWith('.' + emailDom)) return true
  return false
}

/**
 * Strip whitespace and punctuation and lowercase a firm name for
 * mismatch comparison. "H.I.G. Capital" → "higcapital". Tolerates
 * differences like "HIG Capital" vs "H.I.G. Capital" (both normalize
 * to "higcapital") while still catching true mismatches like
 * "Infinedi Partners" vs "H.I.G. Capital".
 */
function normalizeFirmName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}
