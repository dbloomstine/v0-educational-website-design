import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  BOARD_FORMAT_SCOPE,
  LANE_FORMAT_SCOPE,
  formatScopeFor,
  fundAdminGuardFilter,
  inDefaultView,
  isHiddenFundAdminEvent,
  isPastVirtualEvent,
  namesFundAdmin,
  requestedFormats,
  wantsVirtualLane,
} from '../webinars'
import { COLLECTION_BY_SLUG } from '../collections'

// ── The database reads, recorded ───────────────────────────────────
// Every filter call a read makes is kept, so the tests can say which scope each listing asked for.
const calls: { table: string; method: string; args: unknown[] }[][] = []
let nextRows: Record<string, unknown>[] = []

function builder(table: string) {
  const log: { table: string; method: string; args: unknown[] }[] = []
  calls.push(log)
  const result = () => ({ data: nextRows, error: null, count: nextRows.length })
  const proxy: unknown = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === 'then') return (resolve: (v: unknown) => void) => resolve(result())
        if (prop === 'maybeSingle') return async () => ({ data: nextRows[0] ?? null, error: null })
        return (...args: unknown[]) => {
          log.push({ table, method: prop, args })
          return proxy
        }
      },
    },
  )
  return proxy
}

vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))
vi.mock('@/lib/supabase/client', () => ({ getSupabaseAdmin: () => ({ from: (t: string) => builder(t) }) }))

const ors = (log: { method: string; args: unknown[] }[]) => log.filter((c) => c.method === 'or').map((c) => c.args[0])

beforeEach(() => {
  calls.length = 0
  nextRows = []
})

describe('the format scope (webinars lane, 2026-10-22)', () => {
  it('keeps the default view in-person and hybrid, plus what was submitted', () => {
    expect(formatScopeFor(undefined)).toBe(BOARD_FORMAT_SCOPE)
    expect(formatScopeFor('')).toBe(BOARD_FORMAT_SCOPE)
    expect(formatScopeFor('in_person')).toBe(BOARD_FORMAT_SCOPE)
    expect(BOARD_FORMAT_SCOPE).toBe('event_format.in.(in_person,hybrid),is_submitted.eq.true')
  })

  it('opens the lane when a read asks for virtual events', () => {
    expect(wantsVirtualLane('virtual')).toBe(true)
    expect(wantsVirtualLane('in_person,virtual')).toBe(true)
    expect(wantsVirtualLane('virtualish')).toBe(false)
    expect(formatScopeFor('virtual')).toBe(LANE_FORMAT_SCOPE)
    expect(LANE_FORMAT_SCOPE).toBe('event_format.in.(in_person,hybrid,virtual)')
  })

  it('narrows to known formats only', () => {
    expect(requestedFormats('virtual')).toEqual(['virtual'])
    expect(requestedFormats('hybrid, virtual')).toEqual(['hybrid', 'virtual'])
    expect(requestedFormats('online')).toEqual([])
  })

  it('counts a scouted webinar outside the default view', () => {
    expect(inDefaultView({ event_format: 'in_person', is_submitted: false })).toBe(true)
    expect(inDefaultView({ event_format: 'hybrid', is_submitted: false })).toBe(true)
    expect(inDefaultView({ event_format: 'virtual', is_submitted: true })).toBe(true)
    expect(inDefaultView({ event_format: 'virtual', is_submitted: false })).toBe(false)
  })

  it('points /events/webinars at the lane', () => {
    const webinars = COLLECTION_BY_SLUG.get('webinars')!
    expect(webinars.filter.format).toBe('virtual')
    expect(wantsVirtualLane(webinars.filter.format)).toBe(true)
    expect(webinars.boardParams.format).toBe('virtual')
  })
})

