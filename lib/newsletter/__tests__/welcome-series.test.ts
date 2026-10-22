import { describe, it, expect } from 'vitest'
import {
  WELCOME_SERIES_START,
  decideStep,
  dueOn,
  hasHumanClick,
  hasSignOfReading,
  isHouseAddress,
  isNewSubscriber,
  nextAction,
  nextSendDay,
  nyDate,
  seriesPlan,
  seriesWindowOpen,
  welcomeSeriesEnabled,
  type ReaderEvent,
  type SeriesRow,
  type SeriesSubscriber,
} from '../welcome-series-schedule'
import { renderSeriesEmail, SERIES_COPY, type SeriesContext } from '../welcome-series'
import { runWelcomeSeries, SERIES_TABLE } from '../welcome-series-send'

// 2026-10-23 is a Friday; New York leaves daylight saving on Sunday 2026-11-01.

describe('schedule: days, the weekend rule, New York time', () => {
  it('a Tuesday signup: Day 1, 3, 6 (Monday, so Tuesday) and 10', () => {
    expect(seriesPlan('2026-10-27')).toEqual({ 1: '2026-10-28', 2: '2026-10-30', 3: '2026-11-03', 4: '2026-11-06' })
  })

  it('a Friday signup (the draft\'s worst case): Tuesday, Thursday, then the two-day gap keeps pushing', () => {
    expect(seriesPlan('2026-10-23')).toEqual({ 1: '2026-10-27', 2: '2026-10-29', 3: '2026-11-03', 4: '2026-11-05' })
  })

  it('never sends on a Saturday, Sunday or Monday, and keeps two days between emails', () => {
    for (let d = 0; d < 14; d++) {
      const signup = new Date(Date.UTC(2026, 9, 23 + d)).toISOString().slice(0, 10)
      const plan = Object.values(seriesPlan(signup))
      for (const date of plan) expect([2, 3, 4, 5]).toContain(new Date(`${date}T12:00:00Z`).getUTCDay())
      for (let i = 1; i < plan.length; i++) {
        expect((Date.parse(plan[i]) - Date.parse(plan[i - 1])) / 86_400_000).toBeGreaterThanOrEqual(2)
      }
      expect(plan[0] > signup).toBe(true) // never the day of the welcome note
    }
  })

  it('slides to the next Tuesday', () => {
    expect(nextSendDay('2026-10-31')).toBe('2026-11-03') // Saturday
    expect(nextSendDay('2026-11-02')).toBe('2026-11-03') // Monday
    expect(nextSendDay('2026-11-04')).toBe('2026-11-04')
  })

  it('the gap counts from the last email actually sent', () => {
    expect(dueOn(2, '2026-10-27', null)).toBe('2026-10-30')
    expect(dueOn(2, '2026-10-27', '2026-10-29')).toBe('2026-11-03') // Day 3 is Friday, but two days after Thursday is Saturday
  })

  it('the signup date is the New York date of confirmed_at', () => {
    expect(nyDate('2026-10-24T02:00:00Z')).toBe('2026-10-23') // 10pm EDT
    expect(nyDate('2026-11-05T04:30:00Z')).toBe('2026-11-04') // 11:30pm EST
  })

  it('the send window is 12:30 ET either side of daylight saving, Tuesday to Friday only', () => {
    expect(seriesWindowOpen(new Date('2026-10-28T16:30:00Z'))).toBe(true) // Wed 12:30 EDT
    expect(seriesWindowOpen(new Date('2026-10-28T15:30:00Z'))).toBe(false) // 11:30 EDT
    expect(seriesWindowOpen(new Date('2026-11-04T16:30:00Z'))).toBe(false) // Wed 11:30 EST
    expect(seriesWindowOpen(new Date('2026-11-04T17:30:00Z'))).toBe(true) // 12:30 EST
    expect(seriesWindowOpen(new Date('2026-11-04T20:30:00Z'))).toBe(true) // 15:30 EST, a retry
    expect(seriesWindowOpen(new Date('2026-10-26T16:30:00Z'))).toBe(false) // Monday
    expect(seriesWindowOpen(new Date('2026-10-31T16:30:00Z'))).toBe(false) // Saturday
  })

  it('the switch is off unless set', () => {
    expect(welcomeSeriesEnabled({})).toBe(false)
    expect(welcomeSeriesEnabled({ WELCOME_SERIES_ENABLED: 'false' })).toBe(false)
    expect(welcomeSeriesEnabled({ WELCOME_SERIES_ENABLED: 'true' })).toBe(true)
  })
})

