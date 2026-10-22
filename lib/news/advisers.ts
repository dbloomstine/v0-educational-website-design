/**
 * The advisers a story names: its fund counsel, placement agent, fund-finance
 * lender or financial adviser (2026-10-22, step one of the adviser league
 * study, ~/fundopshq-workspace/docs/league/2026-10-22-adviser-league-study.md).
 *
 * Pure, and free: it reads only the classifier's `entities_raw`
 * ([{name, type, role, confidence}]) that every row already carries. The roles
 * are free text written by the classifier ("legal advisor", "Legal counsel to
 * Peterson and Kelso", "placement agent", "fund_administrator, target"…), so
 * the mapping below was built from the role strings actually stored in the
 * ninety days to 2026-10-22, and each rule is a whitelist: a role it does not
 * recognise is dropped, never guessed.
 *
 * Never, under any role: fund administrators, custodians, auditors,
 * depositaries and the like. Danny's day job is a fund administrator (IQ-EQ);
 * the site does not surface or rank administrators as advisers. The role test
 * drops them first, and a short list of administrators' names backs it up.
 */
import { entityKey, keysMatch, storyFamily } from '@/lib/newsletter/story-links'

export type AdviserKind = 'legal' | 'placement' | 'lender' | 'financial'

export interface StoryAdviser {
  /** The name as shown: aliases applied, LLP / LP / Inc. dropped. */
  name: string
  kind: AdviserKind
  /** What the line says after the name: "fund counsel", "placement agent"… */
  label: string
}

export interface AdviserEntity {
  name?: string | null
  type?: string | null
  role?: string | null
  confidence?: number | string | null
}

/** Below this the classifier was guessing; the study's sample read cleanly at 0.7 and up. */
export const ADVISER_CONFIDENCE_FLOOR = 0.7

/** At most this many on one line. */
const MAX_ADVISERS = 6

// ─── What is never an adviser ───────────────────────────────────────────────

/** Any role that touches fund services. Checked before anything else, on the whole role. */
const SERVICE_ROLE = /administ|custod|audit|depositar|transfer agent|registrar|account(?:ant|ing)|trustee|fund services/i

/**
 * Fund administrators by name, in case one turns up with an adviser's role.
 * Matched on the leading words of the name (entityKey / keysMatch).
 */
const ADMINISTRATORS = [
  'IQ-EQ', 'Citco', 'SS&C', 'Apex Group', 'Alter Domus', 'JTC', 'Gen II', 'Aztec Group', 'Ocorian', 'Vistra',
  'Standish', 'Langham Hall', 'Sanne', 'Intertrust', 'CSC', 'Trident Trust', 'Ultimus', 'Formidium', 'NAV Consulting',
  'Juniper Square', 'Carta', 'Hedgeserv', 'Maples Group', 'Suntera', 'Crestbridge', 'Belasko',
].map(entityKey)

// ─── The four kinds ─────────────────────────────────────────────────────────

/**
 * Law firms. The heads seen: "legal advisor", "legal counsel", "legal_advisor",
 * "legal adviser", "counsel", "fund counsel", "law firm advisor", "law_firm",
 * "issuer counsel", "target counsel", "acquirer counsel". Not "law firm
 * target" or "portfolio company / law firm": there the firm is the news.
 */
const LEGAL = /^(?:(?:lead|sole|global|international|us|u\.s\.|uk|local)\s+)?(?:(?:fund|issuer|target|acquirer|buyer|seller|company|deal|transaction|borrower|lender|investor|sponsor)\s+)?(?:legal\s+(?:counsel|advis[eo]r)|counsel|law\s+firm(?:\s+advis[eo]r)?)$/

/** "placement agent", "global placement agent", "structuring advisor and placement agent". */
const PLACEMENT = /^(?:(?:lead|sole|exclusive|global|joint|co-?)\s+)*placement\s+agents?$/

/**
 * Fund finance only: a subscription line, a NAV or capital-call facility. A
 * plain "lender" is not one: on these rows it is the deal's own lender or the
 * story's subject ("Triple Point further backs UK bridging lender Red Kite").
 */
const LENDER = /^(?:(?:lead|sole|joint)\s+)?(?:fund[\s-]finance\s+(?:lender|provider|bank)|subscription\s+(?:line|facility|credit)\s+(?:lender|provider)|(?:nav|capital[\s-]call)\s+(?:facility\s+|loan\s+)?(?:lender|provider))$/

