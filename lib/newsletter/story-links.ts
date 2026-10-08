/**
 * Newsletter-only story linking: the looser "is this the same story?" rules
 * layered on top of lib/news/story-dedup's isSameStory, plus the cross-edition
 * memory that stops a story re-running later in the week.
 *
 * Why this exists (two-week audit, 2026-09-17 → 10-01): isSameStory keys
 * almost everything on an exact firm-name match, and the classifier does not
 * extract firms consistently. One first close ran FOUR times in a single
 * edition ("IIT Madras" / "Indian Institute of Technology Madras" / a null
 * firm), one regulator action ran three times ("Remara" / "Melbourne
 * Securities Corporation"), and deals re-ran days later under the other
 * party's name ("HIG Capital sells GDT to Softcat" → "Softcat Crosses the
 * Atlantic with H.I.G.'s GDT"). Roughly one row in eight over the fortnight
 * was a repeat a reader had already seen.
 *
 * The fix is to compare the *set of names in the story* rather than one
 * extracted firm: two deals naming the same two companies are one deal; two
 * people stories naming the same person are one move; two fund events with
 * the same size and a shared party are one raise.
 *
 * Kept out of lib/news/story-dedup on purpose — the site feed groups across a
 * much longer window than one edition, where rules this loose would over-merge.
 */
import {
  normalizeFirmName,
  titleJaccard,
  fundSizesMatch,
  titlesShareSignificantNumber,
  sameMove,
} from '@/lib/news/story-dedup'

export type StoryFamily = 'fund' | 'deal' | 'people' | 'regulatory' | 'other'

const FAMILY: Record<string, StoryFamily> = {
  fund_launch: 'fund', fund_close: 'fund', capital_raise: 'fund',
  acquisition: 'deal', merger: 'deal',
  executive_hire: 'people', executive_change: 'people', executive_departure: 'people',
  regulatory_action: 'regulatory',
}

export function storyFamily(eventType: string | null | undefined): StoryFamily {
  return FAMILY[eventType ?? ''] ?? 'other'
}

/**
 * Comparison key for an entity name. normalizeFirmName, then runs of
 * single-letter tokens are welded together so "H.I.G. Capital" ("h i g") and
 * "HIG Capital" ("hig") meet.
 */
export function entityKey(name: string | null | undefined): string {
  const tokens = normalizeFirmName(name).split(' ').filter(Boolean)
  const out: string[] = []
  let run = ''
  for (const t of tokens) {
    if (t.length === 1) { run += t; continue }
    if (run) { out.push(run); run = '' }
    out.push(t)
  }
  if (run) out.push(run)
  return out.join(' ')
}

/** Equal, or one is the leading tokens of the other ("metrics" ⊂ "metrics credit"). */
/**
 * Single words that open many unrelated names. "Korea Exchange" and "Korea
 * Venture Investment" (which normalises to just "korea") are not the same
 * organisation; neither are two "First …" or "National …" firms.
 */
const WEAK_PREFIX = new Set([
  'korea', 'china', 'india', 'japan', 'saudi', 'dubai', 'singapore', 'australia', 'canada',
  'america', 'american', 'british', 'europe', 'european', 'asia', 'asian', 'africa', 'african',
  'nordic', 'national', 'first', 'new', 'united', 'pacific', 'atlantic', 'northern', 'southern',
  'general', 'royal', 'state', 'city', 'bank', 'the',
])

/**
 * "hp helicopters" is "high performance helicopters": every token of the
 * shorter key is a token of the longer one, or the initials of the next
 * run of its tokens. Only an acronym of two to four letters counts.
 */
function acronymMatches(short: string[], long: string[]): boolean {
  let j = 0
  for (const t of short) {
    if (long[j] === t) { j++; continue }
    if (t.length >= 2 && t.length <= 4 && j + t.length < long.length && long.slice(j, j + t.length).map((w) => w[0]).join('') === t) { j += t.length; continue }
    return false
  }
  return j === long.length
}

/** Equal, or one is the leading tokens of the other ("metrics" ⊂ "metrics credit"). */
export function keysMatch(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const [s, l] = a.length < b.length ? [a, b] : [b, a]
  if (s.length < 3 || !l.startsWith(s + ' ')) return false
  return !WEAK_PREFIX.has(s)
}