const sub = (over: Partial<SeriesSubscriber> = {}): SeriesSubscriber => ({
  id: '11111111-1111-4111-8111-111111111111',
  email: 'reader@firm.com',
  status: 'confirmed',
  confirmed_at: '2026-10-27T14:00:00Z', // Tuesday
  created_at: '2026-10-27T14:00:00Z',
  interests: [],
  ...over,
})
const row = (step: number, over: Partial<SeriesRow> = {}): SeriesRow => ({
  step,
  status: 'sent',
  created_at: '2026-10-28T16:31:00Z',
  sent_at: '2026-10-28T16:31:00Z',
  ...over,
})

describe('who gets it, and which step is next', () => {
  it('new subscribers only: anyone who first signed up before the launch never gets it', () => {
    expect(WELCOME_SERIES_START).toBe('2026-10-23T00:00:00-04:00')
    expect(isNewSubscriber({ created_at: '2026-10-23T04:00:00Z', confirmed_at: '2026-10-23T04:00:00Z' })).toBe(true)
    expect(isNewSubscriber({ created_at: '2026-10-22T20:00:00Z', confirmed_at: '2026-10-22T20:00:00Z' })).toBe(false)
    // an existing reader who unsubscribed and comes back after launch (confirmed_at reset, created_at not)
    expect(isNewSubscriber({ created_at: '2026-09-01T12:00:00Z', confirmed_at: '2026-10-28T12:00:00Z' })).toBe(false)
    expect(nextAction(sub({ created_at: '2026-09-01T12:00:00Z' }), [], '2026-10-28')).toEqual({ kind: 'done', reason: 'not_eligible' })
  })

  it('never Danny, the house domain or test addresses', () => {
    for (const e of ['dbloomstine@gmail.com', 'dbloomstine+x@gmail.com', 'danny@fundopshq.com', 'a@example.com', 'x@foo.test']) expect(isHouseAddress(e)).toBe(true)
    expect(isHouseAddress('cfo@firm.com')).toBe(false)
    expect(isHouseAddress('qa@firm.com', ['QA@firm.com'])).toBe(true)
  })

  it('unsubscribed readers are not in it', () => {
    expect(nextAction(sub({ status: 'unsubscribed' }), [], '2026-10-28').kind).toBe('done')
  })

  it('step 1 is due the day after signup, not before, and not on the welcome day', () => {
    expect(nextAction(sub(), [], '2026-10-27')).toEqual({ kind: 'wait', step: 1, dueOn: '2026-10-28' })
    expect(nextAction(sub(), [], '2026-10-28')).toEqual({ kind: 'due', step: 1, dueOn: '2026-10-28', late: false, retry: false })
  })

  it('dedupe: a step with a row is never due again, and the next step waits for its day', () => {
    expect(nextAction(sub(), [row(1)], '2026-10-28')).toEqual({ kind: 'wait', step: 2, dueOn: '2026-10-30' })
    expect(nextAction(sub(), [row(1), row(2, { sent_at: '2026-10-30T16:31:00Z', created_at: '2026-10-30T16:31:00Z' })], '2026-10-30').kind).toBe('wait')
    const all = [1, 2, 3, 4].map((s) => row(s))
    expect(nextAction(sub(), all, '2026-11-20')).toEqual({ kind: 'done', reason: 'complete' })
  })

  it('a skipped step 1 does not push step 2 (no email went, so no gap)', () => {
    const skipped = row(1, { status: 'skipped', skip_reason: 'has_interests', sent_at: null })
    expect(nextAction(sub(), [skipped], '2026-10-30')).toMatchObject({ kind: 'due', step: 2, dueOn: '2026-10-30' })
  })

  it('a run that died mid-send stops the series rather than risk a second copy', () => {
    expect(nextAction(sub(), [row(1, { status: 'sending', sent_at: null })], '2026-11-03')).toEqual({ kind: 'done', reason: 'stuck' })
  })

  it('a failed step is retried up to three attempts, then stops', () => {
    expect(nextAction(sub(), [row(1, { status: 'failed', sent_at: null, attempts: 1 })], '2026-10-29')).toMatchObject({ kind: 'due', step: 1, retry: true })
    expect(nextAction(sub(), [row(1, { status: 'failed', sent_at: null, attempts: 3 })], '2026-10-30')).toEqual({ kind: 'done', reason: 'stuck' })
  })

  it('a bounce, a complaint or an unsubscribe on record ends it', () => {
    for (const reason of ['bounced', 'complained', 'unsubscribed']) {
      expect(nextAction(sub(), [row(1), row(2, { status: 'skipped', skip_reason: reason, sent_at: null })], '2026-11-05')).toEqual({ kind: 'done', reason: 'exited' })
    }
  })

  it('no re-entry: a reader who left mid-series and came back (confirmed_at reset) is done', () => {
    const back = sub({ confirmed_at: '2026-11-10T14:00:00Z' })
    expect(nextAction(back, [row(1)], '2026-11-11')).toEqual({ kind: 'done', reason: 'reentry' })
  })

  it('a step more than two send days late is due as late (the runner records a skip)', () => {
    expect(nextAction(sub(), [], '2026-10-30')).toMatchObject({ kind: 'due', step: 1, late: false }) // Wed due, Fri still fine
    expect(nextAction(sub(), [], '2026-11-03')).toMatchObject({ kind: 'due', step: 1, late: true })
    expect(decideStep(1, { interests: [], signOfReading: false, late: true })).toEqual({ skip: 'late' })
  })
})

