// The webinars lane (Danny, 2026-10-22: "lean in and become the source of… all events, even webinars"). Two rules
// live here, both pure so they can be tested without a database:
//
// 1. Which formats a read lists. The board's default view, the home page, the section fronts and the daily email
//    stay in-person and hybrid (plus a virtual event its organizer submitted, the 2026-10-13 rule): a few dozen
//    webinars a week would bury the conferences. A read that ASKS for virtual events (`?format=virtual`: the
//    board's Virtual chip, /events/webinars, the calendar feed) lists every virtual event we have, scouted ones too.
//
// 2. Fund administrators' webinars are never listed (Danny, clicked 2026-10-22). They are IQ-EQ's competitors, his
//    day job. A virtual event is left out when the row says its organizer is a fund administrator
//    (`organizer_type = 'fund_admin'`, stamped from the event_sources registry) OR when its organizer, or the
//    event's own name, names one of the administrators below, in case a row was typed otherwise or an
//    administrator co-hosts. It is applied in the database read of every listing (board, collections, the daily
//    and Monday emails, the sitemap, "similar events") and its JavaScript twin hides the event's own page.
//    In-person and hybrid events hosted by an administrator are NOT touched yet: that is Danny's call to make
//    (as of 2026-10-22 there were none upcoming; the last was SS&C Deliver, 2026-09-20).

/** The board's own formats: what every read lists unless it asks for virtual events (Danny, 2026-09-05). */
export const BOARD_FORMATS = ['in_person', 'hybrid'] as const

/** Every format a read may ask for. */
export const LISTED_FORMATS = ['in_person', 'hybrid', 'virtual'] as const

/**
 * The default format scope, a PostgREST `or`: in-person and hybrid, plus whatever an organizer submitted
 * (Danny, 2026-10-13: what someone takes the trouble to submit is listed, labelled for what it is).
 */
export const BOARD_FORMAT_SCOPE = `event_format.in.(${BOARD_FORMATS.join(',')}),is_submitted.eq.true`

/** The webinars lane's scope: every format, scouted virtual events included (2026-10-22). */
export const LANE_FORMAT_SCOPE = `event_format.in.(${LISTED_FORMATS.join(',')})`

/** Whether a read asks for virtual events: `format` names `virtual` (alone or beside other formats). */
export function wantsVirtualLane(format: string | null | undefined): boolean {
  return (format ?? '').split(',').some((f) => f.trim() === 'virtual')
}

/** The format scope for a read: the lane's when it asks for virtual events, else the board's. */
export function formatScopeFor(format: string | null | undefined): string {
  return wantsVirtualLane(format) ? LANE_FORMAT_SCOPE : BOARD_FORMAT_SCOPE
}

/** Whether a row is in the board's default view (BOARD_FORMAT_SCOPE, in JavaScript): in-person, hybrid or submitted. */
export function inDefaultView(row: { event_format?: string | null; is_submitted?: boolean | null }): boolean {
  return row.event_format !== 'virtual' || row.is_submitted === true
}

/** The formats a `?format=` may narrow to; anything else is dropped (and nothing left means no rows). */
export function requestedFormats(format: string): string[] {
  return format.split(',').map((f) => f.trim()).filter((f) => (LISTED_FORMATS as readonly string[]).includes(f))
}

interface AdminTerm {
  /** A PostgreSQL regular expression, matched case-insensitively (PostgREST `imatch`). No commas or parentheses:
   *  they would break PostgREST's or-syntax. */
  pattern: string
  /** Also look for it in the event's own name (a co-hosted webinar). Off for short names that could be anything. */
  inName: boolean
}

const term = (pattern: string, inName = true): AdminTerm => ({ pattern, inName })

/**
 * Fund administrators, by name (2026-10-22): Danny's list, then the event_sources registry's `fund_admin` rows that
 * are administrators proper. Left out on purpose, as questions for Danny rather than exclusions: the fund-tech
 * platforms that also administer (Carta, Juniper Square, AngelList, Sydecar, Allocations, Repool) and the custodian
 * banks' fund services (State Street, BNY, Northern Trust, U.S. Bank). Never law firms, accounting firms or
 * software vendors. Kroll is valuation, not administration. "Maples Group" only: Maples and Calder is a law firm.
 */