/**
 * The same party in two stories: keysMatch, or one spelled as an acronym.
 * (Kept apart from keysMatch, which also addresses the firm pages.)
 */
function sameParty(a: string, b: string): boolean {
  if (keysMatch(a, b)) return true
  const [s, l] = a.length < b.length ? [a, b] : [b, a]
  const st = s.split(' ')
  const lt = l.split(' ')
  return st.length >= 2 && st.length < lt.length && acronymMatches(st, lt)
}

/**
 * Collapse a key set to its roots, so a firm and its own fund ("kkr", "kkr
 * asia pacific infrastructure") count as one party, not two.
 */
function roots(keys: string[]): string[] {
  return keys.filter((k) => !keys.some((o) => o !== k && o.length < k.length && keysMatch(o, k)))
}

/**
 * Distinct parties two stories have in common. Counted from both sides and the
 * smaller taken: a firm and its own fund that do not prefix each other
 * ("antin infrastructure", "antin nextgen infrastructure i") are two roots on
 * one side and one party on the other, and counting from one side alone made
 * the answer depend on which story was asked about.
 */
function sharedKeys(a: string[], b: string[]): number {
  const ra = roots(a)
  const rb = roots(b)
  const from = (x: string[], y: string[]) => x.filter((k) => y.some((o) => sameParty(k, o))).length
  return Math.min(from(ra, rb), from(rb, ra))
}

/**
 * Regulators and governments are named in every story about them, so sharing
 * one says nothing about whether two stories are the same story.
 */
const REGULATOR_RE = /\b(sec|asic|fca|esma|cftc|finra|irs|doj|ftc|fincen|occ|fdic|treasury|congress|parliament|senate|commission|regulators?|authority|ministry|department|central bank|bank of england|federal reserve|fed|ecb|mas|sfc|bafin|cssf|amf|sebi|apra|prudential)\b/i
export function isRegulatorName(name: string | null | undefined): boolean {
  return !!name && REGULATOR_RE.test(name)
}

/**
 * True when the story's own text mentions the entity. The classifier
 * occasionally attaches another article's entities (2026-09-27: an IIT Madras
 * fund story carried "Morgan Stanley" and "Schroders"); an entity the headline
 * and summary never name must not be used to identify or link the story.
 */
export function entityMentioned(name: string, title: string, tldr: string | null | undefined): boolean {
  const hay = ` ${entityKey(`${title} ${tldr ?? ''}`)} `
  const tokens = entityKey(name).split(' ').filter((t) => t.length >= 3)
  if (tokens.length === 0) {
    const compact = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    return compact.length >= 2 && hay.replace(/ /g, '').includes(compact)
  }
  return tokens.some((t) => hay.includes(` ${t} `) || hay.includes(` ${t}s `))
}

/** How far along a deal headline says the deal is. Higher = more final. */
export function dealStage(title: string): 0 | 1 | 2 {
  const t = title.toLowerCase()
  if (/\b(complet(es|ed|ion)|finalis|finaliz|seals?|wraps? up|closes (on|its|the)? ?(acquisition|purchase|sale|deal|takeover|buyout))/.test(t)) return 2
  if (/\b(in talks|talks to|nears?|nearing|weighs?|explor(es|ing)|mulls?|consider(s|ing)|eyes|bidders?|bids?|in the running|approach(es)?|proposal|offer|interest|shortlist|preferred|frontrunner|could|may|said to|set to|poised|plans? to|seeks?|revisit)\b/.test(t)) return 0
  return 1
}

/**
 * Columns that run several items under their own name, whatever joins the
 * items: "Field Notes: A; B" (Agri Investor), "Loan Note: A; b" (Private Debt
 * Investor), "Term Sheet: A; B; C" and "Blueprint: A, B and more" (PERE).
 *
 * The classifier reads such a column as one article and writes one record
 * for it, and the record can pair one item's firm and size with another
 * item's fund. 2026-10-05: "Field Notes: Farm Credit Canada eyes private
 * capital partnerships for C$1bn fund; Permanent crops ‘abyss has a floor,’
 * says AgIS Capital" was stored as Farm Credit Canada launching the $707M
 * "Area One Farms Fund V" (a fund from an item the headline does not even
 * name), and led the front page as "$707M · Launch". The test on names
 * below let it through: "Permanent crops" is not a party.
 *
 * A list of labels, because a label cannot be told from the lead-in to one
 * story ("United States: SEC Proposes…; Comments Due October 5"), and neither
 * can a closing "and more" ("…closes on $1.6bn for Fund XI, targeting AI
 * infrastructure and more"). `scripts/roundup-audit.ts` shows a new column.
 */
