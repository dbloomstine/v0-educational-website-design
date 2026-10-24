/**
 * A typed search, as people type it into Google or into our own box, mapped to the one page that answers it
 * (2026-10-24; the clusters are in ~/fundopshq-workspace/docs/directory/research/2026-10-24-intent-map.md):
 *
 *   "venture capital lawyer"                         → /fund-lawyers/venture-funds
 *   "hedge fund law firm"                            → /fund-lawyers/hedge-funds/firms
 *   "lawyer to help set up a private equity fund"    → /fund-lawyers/private-equity-funds
 *   "real estate fund attorney nyc"                  → /fund-lawyers/real-estate-funds/new-york
 *   "hedge fund cpa"                                 → /fund-tax-advisors/hedge-funds
 *   "private equity audit firms"                     → /fund-auditors/private-equity-funds/firms
 *
 * Used by a hub's search ("Looking for Hedge Fund Law Firms?") and by the tests, which hold the map to account.
 * Only pages that exist are offered: the caller says which do. Pure.
 */
import { fold } from './search'
import { PLACES, CITIES, type Place } from './places'
import { CATEGORIES, PRACTICE_BY_ID, type CategoryId, type PracticeId } from './taxonomy'

export interface IntentMatch {
  category: CategoryId
  practice: string | null
  place: Place | null
  /** The search wants firms ("law firm", "audit firms", "CPA firms"), not people. */
  firms: boolean
}

/** Phrases for each practice, most specific first; the first practice found wins, fund formation last. */
const PRACTICE_PHRASES: [string, string[]][] = [
  ['buyout_funds', ['private equity', 'pe', 'buyout', 'buyouts', 'lbo']],
  ['venture_funds', ['venture capital', 'venture', 'vc']],
  ['hedge_funds', ['hedge fund', 'hedge funds', 'hedge']],
  ['real_estate_funds', ['real estate', 'reit', 'reits', 'property']],
  ['private_credit_funds', ['private credit', 'direct lending', 'private debt', 'credit', 'bdc']],
  ['infrastructure_funds', ['infrastructure', 'infra']],
  ['secondaries', ['secondaries', 'secondary', 'continuation fund', 'continuation funds', 'gp led']],
  ['funds_regulatory', ['investment adviser', 'investment advisor', 'ria', 'sec registration', 'regulatory', 'compliance']],
  ['fund_finance', ['fund finance', 'subscription line', 'subscription lines', 'nav loan', 'nav facility']],
  ['fund_formation', ['fund formation', 'formation', 'set up', 'setup', 'setting up', 'launch', 'start a fund', 'starting a fund', 'form a fund', 'forming']],
]

const PLACE_NAMES: { words: string; place: Place }[] = (() => {
  const out: { words: string; place: Place }[] = []
  for (const p of PLACES) {
    out.push({ words: fold(p.name), place: p })
    const city = p.kind === 'city' ? CITIES.find((c) => c.slug === p.slug) : null
    for (const a of city?.aliases ?? []) out.push({ words: fold(a), place: p })
  }
  const by = (slug: string) => PLACES.find((p) => p.slug === slug)
  for (const [w, slug] of [['sf', 'san-francisco'], ['la', 'los-angeles'], ['dc', 'washington-dc'], ['ny', 'new-york']] as const) {
    const p = by(slug)
    if (p) out.push({ words: w, place: p })
  }
  // Longest first: "new york city" before "new york", "west palm beach" before "palm beach".
  return out.sort((a, b) => b.words.length - a.words.length)
})()

const has = (text: string, phrase: string) => ` ${text} `.includes(` ${phrase} `)

/** What a typed search asks for. `fallback`: the trade when the words name none ("hedge fund", typed on a hub). */
export function parseIntent(query: string, fallback: CategoryId = 'fund_lawyer'): IntentMatch {
  let text = fold(query)
  const lawyer = /\b(lawyers?|attorneys?|counsel|law|legal)\b/.test(text)
  const auditor = /\b(auditors?|audits?|auditing)\b/.test(text)
  const tax = /\b(tax|taxes|cpas?|accountants?|accounting)\b/.test(text)
  const category: CategoryId = lawyer ? 'fund_lawyer' : auditor ? 'fund_auditor' : tax ? 'fund_tax_advisor' : fallback
  const firms = /\b(firms?|companies|company|lawfirms?)\b/.test(text)

  let place: Place | null = null
  for (const n of PLACE_NAMES) {
    if (has(text, n.words)) {
      place = n.place
      text = ` ${text} `.replace(` ${n.words} `, ' ').trim()
      break
    }
  }

  const allowed = CATEGORIES[category].practices as string[]
  let practice: string | null = null
  for (const [id, phrases] of PRACTICE_PHRASES) {
    if (!allowed.includes(id)) continue
    if (phrases.some((ph) => has(text, ph))) {
      practice = id
      break
    }
  }
  // "Fund tax lawyer": a lawyer's tax practice.
  if (!practice && category === 'fund_lawyer' && tax) practice = 'tax_funds'
  return { category, practice, place, firms }
}

/**
 * The page that answers a match, among those that exist: the most specific first (practice and place), then the
 * practice, then the place, then the trade; a firm search tries each one's /firms first.
 */
export function intentPage(m: IntentMatch, exists: (path: string) => boolean): string {
  const c = CATEGORIES[m.category]
  const t = m.practice ? (PRACTICE_BY_ID.get(m.practice as PracticeId)?.slug ?? null) : null
  const hub = `/${c.slug}`
  const bases = [
    t && m.place ? `${hub}/${t}/${m.place.slug}` : null,
    t ? `${hub}/${t}` : null,
    m.place ? `${hub}/${m.place.slug}` : null,
    hub,
  ].filter((x): x is string => Boolean(x))
  for (const b of bases) {
    if (m.firms) {
      const f = b === hub ? `${hub}/firms` : `${b}/firms`
      if (exists(f)) return f
    }
    if (b === hub || exists(b)) return b
  }
  return hub
}
