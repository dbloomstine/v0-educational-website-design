/**
 * Who outreach v2 never writes to, as pure tests (the database lookups that
 * go with them are in store.ts). Danny's rules of 2026-10-14:
 *
 *  - the Lead Desk suppression list (hashes only; lib/outreach/suppression.ts)
 *  - fund administrators and anyone else competing with IQ-EQ (fund admin,
 *    corporate services, depositary, transfer agency), and IQ-EQ itself
 *  - stories that are bad news for the firm: lawsuits, enforcement, layoffs,
 *    wind-downs
 *  - anyone emailed by either program in the last 90 days
 *  - anyone who unsubscribed, bounced or complained
 *  - news notes: US contacts only (CASL and GDPR)
 */
import { isCompetitor } from '@/lib/outreach/segments'

/** Words that make a firm an IQ-EQ competitor (or IQ-EQ), beyond lib/outreach/segments.ts. */
const EXTRA_COMPETITOR_ORG: RegExp[] = [
  /\biq[\s-]?eq\b/i,
  /\bfund administrat/i,
  /\bfund admin\b/i,
  /\bfund services\b/i,
  /\bcorporate services\b/i,
  /\bdepositary\b/i,
  /\btransfer agen/i,
  /\btrust company\b.*\bfund/i,
]

/** True when a firm (by name, and by the person's title when there is one) must never be written to. */
export function isExcludedFirm(orgName: string | null | undefined, title?: string | null): boolean {
  const o = orgName ?? ''
  if (isCompetitor(title ?? null, o)) return true
  return EXTRA_COMPETITOR_ORG.some((re) => re.test(o))
}

export function isIqeqEmail(email: string): boolean {
  return /@(?:[a-z0-9-]+\.)*iqeq\.com$/i.test(email.trim())
}

/** Event types the classifier gives news that no firm wants a note about. */
const BAD_EVENT_TYPES = new Set(['regulatory_action', 'legal_alert', 'executive_departure'])

/** Headline / summary words that say the news is bad for the firm. */
const BAD_NEWS_WORDS: RegExp[] = [
  /\blaw ?suits?\b/i, /\bsues?\b/i, /\bsued\b/i, /\bsuing\b/i, /\blitigation\b/i, /\bclass action\b/i,
  /\bcharged?\b/i, /\bcharges\b/i, /\bindict/i, /\bfraud/i, /\bponzi\b/i, /\bembezzl/i, /\bmisconduct\b/i,
  /\benforcement\b/i, /\bsettles?\b/i, /\bsettlement\b/i, /\bfined?\b/i, /\bfines\b/i, /\bpenalt(?:y|ies)\b/i,
  /\bprobe[sd]?\b/i, /\binvestigat/i, /\bsubpoena/i, /\bsanction/i, /\bcease[- ]and[- ]desist\b/i, /\bwhistleblow/i,
  /\blay ?offs?\b/i, /\blaid off\b/i, /\bjob cuts?\b/i, /\bcuts? (?:\d+ )?(?:jobs|staff|roles|workforce|headcount)\b/i,
  /\bwind(?:s|ing)?[- ]down\b/i, /\bwound down\b/i, /\bshut(?:s|ting)? down\b/i, /\bshutters?\b/i, /\bcloses? (?:its )?doors\b/i,
  /\bliquidat/i, /\bbankrupt/i, /\bchapter 11\b/i, /\binsolven/i, /\bdefault(?:s|ed)?\b/i, /\breceivership\b/i,
  /\bwrite[- ]?downs?\b/i, /\bwrites? down\b/i, /\bscandal\b/i, /\bousted\b/i, /\bfired\b/i, /\bresigns?\b/i,
  /\bblocks?\b/i, /\bbarred\b/i, /\bbans?\b/i, /\bhalts? (?:redemptions|withdrawals)\b/i, /\bgates? (?:redemptions|withdrawals)\b/i,
  /\bconcerns? over\b/i, /\bdispute\b/i, /\bdeparts?\b/i, /\bdepartures?\b/i, /\bexits? (?:the )?firm\b/i,
]

