/**
 * What the directory's pages show of the data, cleaned for display (2026-10-24 night, the interface pass).
 * Pure, so tested. Nothing here changes a row: these are the rules a page applies on its way out.
 *
 *   - a title is cased the way a firm's own page would set it ("MANAGING DIRECTOR" → "Managing Director");
 *   - seniority is read from the title: partners and managing directors (and founders, chairs, heads) apart from the rest;
 *   - a practice chip shows only when the trade's own vocabulary has it (a placement agent tagged "fund formation" by a
 *     firm's page says nothing a reader can filter on, so it is not shown);
 *   - two visible rows for one person at one firm are one row.
 */
import { CATEGORIES, type Category } from './taxonomy'
import { practiceAreas, type PersonCard } from './people'

// ── Titles ──────────────────────────────────────────────────────────────────

const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with', 'de'])
/** Always upper case, whatever the source did. */
const ACRONYMS = new Set(['cfo', 'ceo', 'coo', 'cio', 'cto', 'cco', 'gc', 'lp', 'gp', 'nav', 'esg', 'us', 'usa', 'uk', 'emea', 'apac', 'md', 'smd', 'svp', 'evp', 'avp', 'vp', 'cpa', 'cfa', 'llp', 'llc', 'it', 'ir', 'hr', 'erisa', 'ma', 'm&a', 'reit', 'pe', 'vc', 'ii', 'iii', 'iv', 'tmt'])

const capWord = (w: string, first: boolean): string => {
  const lower = w.toLowerCase()
  const bare = lower.replace(/[^a-z&]/g, '')
  if (ACRONYMS.has(bare)) return w.toUpperCase()
  if (!first && SMALL.has(lower)) return lower
  // Hyphenated and slashed words: "co-head", "tax/audit".
  return lower.replace(/(^|[-/(])([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase())
}

/**
 * A title as a page shows it. Left alone when the source already mixes cases on purpose ("Partner, Fund Advisory",
 * "Head of NAV Lending"); cased when it came all upper or all lower case. Whitespace and stray commas are tidied either way.
 */
export function displayTitle(raw: string | null | undefined): string | null {
  let t = (raw ?? '').replace(/\s+/g, ' ').replace(/\s+,/g, ',').replace(/^[\s,;|·–-]+|[\s,;|·–-]+$/g, '').trim()
  if (!t) return null
  const letters = t.replace(/[^A-Za-z]/g, '')
  const allUpper = letters.length > 3 && letters === letters.toUpperCase()
  const allLower = letters === letters.toLowerCase()
  if (allUpper || allLower) t = t.split(' ').map((w, i) => capWord(w, i === 0 || /[,(]$/.test(t.split(' ')[i - 1] ?? ''))).join(' ')
  return t
}

// ── Seniority ───────────────────────────────────────────────────────────────

export type Seniority = 'senior' | 'other'

/** Partners and managing directors, and the titles that sit with them (founder, chair, head, chief, president). */
const SENIOR = /\b(partner|managing director|managing partner|founder|co-founder|chair(man|woman|person)?|vice chair(man)?|head\b|chief|president|principal partner|md)\b/i
/** Titles that carry a senior word but are not senior: "Vice President", "Associate Partner"? (Kept senior: some firms' partners.) */
const NOT_SENIOR = /\b(vice president|assistant|associate director|senior associate|analyst|associate(?! partner)|counsel(?!\s*partner)|of counsel|paralegal|intern)\b/i

export function seniority(title: string | null | undefined): Seniority {
  const t = title ?? ''
  if (!t.trim()) return 'other'
  if (NOT_SENIOR.test(t) && !/\b(partner|managing director)\b/i.test(t)) return 'other'
  return SENIOR.test(t) ? 'senior' : 'other'
}

export const SENIOR_LABEL = 'Partners and MDs'

// ── Practice chips ──────────────────────────────────────────────────────────

/** The practice areas a page shows for a person: theirs, within the trade's own vocabulary, in the trade's menu order. */
export function visiblePractices(p: Pick<PersonCard, 'practice_areas' | 'claimed_at' | 'claimed_practice_areas' | 'category'>, category: Category = CATEGORIES[p.category]): string[] {
  const mine = new Set(practiceAreas(p))
  return category.practices.filter((id) => mine.has(id))
}

// ── Duplicates ──────────────────────────────────────────────────────────────

const fold = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv|esq)\b\.?/g, '')
    .replace(/\b[a-z]\.\s?/g, '') // middle initials: "Stuart E. Baldwin" is "Stuart Baldwin"
    .replace(/[^a-z]+/g, ' ')
    .trim()

/** The key two rows for one person share: their name without initials or suffixes, the firm, and the trade (a firm's
 * auditor and its tax advisor of one name are two listings, each on its own trade's pages). */
export const personKey = (p: Pick<PersonCard, 'full_name' | 'firm_domain'> & { category?: string }) => `${p.category ?? ''}|${fold(p.full_name)}|${p.firm_domain.toLowerCase()}`

const richness = (p: PersonCard) => (p.claimed_at ? 100 : 0) + (p.title ? 4 : 0) + practiceAreas(p).length + p.offices.length

/** One row per person per firm: the claimed one, else the one with more on it, else the first. Order is kept. */
export function dedupePeople<T extends PersonCard>(people: T[]): T[] {
  const best = new Map<string, T>()
  for (const p of people) {
    const k = personKey(p)
    const prev = best.get(k)
    if (!prev || richness(p) > richness(prev)) best.set(k, p)
  }
  const keep = new Set(best.values())
  return people.filter((p) => keep.has(p))
}