describe('the reads', () => {
  it('the board default (and the daily email) reads the default scope, with the guard', async () => {
    const { queryEventFeed } = await import('../api')
    await queryEventFeed({ when: '1w', limit: 10 })
    const [feed, facets] = calls
    expect(ors(feed)).toContain(BOARD_FORMAT_SCOPE)
    expect(ors(feed)).toContain(fundAdminGuardFilter())
    expect(ors(feed)).not.toContain(LANE_FORMAT_SCOPE)
    // Facets read the lane so the Virtual chip counts every webinar; the guard rides along.
    expect(ors(facets)).toContain(LANE_FORMAT_SCOPE)
    expect(ors(facets)).toContain(fundAdminGuardFilter())
  })

  it('format=virtual reads the lane, narrowed to virtual', async () => {
    const { queryEventFeed } = await import('../api')
    await queryEventFeed({ format: 'virtual' })
    const feed = calls[0]
    expect(ors(feed)).toContain(LANE_FORMAT_SCOPE)
    expect(ors(feed)).toContain(fundAdminGuardFilter())
    expect(feed.find((c) => c.method === 'in' && c.args[0] === 'event_format')?.args[1]).toEqual(['virtual'])
  })

  it('the default view tallies scouted webinars only under the Virtual chip', async () => {
    const { queryEventFeed } = await import('../api')
    nextRows = [
      { event_format: 'in_person', is_submitted: false, event_kind: 'conference', cost_type: 'paid', topics: [], fund_categories: [] },
      { event_format: 'virtual', is_submitted: false, event_kind: 'webinar', cost_type: 'free', topics: [], fund_categories: [] },
      { event_format: 'virtual', is_submitted: false, event_kind: 'webinar', cost_type: 'free', topics: [], fund_categories: [] },
    ]
    const { facets } = await queryEventFeed({})
    expect(facets.formats).toEqual({ in_person: 1, virtual: 2 })
    expect(facets.totalUpcoming).toBe(1)
    expect(facets.kinds).toEqual({ conference: 1 })
  })

  it('the feed drops a fund administrator’s webinar even if the database let it through', async () => {
    const { queryEventFeed } = await import('../api')
    nextRows = [
      { slug: 'a', name: 'Real Asset Vehicles', organizer_name: 'Ultimus Fund Solutions', organizer_type: 'fund_admin', event_format: 'virtual' },
      { slug: 'b', name: 'Loan Market Webcast', organizer_name: 'LSTA', organizer_type: 'association', event_format: 'virtual' },
    ]
    const { events } = await queryEventFeed({ format: 'virtual' })
    expect(events.map((e) => e.slug)).toEqual(['b'])
  })

  it('a fund administrator’s webinar has no page', async () => {
    const { queryEventBySlug } = await import('../api')
    nextRows = [{ slug: 'x', name: 'CSC Webinar: Apostilles', organizer_name: 'CSC', organizer_type: 'fund_admin', event_format: 'virtual' }]
    expect(await queryEventBySlug('x')).toBeNull()
    nextRows = [{ slug: 'y', name: 'SS&C Deliver 2026', organizer_name: 'SS&C Technologies', organizer_type: 'fund_admin', event_format: 'in_person' }]
    expect((await queryEventBySlug('y'))?.slug).toBe('y') // in person: Danny's call, unchanged
  })

  it('the sitemap reads the lane, guarded, without past webinars', async () => {
    const { queryAllEventSlugs } = await import('../api')
    await queryAllEventSlugs()
    const o = ors(calls[0])
    expect(o).toContain(LANE_FORMAT_SCOPE)
    expect(o).toContain(fundAdminGuardFilter())
    expect(o.some((f) => typeof f === 'string' && f.startsWith('event_format.neq.virtual,start_date.gte.'))).toBe(true)
  })

  it('a webinar’s similar events read the lane; a conference’s keep the board', async () => {
    const { queryRelatedEvents } = await import('../api')
    const base = { slug: 's', name: 'A webinar', startDate: '2026-11-01', endDate: null, city: null, topics: [], fundCategories: [], organizerName: 'X' }
    await queryRelatedEvents({ ...base, eventFormat: 'virtual' } as never)
    expect(ors(calls[0])).toContain(LANE_FORMAT_SCOPE)
    calls.length = 0
    await queryRelatedEvents({ ...base, eventFormat: 'in_person' } as never)
    expect(ors(calls[0])).toContain(BOARD_FORMAT_SCOPE)
    expect(ors(calls[0])).toContain(fundAdminGuardFilter())
  })
})