export interface NewsLike {
  eventType?: string | null
  headline: string
  summary?: string | null
}

/** True when a story is bad news for the firm it names (or reads like it). */
export function isBadNews(s: NewsLike): boolean {
  if (s.eventType && BAD_EVENT_TYPES.has(s.eventType)) return true
  const text = `${s.headline} ${s.summary ?? ''}`
  return BAD_NEWS_WORDS.some((re) => re.test(text))
}

/** Apollo writes the country out ("United States"); allow the usual spellings. */
export function isUsCountry(country: string | null | undefined): boolean {
  const c = (country ?? '').trim().toLowerCase().replace(/\./g, '')
  return c === 'united states' || c === 'us' || c === 'usa' || c === 'united states of america'
}

/**
 * The people a news note goes to, best first (Danny, 2026-10-22: the person who
 * owns the firm's press, never a partner or founder for being one).
 *
 *  0  a senior IR / marketing / communications owner: Head, Director, VP, Chief,
 *     Managing Director or Partner of Investor Relations, Marketing,
 *     Communications, PR, Media Relations, Corporate Affairs or Brand; CMO;
 *     Investor Relations Manager.
 *  1  any other communications / PR / media relations title.
 *  2  any other investor relations title.
 *  3  any other marketing title.
 *  4  FALLBACK, used only when no one above is in the search: a press-adjacent
 *     title whose job is not the firm's news (proposal / RFP writing, product
 *     marketing, demand generation, digital or events marketing).
 * Null when the title is none of these, or junior: a partner, founder or CEO
 * with no IR / marketing / communications remit is never chosen.
 */
const PRESS_FUNCTION = String.raw`(?:investor relations|marketing|communications|public relations|media relations|corporate affairs|brand|\bIR\b|\bPR\b)`
const SENIOR = String.raw`\b(?:head|director|vp|svp|evp|vice president|chief|managing director|md|partner|leader|lead)\b`
const OFF_TARGET = /\b(?:proposals?|rfps?|product marketing|demand gen(?:eration)?|growth marketing|performance marketing|digital marketing|events? marketing|field marketing|marketing operations|marketing technology)\b/i
const NOTE_TITLE_LADDER: RegExp[] = [
  new RegExp(`${SENIOR}.*${PRESS_FUNCTION}|${PRESS_FUNCTION}.*${SENIOR}|\\bcmo\\b|\\bchief (?:marketing|communications)\\b|\\binvestor relations manager\\b|\\bmanager,? investor relations\\b`, 'i'),
  /\b(?:communications|public relations|media relations|corporate affairs)\b/i,
  /\binvestor relations\b|\bIR\b/i,
  /\bmarketing\b/i,
]
const NOTE_FALLBACK_RANK = NOTE_TITLE_LADDER.length
const JUNIOR = /\b(?:intern|assistant(?! director| vice president)|coordinator|analyst|receptionist|trainee|student|associate(?! director| vice president| principal))\b/i

export function noteTitleRank(title: string | null | undefined): number | null {
  const t = (title ?? '').trim()
  if (!t || JUNIOR.test(t)) return null
  const i = NOTE_TITLE_LADDER.findIndex((re) => re.test(t))
  if (i < 0) return null
  return OFF_TARGET.test(t) ? NOTE_FALLBACK_RANK : i
}

/** The Apollo `person_titles` a news-note search asks for (one free search; titles are ORed). Danny's list first. */
export const NOTE_TITLES = [
  'Head of Investor Relations',
  'Director of Investor Relations',
  'VP Investor Relations',
  'Vice President Investor Relations',
  'Investor Relations Manager',
  'Head of Marketing',
  'Marketing Director',
  'Director of Marketing',
  'VP Marketing',
  'Chief Marketing Officer',
  'Head of Communications',
  'Communications Director',
  'Director of Communications',
  'VP Communications',
  'Corporate Communications',
  'Public Relations',
  'Investor Relations',
  'Marketing',
]

