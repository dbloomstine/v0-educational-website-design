/**
 * The directory finder's matching (2026-10-24): one box on /directory that answers "fund lawyers, auditors and tax
 * partners by name, firm, strategy or city". Pure and small, so the browser carries it (the entries themselves are
 * built on the server: lib/directory/finder.ts) and the server's no-JavaScript answer (/directory?q=…) is the same.
 *
 * Every typed word must find a home in an entry's words (its label, plus the everyday words for its strategy: "vc",
 * "pe", "hedge"; and its city's other names: "nyc", "sf"), whole, as a start, as a piece or one slip away (the hub's
 * own matching: lib/directory/search.ts wordScore). The trades' nouns and filler ("lawyer", "best", "near me") count
 * when they fit and never exclude. The most specific page wins a tie: "hedge fund lawyers new york" puts the New York
 * page above the national one.
 */
import { fold, wordScore } from './search'
import { SOFT_WORDS } from './intent'

export type FinderKind = 'trade' | 'page' | 'firm' | 'ranking'

export interface FinderEntry {
  /** What it is. */
  k: FinderKind
  /** The label shown ("Hedge Fund Lawyers in New York", "Kirkland & Ellis"). */
  t: string
  /** Where it goes. */
  h: string
  /** People listed (a ranking: firms ranked). */
  n: number
  /** The trade's plural ("Fund Lawyers"): shown beside a firm, so two trades' Bakers Tilly are told apart. */
  c: string
  /** Extra words that find it, space-separated, already folded ("vc venture nyc manhattan"). */
  w?: string
}

/** A typed query that only searches people: the hubs' own search, one per trade. */
export interface PeopleSearch {
  label: string
  href: string
}

/** Every trade's own nouns (keyed by its plural, which every entry carries), so "audit" or "cpa" finds its pages. */
export const TRADE_WORDS: Record<string, string[]> = {
  'Fund Lawyers': 'lawyer lawyers attorney attorneys counsel law legal'.split(' '),
  'Fund Auditors': 'auditor auditors audit audits auditing assurance'.split(' '),
  'Fund Tax Advisors': 'tax cpa cpas accountant accountants accounting'.split(' '),
  'Placement Agents': 'placement agent agents fundraising'.split(' '),
  'Fund Finance Bankers': 'banker bankers bank lender lenders lending'.split(' '),
}

const words = (s: string) => fold(s).split(' ').filter(Boolean)

/** How well an entry fits the query; 0 when any word that matters finds no home. */
export function finderScore(q: string, e: FinderEntry): number {
  const qs = words(q).filter((w) => w !== 'and')
  if (!qs.length) return 0
  const label = words(e.t)
  const extra = [...(e.w ? e.w.split(' ') : []), ...(TRADE_WORDS[e.c] ?? [])]
  let total = 0
  const used = new Set<number>()
  for (const w of qs) {
    let best = 0
    let at = -1
    label.forEach((x, i) => {
      const s = wordScore(w, x) * 2
      if (s > best) {
        best = s
        at = i
      }
    })
    for (const x of extra) {
      // Everyday words match whole: "pe" must not find "pet".
      const s = x === w ? 7 : 0
      if (s > best) {
        best = s
        at = -1
      }
    }
    if (!best) {
      if (SOFT_WORDS.has(w)) continue
      return 0
    }
    if (at >= 0) used.add(at)
    total += best
  }
  if (!total) return 0
  // The most specific page first: fewer label words left unmatched.
  const filler = new Set(['in', 'for', 'and', 'of', 'the', 'fund', 'funds'])
  const left = label.filter((x, i) => !used.has(i) && !filler.has(x)).length
  const kindBonus = e.k === 'trade' ? 1.5 : e.k === 'page' ? 1 : e.k === 'firm' ? 0.5 : 0
  return total - left * 0.75 + kindBonus + Math.log10(e.n + 1) * 0.2
}

/** The trades a query names by their own nouns ("vc attorney nyc" names the lawyers): the plurals, or none. */
export function namedTrades(q: string): string[] {
  const qs = new Set(words(q))
  return Object.entries(TRADE_WORDS)
    .filter(([, ws]) => ws.some((w) => qs.has(w)))
    .map(([plural]) => plural)
}

/** The best entries for a query, best first; a query that names a trade keeps to it. */
export function matchFinder(entries: FinderEntry[], q: string, max = 8): FinderEntry[] {
  if (!fold(q)) return []
  const named = namedTrades(q)
  return entries
    .filter((e) => !named.length || named.includes(e.c))
    .map((e) => ({ e, s: finderScore(q, e) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || b.e.n - a.e.n || a.e.t.localeCompare(b.e.t, 'en'))
    .slice(0, max)
    .map((x) => x.e)
}

/** The hubs' own people search for the words: a name ("Smith") is answered there. */
export function peopleSearches(trades: { plural: string; slug: string }[], q: string): PeopleSearch[] {
  const v = q.trim().slice(0, 80)
  if (!v) return []
  const named = namedTrades(v)
  return trades.filter((t) => !named.length || named.includes(t.plural)).map((t) => ({ label: `Search ${t.plural.toLowerCase()} for “${v}”`, href: `/${t.slug}?${new URLSearchParams({ q: v }).toString()}` }))
}

/** "374 listed", "Fund Lawyers · 251 listed", "12 firms ranked": the quiet line beside a suggestion. */
export function finderMeta(e: FinderEntry): string {
  const n = e.n.toLocaleString('en-US')
  if (e.k === 'ranking') return `${n} firms ranked`
  if (e.k === 'firm') return `${e.c} · ${n} listed`
  return `${n} listed`
}
