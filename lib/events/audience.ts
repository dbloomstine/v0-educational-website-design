// Events by who they are for (2026-10-22): /events/lps lists the events whose audience is LPs — allocators'
// forums, family office meetings, institutional investor roundtables, ILPA. The board has no audience column;
// `topics` says which part of the job an event is about, and `fundraising_ir` is the GP side of the same room
// (cap intro, IR) with its own page at /events/fundraising. So the LP page reads the event's own name and
// organizer, the words an allocator's event uses to say who it is for. Family offices count as LPs.

interface AudienceTerm {
  field: 'name' | 'organizer_name'
  /** A PostgreSQL regular expression, matched case-insensitively (`~*`, PostgREST `imatch`). No commas or
   *  parentheses: they would break PostgREST's or-syntax. */
  pattern: string
}

export const LP_AUDIENCE_TERMS: readonly AudienceTerm[] = [
  { field: 'name', pattern: '\\mLPs?\\M' }, // "LP/GP Lunch", "Your LP Engagement" — never "help"
  { field: 'name', pattern: 'limited partner' },
  { field: 'name', pattern: 'family office' },
  { field: 'name', pattern: 'institutional invest' },
  { field: 'name', pattern: 'institutional forum' }, // Markets Group's state allocator forums
  { field: 'name', pattern: 'endowment' },
  { field: 'name', pattern: 'foundations' },
  { field: 'name', pattern: 'pension' },
  { field: 'name', pattern: 'allocator' },
  { field: 'name', pattern: 'sovereign wealth' },
  { field: 'name', pattern: '\\mCIOs?\\M' },
  { field: 'name', pattern: '\\mILPA\\M' },
  { field: 'organizer_name', pattern: '\\mILPA\\M' },
  { field: 'organizer_name', pattern: 'limited partner' }, // ILPA's own events, whatever they are called
  { field: 'organizer_name', pattern: 'institutional investor' },
  { field: 'name', pattern: '\\mPREA\\M' }, // the Pension Real Estate Association's meetings
  { field: 'organizer_name', pattern: 'pension' },
]

/** The audiences a feed can be narrowed to (`?audience=`). */
export const EVENT_AUDIENCES = ['lp'] as const
export type EventAudience = (typeof EVENT_AUDIENCES)[number]

export function isEventAudience(value: string | null | undefined): value is EventAudience {
  return EVENT_AUDIENCES.includes(value as EventAudience)
}

/** PostgREST `or` filter selecting the LP-audience events. */
export function lpAudienceFilter(): string {
  return LP_AUDIENCE_TERMS.map((t) => `${t.field}.imatch.${t.pattern}`).join(',')
}

/** The JavaScript twin of the filter (PostgreSQL's \m and \M are word starts and ends; JavaScript's \b covers both). */
export function isLpAudienceEvent(event: { name: string; organizerName?: string | null }): boolean {
  return LP_AUDIENCE_TERMS.some((t) => {
    const text = t.field === 'name' ? event.name : event.organizerName ?? ''
    return new RegExp(t.pattern.replace(/\\[mM]/g, '\\b'), 'i').test(text)
  })
}
