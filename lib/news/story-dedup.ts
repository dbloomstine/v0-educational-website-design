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

/**
 * True when two titles cite a common significant figure ("₹1,125 Cr" /
 * "Rs 1,125 crore", "$4.75 billion" / "$4.75bn"). Numbers are compared with
 * separators stripped; 3+ digits required; four-digit year-like tokens
 * excluded. Two same-day stories about prefix-related firms at the same
 * close stage that also share a headline figure are one story — the shared
 * number survives even when independent currency conversion has pushed the
 * extracted sizes far apart (target vs close amount, spot FX vs rounded).
 */
export function titlesShareSignificantNumber(a: string, b: string): boolean {
  const nums = (s: string) =>
    new Set(
      (s.match(/\d[\d,.]*/g) ?? [])
        .map((n) => n.replace(/[,.]/g, ''))
        .filter((n) => n.length >= 3 && !/^(19|20)\d{2}$/.test(n))
    )
  const A = nums(a)
  const B = nums(b)
  if (A.size === 0 || B.size === 0) return false
  for (const n of A) if (B.has(n)) return true
  return false
}

export interface StoryCandidate {
  title: string
  firmName: string | null
  fundName: string | null
  fundSizeUsdMillions: number | null
  personName?: string | null
  /** close_type from extraction (first_close, final_close, …) when known. */
  closeType?: string | null
}

/**
 * Token-prefix relationship between two normalized firm names.
 * True when the shorter name's tokens are the leading tokens of the
 * longer name (e.g. "btg pactual" ⊂ "btg pactual tig", "vesper" ⊂
 * "vesper infrastructure"). Used in isSameStory as a softer firm-match
 * signal to survive classifier variance ("BTG Pactual" vs "BTG Pactual
 * TIG", "Vesper" vs "Vesper Infrastructure Partners"). Always paired
 * with another corroborating signal (exact fund name or tight size
 * match) to avoid collapsing distinct parent/subsidiary arms like KKR
 * and KKR Credit Advisors.
 */
function firmsSharePrefix(firmA: string, firmB: string): boolean {
  if (!firmA || !firmB || firmA === firmB) return false
  const tokensA = firmA.split(' ').filter((t) => t.length > 0)
  const tokensB = firmB.split(' ').filter((t) => t.length > 0)
  if (tokensA.length === tokensB.length) return false
  const [shorter, longer] =
    tokensA.length < tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA]
  if (shorter.length === 0) return false
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) return false
  }
  return true
}

export function isSameStory(a: StoryCandidate, b: StoryCandidate): boolean {
  // Near-identical titles are one story no matter what the classifier
  // extracted. Real case, 2026-08-16: the same Hedgeweek article arrived
  // via the direct feed and the Google News mirror, and the two copies
  // extracted different firms ("L1 Group" vs "PXC Advisors") — every
  // firm-keyed rule below therefore missed a verbatim duplicate.
  if (titleJaccard(a.title, b.title) >= 0.85) return true

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

  // Prefix-firm match: classifier variance on parent/subsidiary naming.
  // 2026-04-18 incidents: "BTG Pactual" vs "BTG Pactual TIG" on the
  // $370M LatAm timber fund; "Vesper" vs "Vesper Infrastructure
  // Partners" on the €1bn Next Gen Infrastructure Fund. Both ran
  // twice in the same edition because firmA !== firmB. We accept
  // prefix match only when paired with a strong independent signal
  // (exact fund name match OR tight ≤5% size match) to keep KKR vs
  // KKR Credit Advisors distinct when their deals happen to align.
  const prefixFirmMatch = !firmMatch && firmsSharePrefix(firmA, firmB)
  if (prefixFirmMatch) {
    if (fundA.length > 0 && fundA === fundB) return true
    if (fundSizesMatch(a.fundSizeUsdMillions, b.fundSizeUsdMillions, 0.05)) return true
    // Same close stage + strongly similar titles: parent/arm naming variance
    // ("Mirae Asset" vs "Mirae Asset Venture Investments India") combined
    // with independent currency conversion puts the same first close outside
    // the 5% size band. The title similarity is the corroborating signal.
    if (
      a.closeType &&
      a.closeType === b.closeType &&
      titleJaccard(a.title, b.title) >= 0.45
    ) {
      return true
    }
    // Same close stage + a shared headline figure ("Rs 1,800 crore" cited by
    // both) — catches the target-vs-close-amount extraction split, where one
    // outlet's headline led with the ₹1,800cr corpus and another's with the
    // ₹1,125cr first close, and the extracted sizes disagreed by 60%.
    if (
      a.closeType &&
      a.closeType === b.closeType &&
      titlesShareSignificantNumber(a.title, b.title)
    ) {
      return true
    }
    return false
  }

  if (!firmMatch) {
    // Both missing firm but share a fund name — already handled above.
    return false
  }

  // Same firm, both have fund names: they must match. Different fund names
  // at the same firm are different stories (e.g. Apollo Infrastructure vs
  // Apollo Credit closing on the same day) and must never dedup together.
  if (fundA.length > 0 && fundB.length > 0) {
    if (fundA === fundB) return true

    // ...unless the sizes are all but identical. This branch used to return
    // false unconditionally, which let the same story run twice in one
    // edition whenever two outlets named the vehicle differently. Real case,
    // 2026-07-11: "HarbourVest Closes $4.75 Billion Co-Investment Fund" and
    // "HarbourVest Partners Raises $4.75 Billion for Seventh Direct
    // Co-Investment Program" both shipped — same firm, same $4,750M, but the
    // extracted fund names differed so the hard return fired.
    //
    // The tolerance is deliberately tighter (2%) than the general size match
    // (10%): two genuinely distinct funds from one firm landing within 2% of
    // each other on the same day is essentially unheard of, while classifier
    // naming variance on one story is routine.
    if (fundSizesMatch(a.fundSizeUsdMillions, b.fundSizeUsdMillions, 0.02)) return true

    // Same close stage + sizes within 20%: currency drift defeats the 2%
    // band when outlets convert independently. Real case, 2026-08-14: Mirae
    // Asset's first close ran twice in one edition — DealStreetAsia used
    // spot FX ("$118m") while the classifier converted ₹1,125 crore to
    // $135M (12.6% apart), and every outlet invented a different fund name
    // (India Fund III / Venture Opportunity Fund II / Fund II). Two
    // genuinely distinct funds from one firm at the same close stage within
    // 20% on the same day is rare enough to accept the merge.
    if (
      a.closeType &&
      a.closeType === b.closeType &&
      fundSizesMatch(a.fundSizeUsdMillions, b.fundSizeUsdMillions, 0.2)
    ) {
      return true
    }

    // Very similar titles are one story regardless of fund-name variance.
    if (titleJaccard(a.title, b.title) >= 0.5) return true

    // Same close stage + shared headline figure — the target-vs-close-amount
    // split (one outlet leads with the ₹1,800cr corpus, another with the
    // ₹1,125cr first close; extracted sizes disagree by 60% but both titles
    // cite the same number).
    if (
      a.closeType &&
      a.closeType === b.closeType &&
      titlesShareSignificantNumber(a.title, b.title)
    ) {
      return true
    }

    return false
  }

  // Same firm, at most one has a fund name. Fall back to size tolerance
  // then title similarity.
  if (fundSizesMatch(a.fundSizeUsdMillions, b.fundSizeUsdMillions)) return true
  if (titleJaccard(a.title, b.title) >= 0.3) return true

  return false
}
