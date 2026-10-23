// @vitest-environment node
/**
 * The news submission routes (2026-10-22, v2): what is stored, what is
 * refused, who is emailed and when; and the confirm step. The database, the
 * subscribe route and Resend are all stubbed: nothing here reaches the network.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { hashToken } from '@/lib/submit/news-submission'

type Row = Record<string, unknown>
type Filter = [string, string, unknown]

let inserts: Row[]
let updates: { values: Row; filters: Filter[] }[]
let countQueries: Filter[][]
/** The count each query answers, by what it filters on. */
let counts: { ip: number; contactToday: number; contactWaiting: number; inReview: number; unconfirmedToday: number }
let insertError: { code: string; message: string } | null
let stored: Row | null
let updateRows: Row[]

function from(table: string) {
  expect(table).toBe('news_submissions')
  const filters: Filter[] = []
  let mode: 'count' | 'select' | 'insert' | 'update' = 'count'
  let values: Row = {}
  const has = (col: string, v?: unknown) => filters.some((f) => f[1] === col && (v === undefined || f[2] === v))
  const b = {
    select(_cols?: string, opts?: { head?: boolean }) {
      if (mode === 'update') return b
      mode = opts?.head ? 'count' : 'select'
      return b
    },
    eq(col: string, v: unknown) { filters.push(['eq', col, v]); return b },
    gte(col: string, v: unknown) { filters.push(['gte', col, v]); return b },
    in(col: string, v: unknown) { filters.push(['in', col, v]); return b },
    insert(r: Row) { mode = 'insert'; inserts.push(r); return b },
    update(r: Row) { mode = 'update'; values = r; return b },
    maybeSingle() {
      const hash = filters.find((f) => f[1] === 'confirm_token_hash')?.[2]
      return Promise.resolve({ data: stored && stored.confirm_token_hash === hash ? stored : null, error: null })
    },
    then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
      if (mode === 'insert') return Promise.resolve({ error: insertError }).then(resolve, reject)
      if (mode === 'update') {
        updates.push({ values, filters })
        return Promise.resolve({ data: updateRows, error: null }).then(resolve, reject)
      }
      countQueries.push(filters)
      const count = has('ip_hash')
        ? counts.ip
        : has('contact_email') && has('created_at')
          ? counts.contactToday
          : has('contact_email')
            ? counts.contactWaiting
            : has('status', 'pending')
              ? counts.inReview
              : counts.unconfirmedToday
      return Promise.resolve({ count, error: null }).then(resolve, reject)
    },
  }
  return b
}

vi.mock('@/lib/supabase/client', () => ({ getSupabaseAdmin: () => ({ from }) }))

const subscribe = vi.fn()
vi.mock('@/app/api/newsletter/subscribe/route', () => ({ POST: (req: Request) => subscribe(req) }))

import { POST } from '../route'
import { POST as CONFIRM } from '../confirm/route'

const fetchMock = vi.fn()
const today = new Date().toISOString().slice(0, 10)

const good = {
  kind: 'fund_close',
  firm: 'Example Capital',
  firm_website: 'example.com',
  headline: 'Example Capital closes Fund III at $450M',
  details: 'Above its $350M target, from pensions and endowments.',
  amount: '450M',
  currency: 'USD',
  news_date: today,
  url: 'https://www.example.com/news/fund-iii',
  person_name_0: 'Sam Lee',
  person_role_0: 'Managing Partner',
  contact_name: 'Pat Doe',
  contact_role: 'Head of IR',
  contact_email: 'pat@example.com',
}

