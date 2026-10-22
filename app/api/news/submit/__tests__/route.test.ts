// @vitest-environment node
/**
 * The news submission route: what is stored, what is refused, who is emailed
 * and when the sender is subscribed. The database, the subscribe route and
 * Resend are all stubbed: nothing here reaches the network.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type Row = Record<string, unknown>
type Filter = [string, string, unknown]

let inserts: Row[]
let countQueries: Filter[][]
/** The count each query answers, by what it filters on. */
let counts: { ip: number; contact: number; queue: number }
let insertError: { code: string; message: string } | null
let countError: boolean

function from(table: string) {
  expect(table).toBe('news_submissions')
  const filters: Filter[] = []
  let mode: 'count' | 'insert' = 'count'
  const b = {
    select() { mode = 'count'; return b },
    eq(col: string, v: unknown) { filters.push(['eq', col, v]); return b },
    gte(col: string, v: unknown) { filters.push(['gte', col, v]); return b },
    insert(r: Row) { mode = 'insert'; inserts.push(r); return b },
    then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
      if (mode === 'insert') return Promise.resolve({ error: insertError }).then(resolve, reject)
      countQueries.push(filters)
      if (countError) return Promise.resolve({ count: null, error: { message: 'relation does not exist' } }).then(resolve, reject)
      const has = (col: string) => filters.some((f) => f[1] === col)
      const count = has('ip_hash') ? counts.ip : has('contact_email') ? counts.contact : counts.queue
      return Promise.resolve({ count, error: null }).then(resolve, reject)
    },
  }
  return b
}

vi.mock('@/lib/supabase/client', () => ({ getSupabaseAdmin: () => ({ from }) }))

const subscribe = vi.fn()
vi.mock('@/app/api/newsletter/subscribe/route', () => ({ POST: (req: Request) => subscribe(req) }))

import { POST } from '../route'

const fetchMock = vi.fn()

const good = {
  firm: 'Example Capital',
  kind: 'fund_close',
  headline: 'Example Capital closes Fund III at $450M',
  details: 'Above its $350M target.',
  url: 'https://www.example.com/news/fund-iii',
  contact_name: 'Pat Doe',
  contact_email: 'pat@example.com',
  contact_role: 'Head of IR',
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

/** The emails sent through Resend. */
const sent = () => fetchMock.mock.calls.filter(([url]) => String(url).includes('api.resend.com')).map(([, init]) => JSON.parse(init.body))

beforeEach(() => {
  inserts = []
  countQueries = []
  counts = { ip: 0, contact: 0, queue: 0 }
  insertError = null
  countError = false
  subscribe.mockReset()
  subscribe.mockResolvedValue(new Response(JSON.stringify({ success: true, preferencesToken: 'tok' }), { status: 200 }))
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
  it('is stored as pending, with a hash of the IP and never the IP itself', async () => {
    const res = await post(good)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, newsletter: null })
    expect(inserts).toHaveLength(1)
    const row = inserts[0]
    expect(row).toMatchObject({
      status: 'pending',
      kind: 'fund_close',
      firm: 'Example Capital',
      headline: 'Example Capital closes Fund III at $450M',
      details: 'Above its $350M target.',
      url: 'https://www.example.com/news/fund-iii',
      contact_name: 'Pat Doe',
      contact_email: 'pat@example.com',
      contact_role: 'Head of IR',
      wants_newsletter: false,
    })
    expect(row.ip_hash).toMatch(/^[0-9a-f]{32}$/)
    expect(JSON.stringify(row)).not.toContain('203.0.113.9')
  })

  it('stores only the columns of the table, whatever else is sent', async () => {
    await post({ ...good, status: 'accepted', review_notes: 'approved by Danny', id: 'x', ip_hash: 'forged' })
    expect(Object.keys(inserts[0]).sort()).toEqual(
      ['contact_email', 'contact_name', 'contact_role', 'details', 'firm', 'headline', 'ip_hash', 'kind', 'status', 'url', 'wants_newsletter'].sort(),
    )
    expect(inserts[0].status).toBe('pending')
    expect(inserts[0].ip_hash).not.toBe('forged')
  })

  it('emails the owner a plain-text alert marked unverified, replying to the sender', async () => {
    await post(good)
    const mails = sent()
    expect(mails).toHaveLength(1)
    expect(mails[0]).toMatchObject({
      from: 'FundOpsHQ News Desk <feedback@fundopshq.com>',
      to: 'dbloomstine@gmail.com',
      reply_to: 'pat@example.com',
      subject: '[News submission] Fund close: Example Capital — Example Capital closes Fund III at $450M',
    })
    expect(mails[0].html).toBeUndefined()
    expect(mails[0].text).toContain('UNVERIFIED')
    expect(mails[0].text).toContain('https://www.example.com/news/fund-iii')
  })

  it('does not subscribe anyone who did not tick the box', async () => {
    await post(good)
    expect(subscribe).not.toHaveBeenCalled()
  })

  it('still succeeds when the alert cannot be sent', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    const res = await post(good)
    expect(res.status).toBe(200)
    expect(inserts).toHaveLength(1)
  })
})