const COLUMN_LABEL = /^\s*(field notes|loan note|term sheet|blueprint|abf deal digest|investment roundup|deals in brief)\s*:/i

/**
 * Outlets whose headline with a semicolon is their daily wire and never one
 * story. All 138 such PE Hub headlines in the hundred days to 2026-10-05
 * were; the test on names below caught 99. It misses a wire whose later item
 * opens with a firm the classifier did not list ("…; Elvaston makes first
 * deal in Poland…", stored with a third firm's acquisition as its summary) or
 * with no firm at all ("…; Take-private deals in focus").
 */
const WIRE_OUTLETS = new Set(['pe hub', 'pehub.com'])

/**
 * A digest of several unrelated stories under one headline — PE Hub's daily
 * wire ("A backs X; B to acquire Y; C hires Z"), "Deal Roundup:" and the
 * columns above.
 *
 * A semicolon alone is not enough: "TPG Gets $10 Billion for Climate PE Fund;
 * to Close for New Cash" is one story. Away from the outlets and columns that
 * are known, a wire is recognised by a later clause that opens with a
 * different named party.
 */
export function isRoundup(title: string, entityNames: string[] = [], sourceName: string | null = null): boolean {
  if (/^\s*deal roundup\b/i.test(title) || COLUMN_LABEL.test(title)) return true
  const clauses = title.split(';').map((c) => c.trim()).filter((c) => c.split(/\s+/).length >= 3)
  if (clauses.length < 2) return false
  if (WIRE_OUTLETS.has((sourceName ?? '').trim().toLowerCase())) return true
  const first = ` ${entityKey(clauses[0])} `
  const firstTokens = entityNames
    .map((n) => entityKey(n).split(' ')[0])
    .filter((t) => t && t.length >= 3)
  return clauses.slice(1).some((clause) => {
    const lead = entityKey(clause.split(/\s+/).slice(0, 2).join(' ')).split(' ')[0]
    if (!lead || !/^[A-Z0-9]/.test(clause)) return false
    // Opens with a party the first clause never mentions.
    if (firstTokens.includes(lead) && !first.includes(` ${lead} `)) return true
    // No entity data: fall back to "capitalised and not an obvious verb".
    return entityNames.length === 0 && !/^(to|backs|closes|targets|raises|launches|plans|eyes|seeks|adds|hires|names|buys|sells|acquires|will|set)$/i.test(clause.split(/\s+/)[0])
  })
}

/** Recurring columns whose headline is the column, not a story. Dropped. */
const DIGEST_PATTERNS = [
  /^\s*the secondary brief\b/i,
  /^\s*on the move\s*:/i,
  /^\s*the pipeline\s*:/i,
  /^\s*side letter\s*:/i,
  /^\s*pe weekly\s*:/i,
  /\bdeal tracker\b/i,
  /^\s*(weekly|daily|monthly) (wrap|round-?up|digest|briefing)\b/i,
  /\bhires, promotions\b/i,
]
export function isDigest(title: string): boolean {
  return DIGEST_PATTERNS.some((p) => p.test(title))
}

export interface StoryLike {
  title: string
  eventType: string | null
  firmName: string | null
  fundName: string | null
  fundSizeUsdMillions: number | null
  closeType: string | null
  /** entityKey() of every firm/fund the story names (primary firm included). */
  entityKeys: string[]
  /** entityKey() of every person the story names. */
  personKeys: string[]
  /** Read for people moves only (story-dedup sameMove): the name as extracted, the job, the day. */
  personName?: string | null
  personTitle?: string | null
  publishedDate?: string | null
}

const stem = (s: string) => s.replace(/\b(\w{4,})s\b/g, '$1')

/** titleJaccard without the glue words that make unrelated headlines look alike. */
const GLUE = /\b(and|the|for|with|from|into|over|after|its|amid)\b/gi
const contentJaccard = (a: string, b: string) => titleJaccard(a.replace(GLUE, ' '), b.replace(GLUE, ' '))