describe('the fund administrator guard (Danny, 2026-10-22)', () => {
  const virtual = (organizerName: string, organizerType = 'other', name = 'A webinar') => ({ eventFormat: 'virtual', organizerName, organizerType, name })

  it.each([
    'Citco',
    'Alter Domus',
    'SS&C Technologies',
    'SS&C',
    'Apex Group',
    'Gen II Fund Services',
    'JTC',
    'JTC Group',
    'Aztec Group',
    'Ocorian',
    'Vistra',
    'Standish Management',
    'NAV Fund Administration Group',
    'Trident Trust',
    'Ultimus Fund Solutions',
    'CSC',
    'SEI',
    'MUFG Investor Services',
    'Maples Group',
    'TMF Group',
  ])('leaves out a webinar hosted by %s', (organizerName) => {
    expect(isHiddenFundAdminEvent(virtual(organizerName))).toBe(true)
  })

  it("lists IQ-EQ's own webinars, typed fund_admin or not (Danny, 2026-10-22: IQ-EQ is not a competitor)", () => {
    expect(isHiddenFundAdminEvent(virtual('IQ-EQ', 'fund_admin'))).toBe(false)
    expect(isHiddenFundAdminEvent(virtual('IQ EQ'))).toBe(false)
    expect(fundAdminGuardFilter()).toContain('organizer_name.imatch.')
  })

  it('lists EisnerAmper\'s webinars, typed fund_admin or not (Danny, 2026-10-22: like Carta and Juniper Square)', () => {
    expect(isHiddenFundAdminEvent(virtual('EisnerAmper', 'fund_admin'))).toBe(false)
    expect(isHiddenFundAdminEvent(virtual('EisnerAmper LLP', 'accounting_firm'))).toBe(false)
    expect(isHiddenFundAdminEvent(virtual('Eisner Amper', 'fund_admin'))).toBe(false)
    // Every other administrator stays out, and so does a co-host that names one.
    expect(isHiddenFundAdminEvent(virtual('Some New Administrator', 'fund_admin'))).toBe(true)
    expect(isHiddenFundAdminEvent(virtual('EisnerAmper', 'accounting_firm', 'EisnerAmper and Citco on NAV oversight'))).toBe(true)
  })

  it('leaves out any virtual row typed fund_admin, whatever its name', () => {
    expect(isHiddenFundAdminEvent(virtual('Some New Administrator', 'fund_admin'))).toBe(true)
  })

  it('leaves out a co-hosted webinar that names an administrator', () => {
    expect(isHiddenFundAdminEvent(virtual('Kirkland & Ellis', 'law_firm', 'Kirkland and Alter Domus on NAV lending'))).toBe(true)
  })

  // Real organizers from the board, 2026-10-22, and the near-misses a careless list would catch.
  it.each([
    ['Morgan Lewis', 'law_firm'],
    ['National Society of Compliance Professionals (NSCP)', 'association'],
    ['LSTA', 'association'],
    ['Institutional Real Estate, Inc.', 'media'],
    ['Fund Finance Association', 'association'],
    ['NAREIM', 'association'],
    ['Maples and Calder', 'law_firm'], // the law firm, not Maples Group
    ['Kroll', 'other'], // valuation
    ['Carta', 'tech_vendor'], // a question for Danny, not excluded
    ['Juniper Square', 'tech_vendor'], // likewise
    ['Seismic', 'tech_vendor'], // not "SEI"
    ['PwC', 'accounting_firm'],
  ])('keeps a webinar hosted by %s', (organizerName, organizerType) => {
    expect(isHiddenFundAdminEvent(virtual(organizerName, organizerType))).toBe(false)
  })

  it('does not touch in-person or hybrid events (Danny’s call, not made yet)', () => {
    expect(isHiddenFundAdminEvent({ eventFormat: 'in_person', organizerName: 'SS&C Technologies', organizerType: 'fund_admin', name: 'SS&C Deliver 2026' })).toBe(false)
    expect(isHiddenFundAdminEvent({ eventFormat: 'hybrid', organizerName: 'Citco', organizerType: 'fund_admin', name: 'Citco Forum' })).toBe(false)
  })

  it('does not read short names inside an event’s title', () => {
    // "SEI" and "CSC" are checked against the organizer only.
    expect(namesFundAdmin({ name: 'CSC and SEI explained', organizerName: 'Morgan Lewis' })).toBe(false)
  })

  it('is one PostgREST filter that passes any non-virtual row', () => {
    const f = fundAdminGuardFilter()
    // The one nested clause is IQ-EQ's and EisnerAmper's exception: typed fund_admin, but listed (2026-10-22).
    const allowed = 'or(organizer_type.neq.fund_admin,organizer_name.imatch.\\mIQ-?EQ\\M|\\mEisner ?Amper\\M)'
    expect(f.startsWith(`event_format.neq.virtual,and(${allowed},`)).toBe(true)
    expect(f).toContain('organizer_name.not.imatch.\\mCitco\\M')
    expect(f).toContain('name.not.imatch.\\mAlter Domus\\M')
    expect(f).not.toContain(',name.not.imatch.\\mSEI\\M') // organizer only
    // No term may break PostgREST's or-syntax.
    const inner = f.slice(f.indexOf('and(') + 4, -1).replace(allowed, '')
    expect(inner).not.toMatch(/[()]/)
  })
})

describe('past webinars are noindex', () => {
  it('only a virtual event whose last day has passed', () => {
    expect(isPastVirtualEvent({ eventFormat: 'virtual', startDate: '2026-10-13', endDate: null }, '2026-10-22')).toBe(true)
    expect(isPastVirtualEvent({ eventFormat: 'virtual', startDate: '2026-10-22', endDate: null }, '2026-10-22')).toBe(false)
    expect(isPastVirtualEvent({ eventFormat: 'virtual', startDate: '2026-10-20', endDate: '2026-10-23' }, '2026-10-22')).toBe(false)
    expect(isPastVirtualEvent({ eventFormat: 'in_person', startDate: '2026-09-01', endDate: null }, '2026-10-22')).toBe(false)
  })
})