/** A bank on the deal. "advisor" with no qualifier counts only on a deal: on a fund it may mean the fund's investment adviser. */
const FINANCIAL = /^(?:(?:lead|sole|exclusive|joint|co-?|independent)\s+)?(?:financial|m&a|ipo|buy-side|sell-side|structuring|strategic)\s+advis[eo]r$/
const BARE_ADVISER = /^advis[eo]r$/

/** Parts a combined role may carry that neither add a kind nor disqualify it ("advisor/banker"). */
const NEUTRAL_PART = /^(?:banker|investment bank|(?:debt |financing |lead |joint )?arranger)$/

const LABEL: Record<AdviserKind, string> = {
  legal: 'legal counsel',
  placement: 'placement agent',
  lender: 'fund finance',
  financial: 'financial adviser',
}

/** Which order the line reads in: counsel first, as release boilerplate does. */
const ORDER: AdviserKind[] = ['legal', 'placement', 'lender', 'financial']

/**
 * One role, mapped to a kind, or null. `family` is the story's: 'fund' or
 * 'deal' (lib/newsletter/story-links.ts storyFamily).
 */
export function adviserKind(role: string | null | undefined, family: 'fund' | 'deal'): AdviserKind | null {
  if (!role) return null
  if (SERVICE_ROLE.test(role)) return null
  const parts = role
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    // "legal counsel to Peterson and Kelso", "adviser to Proofpoint": whose adviser does not change the kind.
    .replace(/\s+(?:to|for|on)\s+.*$/, '')
    .split(/\s*(?:[/,;]|\band\b)\s*/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  if (!parts.length) return null
  let best: AdviserKind | null = null
  for (const part of parts) {
    const kind = partKind(part, family)
    if (kind) {
      if (!best || ORDER.indexOf(kind) < ORDER.indexOf(best)) best = kind
      continue
    }
    // Every part must be an adviser's: "co-sponsor, originator, advisor" or
    // "lender/investor" is a party to the deal, not its adviser.
    if (!NEUTRAL_PART.test(part)) return null
  }
  return best
}

function partKind(part: string, family: 'fund' | 'deal'): AdviserKind | null {
  if (LEGAL.test(part)) return 'legal'
  if (PLACEMENT.test(part)) return 'placement'
  if (LENDER.test(part)) return 'lender'
  if (FINANCIAL.test(part)) return 'financial'
  if (BARE_ADVISER.test(part) && family === 'deal') return 'financial'
  return null
}

/** How the kind reads on this story: a law firm on a fund is its fund counsel. */
function labelFor(kind: AdviserKind, role: string, family: 'fund' | 'deal'): string {
  if (kind !== 'legal') return LABEL[kind]
  const r = role.toLowerCase()
  if (/\bfund counsel\b/.test(r)) return 'fund counsel'
  // "Legal counsel to Stepstone" on a fund may be an investor's counsel: say only "legal counsel".
  if (family === 'fund' && !/\s(?:to|for)\s/.test(r) && !/\b(?:target|acquirer|buyer|seller|investor|borrower|lender)\b/.test(r)) return 'fund counsel'
  return LABEL.legal
}

// ─── Names ──────────────────────────────────────────────────────────────────

/** Obvious variants, keyed by entityKey of the variant (after suffixes are dropped). */
const ALIASES: Record<string, string> = Object.fromEntries(
  (
    [
      ['Kirkland', 'Kirkland & Ellis'],
      ['Latham', 'Latham & Watkins'],
      ['Proskauer Rose', 'Proskauer'],
      ['Debevoise', 'Debevoise & Plimpton'],
      ['Simpson Thacher', 'Simpson Thacher & Bartlett'],
      ['Morgan Lewis & Bockius', 'Morgan Lewis'],
      ['Davis Polk', 'Davis Polk & Wardwell'],
      ['Paul Weiss Rifkind Wharton & Garrison', 'Paul Weiss'],
      ['Weil Gotshal & Manges', 'Weil'],
      ['Willkie', 'Willkie Farr & Gallagher'],
      ['Willkie Corporate', 'Willkie Farr & Gallagher'],
      ['Skadden Arps Slate Meagher & Flom', 'Skadden'],
      ['SAM', 'Shardul Amarchand Mangaldas'],
      ['McDermott Will & Emery', 'McDermott Will & Schulte'],
      ['Allen & Overy', 'A&O Shearman'],
      ['Allen Overy Shearman Sterling', 'A&O Shearman'],
      ['Evercore Private Funds Group', 'Evercore'],
      ['Evercore Private Capital Advisory', 'Evercore'],
      ['JPMorgan', 'J.P. Morgan'],
      ['JP Morgan', 'J.P. Morgan'],
      ['JPMorgan Chase', 'J.P. Morgan'],
      ['Citigroup', 'Citi'],
      ['Citigroup Global Markets', 'Citi'],
      ['Bank of America', 'BofA Securities'],
      ['Bank of America Securities', 'BofA Securities'],
      ['Wells Fargo Securities', 'Wells Fargo'],
      ['Goldman Sachs & Co', 'Goldman Sachs'],
      ['Robert W Baird', 'Baird'],
      ['RBC', 'RBC Capital Markets'],
    ] as const
  ).map(([from, to]) => [entityKey(from), to]),
)

const SUFFIX = /(?:,?\s+(?:LLP|L\.L\.P\.|LLC|L\.L\.C\.|LP|L\.P\.|Inc\.?|Ltd\.?|Limited|plc|PLC|&\s*Co\.?|and Company|Co\.))+\s*$/

/** The name as the line shows it: "Kirkland & Ellis LLP" → "Kirkland & Ellis". */
export function adviserDisplayName(raw: string): string {
  const stripped = raw.replace(/\s+/g, ' ').trim().replace(SUFFIX, '').trim()
  return ALIASES[entityKey(stripped)] ?? stripped
}

// ─── A story's advisers ─────────────────────────────────────────────────────

export interface AdviserRow {
  entities_raw?: unknown
  event_type?: string | null
}

/**
 * The advisers named across a story's rows, merged: one entry per firm, in
 * the order counsel, placement agent, fund finance, financial adviser.
 *
 * `eventType` is the story's own; only fund events (closes, launches, raises)
 * and deals get advisers. `parties` are the story's own firms (its subject
 * and those its headline names): a firm that is the news is never also shown
 * as its adviser ("Apollo weighs expanding SoftBank's Vision Fund loan").
 */
export function storyAdvisers(rows: AdviserRow[], eventType: string | null | undefined, parties: (string | null | undefined)[] = []): StoryAdviser[] {
  const family = storyFamily(eventType)
  if (family !== 'fund' && family !== 'deal') return []
  const partyKeys = parties.map(entityKey).filter(Boolean)
  const found: (StoryAdviser & { key: string })[] = []
  for (const row of rows) {
    const raw = Array.isArray(row.entities_raw) ? (row.entities_raw as AdviserEntity[]) : []
    for (const e of raw) {
      const name = typeof e?.name === 'string' ? e.name.trim() : ''
      if (!name || !e.role) continue
      if (e.type && e.type !== 'firm') continue // people and funds are not advisers here
      if (Number(e.confidence ?? 0) < ADVISER_CONFIDENCE_FLOOR) continue
      const kind = adviserKind(e.role, family)
      if (!kind) continue
      const display = adviserDisplayName(name)
      const key = entityKey(display)
      if (!key) continue
      if (ADMINISTRATORS.some((k) => keysMatch(k, key))) continue
      if (partyKeys.some((k) => keysMatch(k, key))) continue
      const label = labelFor(kind, e.role, family)
      const seen = found.find((f) => keysMatch(f.key, key))
      if (seen) {
        // The same firm twice: keep the earlier kind in ORDER, and the more specific label.
        if (ORDER.indexOf(kind) < ORDER.indexOf(seen.kind)) Object.assign(seen, { kind, label })
        else if (kind === seen.kind && label === 'fund counsel') seen.label = label
        if (display.length > seen.name.length && keysMatch(entityKey(seen.name), key)) seen.name = display
        continue
      }
      found.push({ name: display, kind, label, key })
    }
  }
  return found
    .map((f, i) => ({ f, i }))
    .sort((a, b) => ORDER.indexOf(a.f.kind) - ORDER.indexOf(b.f.kind) || a.i - b.i)
    .slice(0, MAX_ADVISERS)
    .map(({ f }) => ({ name: f.name, kind: f.kind, label: f.label }))
}
