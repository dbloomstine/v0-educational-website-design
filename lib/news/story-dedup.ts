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
 *   6. Same firm, both people moves, and one move (sameMove, at the foot of
 *      this file): the same surname, or — when one report names nobody — the
 *      same job, within a couple of days
 *
 * Headline figures are compared as money (headlinesShareFigure): "€1bn" and
 * "1 Billion Euro" are one figure, and so are "₹950 crore" and "$99.2M".
 */
import { headlineMoney, moneyMatchesUsd } from './money'

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

/**
 * "Stéphane Villemain" and "Stephane Villemain" are one person: an accent is
 * not a separator. normalizeFirmName turns "é" into a gap ("st phane"), which
 * the firm-page lookup depends on, so story identity folds accents first.
 */
export function foldAccents(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

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
  if (A.size > 0 && B.size > 0) for (const n of A) if (B.has(n)) return true
  return headlinesShareFigure(a, b)
}

/**
 * Two headlines state the same sum of money, read as money: "€1bn" and "1
 * Billion Euro" (Hg's first close, 2026-10-14, stored at $1,100M and, from
 * the target in the other report, $1,925M). The same currency, within 2%;
 * digits alone ("1" in both) are never enough. Figures in two currencies are
 * not compared here: the dollar band money.ts allows for a conversion is wide
 * enough that "$500m" and "€400m" fall inside it (CVC's Montagu deal and a
 * CVC CLO, 2026-10-09/13), so a cross-currency match is only ever a weak sign
 * (headlinesShareFigureLoose), never proof of one figure.
 */
export function headlinesShareFigure(a: string, b: string): boolean {
  return shareFigure(a, b, false)
}

/** As above, and a dollar figure that is a plausible conversion of the other headline's figure ("₹950 crore" / "$99.2M", Bajaj Alts, 2026-10-12). */
export function headlinesShareFigureLoose(a: string, b: string): boolean {
  return shareFigure(a, b, true)
}

function shareFigure(a: string, b: string, crossCurrency: boolean): boolean {
  const A = headlineMoney(a)
  const B = headlineMoney(b)
  if (A.length === 0 || B.length === 0) return false
  for (const x of A) {
    for (const y of B) {
      if (x.currency === y.currency) {
        if (fundSizesMatch(x.amountM, y.amountM, 0.02)) return true
        continue
      }
      if (!crossCurrency) continue
      if (x.currency === 'USD' && moneyMatchesUsd(y, x.amountM)) return true
      if (y.currency === 'USD' && moneyMatchesUsd(x, y.amountM)) return true
    }
  }
  return false
}

const ORDINAL_WORDS: Record<string, number> = {
  first: 1, debut: 1, maiden: 1, inaugural: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7,
  eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12,
}
const ROMAN: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15,
  xvi: 16, xvii: 17, xviii: 18, xix: 19, xx: 20,
}

/**
 * Which fund in a manager's series a report is about, when it says: "Fund VI",
 * "Fund 6", a fund_number of "VI", or "sixth flagship" / "sixth PE secondaries
 * fund" in the headline. 2026-10-13/14: "StepStone reaches over half of
 * combined target for sixth flagship and GP-led fund" (no fund named, no
 * size) and "StepStone's sixth PE secondaries fundraise passes halfway mark…"
 * (StepStone PE Secondaries Fund VI, $6bn target) ran on consecutive days.
 * An ordinal word counts only just ahead of a fund word, so "first close",
 * "first-time buyer" and "third quarter" are not read. Null when nothing says.
 */