function post(body: unknown, headers: Record<string, string> = { 'x-forwarded-for': '203.0.113.9' }) {
  return POST(
    new Request('http://localhost/api/news/submit', {
      method: 'POST',
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
}

function confirm(token: unknown) {
  return CONFIRM(new Request('http://localhost/api/news/submit/confirm', { method: 'POST', body: JSON.stringify({ token }) }))
}

/** The emails sent through Resend. */
const sent = () => fetchMock.mock.calls.filter(([url]) => String(url).includes('api.resend.com')).map(([, init]) => JSON.parse(init.body))
const toOwner = () => sent().filter((m) => m.to === 'dbloomstine@gmail.com')
const toSender = () => sent().filter((m) => m.to !== 'dbloomstine@gmail.com')
/** The token in the confirmation email's link. */
const linkToken = () => /\/submit\/confirm\?t=([A-Za-z0-9_-]{43})/.exec(toSender()[0].text)?.[1] ?? ''

beforeEach(() => {
  inserts = []
  updates = []
  countQueries = []
  counts = { ip: 0, contactToday: 0, contactWaiting: 0, inReview: 0, unconfirmedToday: 0 }
  insertError = null
  stored = null
  updateRows = [{ id: 'row-1' }]
  subscribe.mockReset()
  subscribe.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('RESEND_API_KEY', 're_test')
  vi.stubEnv('RESEND_FROM_EMAIL', 'feedback@fundopshq.com')
  vi.stubEnv('CRON_SECRET', 'test-secret')
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('a good submission', () => {
  it('is stored as unconfirmed with a token hash, and the sender gets a confirm link', async () => {
    const res = await post(good)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, confirm: 'sent' })
    expect(inserts).toHaveLength(1)
    const row = inserts[0]
    expect(row).toMatchObject({
      status: 'unconfirmed',
      kind: 'fund_close',
      firm: 'Example Capital',
      firm_website: 'https://example.com/',
      amount: 450_000_000,
      currency: 'USD',
      news_date: today,
      people: [{ name: 'Sam Lee', role: 'Managing Partner' }],
      contact_email: 'pat@example.com',
      domain_match: true,
    })
    expect(row.ip_hash).toMatch(/^[0-9a-f]{32}$/)
    expect(JSON.stringify(row)).not.toContain('203.0.113.9')

    const mails = toSender()
    expect(mails).toHaveLength(1)
    expect(mails[0]).toMatchObject({ from: 'FundOpsHQ News Desk <danny@fundopshq.com>', to: 'pat@example.com', reply_to: 'danny@fundopshq.com' })
    const token = linkToken()
    expect(row.confirm_token_hash).toBe(hashToken(token))
    expect(JSON.stringify(row)).not.toContain(token)
    const ttl = new Date(String(row.confirm_expires_at)).getTime() - Date.now()
    expect(ttl).toBeGreaterThan(7 * 86_400_000 - 60_000)
    expect(ttl).toBeLessThanOrEqual(7 * 86_400_000)
  })

  it('does not email the owner until the sender confirms', async () => {
    await post(good)
    expect(toOwner()).toHaveLength(0)
    expect(subscribe).not.toHaveBeenCalled()
  })

  it('stores only known columns, whatever else is sent', async () => {
    await post({ ...good, status: 'approved', review_notes: 'ok', id: 'x', ip_hash: 'forged', published_news_item_id: 'y', confirmed_at: 'now' })
    expect(Object.keys(inserts[0]).sort()).toEqual(
      [
        'amount', 'confirm_expires_at', 'confirm_token_hash', 'contact_email', 'contact_name', 'contact_role', 'currency',
        'details', 'domain_match', 'firm', 'firm_website', 'headline', 'ip_hash', 'kind', 'news_date', 'people', 'status',
        'url', 'wants_newsletter',
      ].sort(),
    )
    expect(inserts[0].status).toBe('unconfirmed')
    expect(inserts[0].ip_hash).not.toBe('forged')
  })

  it('flags, but accepts, an email whose domain is not the website’s', async () => {
    const res = await post({ ...good, contact_email: 'pat@placementagent.com' })
    expect(res.status).toBe(200)
    expect(inserts[0].domain_match).toBe(false)
  })

  it('tells the sender when the confirmation email could not go, and the owner', async () => {
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) =>
      JSON.parse(String(init.body)).to === 'pat@example.com' ? new Response('{}', { status: 500 }) : new Response('{}', { status: 200 }),
    )
    const res = await post(good)
    expect(await res.json()).toEqual({ success: true, confirm: 'failed' })
    expect(toOwner()[0].text).toContain('UNCONFIRMED')
  })
})

describe('refused', () => {
  it('free mail, with a friendly message naming the field', async () => {
    const res = await post({ ...good, contact_email: 'pat@gmail.com' })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.field).toBe('contact_email')
    expect(json.error).toMatch(/work email/)
    expect(inserts).toHaveLength(0)
    expect(sent()).toHaveLength(0)
  })

  it('a body that is not JSON, or not an object', async () => {
    for (const body of ['not json', '[1,2]', 'null', '"text"']) {
      expect((await post(body)).status).toBe(400)
    }
    expect(inserts).toHaveLength(0)
  })

  it('a missing website or date', async () => {
    expect((await (await post({ ...good, firm_website: '' })).json()).field).toBe('firm_website')
    expect((await (await post({ ...good, news_date: '' })).json()).field).toBe('news_date')
  })

  it('a fourth confirmation email to one address in a day (nobody’s inbox is flooded through us)', async () => {
    counts.contactToday = 3
    expect((await post(good)).status).toBe(429)
    expect(inserts).toHaveLength(0)
    expect(sent()).toHaveLength(0)
  })

  it('a sixth submission in a day from one IP address', async () => {
    counts.ip = 5
    expect((await post(good)).status).toBe(429)
    expect(inserts).toHaveLength(0)
  })

  it('a sixth waiting from one address, counting unconfirmed and pending', async () => {
    counts.contactWaiting = 5
    expect((await post(good)).status).toBe(429)
    const q = countQueries.find((f) => f.some((x) => x[0] === 'in'))
    expect(q?.find((x) => x[0] === 'in')?.[2]).toEqual(['unconfirmed', 'pending'])
  })

  it('anything once two hundred are in review, or a hundred unconfirmed today', async () => {
    counts.inReview = 200
    expect((await post(good)).status).toBe(429)
    counts.inReview = 0
    counts.unconfirmedToday = 100
    expect((await post(good)).status).toBe(429)
    expect(inserts).toHaveLength(0)
  })
})

