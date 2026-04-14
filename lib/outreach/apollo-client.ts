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

interface TitleTable {
  [storyType: string]: string[]
}

// Story-type → preferred-title priority list. Mirrors the skill's Step 7 table.
const TITLE_PRIORITY: TitleTable = {
  fund_close: ['Head of Investor Relations', 'Investor Relations', 'Partner', 'Managing Partner', 'CFO'],
  fund_launch: ['Head of Investor Relations', 'Investor Relations', 'Partner', 'Managing Partner', 'CFO'],
  capital_raise: ['Head of Investor Relations', 'Investor Relations', 'CFO', 'Partner'],
  acquisition: ['Partner', 'Head of Business Development', 'Head of M&A'],
  merger: ['Partner', 'Head of Business Development', 'Head of M&A'],
  lp_commitments: ['Head of Investor Relations', 'Investor Relations'],
  default: ['Head of Investor Relations', 'Partner', 'Managing Partner', 'CFO'],
}

// Junior / non-relevant titles to drop from search results.
const JUNIOR_TITLE_FRAGMENTS = [
  'analyst', 'associate', 'assistant', 'intern', 'coordinator',
  'admin', 'executive assistant', 'hr ', 'human resources',
  'recruiter', 'receptionist', 'office manager',
]

function titleIsJunior(title: string | undefined | null): boolean {
  if (!title) return true // empty title = skip
  const lower = title.toLowerCase()
  return JUNIOR_TITLE_FRAGMENTS.some((f) => lower.includes(f))
}

function titlesForStoryType(storyType: string): string[] {
  return TITLE_PRIORITY[storyType] ?? TITLE_PRIORITY.default
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

  const res = await fetch(`${APOLLO_BASE}/mixed_people/search`, {
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
      titles: titlesForStoryType(storyType),
      domain: article.firmDomain,
    })

    // Pick the first non-junior candidate.
    const picked = searchResults.find(
      (p) => p.has_email && !titleIsJunior(p.title),
    )

    if (!picked) {
      // Fallback: retry without the title filter — sometimes Apollo doesn't
      // honor the title filter on smaller firms. Still requires verified
      // email_status from the search filter.
      if (counters) counters.searchCalls++
      const fallback = await searchPeople({
        firmName: article.firmName,
        domain: article.firmDomain,
      })
      const pickedFallback = fallback.find(
        (p) => p.has_email && !titleIsJunior(p.title),
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

  return {
    email: person.email,
    firstName: person.first_name,
    lastName: person.last_name ?? '',
    title: person.title ?? '',
    firmName: person.organization?.name ?? article.firmName,
    firmDomain: person.organization?.primary_domain ?? article.firmDomain,
    personId: person.id,
    article,
  }
}