export const FUND_ADMIN_TERMS: readonly AdminTerm[] = [
  term('\\mCitco\\M'),
  term('\\mAlter Domus\\M'),
  term('\\mSS&C\\M'),
  term('\\mApex Group\\M'),
  term('\\mApex Fund Services\\M'),
  term('\\mGen II\\M'),
  term('\\mJTC\\M', false),
  term('\\mJTC Group\\M'),
  term('\\mAztec Group\\M'),
  term('\\mOcorian\\M'),
  term('\\mVistra\\M'),
  term('\\mStandish\\M', false),
  term('\\mNAV Fund\\M', false), // organizer only: "NAV fund finance" is a topic, not this firm
  term('\\mNAV Consulting\\M'),
  term('\\mTrident Trust\\M'),
  term('\\mUltimus\\M'),
  term('\\mIQ-?EQ\\M'),
  term('\\mCSC\\M', false),
  term('\\mSEI\\M', false),
  term('\\mMUFG Investor Services\\M'),
  term('\\mMUFG Fund Services\\M'),
  term('\\mUMB Fund Services\\M'),
  term('\\mMaples Group\\M'),
  term('\\mTMF Group\\M'),
  term('\\mWaystone\\M'),
  term('\\mHedgeServ\\M'),
  term('\\mIntertrust\\M'),
  term('\\mSanne\\M'),
  term('\\mFormidium\\M'),
  term('\\mOpus Fund Services\\M'),
  term('\\mLangham Hall\\M'),
  term('\\mLinnovate\\M'),
  term('\\mAduro Advisors\\M'),
  term('\\m4Pines\\M'),
  term('\\mAscent Fund Services\\M'),
  term('\\mBelasko\\M'),
  term('\\mBolder Group\\M'),
  term('\\mHawksford\\M'),
  term('\\mZedra\\M'),
  term('\\mSuntera\\M'),
  term('\\mPetra Funds\\M'),
  term('\\mPEF Services\\M'),
  term('\\mPhoenix American\\M'),
  term('\\mSocium\\M'),
  term('\\mStone Coast Fund\\M'),
  term('\\mTheorem Fund Services\\M'),
  term('\\mMG Stover\\M'),
]

/**
 * The guard as a PostgREST `or` filter: a row passes when it is not virtual, or when nothing marks its host as a
 * fund administrator. Added to every listing read with `.or()`, which PostgREST ANDs with the other filters.
 */
export function fundAdminGuardFilter(): string {
  const clear = ['organizer_type.neq.fund_admin']
  for (const t of FUND_ADMIN_TERMS) {
    clear.push(`organizer_name.not.imatch.${t.pattern}`)
    if (t.inName) clear.push(`name.not.imatch.${t.pattern}`)
  }
  return `event_format.neq.virtual,and(${clear.join(',')})`
}

function matches(pattern: string, text: string | null | undefined): boolean {
  // PostgreSQL's \m and \M are word starts and ends; JavaScript's \b covers both.
  return !!text && new RegExp(pattern.replace(/\\[mM]/g, '\\b'), 'i').test(text)
}

/** Whether an organizer or event name names a fund administrator on the list. */
export function namesFundAdmin(event: { name?: string | null; organizerName?: string | null }): boolean {
  return FUND_ADMIN_TERMS.some((t) => matches(t.pattern, event.organizerName) || (t.inName && matches(t.pattern, event.name)))
}

/** The JavaScript twin of the guard: a virtual event hosted by a fund administrator, which is never listed or shown. */
export function isHiddenFundAdminEvent(event: {
  eventFormat: string
  organizerType?: string | null
  organizerName?: string | null
  name?: string | null
}): boolean {
  if (event.eventFormat !== 'virtual') return false
  return event.organizerType === 'fund_admin' || namesFundAdmin(event)
}

/**
 * A past webinar's page is kept out of search (2026-10-22): a webinar that has happened is of no use to a reader
 * who finds it, unlike a conference, whose page people search for the next edition. The table has no recording
 * link; when it gets one, a webinar with a recording should stay indexed. The page itself stays up.
 */
export function isPastVirtualEvent(event: { eventFormat: string; startDate: string; endDate: string | null }, today: string): boolean {
  return event.eventFormat === 'virtual' && (event.endDate ?? event.startDate) < today
}