describe('bots and spam', () => {
  it('the honeypot: told it worked, nothing stored or sent', async () => {
    const res = await post({ ...good, website: 'https://spam.example' })
    expect(await res.json()).toEqual({ success: true, confirm: 'sent' })
    expect(inserts).toHaveLength(0)
    expect(sent()).toHaveLength(0)
  })

  it('a fistful of links is kept as spam, and nobody is emailed', async () => {
    const res = await post({ ...good, details: 'https://a.example https://b.example www.c.example http://d.example' })
    expect(await res.json()).toEqual({ success: true, confirm: 'sent' })
    expect(inserts[0].status).toBe('spam')
    expect(inserts[0].confirm_token_hash).toBeUndefined()
    expect(sent()).toHaveLength(0)
  })
})

describe('when the database fails', () => {
  it('the owner gets the submission by email, marked not saved, and no confirm link goes out', async () => {
    insertError = { code: '42703', message: 'column "firm_website" does not exist' }
    const res = await post(good)
    expect(await res.json()).toEqual({ success: true, confirm: 'none' })
    expect(toSender()).toHaveLength(0)
    expect(toOwner()[0].text).toContain('NOT SAVED')
  })

  it('with no email either, the sender is told to try again', async () => {
    insertError = { code: '42703', message: 'nope' }
    vi.stubEnv('RESEND_API_KEY', '')
    expect((await post(good)).status).toBe(500)
  })
})

describe('the confirm step', () => {
  /** Submit, then keep the inserted row as the table's one row. */
  async function submitted(patch: Row = {}) {
    await post({ ...good, ...patch })
    const token = linkToken()
    stored = { id: 'row-1', ...inserts[0] }
    fetchMock.mockClear()
    return token
  }

  it('makes the row pending, once, and only then tells the owner', async () => {
    const token = await submitted()
    const res = await confirm(token)
    expect(await res.json()).toEqual({ outcome: 'confirmed', newsletter: null })
    expect(updates).toHaveLength(1)
    expect(updates[0].values.status).toBe('pending')
    expect(updates[0].values.confirmed_at).toBeTruthy()
    // The update itself checks the row is still unconfirmed: two clicks at once confirm it once.
    expect(updates[0].filters).toContainEqual(['eq', 'status', 'unconfirmed'])
    expect(toOwner()).toHaveLength(1)
    expect(toOwner()[0].text).toContain('pending review')
    expect(toOwner()[0].reply_to).toBe('pat@example.com')
  })

  it('a second click says already confirmed and emails nobody', async () => {
    const token = await submitted()
    stored = { ...stored, status: 'pending' }
    expect(await (await confirm(token)).json()).toEqual({ outcome: 'already' })
    expect(updates).toHaveLength(0)
    expect(sent()).toHaveLength(0)
  })

  it('losing a race to another click says already confirmed', async () => {
    const token = await submitted()
    updateRows = []
    expect(await (await confirm(token)).json()).toEqual({ outcome: 'already' })
    expect(toOwner()).toHaveLength(0)
  })

  it('an expired link is refused', async () => {
    const token = await submitted()
    stored = { ...stored, confirm_expires_at: new Date(Date.now() - 1000).toISOString() }
    const res = await confirm(token)
    expect(res.status).toBe(410)
    expect(await res.json()).toEqual({ outcome: 'expired' })
    expect(updates).toHaveLength(0)
  })

  it('an unknown, malformed or spam token is refused alike', async () => {
    const token = await submitted()
    expect((await confirm('x'.repeat(43))).status).toBe(404)
    expect((await confirm('short')).status).toBe(400)
    expect((await confirm(undefined)).status).toBe(400)
    stored = { ...stored, status: 'spam' }
    expect(await (await confirm(token)).json()).toEqual({ outcome: 'invalid' })
    expect(updates).toHaveLength(0)
  })

  it('subscribes the sender on confirmation if they ticked the box', async () => {
    const token = await submitted({ wants_newsletter: 'on' })
    expect(subscribe).not.toHaveBeenCalled()
    const res = await confirm(token)
    expect(await res.json()).toEqual({ outcome: 'confirmed', newsletter: 'subscribed' })
    const req: Request = subscribe.mock.calls[0][0]
    expect(await req.json()).toEqual({ email: 'pat@example.com', form: 'submit', page: '/submit' })
    expect(toOwner()[0].text).toContain('asked to subscribe (subscribed)')
  })
})