/**
 * Words every fundraising headline uses. Two headlines that share only these
 * share nothing: "Connect Ventures raises $55 mn first close for $80 mn Fund V"
 * and "IITM-backed deeptech fund raises Rs 453 cr in first close" overlap on
 * "raises / first / close / fund" and are two different funds (2026-10-01:
 * that overlap, plus two sizes that both convert to about $55M, filed 31 IIT
 * Madras reports under Connect Ventures on the site).
 */
const FUND_VOCAB = /\b(funds?|raises?|raised|raising|closes?|closed|closing|first|final|second|third|debut|maiden|new|launch(es|ed)?|targets?|targeting|secures?|secured|hits?|holds?|announces?|announced|million|billion|capital|ventures?|partners|investments?)\b/gi
const distinctiveJaccard = (a: string, b: string) => contentJaccard(a.replace(FUND_VOCAB, ' '), b.replace(FUND_VOCAB, ' '))

/** What a deal headline says about the target once the parties and the deal's own verbs are set aside. */
const DEAL_VOCAB = /\b(acquires?|acquired|acquisition|buys?|buying|bought|sells?|sale|strikes?|deal|inks?|agrees?|agreed|completes?|take-private|takeover|bid|offer|stake|majority|minority|billion|million|for|from|and|the|its|including|debt|more|add|to)\b/gi
const descriptorWords = (title: string, keys: string[]): Set<string> => {
  const skip = new Set(keys.flatMap((k) => k.split(' ')))
  return new Set(
    title.toLowerCase().replace(DEAL_VOCAB, ' ').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter((w) => w.length >= 4 && !skip.has(w) && !/^\d+$/.test(w)),
  )
}

/**
 * Two deals with ONE party in common are the same deal when they say so:
 *   - the same stated price (within 2%, $100M or more) under a headline that
 *     overlaps, as with "CD&R and
 *     McKesson ink $5.8bn take-private deal for Option Care Health" and Law360's
 *     "4 Firms Advise On $5.8B Option Care Health Take-Private Deal"; or
 *   - headlines that are mostly the same words: "UBS to transfer Credit Suisse
 *     fund administration businesses to Northern Trust" / "UBS to shed fund
 *     administration business acquired through Credit Suisse merger"; or
 *   - one of them names only the buyer, and describes the same target in two
 *     or more words, within two days: "KKR (KKR) Acquires Fund Administrator
 *     To Add More Recurring Fee Income" beside "KKR Strikes Deal to Buy
 *     Private-Capital Fund Administrator Gen II".
 * Two deals a sponsor does on one day share its name and little else.
 */
function sameDealOnePartyShared(a: StoryLike, b: StoryLike): boolean {
  const words = contentJaccard(a.title, b.title)
  const sameSize = !!a.fundSizeUsdMillions && !!b.fundSizeUsdMillions && a.fundSizeUsdMillions >= 100 && fundSizesMatch(a.fundSizeUsdMillions, b.fundSizeUsdMillions, 0.02)
  if (sameSize && words >= 0.2) return true
  if (words >= 0.3) return true
  const [sparse, full] = a.entityKeys.length <= b.entityKeys.length ? [a, b] : [b, a]
  if (sparse.entityKeys.length !== 1 || full.entityKeys.length < 2) return false
  const gap = daysBetween(a.publishedDate, b.publishedDate)
  if (gap !== null && gap > 2) return false
  const mine = descriptorWords(sparse.title, sparse.entityKeys)
  let shared = 0
  descriptorWords(full.title, sparse.entityKeys).forEach((w) => { if (mine.has(w)) shared++ })
  return shared >= 2
}

function daysBetween(a: string | null | undefined, b: string | null | undefined): number | null {
  if (!a || !b) return null
  const gap = Math.abs(Date.parse(`${String(a).slice(0, 10)}T12:00:00Z`) - Date.parse(`${String(b).slice(0, 10)}T12:00:00Z`)) / 86_400_000
  return Number.isFinite(gap) ? Math.round(gap) : null
}

/**
 * Same story, by the names in it. `crossEdition` tightens the fund rule: over
 * several days one firm can genuinely announce two different vehicles, so two
 * disjoint fund names are never merged there.
 */