describe('the newsletter tick', () => {
  it('subscribes the sender through the subscribe route, form "submit"', async () => {
    const res = await post({ ...good, wants_newsletter: 'on', attribution: { source: 'linkedin', medium: 'post' } })
    expect(await res.json()).toEqual({ success: true, newsletter: 'subscribed' })
    expect(subscribe).toHaveBeenCalledTimes(1)
    const req: Request = subscribe.mock.calls[0][0]
    expect(await req.json()).toEqual({
      email: 'pat@example.com',
      form: 'submit',
      page: '/submit',
      attribution: { source: 'linkedin', medium: 'post' },
    })
    expect(inserts[0].wants_newsletter).toBe(true)
    expect(sent()[0].text).toContain('asked to subscribe (subscribed)')
  })

  it('says so when the address is already on the list', async () => {
    subscribe.mockResolvedValue(new Response(JSON.stringify({ success: true, message: 'Already subscribed' }), { status: 200 }))
    const res = await post({ ...good, wants_newsletter: true })
    expect(await res.json()).toEqual({ success: true, newsletter: 'already' })
  })

  it('a failed signup does not fail the submission', async () => {
    subscribe.mockResolvedValue(new Response(JSON.stringify({ error: 'Failed to subscribe' }), { status: 500 }))
    const res = await post({ ...good, wants_newsletter: 'on' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, newsletter: 'failed' })
    subscribe.mockRejectedValue(new Error('boom'))
    const again = await post({ ...good, wants_newsletter: 'on' })
    expect(await again.json()).toEqual({ success: true, newsletter: 'failed' })
  })
})

describe('refused', () => {
  it('a body that is not JSON, or not an object', async () => {
    for (const body of ['not json', '[1,2]', 'null', '"text"']) {
      const res = await post(body)
      expect(res.status).toBe(400)
    }
    expect(inserts).toHaveLength(0)
  })

  it('a submission without the announcement link, naming the field', async () => {
    const res = await post({ ...good, url: '' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'A link to the announcement is required', field: 'url' })
    expect(inserts).toHaveLength(0)
    expect(sent()).toHaveLength(0)
  })

  it('a link that is not a web address', async () => {
    const res = await post({ ...good, url: 'javascript:alert(document.cookie)' })
    expect(res.status).toBe(400)
    expect((await res.json()).field).toBe('url')
  })

  it('a sixth submission in a day from one IP address', async () => {
    counts.ip = 5
    const res = await post(good)
    expect(res.status).toBe(429)
    expect(inserts).toHaveLength(0)
    expect(sent()).toHaveLength(0)
    const ipQuery = countQueries.find((q) => q.some((f) => f[1] === 'ip_hash'))
    expect(ipQuery?.some((f) => f[0] === 'gte' && f[1] === 'created_at')).toBe(true)
  })

  it('a sixth waiting submission from one contact address', async () => {
    counts.contact = 5
    expect((await post(good)).status).toBe(429)
    expect(inserts).toHaveLength(0)
  })

  it('anything once two hundred are waiting', async () => {
    counts.queue = 200
    expect((await post(good)).status).toBe(429)
    expect(inserts).toHaveLength(0)
  })
})

describe('bots and spam', () => {
  it('the honeypot: told it worked, nothing stored, sent or subscribed', async () => {
    const res = await post({ ...good, wants_newsletter: 'on', website: 'https://spam.example' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(inserts).toHaveLength(0)
    expect(sent()).toHaveLength(0)
    expect(subscribe).not.toHaveBeenCalled()
  })

  it('a fistful of links is kept as spam, without an email or a signup', async () => {
    const res = await post({
      ...good,
      wants_newsletter: 'on',
      details: 'https://a.example https://b.example www.c.example http://d.example',
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(inserts[0].status).toBe('spam')
    expect(sent()).toHaveLength(0)
    expect(subscribe).not.toHaveBeenCalled()
  })
})

describe('when the database fails', () => {
  it('a failed insert still reaches the owner by email, marked not saved', async () => {
    insertError = { code: '42P01', message: 'relation "news_submissions" does not exist' }
    countError = true
    const res = await post(good)
    expect(res.status).toBe(200)
    expect(sent()[0].text).toContain('NOT SAVED')
  })

  it('a failed insert with no email either tells the sender to try again', async () => {
    insertError = { code: '42P01', message: 'relation "news_submissions" does not exist' }
    vi.stubEnv('RESEND_API_KEY', '')
    const res = await post(good)
    expect(res.status).toBe(500)
  })

  it('without an IP address it stores no hash and skips the per-address count', async () => {
    const res = await post(good, {})
    expect(res.status).toBe(200)
    expect(inserts[0].ip_hash).toBeNull()
    expect(countQueries.some((q) => q.some((f) => f[1] === 'ip_hash'))).toBe(false)
  })
})