export function fundOrdinal(x: { title: string; fundName?: string | null; fundNumber?: string | null }): number | null {
  const fromNumber = (s: string | null | undefined): number | null => {
    if (!s) return null
    const m = /^\s*(?:funds?\s+)?([ivx]+|\d{1,2})\s*$/i.exec(s)
    if (!m) return null
    const t = m[1].toLowerCase()
    return /^\d+$/.test(t) ? Number(t) : ROMAN[t] ?? null
  }
  const fromName = (s: string | null | undefined): number | null => {
    if (!s) return null
    const m = /\b(?:fund|partners|opportunities|capital|credit|secondaries|ventures?|growth|infrastructure|equity|debt|lending|solutions|program(?:me)?)\s+([IVX]{1,5}|\d{1,2})\b(?![\d.,%])/i.exec(s)
    if (!m) return null
    const t = m[1].toLowerCase()
    return /^\d+$/.test(t) ? Number(t) : ROMAN[t] ?? null
  }
  const fromWords = (s: string): number | null => {
    const m = /\b(first|debut|maiden|inaugural|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)(?![- ](?:close|closing|time|half|quarter|round|year|day|week|month)\b)(?:[- ][a-z&-]+){0,2}?[- ](?:fund|flagship|vehicle|vintage|fundraise|raise)\b/i.exec(s)
    return m ? ORDINAL_WORDS[m[1].toLowerCase()] ?? null : null
  }
  return fromNumber(x.fundNumber) ?? fromName(x.fundName) ?? fromName(x.title) ?? fromWords(x.title)
}

