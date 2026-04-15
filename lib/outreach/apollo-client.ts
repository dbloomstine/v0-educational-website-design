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
 * Top-level helper. Takes an article (with firm name, story type, optional
 * named person) and returns either a verified Contact or a typed drop
 * reason. The reason taxonomy (see ContactDropReason in types.ts) tells
 * the caller WHICH guard fired — useful for diagnosing pipeline drops
 * beyond the generic "no_verified_email" label we had before 2026-04-15.
 *
 * Branch A (named person): executive moves where person_name is present.
 *   Direct name match via matchPerson() — one API call. Mostly dead code
 *   now because Block G drops person-move articles before they get here.
 *
 * Branch B (title-based): everything else.
 *   Search by firm + TARGET_TITLES → pick top non-junior + investment-
 *   function candidate → match by ID. Two API calls.
 */
export async function findContactForFirm(
  article: Article,
  counters?: { searchCalls: number; matchCalls: number },
): Promise<FindContactResult> {
  if (!article.firmName) return { ok: false, reason: 'empty_firm_name' }

  const storyType = article.eventType ?? article.articleType ?? 'default'
  const execMoveTypes = ['executive_hire', 'executive_change', 'executive_departure']
  const isNamedPersonStory =
    execMoveTypes.includes(storyType) && !!article.personName

  let person: ApolloMatchPerson | null = null

  if (isNamedPersonStory) {
    // Branch A — direct name match.
    if (counters) counters.matchCalls++
    person = await matchPerson({
      name: article.personName!,
      organizationName: article.firmName,
      domain: article.firmDomain,
    })
  } else {
    // Branch B — search then match.
    if (counters) counters.searchCalls++
    const searchResults = await searchPeople({
      firmName: article.firmName,
      titles: TARGET_TITLES,
      domain: article.firmDomain,
    })

    // Pick the first candidate whose title is both non-junior AND matches
    // an investment-function pattern. Both checks are required — Apollo
    // occasionally returns a "Chief Talent Officer" under c_suite seniority
    // filtering, or a "Director of Partnership Development" matching the
    // TARGET_TITLES 'Partner' filter via substring. The word-boundary
    // regex in titleIsAcceptable catches these.
    const picked = searchResults.find(
      (p) => p.has_email && titleIsAcceptable(p.title),
    )

    if (!picked) {
      // Fallback: retry without the title filter — sometimes Apollo doesn't
      // honor the title filter on smaller firms. Still requires verified
      // email_status AND titleIsAcceptable, so the fallback won't blindly
      // grab whoever's at the firm regardless of role.
      if (counters) counters.searchCalls++
      const fallback = await searchPeople({
        firmName: article.firmName,
        domain: article.firmDomain,
      })
      const pickedFallback = fallback.find(
        (p) => p.has_email && titleIsAcceptable(p.title),
      )
      if (!pickedFallback) return { ok: false, reason: 'apollo_no_match' }

      if (counters) counters.matchCalls++
      person = await matchPerson({ personId: pickedFallback.id })
    } else {
      if (counters) counters.matchCalls++
      person = await matchPerson({ personId: picked.id })
    }
  }

  if (!person) return { ok: false, reason: 'apollo_no_match' }

  // Verified-only rule.
  if (person.email_status !== 'verified' || !person.email) {
    return { ok: false, reason: 'no_verified_email' }
  }

  // Empty first name produces "Hi ," in the greeting.
  if (!person.first_name || !person.first_name.trim()) {
    return { ok: false, reason: 'empty_first_name' }
  }

  // ─── Guard 0: final matched person must have an acceptable title ─────
  // The matchPerson() response title can differ from the search result
  // title. Re-check so Branch A and any search→match drift are covered.
  if (!titleIsAcceptable(person.title)) {
    console.warn(
      `[outreach] title not acceptable — dropped ${person.email}: ` +
        `title="${person.title ?? '<empty>'}"`,
    )
    return { ok: false, reason: 'title_not_acceptable' }
  }

  // ─── Guard 1: Apollo org name must match article firm ────────────────
  // Apollo's person records can be stale when someone has just moved
  // firms — the 2026-04-15 H.I.G./Infinedi collision was a Branch A
  // matchPerson() call asking for "Rohan Arora at Infinedi Partners",
  // and Apollo returned his prior record at H.I.G. Capital with email
  // rarora@hig.com. If we trust Apollo's org over the article's firm,
  // we end up emailing the wrong firm.
  if (person.organization?.name) {
    const apolloNorm = normalizeFirmName(person.organization.name)
    const articleNorm = normalizeFirmName(article.firmName)
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

  // ─── Guard 2: email domain must match article firm domain ────────────
  // The org-name guard isn't sufficient — Apollo tags portco executives
  // under the parent PE firm's organization.name even when their actual
  // email is at the portco domain. The 2026-04-15 Olympus Partners /
  // Onsite Mammography incident: Apollo returned Heather Deng with
  // organization.name="Olympus Partners" (portco tagging) but
  // email="heatherdeng@onsitemammography.com".
  //
  // Rule: the email's domain MUST match article.firmDomain (exact match
  // or subdomain either way). If article.firmDomain is missing, drop —
  // don't trust Apollo's primary_domain which has the same portco-tagging
  // problem.
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
    firmName: article.firmName,
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