export function sameStoryLoose(a: StoryLike, b: StoryLike, opts: { crossEdition?: boolean } = {}): boolean {
  const famA = storyFamily(a.eventType)
  const famB = storyFamily(b.eventType)
  const firmA = entityKey(a.firmName)
  const firmB = entityKey(b.firmName)
  const sameFirm = keysMatch(firmA, firmB)
  const shared = sharedKeys(a.entityKeys, b.entityKeys)

  // People: a named person in common is one move, whoever the "firm" is.
  if (famA === 'people' && famB === 'people') {
    if (sharedKeys(a.personKeys, b.personKeys) >= 1) return true
    // Same firm, same surname: "Jon Baratta" in one summary and "Joe Baratta"
    // in another were one Blackstone departure (2026-09-27). Or the same job,
    // when one report names nobody: "Barings hires global head of ABF" and
    // "Barings expands private credit naming global head of asset-based
    // finance" (2026-10-05). Both tests are sameMove's.
    return sameFirm && sameMove(a, b, opts)
  }

  // Deals: the same two companies are the same transaction — given some sign
  // the headlines are about the same thing. Two sponsors in common is not
  // enough on its own: "DCC Energy shareholders approve takeover by KKR and
  // ECP" and a different auction that also names KKR and ECP are two deals.
  if (famA === 'deal' && famB === 'deal') {
    if (shared < 2) return shared === 1 && sameDealOnePartyShared(a, b)
    if (!opts.crossEdition) return true
    return (
      shared >= 3 ||
      contentJaccard(a.title, b.title) >= 0.12 ||
      fundSizesMatch(a.fundSizeUsdMillions, b.fundSizeUsdMillions)
    )
  }

  // Regulatory: the same (non-regulator) subject, or a near-identical headline.
  if (famA === 'regulatory' && famB === 'regulatory') {
    if (sameFirm && !isRegulatorName(a.firmName) && !isRegulatorName(b.firmName)) return true
    if (titleJaccard(stem(a.title), stem(b.title)) >= 0.5) return true
    // One announcement, two write-ups, on the same morning: "SEC proposes
    // widening retail access to private markets" / "SEC opens door further to
    // retail private credit push". Same edition only, and only when neither
    // names a specific firm — "SEC charges adviser X" and "SEC charges adviser
    // Y" are two cases.
    const noSubject = (x: StoryLike) => !x.firmName || isRegulatorName(x.firmName)
    if (!opts.crossEdition && noSubject(a) && noSubject(b) && contentJaccard(stem(a.title), stem(b.title)) >= 0.22) return true
    return false
  }

  if (famA === 'fund' && famB === 'fund') {
    const closeCompatible = !a.closeType || !b.closeType || a.closeType === b.closeType
    const bothSized = !!a.fundSizeUsdMillions && !!b.fundSizeUsdMillions
    const sizeCompatible = !bothSized || fundSizesMatch(a.fundSizeUsdMillions, b.fundSizeUsdMillions, 0.25)
    const fundA = entityKey(a.fundName)
    const fundB = entityKey(b.fundName)
    const namesDisjoint =
      !!fundA && !!fundB &&
      !fundA.split(' ').some((t) => t.length > 2 && fundB.split(' ').includes(t))

    // A first close and a final close, or a $400M and a $900M close, are two
    // events however much else matches — unless the two reports carry the
    // very same figure, in which case one of them mislabelled the stage.
    const sameFigure = bothSized && fundSizesMatch(a.fundSizeUsdMillions, b.fundSizeUsdMillions, 0.02)
    if ((!closeCompatible || !sizeCompatible) && !sameFigure) return false

    // The identical vehicle, whoever was extracted as the manager.
    if (fundA && fundA === fundB && fundA.split(' ').length >= 2) return true

    if (sameFirm && closeCompatible && sizeCompatible && !namesDisjoint) {
      if (!opts.crossEdition) return true
      // Across days a large firm really does announce unrelated vehicles
      // ("Blackstone launches multi-asset fund", then "Blackstone to launch
      // Nordics warehouse platform"), so the same firm alone is not a repeat.
      // Something must tie the two headlines to one raise.
      const stage = a.closeType && a.closeType === b.closeType && /close/.test(a.closeType)
      const fundOverlap = !!fundA && !!fundB
      if (
        stage || fundOverlap || bothSized ||
        contentJaccard(a.title, b.title) >= 0.2 ||
        titlesShareSignificantNumber(a.title, b.title)
      ) return true
    }
    if (sameFirm && closeCompatible && sizeCompatible) {
      // Two outlets inventing different names for one size-less announcement
      // ("Blackstone Private Markets Fund" / "BXPM Fund", 2026-09-25). Same
      // edition only — across days these could be two real vehicles.
      if (!opts.crossEdition && !a.fundSizeUsdMillions && !b.fundSizeUsdMillions && a.eventType === b.eventType) return true
    }

    // Different extracted firms, same raise: an all-but-identical size plus a
    // party in common, or two parties in common at a compatible stage.
    if (sameFigure && shared >= 1) return true
    // The same number under a near-identical headline, whoever was extracted
    // as the firm: "NYC pension chief proposes $5bn private markets climate
    // investment expansion" / "NYC comptroller proposes $5bn private markets
    // climate push".
    // "Near-identical" is judged on what is left once the words every fund
    // headline uses are set aside.
    if (sameFigure && distinctiveJaccard(a.title, b.title) >= 0.4) return true
    if (shared >= 2) return true
    return false
  }

  return false
}

