/**
 * Candidate firm builder for the daily outreach pipeline.
 *
 * Takes the raw article list from today's newsletter edition and applies
 * the hard-block filters (mega-funds, public pensions, non-NA geography,
 * media outlets, fund admin service providers, bad-news events), then
 * emits a deduped list of candidate firms ready for Apollo enrichment.
 *
 * This is a direct port of the `grow-newsletter` skill's Step 3 with the
 * post-smoke-test additions Danny approved on 2026-04-14:
 *   - Hard Block B "sovereign" substring collapsed to "sovereign wealth" / "swf"
 *   - Hard Block A expanded with Thoma Bravo, Vista, Silver Lake, H&F, Adams Street
 *   - New Hard Block E for fund admin service providers
 *   - New Hard Block F for bad-news events (wind-downs, bankruptcies, regulatory actions)
 *   - "Global" geography accepted as NA-inclusive
 *
 * The same rules should eventually be synced back into the skill file. For
 * now this file is the canonical source because Path B ships first.
 */

import type { Article, Candidate } from './types'

// ─── Hard Block A — REMOVED 2026-04-15 ──────────────────────────────────────
// Previously blocked the top ~25 mega-fund GPs (Blackstone, KKR, Apollo,
// Carlyle, TPG, Bain, Advent, Warburg, CVC, EQT, Permira, Cinven,
// Brookfield, Ares, Oaktree, Goldman SAM, Thoma Bravo, Vista, Silver Lake,
// H&F, Adams Street, Blue Owl, etc.). Removed per Danny: given the 4-layer
// defense now in place on the sending side (v4 static template, Apollo
// org-name guard, email-domain guard, investment-title whitelist), the
// "weird email to a mega-fund inbox" risk is low, and the throughput cost
// of blocking them was 5 firms / ~19% of today's 26-article edition.

// ─── Hard Block B — REMOVED 2026-04-15 ──────────────────────────────────────
// Previously blocked public pensions / state LPs / sovereign wealth /
// endowments. Relaxed per Danny: LPs are in-ecosystem and valid outreach
// targets when they're in the news. Fund admins (Block E), media (Block D),
// bad-news events (Block F), and person-moves (Block G) remain blocked.

// ─── Hard Block D — Media outlets ────────────────────────────────────────────
// Note: avoid bare 2-char patterns like 'ft' — they false-positive on firm
// names like "Soft", "Draft", "Lyft Ventures". Use the full outlet name or
// skip the abbreviation.
const MEDIA_OUTLET_PATTERNS: string[] = [
  'bloomberg', 'reuters', 'wall street journal', 'wsj',
  'financial times',
  'pitchbook', 'pe hub', 'private equity international', 'buyouts',
  'private equity news', 'axios', 'business insider', 'cnbc', 'the information',
  'institutional investor', 'hedgeweek', 'alt credit',
]

// ─── Hard Block E — Fund admin service providers + actuarial consulting ─────
// Added 2026-04-14 per Danny's rule: "we don't want to reach out to other
// fund admin service providers." Apex, Mercer got dropped manually in the
// smoke test — codify here.
const FUND_ADMIN_PATTERNS: string[] = [
  'apex group', 'apex fund services',
  'alter domus',
  'citco',
  'gen ii fund services', 'gen ii',
  'ss&c', 'ss&c technologies',
  'sei investments', 'sei ',
  'mercer', // Marsh subsidiary, actuarial consulting
  'aon ',
  'intertrust',
  'vistra',
]

// ─── Hard Block C — REMOVED 2026-04-15 ──────────────────────────────────────
// Previously required article geography to include "North America" or
// "Global" to pass. Removed per Danny: audience is "GPs, LPs, and fund
// service providers" globally, not NA-focused. The geography field also
// tracks the DEAL's geography, not the FIRM's — I Squared Capital got
// tagged Europe-only because its specific deal was for a German target,
// even though the firm itself is US-headquartered. Europe/APAC/other
// regions are now all valid outreach targets.

// ─── Substring-match helper ──────────────────────────────────────────────────
function matchesAny(firmName: string, patterns: string[]): boolean {
  const lower = firmName.toLowerCase()
  return patterns.some((p) => lower.includes(p))
}

