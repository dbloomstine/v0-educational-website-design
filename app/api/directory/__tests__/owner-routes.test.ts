// @vitest-environment node
/**
 * The directory's owner routes (2026-10-24, workstream B): claim vs sign-in,
 * confirming (alerts, owner emails, newsletter, moves), and view counting.
 * The database, the profile reads, the subscribe route and Resend are all
 * stubbed: nothing here reaches the network or writes anywhere.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { hashToken } from '@/lib/directory/claim'

type Row = Record<string, unknown>

const PERSON = '11111111-2222-4333-8444-555555555555'
const OLD = '22222222-2222-4333-8444-555555555555'
const CLAIM = '99999999-8888-4777-8666-555555555555'
const TOKEN = 'A'.repeat(43)
const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'

let claimRow: Row | null
let moveRow: Row | null
let updates: { table: string; values: Row; filters: [string, unknown][] }[]
let inserts: { table: string; row: Row }[]
let rpcs: { fn: string; args: Row }[]
let people: Record<string, Row>
let earlierClaims: { id: string; email: string; confirmed_at: string | null }[]
let cookieValue: string | undefined

function from(table: string) {
  const filters: [string, unknown][] = []
  let mode: 'select' | 'count' | 'update' | 'insert' = 'select'
  let values: Row = {}
  const b = {
    select(_c?: string, opts?: { head?: boolean }) {
      if (mode !== 'update' && mode !== 'insert') mode = opts?.head ? 'count' : 'select'
      return b
    },
    eq(c: string, v: unknown) { filters.push([c, v]); return b },
    is(c: string, v: unknown) { filters.push([c, v]); return b },
    not() { return b },
    gte() { return b },
    order() { return b },
    limit() { return b },
    insert(r: Row) { mode = 'insert'; inserts.push({ table, row: r }); return b },
    update(r: Row) { mode = 'update'; values = r; return b },
    maybeSingle() {
      if (table === 'directory_claims') {
        const h = filters.find((f) => f[0] === 'token_hash')?.[1]
        return Promise.resolve({ data: claimRow && claimRow.token_hash === h ? claimRow : null, error: null })
      }
      if (table === 'directory_moves') return Promise.resolve({ data: moveRow, error: null })
      return Promise.resolve({ data: null, error: null })
    },
    then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
      if (mode === 'update') {
        updates.push({ table, values, filters })
        return Promise.resolve({ data: [{ id: 'x' }], error: null }).then(resolve, reject)
      }
      if (mode === 'insert') return Promise.resolve({ error: null }).then(resolve, reject)
      return Promise.resolve({ count: 0, data: [], error: null }).then(resolve, reject)
    },
  }
  return b
}

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: () => ({
    from,
    rpc: (fn: string, args: Row) => {
      rpcs.push({ fn, args })
      return Promise.resolve({ error: null })
    },
  }),
}))
vi.mock('@/lib/directory/server', () => ({
  personById: async (id: string) => people[id] ?? null,
  personBySlug: async (slug: string) => Object.values(people).find((p) => p.slug === slug) ?? null,
  confirmedClaims: async () => earlierClaims.filter((c) => c.confirmed_at),
  refreshDirectory: () => {},
}))
const subscribe = vi.fn()
vi.mock('@/app/api/newsletter/subscribe/route', () => ({ POST: (req: Request) => subscribe(req) }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => (cookieValue ? { value: cookieValue } : undefined) }) }))

import { POST as CLAIM_POST } from '../claim/route'
import { POST as CONFIRM } from '../claim/confirm/route'
import { POST as VIEW } from '../view/route'
import { signSession } from '@/lib/directory/claim'

const fetchMock = vi.fn()
const sent = () => fetchMock.mock.calls.filter(([url]) => String(url).includes('api.resend.com')).map(([, init]) => JSON.parse(init.body))
const toDanny = () => sent().filter((m) => m.to === 'dbloomstine@gmail.com')
const to = (addr: string) => sent().filter((m) => m.to === addr)

const jane = (o: Row = {}): Row => ({
  id: PERSON,
  category: 'fund_lawyer',
  slug: 'jane-smith',
  full_name: 'Jane Smith',
  firm_name: 'Kirkland & Ellis',
  firm_domain: 'kirkland.com',
  status: 'published',
  hidden_by: null,
  claimed_at: null,
  pending_edits: null,
  ...o,
})

const confirm = (newsletter = false) => CONFIRM(new Request('http://localhost/api/directory/claim/confirm', { method: 'POST', body: JSON.stringify({ token: TOKEN, newsletter }) }))
const claim = (email: string) => CLAIM_POST(new Request('http://localhost/api/directory/claim', { method: 'POST', headers: { 'x-forwarded-for': '203.0.113.9' }, body: JSON.stringify({ slug: 'jane-smith', email }) }))

beforeEach(() => {
  claimRow = { id: CLAIM, person_id: PERSON, email: 'jane.smith@kirkland.com', token_hash: hashToken(TOKEN), expires_at: new Date(Date.now() + 86_400_000).toISOString(), confirmed_at: null }
  moveRow = null
  updates = []
  inserts = []
  rpcs = []
  people = { [PERSON]: jane() }
  earlierClaims = []
  cookieValue = undefined
  subscribe.mockReset()
  subscribe.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('DIRECTORY_ENABLED', 'true')
  vi.stubEnv('RESEND_API_KEY', 're_test')
  vi.stubEnv('DIRECTORY_SESSION_SECRET', 'test-secret')
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('asking for a link', () => {
  it('sends the claim email to a new address, and a sign-in email to one that claimed before', async () => {
    expect((await claim('jane.smith@kirkland.com')).status).toBe(200)
    expect(to('jane.smith@kirkland.com')[0].subject).toBe('Confirm your FundOpsHQ directory profile')
    expect(to('jane.smith@kirkland.com')[0].from).toMatch(/^FundOpsHQ Directory </)
    people[PERSON] = jane({ claimed_at: '2026-10-20T00:00:00Z' })
    earlierClaims = [{ id: 'c0', email: 'jane.smith@kirkland.com', confirmed_at: '2026-10-20T00:00:00Z' }]
    fetchMock.mockClear()
    expect((await claim('Jane.Smith@kirkland.com')).status).toBe(200)
    expect(to('jane.smith@kirkland.com')[0].subject).toBe('Sign in to edit your FundOpsHQ directory profile')
  })
  it('refuses a profile the desk hid', async () => {
    people[PERSON] = jane({ status: 'hidden', hidden_by: 'desk' })
    expect((await claim('jane.smith@kirkland.com')).status).toBe(404)
    expect(sent()).toHaveLength(0)
  })
})

describe('confirming', () => {
  it('a first claim: marked claimed, Danny alerted, the claimer told, a session tied to the claim', async () => {
    const res = await confirm()
    const json = await res.json()
    expect(json).toMatchObject({ outcome: 'confirmed', kind: 'claim', newsletter: null })
    expect(updates.find((u) => u.table === 'directory_people')?.values).toMatchObject({ claimed_email_domain: 'kirkland.com' })
    expect(toDanny()[0].subject).toBe('[Directory] Claimed: Jane Smith (Kirkland & Ellis)')
    expect(toDanny()[0].text).not.toContain('CHECK:')
    expect(to('jane.smith@kirkland.com')[0].subject).toBe('Your FundOpsHQ directory profile is claimed')
    expect(subscribe).not.toHaveBeenCalled()
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toContain(`fohq_dir_edit=${PERSON}.${CLAIM}.`)
  })
  it('a second claim from another address: Danny alerted again (flagged), the earlier claimer told', async () => {
    people[PERSON] = jane({ claimed_at: '2026-10-20T00:00:00Z' })
    earlierClaims = [{ id: 'c0', email: 'jane.smith@kirkland.com', confirmed_at: '2026-10-20T00:00:00Z' }]
    claimRow = { ...claimRow!, email: 'marketing@kirkland.com' }
    expect(await (await confirm()).json()).toMatchObject({ kind: 'claim' })
    expect(toDanny()[0].subject).toBe('[Directory] Claimed again: Jane Smith (Kirkland & Ellis)')
    expect(toDanny()[0].text).toContain('CHECK:')
    expect(toDanny()[0].text).toContain('Claimed before by: jane.smith@kirkland.com')
    expect(to('jane.smith@kirkland.com')[0].subject).toBe('Someone else claimed your FundOpsHQ directory profile')
  })
  it('a sign-in: the session opens, nobody is emailed', async () => {
    people[PERSON] = jane({ claimed_at: '2026-10-20T00:00:00Z' })
    earlierClaims = [{ id: 'c0', email: 'jane.smith@kirkland.com', confirmed_at: '2026-10-20T00:00:00Z' }]
    const res = await confirm()
    expect(await res.json()).toMatchObject({ outcome: 'confirmed', kind: 'signin' })
    expect(sent()).toHaveLength(0)
    expect(updates.filter((u) => u.table === 'directory_people')).toHaveLength(0)
    expect(res.headers.get('set-cookie')).toContain('fohq_dir_edit=')
  })
  it('the tick box signs the proven address up as a directory-claim signup', async () => {
    const json = await (await confirm(true)).json()
    expect(json.newsletter).toBe('subscribed')
    const body = JSON.parse(await (subscribe.mock.calls[0][0] as Request).text())
    expect(body).toEqual({ email: 'jane.smith@kirkland.com', form: 'directory-claim', page: '/directory/claim/confirm' })
  })
  it('a used or expired link does nothing', async () => {
    claimRow = { ...claimRow!, confirmed_at: '2026-10-20T00:00:00Z' }
    expect(await (await confirm()).json()).toEqual({ outcome: 'already' })
    claimRow = { ...claimRow!, confirmed_at: null, expires_at: '2020-01-01T00:00:00Z' }
    expect((await confirm()).status).toBe(410)
    expect(sent()).toHaveLength(0)
  })
  it('completes a move: the old additions arrive as pending edits, the old profile is hidden, not deleted', async () => {
    people[OLD] = jane({ id: OLD, slug: 'jane-smith-old', firm_domain: 'oldfirm.com', claimed_at: '2026-01-01', headline: 'Forms funds', description: 'At Old LLP.', photo_url: null, contact_url: 'https://oldfirm.com/jane', claimed_practice_areas: ['fund_formation'], notable: [] })
    moveRow = { id: 'm1', from_person_id: OLD }
    await confirm()
    const pending = updates.find((u) => u.table === 'directory_people' && 'pending_edits' in u.values)!.values
    expect(pending.pending_edits).toMatchObject({ headline: 'Forms funds', contact_url: null, submitted_by_claim: CLAIM, carried_from: 'jane-smith-old' })
    expect(updates.find((u) => u.table === 'directory_moves')?.values).toMatchObject({ status: 'verified', verified_claim_id: CLAIM })
    const hid = updates.find((u) => u.table === 'directory_people' && u.values.status === 'hidden')!
    expect(hid.values).toEqual({ status: 'hidden', hidden_by: 'desk' })
    expect(hid.filters).toContainEqual(['id', OLD])
    expect(toDanny()[0].text).toContain('Move completed from jane-smith-old')
  })
})

describe('counting a view', () => {
  const view = (headers: Record<string, string>, id = PERSON) =>
    VIEW(new Request('http://localhost/api/directory/view', { method: 'POST', headers, body: JSON.stringify({ id }) }))
  it('one upsert for a browser; nothing for a bot, a prefetch or the owner', async () => {
    expect((await view({ 'user-agent': CHROME, 'sec-fetch-site': 'same-origin' })).status).toBe(204)
    expect(rpcs).toEqual([{ fn: 'directory_count_view', args: { p_person: PERSON } }])
    await view({ 'user-agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' })
    await view({ 'user-agent': CHROME, 'next-router-prefetch': '1' })
    await view({ 'user-agent': CHROME, 'sec-fetch-site': 'cross-site' })
    cookieValue = signSession(PERSON, Date.now(), 'test-secret', CLAIM)!
    await view({ 'user-agent': CHROME })
    expect(rpcs).toHaveLength(1)
  })
  it('does nothing while the directory is off', async () => {
    vi.stubEnv('DIRECTORY_ENABLED', 'false')
    await view({ 'user-agent': CHROME })
    expect(rpcs).toHaveLength(0)
  })
})