describe('skip rules and the no-clicks branch', () => {
  it('step 1 is skipped when story interests are on file at send time; an events opt-in is not an answer', () => {
    expect(decideStep(1, { interests: ['PE'], signOfReading: false })).toEqual({ skip: 'has_interests' })
    expect(decideStep(1, { interests: ['events', 'city:chicago'], signOfReading: false })).toEqual({ send: '1' })
    expect(decideStep(1, { interests: null, signOfReading: false })).toEqual({ send: '1' })
  })

  const at = (iso: string, plusMs: number) => new Date(Date.parse(iso) + plusMs).toISOString()
  const SENT = '2026-10-29T11:30:00Z'
  const ev = (type: ReaderEvent['type'], ms: number, id = 'e1'): ReaderEvent => ({ resend_email_id: id, type, occurred_at: at(SENT, ms), sent_at: SENT })

  it('a human click is a sign of reading; a scanner click is not; opens never are', () => {
    expect(hasHumanClick([ev('delivered', 1000), ev('clicked', 3_600_000)])).toBe(true)
    expect(hasHumanClick([ev('delivered', 1000), ev('clicked', 20_000)])).toBe(false) // within a minute of delivery
    expect(hasHumanClick([ev('delivered', 1000), ev('opened', 600_000), ev('clicked', 601_000)])).toBe(false) // open-then-click scanner
    expect(hasHumanClick([ev('delivered', 1000), ev('opened', 600_000)])).toBe(false)
    expect(hasHumanClick([])).toBe(false)
  })

  it('step 3 sends 3 to readers with a sign of reading, 3b to the rest', () => {
    const clicked = [ev('delivered', 1000), ev('clicked', 3_600_000)]
    expect(decideStep(3, { interests: [], signOfReading: hasSignOfReading([], clicked) })).toEqual({ send: '3' })
    expect(decideStep(3, { interests: ['credit'], signOfReading: hasSignOfReading(['credit'], []) })).toEqual({ send: '3' })
    expect(decideStep(3, { interests: [], signOfReading: hasSignOfReading([], [ev('opened', 600_000)]) })).toEqual({ send: '3b' })
  })

  it('steps 2 and 4 go to everyone still confirmed', () => {
    expect(decideStep(2, { interests: ['PE'], signOfReading: false })).toEqual({ send: '2' })
    expect(decideStep(4, { interests: [], signOfReading: false })).toEqual({ send: '4' })
  })
})

const CTX: SeriesContext = {
  unsubscribeUrl: 'https://fundopshq.com/api/newsletter/unsubscribe?token=T',
  preferencesUrl: 'https://fundopshq.com/preferences?token=T',
  interestToken: 'TOKEN',
  audience: { readers: 161, firms: 98 },
}