// ─── A wire's items ─────────────────────────────────────────────────────────

const WIRE_STOP = new Set([
  'deal', 'roundup', 'capital', 'partners', 'group', 'management', 'holdings', 'investment', 'investments',
  'equity', 'fund', 'funds', 'ventures', 'family', 'private', 'global', 'asset', 'assets', 'with', 'from',
  'acquires', 'acquire', 'agrees', 'backs', 'buys', 'completes', 'exits', 'sells', 'invest', 'strikes',
  'what', 'this', 'that', 'bets', 'targets',
])

/** The names in a clause: capitalised words and acronyms, without the vocabulary every deal headline uses. */
function namesIn(text: string): Set<string> {
  const out = new Set<string>()
  for (const w of text.match(/\b[A-Z][A-Za-z0-9&]*\b/g) ?? []) {
    const k = w.toLowerCase()
    if (WIRE_STOP.has(k)) continue
    if (/^[A-Z0-9&]{2,}$/.test(w) || w.length >= 4) out.add(k)
  }
  return out
}

/**
 * Does this row tell one of a wire's items? The wire's single record holds
 * only its first item's firm and sizes, so comparing the row with the record
 * (sameStoryLoose) can silence the wire for that first item and no other.
 * Read the wire's own clauses instead: a row tells an item when two of the
 * names in the row's headline are named together in one clause. 2026-10-05:
 * "Deal Roundup: Warburg buys into Ares, LightBay-backed Awayday, Antin Infra
 * invest in HP Helicopters" ran beside "Antin acquires majority stake in
 * aerial firefighting firm HP Helicopters".
 */
export function tellsAnItemOf(single: StoryLike, wire: StoryLike): boolean {
  if (sameStoryLoose(single, wire)) return true
  const mine = namesIn(single.title)
  if (mine.size < 2) return false
  const clauses = wire.title.replace(/^[^:;]{0,30}:\s*/, '').split(/;|,\s+(?=[A-Z])/)
  return clauses.some((clause) => {
    let n = 0
    namesIn(clause).forEach((k) => { if (mine.has(k)) n++ })
    return n >= 2
  })
}

/**
 * Cross-edition check. A deal that has visibly moved on ("nears $1.8bn deal"
 * → "agreed to acquire") is a development, not a repeat, and runs again.
 */
export function findPriorStory<T extends StoryLike>(candidate: StoryLike, priors: T[]): T | null {
  for (const prior of priors) {
    if (!sameStoryLoose(prior, candidate, { crossEdition: true })) continue
    if (storyFamily(candidate.eventType) === 'deal' && dealStage(candidate.title) > dealStage(prior.title)) continue
    return prior
  }
  return null
}

/** Union-find clustering, so A~B and B~C lands A, B and C in one story. */
export function clusterBy<T>(items: T[], same: (a: T, b: T) => boolean): T[][] {
  const parent = items.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (find(i) !== find(j) && same(items[i], items[j])) parent[find(j)] = find(i)
    }
  }
  const groups = new Map<number, T[]>()
  items.forEach((item, i) => {
    const root = find(i)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(item)
  })
  return Array.from(groups.values())
}
