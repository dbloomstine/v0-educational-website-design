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

import type { Article, Contact } from './types'

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

// Junior / non-relevant title fragments — hard exclude.
const JUNIOR_TITLE_FRAGMENTS = [
  'analyst', 'associate', 'assistant', 'intern', 'coordinator',
  'admin', 'executive assistant', 'hr ', 'human resources',
  'recruiter', 'receptionist', 'office manager',
]

// Investment-function whitelist — a returned contact's title MUST contain
// at least one of these keywords to count as relevant. Added 2026-04-15
// after the Stellex "Chief Talent Officer" miss, where Apollo returned a
// c-suite contact who passed the seniority filter but had the wrong
// function (HR, not investment). Positive whitelist is easier to reason
// about than a negative blocklist — if we can't identify an investment
// angle in the title, drop the candidate.
const INVESTMENT_TITLE_KEYWORDS = [
  'invest',           // investment, investor, investor relations
  'portfolio',
  'capital',          // head of capital formation, capital markets
  'partner',          // managing partner, general partner, partner
  'principal',
  'managing director',
  'cfo',
  'chief financial',
  'chief operating',
  'coo',
  'chief compliance', // CCO at PE firms typically wears a finance hat
  'fund',             // fund manager, fund director
  'origination',
  'fundraising',
  'acquisition',      // head of acquisitions
]

function titleIsJunior(title: string | undefined | null): boolean {
  if (!title) return true // empty title = skip
  const lower = title.toLowerCase()
  return JUNIOR_TITLE_FRAGMENTS.some((f) => lower.includes(f))
}

function titleIsInvestmentFunction(title: string | undefined | null): boolean {
  if (!title) return false
  const lower = title.toLowerCase()
  return INVESTMENT_TITLE_KEYWORDS.some((kw) => lower.includes(kw))
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
 * named person) and returns a single verified Contact or null.
 *
 * Branch A (named person): executive moves where person_name is present.
 *   Direct name match via matchPerson() — one API call.
 *
 * Branch B (title-based): everything else.
 *   Search by firm + title → pick top non-junior candidate → match by ID.
 *   Two API calls.
 */
export async function findContactForFirm(
  article: Article,
  counters?: { searchCalls: number; matchCalls: number },
): Promise<Contact | null> {
  if (!article.firmName) return null

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

    // Pick the first candidate whose title is both non-junior AND contains
    // an investment-function keyword. Both checks are required — we've seen
    // Apollo return a "Chief Talent Officer" under c_suite seniority
    // filtering that passes the non-junior check but has no investment
    // function. See INVESTMENT_TITLE_KEYWORDS for the whitelist.
    const picked = searchResults.find(
      (p) => p.has_email && titleIsAcceptable(p.title),
    )

    if (!picked) {
      // Fallback: retry without the title filter — sometimes Apollo doesn't
      // honor the title filter on smaller firms. Still requires verified
      // email_status AND a title matching the investment-function whitelist,
      // so a fallback won't blindly grab whoever's at the firm regardless
      // of role.
      if (counters) counters.searchCalls++
      const fallback = await searchPeople({
        firmName: article.firmName,
        domain: article.firmDomain,
      })
      const pickedFallback = fallback.find(
        (p) => p.has_email && titleIsAcceptable(p.title),
      )
      if (!pickedFallback) return null

      if (counters) counters.matchCalls++
      person = await matchPerson({ personId: pickedFallback.id })
    } else {
      if (counters) counters.matchCalls++
      person = await matchPerson({ personId: picked.id })
    }
  }

  if (!person) return null

  // Verified-only rule. Drop anyone whose email isn't a verified match.
  if (person.email_status !== 'verified') return null
  if (!person.email) return null

  // Empty first name produces "Hi ," in the greeting which looks broken.
  // Drop the contact rather than send a malformed email. The quality gate
  // has a redundant check for belt + suspenders.
  if (!person.first_name || !person.first_name.trim()) return null

  // ─── Guard 0: final matched person must have an investment title ─────
  // The matchPerson() response title can differ from the search result
  // title (Apollo occasionally returns a different "current" title on
  // enrichment). Re-check the title on the returned record so Branch A
  // and any search→match drift are both covered.
  if (!titleIsAcceptable(person.title)) {
    console.warn(
      `[outreach] title not investment-function — dropped ${person.email}: ` +
        `title="${person.title ?? '<empty>'}"`,
    )
    return null
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
      return null
    }
  }

  // ─── Guard 2: email domain must match article firm domain ────────────
  // The org-name guard isn't sufficient — Apollo tags portco executives
  // under the parent PE firm's organization.name even when their actual
  // email is at the portco domain. The 2026-04-15 Olympus Partners /
  // Onsite Mammography incident: Apollo returned Heather Deng with
  // organization.name="Olympus Partners" (portco tagging) but
  // email="heatherdeng@onsitemammography.com". The org-name guard
  // happily passed; she got an email with subject "Covered Olympus
  // today" despite working at a medical imaging company.
  //
  // New rule: the email's domain MUST match article.firmDomain (exact
  // match or subdomain either way). If article.firmDomain is missing we
  // have no source of truth to compare against, so drop the contact
  // rather than trust Apollo's primary_domain which has the same portco-
  // tagging problem.
  if (!article.firmDomain) {
    console.warn(
      `[outreach] no article firm domain — dropped ${person.email} (can't verify domain match)`,
    )
    return null
  }
  const emailDom = emailDomain(person.email)
  const targetDom = normalizeDomain(article.firmDomain)
  if (!domainsMatch(emailDom, targetDom)) {
    console.warn(
      `[outreach] email-domain mismatch — dropped ${person.email}: ` +
        `target="${targetDom}" emailDom="${emailDom}"`,
    )
    return null
  }

  // Source-of-truth rule: the Contact's firm is ALWAYS the article's firm.
  // Apollo's organization record is used for the match checks above but
  // never overrides downstream subject/body composition.
  return {
    email: person.email,
    firstName: person.first_name,
    lastName: person.last_name ?? '',
    title: person.title ?? '',
    firmName: article.firmName,
    firmDomain: article.firmDomain,
    personId: person.id,
    article,
  }
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