/** "H.I.G. Capital" → "higcapital", for comparing names from two sources. */
export function normalizeFirmName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
}

const SUFFIX_WORDS = '(?:llc|lp|llp|inc|ltd|group|holdings|management|partners|capital|advisors|advisers|investments|investment|fund|funds|ventures|equity|privateequity)'
const FIRM_SUFFIX = new RegExp(`${SUFFIX_WORDS}+$`)
const ONLY_SUFFIXES = new RegExp(`^${SUFFIX_WORDS}+$`)

/** Apollo's organization name and the story's firm name are the same firm. */
export function sameFirm(a: string, b: string): boolean {
  const x = normalizeFirmName(a)
  const y = normalizeFirmName(b)
  if (!x || !y) return false
  if (x === y) return true
  const sx = x.replace(FIRM_SUFFIX, '')
  const sy = y.replace(FIRM_SUFFIX, '')
  if (sx.length >= 4 && sx === sy) return true
  // "StepStone" vs "StepStone Group": one is the other plus a suffix word.
  const [short, long] = x.length <= y.length ? [x, y] : [y, x]
  return short.length >= 4 && long.startsWith(short) && ONLY_SUFFIXES.test(long.slice(short.length))
}

/* ───────────────────────── organizer notes ───────────────────────── */

/**
 * The people an organizer note goes to, best first (2026-10-22): whoever runs
 * the organizer's events, then marketing, communications or partnerships; at a
 * small organizer (an association, a community, a conference producer) the
 * founder or executive director too. An events coordinator is the right person
 * here, so only interns, assistants and the like are too junior.
 */
const ORGANIZER_TITLE_LADDER: RegExp[] = [
  /\b(?:head|director|vp|vice president|chief|managing director|senior manager)\b.*\b(?:events?|conferences?|programs?|programming|meetings)\b|\bchief events?\b|\bevents? director\b|\bconference director\b/i,
  /\bevents?\b|\bconferences?\b|\bconference producer\b|\bprogramming\b|\bmeetings?\b/i,
  /\bmarketing\b|\bcommunications\b|\bpartnerships?\b|\bsponsorships?\b|\bmembership\b|\bcmo\b/i,
]
const SMALL_ORGANIZER_LEAD = /\b(?:co-?founder|founder|executive director|president|ceo|chief executive)\b/i
const SMALL_ORGANIZER_TYPES = new Set(['association', 'community', 'conference_producer'])
const ORGANIZER_JUNIOR = /\b(?:intern|internship|assistant(?! director| vice president)|receptionist|trainee|student|volunteer)\b/i

export function organizerTitleRank(title: string | null | undefined, organizerType?: string | null): number | null {
  const t = (title ?? '').trim()
  if (!t || ORGANIZER_JUNIOR.test(t)) return null
  const i = ORGANIZER_TITLE_LADDER.findIndex((re) => re.test(t))
  if (i >= 0) return i
  // "President" or "Founder" of a law or accounting firm is not who handles its events.
  return SMALL_ORGANIZER_LEAD.test(t) && SMALL_ORGANIZER_TYPES.has(organizerType ?? '') ? ORGANIZER_TITLE_LADDER.length : null
}

/** The Apollo `person_titles` an organizer-note search asks for (the founder's titles only for a small organizer). */
export function organizerTitles(organizerType?: string | null): string[] {
  const base = [
    'Head of Events',
    'Director of Events',
    'Events Director',
    'VP Events',
    'Events Manager',
    'Event Manager',
    'Conference Director',
    'Conference Producer',
    'Director of Programs',
    'Events',
    'Head of Marketing',
    'Director of Marketing',
    'Marketing Director',
    'Marketing Manager',
    'Director of Communications',
    'Communications Director',
    'Director of Partnerships',
    'Head of Partnerships',
    'Sponsorship Director',
  ]
  return SMALL_ORGANIZER_TYPES.has(organizerType ?? '') ? [...base, 'Executive Director', 'Founder', 'Co-Founder', 'President'] : base
}