// ─── Bad-news event filter (Hard Block F) ────────────────────────────────────
// Keyword scan over title+tldr for shutdown/failure language. The classifier's
// close_type/event_type fields aren't reliable enough on their own — confirmed
// on 2026-04-14 with Alua Hedge Fund being tagged close_type='fund_close'
// despite the article title explicitly saying "Shutter $2 Billion Alua Hedge
// Fund". Sending a celebratory "Saw X closed at $Y today!" to a fund that's
// actually dying is the worst possible failure mode, so we scan text too.
const BAD_NEWS_TEXT_PATTERNS: RegExp[] = [
  /\bshutter(s|ed|ing)?\b/i,
  /\bwind(ing|ed|s)?[-\s]?down\b/i,
  /\bwound[-\s]?down\b/i,
  /\bclosing down\b/i,
  /\bliquidat(e|es|ed|ing|ion)\b/i,
  /\bdissolv(e|es|ed|ing)\b/i,
  /\bcollapse(d|s)?\b/i,
  /\bbankrupt(cy)?\b/i,
  /\binsolven(t|cy)\b/i,
  /\bfraud\b/i,
  /\bscandal\b/i,
  /\bindicted?\b/i,
  /\benforcement action\b/i,
  /\bfine(d|s)?\b(?=[^.]*regulat)/i, // "fined by regulator" but not "fine print" / "finely tuned"
]

function hasBadNewsLanguage(article: Article): boolean {
  const haystack = `${article.title} ${article.tldr ?? ''}`
  return BAD_NEWS_TEXT_PATTERNS.some((re) => re.test(haystack))
}

// ─── Hard Block G — Person-move events ──────────────────────────────────────
// Executive hires, departures, changes, and appointments are high-collision
// risk: Apollo's current-employer records can be stale when someone has
// just moved firms, and the 2026-04-15 H.I.G./Infinedi incident proved the
// failure mode out (Branch A matchPerson for "Rohan Arora at Infinedi"
// returned his prior record at H.I.G. Capital, and we sent a hook about
// Infinedi to rarora@hig.com).
//
// Even with the Apollo-side org-mismatch guard in place, person-move stories
// are awkward to hook on: the "news" is someone leaving or joining, and the
// right audience is the receiving firm's colleagues, not the person
// themselves or their old firm. Easier to drop the whole class than to
// differentiate.
const PERSON_MOVE_EVENT_TYPES = new Set([
  'executive_hire',
  'executive_change',
  'executive_departure',
  'executive_appointment',
  'hire',
  'appointment',
  'departure',
  'promotion',
])

function isPersonMoveEvent(article: Article): boolean {
  const evt = article.eventType?.toLowerCase() ?? ''
  if (PERSON_MOVE_EVENT_TYPES.has(evt)) return true
  const atype = article.articleType?.toLowerCase() ?? ''
  if (PERSON_MOVE_EVENT_TYPES.has(atype)) return true
  return false
}

function isBadNewsEvent(article: Article): boolean {
  // Wind-downs are awkward to congratulate on.
  if (article.closeType === 'wind_down') return true
  // Bankruptcies or similar failure events.
  const evt = article.eventType?.toLowerCase() ?? ''
  if (evt.includes('bankruptcy') || evt.includes('insolvency') || evt.includes('liquidation')) return true
  // Regulatory actions where the firm is the subject (not the commenter) are
  // usually enforcement news. The article_type signals this.
  if (article.articleType === 'regulatory_action') return true
  // Title/tldr keyword scan — catches Alua-style "Shutter" language that the
  // classifier's structured fields miss.
  if (hasBadNewsLanguage(article)) return true
  return false
}

/**
 * Candidate priority score — higher = better outreach target.
 *
 * Two signals combine:
 *   1. Event-type weight: fund closes and launches are the most
 *      response-worthy hooks; capital raises and deals are strong;
 *      everything else degrades. Drawn from 2026-04-15..17 reply data —
 *      both replies we got came on fund_close stories.
 *   2. Fund-size log scale: bigger funds get more attention from their
 *      IR/partner teams, so a $5B close replies at ~3x the rate of a
 *      $50M close. log10 compresses the extremes so a $20B story isn't
 *      100x a $200M one, just ~2x.
 *
 * Deliberately does NOT weight by named-person or LP-side status —
 * those carry other risks (stale contact, wrong audience) that the
 * hard blocks handle.
 */