export interface StoryCandidate {
  title: string
  firmName: string | null
  fundName: string | null
  fundSizeUsdMillions: number | null
  personName?: string | null
  /** close_type from extraction (first_close, final_close, …) when known. */
  closeType?: string | null
  /** The four below are read only for people moves (see sameMove). */
  eventType?: string | null
  personTitle?: string | null
  personKeys?: string[]
  publishedDate?: string | null
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

/** Both sized, more than 25% apart, and no headline figure in common. */
function sizesDisagree(a: StoryCandidate, b: StoryCandidate): boolean {
  return !!a.fundSizeUsdMillions && !!b.fundSizeUsdMillions && !fundSizesMatch(a.fundSizeUsdMillions, b.fundSizeUsdMillions, 0.25) && !titlesShareSignificantNumber(a.title, b.title)
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
    if (normalizeFirmName(foldAccents(a.personName)) === normalizeFirmName(foldAccents(b.personName))) {
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

  // One hire, told by one outlet with the name and by another without it.
  if ((firmMatch || prefixFirmMatch) && isPeopleMove(a.eventType) && isPeopleMove(b.eventType) && sameMove(a, b)) {
    return true
  }

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

    // Very similar titles are one story regardless of fund-name variance —
    // unless the two report different sizes and no figure in common. Then the
    // likeness is the firm's name and the words of every fund headline:
    // "Ares raises $1.15bn for PE secondaries Fund I" (09-29) and "Ares raises
    // $4.2bn for first structured solutions secondaries fund" (10-02) are two
    // funds, and the first was filed under the second.
    if (titleJaccard(a.title, b.title) >= 0.5 && !sizesDisagree(a, b)) return true

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

// ─── People moves: one hire, told with and without the name ─────────────────

const PEOPLE_EVENTS = new Set(['executive_hire', 'executive_change', 'executive_departure'])

export function isPeopleMove(eventType: string | null | undefined): boolean {
  return PEOPLE_EVENTS.has(eventType ?? '')
}

/**
 * Short forms a headline uses for a desk, spelled out so that "global head of
 * ABF" and "global head of asset-based finance" are the same words. Only
 * forms that mean one thing in a people story: not CLO (a chief legal officer
 * or a loan vehicle) and not RE ("re-hires").
 */
const ROLE_SHORT_FORMS: Array<[RegExp, string]> = [
  [/\babf\b/g, 'asset based finance'],
  [/\babl\b/g, 'asset based lending'],
  [/\bir\b/g, 'investor relations'],
  [/\bbd\b/g, 'business development'],
  [/\bpe\b/g, 'private equity'],
  [/\bvc\b/g, 'venture capital'],
  [/\binfra\b/g, 'infrastructure'],
  [/\bm&a\b/g, 'mergers acquisitions'],
  [/\bai\b/g, 'artificial intelligence'],
  [/\bcfo\b/g, 'chief financial officer'],
  [/\bcoo\b/g, 'chief operating officer'],
  [/\bcio\b/g, 'chief investment officer'],
  [/\bcco\b/g, 'chief compliance officer'],
  [/\bcto\b/g, 'chief technology officer'],
  [/\bgc\b/g, 'general counsel'],
  // One job, three words for it: "Foley Hoag Lands Private Equity M&A Lawyer
  // Brandon Cuffy in DC" / "Foley Hoag Hires Miles & Stockbridge M&A Atty In
  // DC" (2026-10-15, two rows in one edition).
  [/\batty\b/g, 'attorney'],
  [/\battys\b/g, 'attorneys'],
  [/\blawyers?\b/g, 'attorney'],
]

/**
 * Words that say a move happened, or how senior it is, and not what the job
 * is. "Portfolio manager", "managing director" and "partner" are here on
 * purpose: a large firm hires several in a week, so sharing one says nothing
 * ("Rates trader opts for Millennium", a portfolio manager, and "Ex-Schonfeld
 * exec joins Millennium as senior PM in Hong Kong" were two people).
 */
const ROLE_GENERIC = new Set([
  // rank
  'head', 'heads', 'global', 'chief', 'chiefs', 'officer', 'senior', 'junior', 'managing', 'director',
  'directors', 'partner', 'partners', 'principal', 'associate', 'vice', 'president', 'chair', 'chairman',
  'executive', 'executives', 'exec', 'execs', 'leader', 'leaders', 'leadership', 'lead', 'leads',
  'manager', 'managers', 'portfolio', 'member', 'members', 'team', 'teams', 'bench', 'practice', 'role',
  'roles', 'boss',
  'veteran', 'former', 'new', 'top', 'key', 'star', 'first', 'next',
  // the move
  'hire', 'hires', 'hired', 'hiring', 'rehires', 'appoints', 'appointed', 'appointment', 'names', 'named',
  'naming', 'taps', 'tapped', 'adds', 'added', 'adding', 'joins', 'joined', 'join', 'promotes', 'promoted',
  'poaches', 'nabs', 'lands', 'recruits', 'brings', 'elevates', 'moves', 'move', 'departs', 'depart',
  'departure', 'leaves', 'leave', 'exit', 'exits', 'retire', 'retires', 'steps', 'makes', 'make', 'expands',
  'expand', 'builds', 'build', 'continues', 'strengthens', 'bolsters', 'boosts', 'launches', 'creates',
  // glue
  'the', 'and', 'for', 'with', 'from', 'into', 'after', 'amid', 'over', 'its', 'has', 'firm', 'business',
  'platform', 'unit', 'division', 'group', 'people', 'double', 'two', 'three', 'more', 'than',
])

/** Where the job is. Two hires share a city as easily as an employer. */
const ROLE_PLACES = new Set([
  'london', 'york', 'hong', 'kong', 'tokyo', 'singapore', 'dubai', 'paris', 'frankfurt', 'zurich',
  'geneva', 'boston', 'chicago', 'los', 'angeles', 'san', 'francisco', 'miami', 'dallas', 'houston',
  'toronto', 'sydney', 'mumbai', 'shanghai', 'beijing', 'seoul', 'milan', 'madrid', 'amsterdam',
  'luxembourg', 'dublin', 'abu', 'dhabi', 'riyadh', 'europe', 'european', 'asia', 'asian', 'pacific',
  'apac', 'emea', 'americas', 'america', 'american', 'north', 'south', 'east', 'west', 'eastern',
  'western', 'central', 'region', 'regional', 'middle', 'nordic', 'nordics', 'latin', 'africa', 'india',
  'china', 'japan', 'korea', 'australia', 'canada', 'germany', 'france', 'italy', 'spain', 'texas',
  'california', 'florida', 'usa',
])

function words(text: string | null | undefined): string[] {
  let t = ` ${(text ?? '').toLowerCase()} `
  for (const [short, long] of ROLE_SHORT_FORMS) t = t.replace(short, long)
  return t
    .replace(/[’']s\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3)
}

/** "secondaries" / "secondary", "investors" / "investor". */
const singular = (w: string) => (w.length > 4 ? w.replace(/ies$/, 'y').replace(/([^s])s$/, '$1') : w)

/** One report of a people move, as much of it as the rule below reads. */
export interface MoveLike {
  title: string
  firmName: string | null
  personName?: string | null
  /** The job, as the classifier wrote it ("Global Head of Asset-Based Finance"). */
  personTitle?: string | null
  /** Full names of every person the report names (story-links entity keys). */
  personKeys?: string[]
  publishedDate?: string | null
  eventType?: string | null
  /** Keys of every firm the report names (story-links): the prior employer is not part of the job. */
  entityKeys?: string[]
}

const personNames = (m: MoveLike): string[] => [
  ...(m.personName ?? '').split(/\s*(?:;|,| and | & )\s*/),
  ...(m.personKeys ?? []),
].map((n) => foldAccents(n).trim().toLowerCase()).filter(Boolean)

/**
 * What the job is, in words: the headline and the stated title, without the
 * firm's own name, the person's, rank, the verbs of a move, or a place.
 */
export function roleWords(m: MoveLike): Set<string> {
  const skip = new Set([...words(m.firmName), ...personNames(m).flatMap((n) => words(n)), ...(m.entityKeys ?? []).flatMap((k) => words(k))])
  return new Set(
    [...words(m.title), ...words(m.personTitle)]
      .filter((w) => !skip.has(w) && !ROLE_GENERIC.has(w) && !ROLE_PLACES.has(w) && !/^\d+$/.test(w))
      .map(singular),
  )
}

/** Days between two reports, or null when either has no date. */
function daysApart(a: MoveLike, b: MoveLike): number | null {
  const day = (m: MoveLike) => (m.publishedDate ? Date.parse(`${String(m.publishedDate).slice(0, 10)}T12:00:00Z`) : NaN)
  const gap = Math.abs(day(a) - day(b)) / 86_400_000
  return Number.isFinite(gap) ? Math.round(gap) : null
}

/** A nameless report and its named twin appear within this many days. */
const NAMELESS_MOVE_WINDOW_DAYS = 2

/** The same stated job at one firm is one move across this many days (Suntera, 10-13 and 10-20, was seven). */
const SAME_TITLE_MOVE_WINDOW_DAYS = 7

/** Both reports state the same job, word for word once folded, in three words or more. */
function sameStatedJob(a: MoveLike, b: MoveLike): boolean {
  const ta = words(a.personTitle).map(singular).join(' ')
  const tb = words(b.personTitle).map(singular).join(' ')
  return ta.split(' ').length >= 3 && ta === tb
}

/** A firm both reports name that is not the hiring firm itself. */
function shareOtherFirm(a: MoveLike, b: MoveLike): boolean {
  const own = (m: MoveLike) => words(m.firmName).join(' ')
  const others = (m: MoveLike) =>
    (m.entityKeys ?? []).map((k) => words(k).join(' ')).filter((k) => k && !k.includes(own(m)) && !own(m).includes(k))
  const ob = new Set(others(b))
  return others(a).some((k) => ob.has(k))
}

/** A firm's leadership transition is reported over a longer stretch (Hines: 10-02 to 10-05). */
const LEADERSHIP_MOVE_WINDOW_DAYS = 4
const LEADERSHIP_HEADLINE = /\b(top )?leadership (transitions?|changes?|shake-?ups?|reshuffle|succession)\b|\bsuccession plan/i
const TOP_ROLE = /\b(co-?ceo|ceo|chief executive|chair(man|woman|person)?|president)\b/i
const isLeadershipHeadline = (m: MoveLike) => personNames(m).length === 0 && LEADERSHIP_HEADLINE.test(m.title)
const namesTopRole = (m: MoveLike) => TOP_ROLE.test(`${m.title} ${m.personTitle ?? ''}`)

/**
 * Two people-move reports from ONE firm (the caller has checked the firm, and
 * that both are people moves): are they one move?
 *
 *   Both name someone → the same surname. A bare surname counts here and only
 *   here, under one employer: "Octagon Credit hires Antares exec Zilko" and
 *   "Octagon hires Antares Capital’s John Zilko".
 *
 *   One names nobody (or neither does) → there is no person to compare, so
 *   the job has to be the same job: at least two words of it in common, and
 *   three in four of the terser description's words found in the fuller one.
 *   2026-10-05: "Barings expands private credit naming global head of
 *   asset-based finance" (nobody named) and "Barings hires global head of
 *   ABF" (Sloan Sutta) ran as two stories on the site and twice in one email.
 *   Only within a couple of days of each other, and never a hire against a
 *   departure. Without dates the pair is taken to be one day's reports,
 *   unless the caller says it is comparing across editions.
 *
 * What it must not join, all real and all two moves: "Blackstone poaches
 * ex-InfraBridge co-head for London infra MD role" / "Blackstone PE chief to
 * leave firm"; "Millennium adds veteran fixed-income exec as senior adviser" /
 * "Millennium taps Jera power trader"; "Point72 offering $300k salary to lure
 * quant teacher" / "Point72 appoints former JPMorgan equities risk chief".
 *
 * Measured on the fifty days to 2026-10-08 (scripts/people-pairs-audit.ts):
 * of 69 same-firm pairs of moves the site showed as two stories it joins 14,
 * each one move when read; it leaves the vague ones apart ("Hines readies
 * top leadership transitions" beside the report naming the new co-CEO),
 * because a headline with no job in it would join any two moves at a firm.
 */
export function sameMove(a: MoveLike, b: MoveLike, opts: { crossEdition?: boolean } = {}): boolean {
  const namesA = personNames(a)
  const namesB = personNames(b)
  if (namesA.length > 0 && namesB.length > 0) {
    const surnames = (names: string[]) =>
      names.map((n) => normalizeFirmName(n).split(' ').pop() ?? '').filter((n) => n.length >= 4)
    const sb = surnames(namesB)
    return surnames(namesA).some((n) => sb.includes(n))
  }

  const types = [a.eventType, b.eventType]
  if (types.includes('executive_hire') && types.includes('executive_departure')) return false

  // A firm's own leadership changing hands, told in the abstract ("Hines readies
  // top leadership transitions", "Hines announces major leadership changes")
  // and by the report that names the new co-CEO. These headlines carry no job
  // words to compare, but a firm has one such transition at a time.
  if (isLeadershipHeadline(a) || isLeadershipHeadline(b)) {
    const apart = daysApart(a, b)
    if (apart === null ? !opts.crossEdition : apart <= LEADERSHIP_MOVE_WINDOW_DAYS) {
      if ((isLeadershipHeadline(a) || namesTopRole(a)) && (isLeadershipHeadline(b) || namesTopRole(b))) return true
    }
  }

  const gap = daysApart(a, b)

  // The very same stated job at one firm, a week apart: a trade outlet often
  // writes a hire up days after the release. 2026-10-22: "Suntera appoints Sng
  // as Head of Fund Services" (10-13) and "Suntera appoints Singapore head of
  // fund services" (10-20), both stated as "Head of Fund Services", ran as two
  // stories. Only a title of three words or more, only with dates, and a
  // week at most: past that the same job filled again is another hire.
  if (gap !== null && gap <= SAME_TITLE_MOVE_WINDOW_DAYS && sameStatedJob(a, b)) return true

  if (gap === null ? opts.crossEdition : gap > NAMELESS_MOVE_WINDOW_DAYS) return false

  // Neither report names the person, the same day, and both name the same
  // other firm (where the person came from). 2026-10-22: "LaSalle names
  // Brookfield exec to lead $10bn indirect investment platform" and "LaSalle
  // hires ex-Brookfield secondaries veteran to grow indirect business" (both
  // 10-13) share one job word, but they are one hire. A firm rarely makes two
  // nameless hires from one rival on one day.
  if (namesA.length === 0 && namesB.length === 0 && gap !== null && gap <= 1 && shareOtherFirm(a, b)) return true

  const ra = roleWords(a)
  const rb = roleWords(b)
  const [terse, full] = ra.size <= rb.size ? [ra, rb] : [rb, ra]
  let shared = 0
  terse.forEach((w) => { if (full.has(w)) shared++ })
  return shared >= 2 && shared / terse.size >= 0.75
}
