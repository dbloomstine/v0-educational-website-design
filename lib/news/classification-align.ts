/**
 * Pair a batch of classifier outputs with the articles they describe.
 *
 * The classifier is sent up to 15 articles per call and returns a JSON array.
 * Until 2026-10 the results were paired with articles purely by array
 * position. That is only correct if the model returns exactly one object per
 * article, in order — and when it skipped or reordered one, every later
 * article in the batch silently received its neighbour's classification.
 *
 * A two-week audit found the damage in sent editions: on 2026-09-30 the
 * headline "Audax Agrees to Sell GCG to Rexel for $1.4 Billion" carried
 * HighPost Capital's hire and ran under People Moves, while "HighPost Capital
 * Forms Aerospace, Defense and Cybersecurity Vertical" carried the Audax sale
 * and ran under Deals; two more pairs were swapped the same morning.
 *
 * Two defences, both required:
 *   1. Pair by the echoed `id` when the model returns one (the prompt now
 *      demands it); position is only the fallback.
 *   2. Whatever the pairing, a result must fit its article — a name it
 *      extracted has to appear in that article's text. A result that names
 *      nobody from its own article but does match another article in the
 *      batch is discarded (→ null → retried later) rather than stored
 *      against the wrong headline.
 */

export interface AlignableArticle {
  title: string
  /** The body text the classifier was shown (may be empty). */
  text: string
}

export interface AlignableResult {
  id?: unknown
  firm_name?: string | null
  fund_name?: string | null
  person_name?: string | null
  entities?: Array<{ name?: string | null }> | null
}

const GENERIC = new Set([
  'the', 'and', 'for', 'capital', 'partners', 'group', 'management', 'investment', 'investments',
  'fund', 'funds', 'asset', 'assets', 'global', 'international', 'holdings', 'advisors', 'advisers',
  'ventures', 'equity', 'private', 'credit', 'company', 'corp', 'inc', 'llc', 'llp', 'ltd',
])

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !GENERIC.has(w))
}

/** True when the result names at least one thing the article actually mentions. */
export function resultFitsArticle(article: AlignableArticle, result: AlignableResult): boolean {
  const names = [
    result.firm_name,
    result.fund_name,
    result.person_name,
    ...(result.entities ?? []).map((e) => e?.name),
  ].filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
  // Nothing extracted (commentary, "other") — nothing to contradict.
  if (names.length === 0) return true
  const hay = new Set(tokens(`${article.title} ${article.text}`))
  const squashed = `${article.title} ${article.text}`.toLowerCase().replace(/[^a-z0-9]/g, '')
  return names.some((name) => {
    const t = tokens(name)
    if (t.length > 0) return t.some((w) => hay.has(w))
    // All-generic or very short names ("Capital Group", "Hg"): match the whole string.
    const compact = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    return compact.length >= 2 && squashed.includes(compact)
  })
}

export function alignClassifications<T extends AlignableResult>(
  articles: AlignableArticle[],
  parsed: T[],
): (T | null)[] {
  const byId = new Map<number, T>()
  let idsUsable = parsed.length > 0
  for (const item of parsed) {
    const id = typeof item?.id === 'number' ? item.id : Number.NaN
    if (!Number.isInteger(id) || id < 0 || id >= articles.length || byId.has(id)) {
      idsUsable = false
      break
    }
    byId.set(id, item)
  }

  return articles.map((article, i) => {
    const candidate = idsUsable ? byId.get(i) : parsed[i]
    if (!candidate) return null
    if (resultFitsArticle(article, candidate)) return candidate
    // It names nobody from this article. Reject it only on positive evidence
    // of a mix-up — it fits a different article in the batch. A result that
    // fits none (the model expanded "KKR" to "Kohlberg Kravis Roberts") is
    // odd but not misfiled, and discarding it would cost a real article.
    const fitsAnother = articles.some((other, j) => j !== i && resultFitsArticle(other, candidate))
    return fitsAnother ? null : candidate
  })
}
