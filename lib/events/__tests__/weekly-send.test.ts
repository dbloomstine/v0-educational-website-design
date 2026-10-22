import { describe, it, expect, vi } from 'vitest'

// The send reads the board through ./api only when no loader is handed in; keep the real one out of the test.
vi.mock('../api', () => ({ queryEventFeed: vi.fn(async () => ({ events: [] })) }))

import { OWNER_EMAIL, commonestCity, pickWeeklyReaders, runEventsWeekly } from '../weekly-send'
import { FIXTURE_EVENTS } from './weekly-fixture'

const MONDAY_645 = new Date('2026-10-26T10:45:00Z')
const tok = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const READERS = [
  { id: 'a', email: 'chi@example.com', unsubscribe_token: tok(1), interests: ['PE', 'events', 'city:chicago'] },
  { id: 'b', email: 'all@example.com', unsubscribe_token: tok(2), interests: ['events'] },
  { id: 'c', email: 'chi2@example.com', unsubscribe_token: tok(3), interests: ['events', 'city:chicago'] },
  { id: 'd', email: 'news-only@example.com', unsubscribe_token: tok(4), interests: ['PE'] },
  { id: 'e', email: 'CHI@example.com', unsubscribe_token: tok(5), interests: ['events'] },
]

function fakeDb(opts: { readers?: unknown[]; insertError?: { code?: string; message: string } | null; existingStatus?: string } = {}) {
  const tables: string[] = []
  const inserts: unknown[] = []
  const updates: unknown[] = []
  const chain = (result: () => unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = {}
    for (const m of ['select', 'eq', 'contains', 'limit']) c[m] = () => c
    c.maybeSingle = () => Promise.resolve(result())
    c.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(result()).then(res, rej)
    return c
  }
  const db = {
    from(table: string) {
      tables.push(table)
      return {
        select: () =>
          table === 'newsletter_subscribers'
            ? chain(() => ({ data: opts.readers ?? READERS, error: null }))
            : chain(() => ({ data: { status: opts.existingStatus ?? 'sent' }, error: null })),
        insert: (row: unknown) => {
          inserts.push(row)
          return Promise.resolve({ error: opts.insertError ?? null })
        },
        update: (row: unknown) => {
          updates.push(row)
          return chain(() => ({ error: null }))
        },
      }
    },
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { db: db as any, tables, inserts, updates }
}

type Sent = { to: string; subject: string; html: string; text: string; headers?: Record<string, string> }
function fakeResend() {
  const batches: Sent[][] = []
  const fetchFn = vi.fn(async (_url: unknown, init?: { body?: unknown }) => {
    const batch = JSON.parse(String(init?.body)) as Sent[]
    batches.push(batch)
    return new Response(JSON.stringify({ data: batch.map((_, i) => ({ id: `re_${i}` })) }), { status: 200 })
  })
  return { batches, fetchFn: fetchFn as unknown as typeof fetch, calls: fetchFn }
}

const run = (mode: 'off' | 'preview' | 'live', db: ReturnType<typeof fakeDb>, resend: ReturnType<typeof fakeResend>, events = FIXTURE_EVENTS) =>
  runEventsWeekly({ db: db.db, mode, resendApiKey: 'test', now: MONDAY_645, loadEvents: async () => events, fetchFn: resend.fetchFn })

describe('who the Monday email goes to', () => {
  it('is the confirmed readers who asked for the events, each address once', () => {
    expect(pickWeeklyReaders(READERS).map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })
  it('previews for the city most of them follow', () => {
    expect(commonestCity(pickWeeklyReaders(READERS))).toBe('chicago')
    expect(commonestCity([])).toBeNull()
  })
})

describe('the switch', () => {
  it('off: reads nothing and sends nothing', async () => {
    const db = fakeDb()
    const resend = fakeResend()
    expect(await run('off', db, resend)).toEqual({ ok: true, mode: 'off', skipped: 'off' })
    expect(db.tables).toEqual([])
    expect(resend.calls).not.toHaveBeenCalled()
  })

  it('preview: one email, to the owner only, marked as a preview', async () => {
    const db = fakeDb()
    const resend = fakeResend()
    const result = await run('preview', db, resend)
    expect(result).toMatchObject({ ok: true, mode: 'preview', weekOf: '2026-10-26', sent: 1, readers: 3 })
    const all = resend.batches.flat()
    expect(all).toHaveLength(1)
    expect(all[0].to).toBe(OWNER_EMAIL)
    expect(all[0].subject).toBe('[PREVIEW] Chicago this week: 2 fund events, plus 4 across North America')
    expect(all[0].text).toContain('would go to 3 readers')
    expect(db.inserts).toEqual([{ week_of: '2026-10-26', mode: 'preview', status: 'sending' }])
  })

  it('live: each opted-in reader, their city first, with a one-click stop for this email only', async () => {
    const db = fakeDb()
    const resend = fakeResend()
    const result = await run('live', db, resend)
    expect(result).toMatchObject({ ok: true, mode: 'live', sent: 3, readers: 3, thisWeek: 6, nextWeek: 3 })
    const all = resend.batches.flat()
    expect(all.map((e) => e.to)).toEqual(['chi@example.com', 'all@example.com', 'chi2@example.com'])
    expect(all[0].subject).toBe('Chicago this week: 2 fund events, plus 4 across North America')
    expect(all[1].subject).toBe('This week: 6 fund events across North America')
    const stop = `https://fundopshq.com/api/newsletter/events-unsubscribe?token=${tok(1)}`
    expect(all[0].headers).toEqual({ 'List-Unsubscribe': `<${stop}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' })
    expect(all[0].html).toContain(`href="${stop}"`)
    expect(all[0].html).toContain(`href="https://fundopshq.com/api/newsletter/unsubscribe?token=${tok(1)}"`)
    expect(all[0].text).toContain(stop)
    for (const e of all) expect(e.html + e.text).not.toMatch(/__FUNDOPS_/)
    // Each reader's links are their own.
    expect(all[1].html).not.toContain(tok(1))
    expect(db.updates.at(-1)).toMatchObject({ status: 'sent', recipient_count: 3 })
  })

  it('sends a week once: a second run after a good send does nothing', async () => {
    const db = fakeDb({ insertError: { code: '23505', message: 'duplicate key' }, existingStatus: 'sent' })
    const resend = fakeResend()
    expect(await run('live', db, resend)).toMatchObject({ ok: true, skipped: 'already_sent' })
    expect(resend.calls).not.toHaveBeenCalled()
  })

  it('tries again after a run that sent nothing', async () => {
    const db = fakeDb({ insertError: { code: '23505', message: 'duplicate key' }, existingStatus: 'failed' })
    const resend = fakeResend()
    expect(await run('live', db, resend)).toMatchObject({ ok: true, sent: 3 })
  })

  it('refuses to send without its table', async () => {
    const db = fakeDb({ insertError: { code: '42P01', message: 'relation "events_weekly_sends" does not exist' } })
    const resend = fakeResend()
    const result = await run('live', db, resend)
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/20261022_events_weekly_sends\.sql/)
    expect(resend.calls).not.toHaveBeenCalled()
  })

  it('sends nothing in a week with no events', async () => {
    const db = fakeDb()
    const resend = fakeResend()
    expect(await run('live', db, resend, [])).toMatchObject({ ok: true, skipped: 'no_events' })
    expect(resend.calls).not.toHaveBeenCalled()
  })
})
