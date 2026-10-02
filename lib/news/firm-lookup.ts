/**
 * Finding a firm's reports from its page address.
 *
 * A firm's address is its key (lib/newsletter/story-links.ts entityKey):
 * "Ares Management" → "ares", "Kirkland & Ellis" → "kirkland ellis". The key
 * welds initials together — "H.I.G. Capital" → "hig", "A&O Shearman" →
 * "ao shearman", "M&G" → "mg" — so the firm and its page agree whether a
 * report wrote "HIG" or "H.I.G.".
 *
 * The database stores the names as written. Until 2026-10-02 the page looked
 * for the key's letters side by side ("%hig%", "%ao%shearman%"), which is not
 * how those names are written: the directory linked to fifteen firms whose
 * page was a 404, and H.I.G., M&G and J.P. Morgan had pages missing every
 * report that used the dots or the ampersand. firmLookup() says what to ask
 * the database for; the rows that come back are then held to the key itself
 * (isFirmName), so a loose lookup costs a few extra rows and never a wrong
 * story.
 *
 * Pure: no I/O.
 */
import { entityKey, keysMatch } from '@/lib/newsletter/story-links'
import { acronymOf } from './league'

/**
 * What to ask the database for.
 *
 * `exact` is a regular expression: every token of the key as a whole word, in
 * order, a short token either as written or as initials apart. It is what a
 * headline is searched with, and the first thing a firm name is.
 *
 * `loose` is the plain "contains these letters in this order", offered when
 * the key has a word of three letters or more. It is for firm names only, and
 * only when `exact` found nothing: it exists for the name with an accent in
 * it — "Värde Partners" is the key "v rde", and the "ä" between them is not
 * punctuation. Thirteen names in a year need it.
 */
export interface FirmLookup {
  exact: string
  loose: string | null
}

/**
 * What can stand beside a word: punctuation, written out.
 *
 * The honest definition is "whatever is not a letter or a digit", which is how
 * entityKey splits a name. The index cannot use it. The trigram index serves
 * an expression only when it can find three known characters in a row on every
 * path through it, and for a short word or a pair of initials those three
 * characters include the word's edges — which it recognises only as a list of
 * plain punctuation. With the open-ended class the lookup for "M&G" read every
 * row of the year: seventeen seconds from a cold disk, against a statement
 * limit of eight. With the list, it reads thirty-nine rows. The list also
 * tells the index a word ends where it ends: "man" as a word is a third of the
 * rows "man" inside "management" is.
 *
 * A curly apostrophe ("KKR’s") is its own alternative, not a member of the
 * class: one character from outside ASCII in the class and the index treats
 * the whole class as unknown. No straight double quote and no backslash: the
 * filter syntax would need them escaped.
 */
const MARK = "[ !#$%&'()*+,./:;<=>?@^_`{|}~-]"
const AFTER = `(${MARK}|’)`

/** A token as the key has it, or — two or three letters — as initials apart: H.I.G., A&O, J. P. Four or more letters never are. */
function spelled(t: string): string {
  if (t.length !== 2 && t.length !== 3) return t
  return `(${t}|${t.split('').join(`${MARK}+(and${MARK}+)?`)})`
}

/** How to find every spelling of a key. Null for an empty key. */
export function firmLookup(key: string): FirmLookup | null {
  const tokens = key.split(' ').filter(Boolean)
  if (tokens.length === 0) return null
  return {
    // Whole words, in order. Between two: the end of one, then anything, then the start of the next; one mark may be both.
    exact: `(^|${MARK})${tokens.map(spelled).join(`${AFTER}(.*${MARK})?`)}(${AFTER}|$)`,
    // "%mg%" is Omega and Magnetar, and no index can serve two letters.
    loose: tokens.some((t) => t.length >= 3) ? `%${tokens.join('%')}%` : null,
  }
}

/**
 * The lookup as one PostgREST `or` filter on a column. Values are quoted: they
 * carry dots, commas and parentheses, which the filter syntax would otherwise
 * read as its own.
 *
 * `loose` is for the firm-name column only. On headlines "%hig%" is every
 * "high" and "higher": the planner expects so many that it walks the year
 * newest-first waiting for 300 of them, finds 278, and has read everything.
 */
export function lookupFilter(column: string, lookup: FirmLookup, opts: { loose?: boolean } = {}): string {
  return [`${column}.imatch."${lookup.exact}"`, ...(opts.loose && lookup.loose ? [`${column}.ilike."${lookup.loose}"`] : [])].join(',')
}

/** ILIKE patterns as one PostgREST `or` filter on a column, quoted the same way. */
export function anyOfPatterns(column: string, patterns: string[]): string {
  return patterns.map((p) => `${column}.ilike."${p.replace(/[\\"]/g, '\\$&')}"`).join(',')
}

/** The test the database applies to an ILIKE pattern. */
export function ilike(pattern: string, value: string): boolean {
  const re = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')
  return new RegExp(`^${re}$`, 'is').test(value)
}

/** True when `name` is this firm by its key: the same key, or a longer form of it. */
export function isFirmName(name: string | null | undefined, key: string): boolean {
  if (!name) return false
  const k = entityKey(name)
  return Boolean(k) && keysMatch(k, key)
}

/**
 * True when a story's `name` is this firm: by its key, or because the key is
 * the name's initials AND the story's own headline uses those initials as a
 * word ("CIP closes fund" on a report about Copenhagen Infrastructure
 * Partners).
 *
 * Initials alone prove nothing — "Ares Management" and "Apollo Management"
 * are both "AM", and so is A&M Capital, whose page they must not land on — so
 * two-letter initials never count, and longer ones need the headline.
 */
export function isFirmInStory(name: string | null | undefined, key: string, headline: string | null | undefined): boolean {
  if (!name) return false
  if (isFirmName(name, key)) return true
  const initials = key.replace(/ /g, '')
  if (initials.length < 3 || acronymOf(name) !== initials) return false
  return new RegExp(`(^|[^a-z0-9])${initials}([^a-z0-9]|$)`, 'i').test(headline ?? '')
}

/**
 * Patterns for the directory's search box. Someone looking for H.I.G. types
 * "hig"; someone looking for M&G may type "mg". A short query with no spaces
 * is also tried as initials.
 */
export function searchPatterns(query: string): string[] {
  const q = query.replace(/[%_\\"]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!q) return []
  const out = new Set<string>([`%${q}%`])
  if (/^[a-z]{2,4}$/i.test(q)) for (const sep of ['.', '. ', '&', ' & ']) out.add(`%${q.split('').join(sep)}%`)
  return Array.from(out)
}

/** True when what was typed starts one of the name's words — counting welded initials as a word. */
export function startsAWord(name: string, needle: string): boolean {
  const n = needle.toLowerCase()
  const words = [...name.toLowerCase().split(/[^\p{L}\p{N}]+/u), ...entityKey(name).split(' ')]
  return words.some((w) => w.startsWith(n))
}