describe('copy', () => {
  const keys = ['1', '2', '3', '3b', '4'] as const
  it('house rules: no "educational", no exclamation marks, the audience phrase as written, no price', () => {
    for (const k of keys) {
      const e = renderSeriesEmail(k, CTX)
      const words = `${e.subject} ${e.preheader} ${e.text} ${e.html ?? ''}`
      expect(words.toLowerCase()).not.toContain('educational')
      expect(e.text).not.toMatch(/!/)
      expect(words).not.toMatch(/\$\d[\d,]*(\s*\/\s*|\s+a\s+)week/)
      expect(words).not.toMatch(/GPs, LPs and fund service providers|GPs, LPs or fund service providers/)
    }
    expect(renderSeriesEmail('4', CTX).text).toContain('GPs, LPs, and fund service providers')
  })

  it('every email carries its unsubscribe link; 3b is plain text only', () => {
    for (const k of keys) expect(renderSeriesEmail(k, CTX).text).toContain(CTX.unsubscribeUrl)
    expect(renderSeriesEmail('3b', CTX).html).toBeNull()
    expect(renderSeriesEmail('1', CTX).html).toContain(CTX.unsubscribeUrl)
  })

  it('Email 1 has the one-click row; without a token, only the preferences link', () => {
    expect(renderSeriesEmail('1', CTX).html).toContain('/api/newsletter/interest?t=TOKEN&amp;i=credit')
    const bare = renderSeriesEmail('1', { ...CTX, interestToken: null })
    expect(bare.html).not.toContain('/api/newsletter/interest')
    expect(bare.html).toContain('preferences?token=T')
  })

  it('Email 3 mentions the Monday events email only while it is live; the league-tables button is tagged', () => {
    expect(renderSeriesEmail('3', CTX).text).not.toContain('every Monday')
    expect(renderSeriesEmail('3', { ...CTX, eventsMondayLive: true }).text).toContain('every Monday')
    expect(renderSeriesEmail('3', CTX).html).toContain('league-tables?utm_source=welcome&amp;utm_medium=email&amp;utm_campaign=welcome3')
  })

  it('Email 4 drops the reader line without both counts, and has the sponsor P.S. without a price', () => {
    expect(renderSeriesEmail('4', CTX).text).toContain('161 readers at 98 firms')
    expect(renderSeriesEmail('4', { ...CTX, audience: { readers: 161, firms: null } }).text).not.toContain('readers at')
    const e = renderSeriesEmail('4', CTX)
    expect(e.text).toContain('P.S. Want your firm in front of these readers?')
    expect(e.text).toContain('https://fundopshq.com/sponsor')
    expect(e.html).toContain('mailto:?subject=Thought%20this%20was%20worth%20passing%20along')
    expect(decodeURIComponent(e.html!.match(/mailto:[^"]+/)![0])).toContain('utm_campaign=welcome4')
  })

  it('subjects are the draft\'s lead options', () => {
    expect(SERIES_COPY['1'].subject).toBe('What do you follow?')
    expect(SERIES_COPY['3b'].subject).toBe('Is FundOps Daily reaching you?')
  })
})

// ─── The runner, against an in-memory database ──────────────────────────

type Row = Record<string, unknown>

function memoryDb(seed: Record<string, Row[]>) {
  const tables: Record<string, Row[]> = { [SERIES_TABLE]: [], newsletter_events: [], newsletter_editions: [], ...seed }
  let clock = 0
  const writes: Array<{ table: string; op: string; row: Row }> = []
  function query(table: string) {
    const filters: Array<(r: Row) => boolean> = []
    let order: { col: string; asc: boolean } | null = null
    let lim = Infinity
    let op: { kind: 'select' } | { kind: 'update'; patch: Row; returning: boolean } = { kind: 'select' }
    const run = () => {
      if (!(table in tables)) return { data: null, error: { message: `relation "${table}" does not exist`, code: '42P01' } }
      let rows = tables[table].filter((r) => filters.every((f) => f(r)))
      if (op.kind === 'update') {
        const patch = op.patch
        rows.forEach((r) => Object.assign(r, patch))
        rows.forEach(() => writes.push({ table, op: "update", row: { ...patch } }))
        return { data: op.returning ? rows : null, error: null }
      }
      if (order) {
        const o = order
        rows = [...rows].sort((a, b) => String(a[o.col]).localeCompare(String(b[o.col])) * (o.asc ? 1 : -1))
      }
      return { data: rows.slice(0, lim), error: null }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = {
      select: () => {
        if (op.kind === 'update') op.returning = true
        return q
      },
      eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), q),
      gte: (c: string, v: string) => (filters.push((r) => String(r[c]) >= v), q),
      in: (c: string, vs: unknown[]) => (filters.push((r) => vs.includes(r[c])), q),
      order: (col: string, o: { ascending: boolean }) => ((order = { col, asc: o.ascending }), q),
      limit: (n: number) => ((lim = n), q),
      maybeSingle: () => {
        const r = run()
        return Promise.resolve({ data: Array.isArray(r.data) ? (r.data[0] ?? null) : null, error: r.error })
      },
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(run()).then(res, rej),
      update: (patch: Row) => ((op = { kind: 'update', patch, returning: false }), q),
      insert: (row: Row) => {
        if (!(table in tables)) return Promise.resolve({ error: { message: 'missing', code: '42P01' } })
        if (table === SERIES_TABLE && tables[table].some((r) => r.subscriber_id === row.subscriber_id && r.step === row.step)) {
          return Promise.resolve({ error: { message: 'duplicate key', code: '23505' } })
        }
        const full = { attempts: 1, created_at: new Date(Date.parse('2026-10-28T16:30:00Z') + clock++ * 1000).toISOString(), sent_at: null, resend_email_id: null, ...row }
        tables[table].push(full)
        writes.push({ table, op: 'insert', row: full })
        return Promise.resolve({ error: null })
      },
    }
    return q
  }
  return { db: { from: (t: string) => query(t) }, tables, writes }
}

const READER = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'reader@firm.com',
  status: 'confirmed',
  unsubscribe_token: '33333333-3333-4333-8333-333333333333',
  interests: [] as string[],
  confirmed_at: '2026-10-27T14:00:00Z',
  created_at: '2026-10-27T14:00:00Z',
}
const WED_1230 = new Date('2026-10-28T16:30:00Z')

function fakeResend() {
  const sent: Array<Record<string, unknown>> = []
  const fetchFn = (async (_url: string, init: { body: string }) => {
    sent.push(JSON.parse(init.body))
    return new Response(JSON.stringify({ id: `re_${sent.length}` }), { status: 200 })
  }) as unknown as typeof fetch
  return { sent, fetchFn }
}

describe('runWelcomeSeries', () => {
  it('dry run: says who would get what, sends nothing, writes nothing', async () => {
    const { db, writes } = memoryDb({ newsletter_subscribers: [{ ...READER }] })
    const { sent, fetchFn } = fakeResend()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await runWelcomeSeries({ db: db as any, mode: 'dry', now: WED_1230, fetchFn, env: {} })
    expect(r.actions).toEqual([expect.objectContaining({ step: 1, send: '1', subject: 'What do you follow?' })])
    expect(sent).toHaveLength(0)
    expect(writes).toHaveLength(0)
  })

  it('live: sends step 1 once, records it, and a second run the same day sends nothing', async () => {
    const { db, tables } = memoryDb({ newsletter_subscribers: [{ ...READER }] })
    const { sent, fetchFn } = fakeResend()
    const deps = { db, mode: 'live' as const, now: WED_1230, fetchFn, resendApiKey: 'k', env: {} }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const first = await runWelcomeSeries(deps as any)
    expect(first.actions[0]).toMatchObject({ step: 1, send: '1', result: 'sent' })
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({ to: 'reader@firm.com', subject: 'What do you follow?', reply_to: 'dbloomstine@gmail.com' })
    expect((sent[0].headers as Record<string, string>)['List-Unsubscribe']).toContain(READER.unsubscribe_token)
    expect(tables[SERIES_TABLE]).toEqual([expect.objectContaining({ step: 1, email_key: '1', status: 'sent', resend_email_id: 're_1' })])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const again = await runWelcomeSeries({ ...deps, now: new Date('2026-10-28T17:30:00Z') } as any)
    expect(again.actions).toHaveLength(0)
    expect(sent).toHaveLength(1)
  })

  it('live: a reader who already chose interests gets a skipped step 1 row and no email', async () => {
    const { db, tables } = memoryDb({ newsletter_subscribers: [{ ...READER, interests: ['PE'] }] })
    const { sent, fetchFn } = fakeResend()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await runWelcomeSeries({ db: db as any, mode: 'live', now: WED_1230, fetchFn, resendApiKey: 'k', env: {} })
    expect(sent).toHaveLength(0)
    expect(tables[SERIES_TABLE]).toEqual([expect.objectContaining({ step: 1, status: 'skipped', skip_reason: 'has_interests' })])
  })

  it('live: a bounce on the latest edition ends the series', async () => {
    const { db, tables } = memoryDb({
      newsletter_subscribers: [{ ...READER }],
      newsletter_editions: [{ id: 'ed1', status: 'sent', sent_at: '2026-10-28T11:30:00Z', resend_email_ids: { 'reader@firm.com': 're_ed1' } }],
    })
    const { sent, fetchFn } = fakeResend()
    const lastEvent = async (id: string) => (id === 're_ed1' ? 'bounced' : 'delivered')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await runWelcomeSeries({ db: db as any, mode: 'live', now: WED_1230, fetchFn, resendApiKey: 'k', lastEvent, env: {} })
    expect(sent).toHaveLength(0)
    expect(tables[SERIES_TABLE]).toEqual([expect.objectContaining({ step: 1, status: 'skipped', skip_reason: 'bounced' })])
  })

  it('live: step 3 goes as 3b (text only) to a reader with no human click, as 3 to one with', async () => {
    const quiet = { ...READER }
    const clicker = { ...READER, id: '44444444-4444-4444-8444-444444444444', email: 'clicker@firm.com', unsubscribe_token: '55555555-5555-4555-8555-555555555555' }
    const prior = (id: string) => [
      { subscriber_id: id, step: 1, email_key: '1', status: 'sent', created_at: '2026-10-28T16:31:00Z', sent_at: '2026-10-28T16:31:00Z' },
      { subscriber_id: id, step: 2, email_key: '2', status: 'sent', created_at: '2026-10-30T16:31:00Z', sent_at: '2026-10-30T16:31:00Z' },
    ]
    const { db } = memoryDb({
      newsletter_subscribers: [quiet, clicker],
      [SERIES_TABLE]: [...prior(quiet.id), ...prior(clicker.id)],
      newsletter_editions: [{ id: 'ed1', status: 'sent', sent_at: '2026-10-29T11:30:00Z', resend_email_ids: {} }],
      newsletter_events: [
        { resend_email_id: 're_c', type: 'delivered', email: 'clicker@firm.com', edition_id: 'ed1', occurred_at: '2026-10-29T11:30:05Z' },
        { resend_email_id: 're_c', type: 'clicked', email: 'clicker@firm.com', edition_id: 'ed1', occurred_at: '2026-10-29T13:00:00Z' },
        { resend_email_id: 're_q', type: 'delivered', email: 'reader@firm.com', edition_id: 'ed1', occurred_at: '2026-10-29T11:30:05Z' },
        { resend_email_id: 're_q', type: 'opened', email: 'reader@firm.com', edition_id: 'ed1', occurred_at: '2026-10-29T12:00:00Z' },
      ],
    })
    const { sent, fetchFn } = fakeResend()
    // Tuesday 2026-11-03, 12:30 EST
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await runWelcomeSeries({ db: db as any, mode: 'live', now: new Date('2026-11-03T17:30:00Z'), fetchFn, resendApiKey: 'k', env: {} })
    const byTo = Object.fromEntries(sent.map((s) => [s.to, s]))
    expect(byTo['reader@firm.com']).toMatchObject({ subject: 'Is FundOps Daily reaching you?' })
    expect(byTo['reader@firm.com'].html).toBeUndefined()
    expect(byTo['clicker@firm.com']).toMatchObject({ subject: 'Between editions: league tables, firm pages, events' })
  })

  it('live: refuses to send without the table', async () => {
    const { db, tables } = memoryDb({ newsletter_subscribers: [{ ...READER }] })
    delete (tables as Record<string, unknown>)[SERIES_TABLE]
    const { sent, fetchFn } = fakeResend()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await runWelcomeSeries({ db: db as any, mode: 'live', now: WED_1230, fetchFn, resendApiKey: 'k', env: {} })
    expect(r.ok).toBe(false)
    expect(r.error).toContain('20261023_welcome_series_sends.sql')
    expect(sent).toHaveLength(0)
  })

  it('pre-launch readers are never drawn', async () => {
    const old = { ...READER, created_at: '2026-09-01T12:00:00Z' }
    const { db } = memoryDb({ newsletter_subscribers: [old] })
    const { sent, fetchFn } = fakeResend()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await runWelcomeSeries({ db: db as any, mode: 'live', now: WED_1230, fetchFn, resendApiKey: 'k', env: {} })
    expect(r.readers).toBe(0)
    expect(sent).toHaveLength(0)
  })
})
