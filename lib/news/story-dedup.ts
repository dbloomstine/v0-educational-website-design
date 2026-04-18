/**
 * Shared story-level dedup helpers for both the newsletter assembly
 * (lib/newsletter/query-articles.ts) and the web feed UI grouping
 * (lib/news/api.ts).
 *
 * Two articles are considered the same story if any of these hold:
 *   1. Same extracted person name (exec moves)
 *   2. Same normalized firm name AND same normalized fund name
 *   3. Same normalized firm name AND fund sizes within ±10%
 *   4. Same normalized firm name AND title Jaccard ≥ 0.3
 *   5. Both missing firm, but same normalized fund name
 */

/**
 * Legal-form / stop-word tokens — always safe to strip. An all-caps firm
 * name like "BLACKSTONE INC" and the plain "Blackstone" should collapse.
 * These never carry descriptive meaning about the firm.
 */
const LEGAL_FORM_NOISE = new Set([
  'llc', 'inc', 'corp', 'corporation', 'ltd', 'limited',
  'lp', 'llp', 'plc', 'ag', 'sa', 'nv', 'bv',
  'co', 'company',
  'and', 'the',
])

/**
 * Descriptive / generic firm-industry tokens. Stripped AFTER legal-form
 * tokens, but only when removing them leaves at least one distinctive
 * token standing. "Apollo Global Management" → "apollo"; but "Partners
 * Group" would otherwise collapse to "", so we keep the descriptive
 * tokens in that case. See normalizeFirmName for the two-pass logic.
 */
const DESCRIPTIVE_NOISE = new Set([
  'group', 'partners', 'capital', 'management', 'mgmt',
  'investment', 'investments', 'advisors', 'advisory',
  'ventures', 'venture', 'holdings', 'holding',
  'enterprises', 'industries', 'asset', 'assets',
  'fund', 'funds', 'finance', 'financial', 'equity',
  'international', 'global', 'worldwide',
])

export function normalizeFirmName(name: string | null | undefined): string {
  if (!name) return ''
  const tokens = name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0)

  // Pass 1: always strip legal-form tokens.
  const afterLegal = tokens.filter((w) => !LEGAL_FORM_NOISE.has(w))

  // Pass 2: also strip descriptive tokens — but only if some distinctive
  // token remains. Without the conditional, "Partners Group" and
  // "International Finance Corporation" would collapse to "" and every
  // story about them would evade same-day and cross-edition dedup.
  const afterDescriptive = afterLegal.filter((w) => !DESCRIPTIVE_NOISE.has(w))
  const result = afterDescriptive.length > 0 ? afterDescriptive : afterLegal
  return result.join(' ').trim()
}

/**
 * Fund sizes match if both are set and within the tolerance band (default ±10%).
 * Used to collapse articles where currency conversion or rounding produced
 * slightly different USD figures (e.g. €1bn → $1.1B vs $1.2B).
 */
export function fundSizesMatch(
  a: number | null | undefined,
  b: number | null | undefined,
  tolerance = 0.1
): boolean {
  if (!a || !b) return false
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return (hi - lo) / hi <= tolerance
}

/**
 * Jaccard similarity of word sets from two titles, ignoring words ≤ 2 chars.
 */
export function titleJaccard(a: string, b: string): number {
  const toks = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    )
  const A = toks(a)
  const B = toks(b)
  if (A.size === 0 || B.size === 0) return 0
  let intersection = 0
  A.forEach((w) => {
    if (B.has(w)) intersection++
  })
  return intersection / (A.size + B.size - intersection)
}

export interface StoryCandidate {
  title: string
  firmName: string | null
  fundName: string | null
  fundSizeUsdMillions: number | null
  personName?: string | null
}

export function isSameStory(a: StoryCandidate, b: StoryCandidate): boolean {
  // Exec-move fallback: same person = same story regardless of firm extraction.
  if (a.personName && b.personName) {
    if (normalizeFirmName(a.personName) === normalizeFirmName(b.personName)) {
      return true
    }
  }

  const firmA = normalizeFirmName(a.firmName)
  const firmB = normalizeFirmName(b.firmName)
  const fundA = normalizeFirmName(a.fundName)
  const fundB = normalizeFirmName(b.fundName)

  // Asymmetric firm extraction: one side has firm, other doesn't, but both
  // reference the same fund name. Claude's firm extraction is occasionally
  // null on stories where the fund name is the primary handle (e.g. "Zero
  // Shot Fund"). Matching fund names is strong enough to cluster these.
  if (fundA.length > 0 && fundA === fundB) {
    if (!firmA || !firmB) return true
  }

  const firmMatch = firmA.length > 0 && firmA === firmB

  if (!firmMatch) {
    // Both missing firm but share a fund name — already handled above.
    return false
  }

  // Same firm, both have fund names: they must match. Different fund names
  // at the same firm are different stories (e.g. Apollo Infrastructure vs
  // Apollo Credit closing on the same day) and must never dedup together.
  if (fundA.length > 0 && fundB.length > 0) {
    return fundA === fundB
  }

  // Same firm, at most one has a fund name. Fall back to size tolerance
  // then title similarity.
  if (fundSizesMatch(a.fundSizeUsdMillions, b.fundSizeUsdMillions)) return true
  if (titleJaccard(a.title, b.title) >= 0.3) return true

  return false
}