const EVENT_TYPE_WEIGHT: Record<string, number> = {
  fund_close: 3,
  fund_launch: 2.5,
  capital_raise: 2,
  acquisition: 2,
  merger: 2,
  regulatory_action: 1,
}

export function scoreCandidate(c: Candidate): number {
  const evt = (c.article.eventType ?? c.article.articleType ?? '').toLowerCase()
  const eventWeight = EVENT_TYPE_WEIGHT[evt] ?? 0.5
  const size = c.article.fundSizeUsdMillions ?? 0
  const sizeWeight = size > 0 ? Math.log10(size + 10) : 0.5
  return eventWeight * sizeWeight
}

/**
 * Build the candidate firm list from today's articles. Applies all hard
 * blocks, drops duplicates (one candidate per firm per day), and returns
 * a list sized for downstream Apollo enrichment, sorted by scoreCandidate
 * (highest-leverage stories first) so the batch's 30-contact cap catches
 * the most-responsive targets.
 *
 * The caller is responsible for running firm-level dedup against
 * cold_outreach_sent (see `lib/outreach/dedup.ts`).
 */
export function buildCandidates(articles: Article[]): Candidate[] {
  const seenFirms = new Set<string>()
  const candidates: Candidate[] = []

  for (const article of articles) {
    const firmName = article.firmName?.trim()
    if (!firmName) continue

    // Block A, B, C removed 2026-04-15 — mega-funds, LPs/pensions, and
    // non-NA geography are all valid outreach targets. The four layers of
    // defense on the sending side (template + Apollo org guard +
    // email-domain guard + investment-title whitelist) carry the load.

    // Hard Block D — media outlets
    if (matchesAny(firmName, MEDIA_OUTLET_PATTERNS)) continue

    // Hard Block E — fund admin service providers / actuarial consulting
    if (matchesAny(firmName, FUND_ADMIN_PATTERNS)) continue

    // Hard Block F — bad-news events
    if (isBadNewsEvent(article)) continue

    // Hard Block G — person-move events (hires, departures, promotions)
    if (isPersonMoveEvent(article)) continue

    // One candidate per firm per day
    const firmKey = firmName.toLowerCase()
    if (seenFirms.has(firmKey)) continue
    seenFirms.add(firmKey)

    candidates.push({
      article,
      firmName,
      firmDomain: article.firmDomain,
      storyType: article.eventType ?? article.articleType ?? 'unknown',
      hasNamedPerson: !!article.personName,
      personName: article.personName,
      personTitle: article.personTitle,
    })
  }

  // Sort by priority score DESC — highest-leverage hooks get the top
  // slots in the Apollo enrichment loop, which matters once the 30-cap
  // starts biting.
  candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a))

  return candidates
}

/**
 * Shortened firm name for the email subject line. Drops trailing
 * corporate suffixes like "Capital", "Partners", "Management" so
 * "Court Square Capital Partners LP" becomes "Court Square".
 *
 * Rule: if the shortened form is <5 chars or generic, keep the full name.
 */
export function shortenFirmName(firmName: string): string {
  const trimmed = firmName.trim()
  const suffixesToStrip = [
    ' Capital Partners LP',
    ' Capital Partners',
    ' Capital Management',
    ' Asset Management',
    ' Investment Management',
    ' Capital',
    ' Partners',
    ' Management',
    ' Holdings',
    ' Group',
    ' LLC',
    ' LP',
    ' Inc',
  ]

  let shortened = trimmed
  for (const suffix of suffixesToStrip) {
    if (shortened.toLowerCase().endsWith(suffix.toLowerCase())) {
      shortened = shortened.slice(0, -suffix.length).trim()
      break // only strip the longest matching suffix once
    }
  }

  // Sanity check: if stripping produced something too short, or reduced
  // the firm to a bare descriptor ("Partners", "Capital") that reads
  // ambiguously in outreach copy ("Saw Partners close..."), fall back
  // to the full name. "Partners Group" → "Partners" was the 2026-04-18
  // regression that prompted this extra guard.
  if (shortened.length < 4) return trimmed
  const BARE_DESCRIPTORS = new Set([
    'partners', 'capital', 'group', 'management', 'ventures',
    'holdings', 'advisors', 'investments', 'asset', 'assets',
    'equity', 'fund', 'funds',
  ])
  if (BARE_DESCRIPTORS.has(shortened.toLowerCase())) return trimmed
  return shortened
}
