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

// ─── Hard Block A — Mega-fund GPs (case-insensitive substring match) ────────
const MEGA_FUND_PATTERNS: string[] = [
  'blackstone', 'blackstone group', 'blackstone inc',
  'kkr', 'kkr & co', 'kohlberg kravis roberts',
  'apollo global management', 'apollo management', 'apollo asset management',
  'carlyle', 'the carlyle group',
  'tpg', 'tpg capital', 'tpg inc', 'tpg angelo gordon',
  'bain capital',
  'advent international',
  'warburg pincus',
  'cvc capital partners',
  'eqt group', 'eqt ab', 'eqt partners',
  'permira',
  'cinven',
  'brookfield asset management',
  'ares management', 'ares capital',
  'oaktree capital',
  'goldman sachs asset management', 'goldman sachs merchant banking',
  'morgan stanley investment management',
  // Post-smoke-test additions (2026-04-14)
  'thoma bravo',
  'vista equity partners',
  'silver lake',
  'hellman & friedman',
  'adams street partners', // $65B AUM — Danny flagged for block list
  // First-live-run additions (2026-04-15)
  'blue owl capital', // ~$200B AUM
  'blue owl',
]

// ─── Hard Block B — Public pensions / state LPs / sovereign / endowments ────
// Rule: only use patterns that are multi-word or ≥6 characters. Short
// abbreviations like 'pers', 'sers', 'swf', 'cpp' create substring false
// positives on legitimate firm names — confirmed in production dry-run data
// on 2026-04-14 (Pershing Square → 'pers' match). Every pattern below is
// either a full phrase or a unique acronym unlikely to appear inside a firm
// name.
const PUBLIC_LP_PATTERNS: string[] = [
  'pension',
  'retirement system',
  "employees' retirement",
  'employees retirement',
  'teachers retirement',
  "teachers' retirement",
  'teachers pension',
  "teachers' pension",
  'ontario teachers',
  'state investment board',
  'state investment council',
  'sovereign wealth',
  'endowment',
  // Specific, unambiguous identifiers:
  'calpers',
  'calstrs',
  'cppib',
  'healthcare of ontario',
]

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

// ─── Geography filter helper ─────────────────────────────────────────────────
// The classifier frequently leaves geography empty on clearly-US firms — this
// was over-rotated as a "definitely non-NA, drop" signal in the original build
// and dropped ~14 of 26 legitimate NA-based candidates on 2026-04-15 (Stellex,
// Dominus, THL Partners, Newmark, Olympus, Costanoa, etc.). New rule: empty
// or null passes through, and we trust downstream Apollo + verified-email
// rules to filter bad matches. Only drop when geography is explicitly and
// exclusively non-NA / non-Global.
function hasAcceptableGeography(geography: string[] | null): boolean {
  // Empty/null → pass through.
  if (!geography || geography.length === 0) return true

  const normalized = geography.map((g) => g.toLowerCase())

  // Contains NA or Global → accept (even if mixed with other regions).
  if (
    normalized.some(
      (g) => g.includes('north america') || g === 'global' || g.includes('worldwide'),
    )
  ) {
    return true
  }

  // Explicitly non-NA (Europe-only, Asia-Pacific-only, etc.) → drop.
  return false
}

// ─── Pension text scan (supplement to Block B firm-name patterns) ────────────
// Catches public-pension LPs whose firm_name doesn't trigger the Block B
// patterns but whose article text makes the identity obvious. Added
// 2026-04-15 after "Nest" (UK pension scheme) slipped through — the firm
// name was too short to match any pattern, but the article title started
// with "UK pension scheme Nest commits..."
const PENSION_TEXT_PATTERNS: RegExp[] = [
  /\bpension scheme\b/i,
  /\bpension fund\b/i,
  /\bpension plan\b/i,
  /\bretirement fund\b/i,
  /\bsuperannuation\b/i,
  /\bworkplace pension\b/i,
  /\bstate pension\b/i,
]

function hasPensionLanguage(article: Article): boolean {
  const text = `${article.title ?? ''} ${article.tldr ?? ''}`
  return PENSION_TEXT_PATTERNS.some((re) => re.test(text))
}

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
 * Build the candidate firm list from today's articles. Applies all hard
 * blocks, drops duplicates (one candidate per firm per day), and returns
 * a list sized for downstream Apollo enrichment.
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

    // Hard Block C — geography (relaxed 2026-04-15: empty passes through)
    if (!hasAcceptableGeography(article.geography)) continue

    // Hard Block D — media outlets
    if (matchesAny(firmName, MEDIA_OUTLET_PATTERNS)) continue

    // Hard Block A — mega-fund GPs
    if (matchesAny(firmName, MEGA_FUND_PATTERNS)) continue

    // Hard Block B — public pensions / sovereign / endowments (firm-name match)
    if (matchesAny(firmName, PUBLIC_LP_PATTERNS)) continue

    // Hard Block B (text scan) — catches pensions where firm_name doesn't
    // match but article text makes it obvious ("UK pension scheme Nest ...").
    if (hasPensionLanguage(article)) continue

    // Hard Block E — fund admin service providers / actuarial consulting
    if (matchesAny(firmName, FUND_ADMIN_PATTERNS)) continue

    // Hard Block F — bad-news events
    if (isBadNewsEvent(article)) continue

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

  // Sanity check: if stripping produced something too short or generic,
  // fall back to the full name.
  if (shortened.length < 4) return trimmed
  return shortened
}
