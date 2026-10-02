import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * A stand-in for the `site_cache` table: enough of the query builder for
 * build-once.ts, with the one property that matters — an UPDATE that moves
 * `claimed_until` is atomic, so only one caller wins it.
 */
interface Row { key: string; payload: string | null; computed_at: string | null; claimed_until: string }
const table = new Map<string, Row>()
let unreachable = false
let missingTable = false

function query() {
  const filters: ((r: Row) => boolean)[] = []
  let patch: Partial<Row> | null = null
  let insert: Row | null = null
  const run = () => {
    if (unreachable) return { data: null, error: { message: 'connection refused' } }
    if (missingTable) return { data: null, error: { code: 'PGRST205', message: "Could not find the table 'public.site_cache' in the schema cache" } }
    if (insert) {
      if (table.has(insert.key)) return { data: [], error: null }
      table.set(insert.key, insert)
      return { data: [{ key: insert.key }], error: null }
    }
    const hits = Array.from(table.values()).filter((r) => filters.every((f) => f(r)))
    if (patch) for (const r of hits) Object.assign(r, patch)
    return { data: hits.map((r) => ({ ...r })), error: null }
  }
  const q = {
    update(p: Partial<Row>) { patch = p; return q },
    upsert(r: Partial<Row>) { insert = { payload: null, computed_at: null, claimed_until: '1970-01-01T00:00:00.000Z', ...r } as Row; return q },
    select() { return q },
    eq(col: keyof Row, v: string) { filters.push((r) => r[col] === v); return q },
    lt(col: keyof Row, v: string) { filters.push((r) => String(r[col]) < v); return q },
    maybeSingle: async () => { const r = run(); return { data: r.data?.[0] ?? null, error: r.error } },
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => Promise.resolve(run()).then(resolve, reject),
  }
  return q
}

vi.mock('@/lib/supabase/client', () => ({ getSupabaseAdmin: () => ({ from: () => query() }) }))

import { buildOnce } from '../build-once'

beforeEach(() => { table.clear(); unreachable = false; missingTable = false; vi.useFakeTimers({ now: new Date('2026-10-02T20:00:00Z') }) })
afterEach(() => { vi.useRealTimers() })

/** Run to completion with the fake clock: lets the polling sleeps elapse. */
async function settle<T>(p: Promise<T>): Promise<T> {
  let done = false
  const tracked = p.finally(() => { done = true })
  tracked.catch(() => {}) // the caller handles a rejection; this only stops it being reported as unhandled meanwhile
  while (!done) await vi.advanceTimersByTimeAsync(500)
  return tracked
}

describe('buildOnce', () => {
  it('builds, stores the copy, and returns it', async () => {
    const build = vi.fn(async () => ({ closes: 3 }))
    expect(await settle(buildOnce('league', build))).toEqual({ closes: 3 })
    expect(build).toHaveBeenCalledTimes(1)
    expect(JSON.parse(table.get('league')!.payload!)).toEqual({ closes: 3 })
  })

  it('lets one of fifty simultaneous callers build; the rest take its result', async () => {
    // 2026-10-02: fifty firm pages, fifty league builds, twelve minutes of outage.
    let builds = 0
    const build = async () => { builds++; await new Promise((r) => setTimeout(r, 4000)); return { n: builds } }
    const results = await settle(Promise.all(Array.from({ length: 50 }, () => buildOnce('league', build))))
    expect(builds).toBe(1)
    expect(results.every((r) => r.n === 1)).toBe(true)
  })

  it('does not build again until the claim lapses, then does', async () => {
    const build = vi.fn(async () => ({ at: Date.now() }))
    const first = await settle(buildOnce('stories', build, { lockSeconds: 120 }))
    await vi.advanceTimersByTimeAsync(60_000)
    expect(await settle(buildOnce('stories', build, { lockSeconds: 120 }))).toEqual(first)
    expect(build).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(61_000)
    const later = await settle(buildOnce('stories', build, { lockSeconds: 120 }))
    expect(build).toHaveBeenCalledTimes(2)
    expect(later.at).toBeGreaterThan(first.at)
  })

  it('serves the last good copy when a build fails, and does not retry until the claim lapses', async () => {
    await settle(buildOnce('league', async () => ({ v: 1 }), { lockSeconds: 120 }))
    await vi.advanceTimersByTimeAsync(121_000)
    const failing = vi.fn(async () => { throw new Error('statement timeout') })
    // The database is down: every caller gets the last good copy, and only one of them asked it anything.
    const results = await settle(Promise.all(Array.from({ length: 20 }, () => buildOnce('league', failing, { lockSeconds: 120 }))))
    expect(results.every((r) => (r as { v: number }).v === 1)).toBe(true)
    expect(failing).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(30_000)
    await settle(buildOnce('league', failing, { lockSeconds: 120 }))
    expect(failing).toHaveBeenCalledTimes(1)
  })

  it('throws when the first ever build fails: there is nothing to serve', async () => {
    await expect(settle(buildOnce('league', async () => { throw new Error('boom') }))).rejects.toThrow('boom')
  })

  it('waits for a first build that is still running rather than starting its own', async () => {
    let builds = 0
    const slow = async () => { builds++; await new Promise((r) => setTimeout(r, 20_000)); return { ok: true } }
    const results = await settle(Promise.all([buildOnce('archive', slow), buildOnce('archive', slow), buildOnce('archive', slow)]))
    expect(builds).toBe(1)
    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }])
  })

  it('does not build when the database cannot be reached: the build needs the same database', async () => {
    unreachable = true
    const build = vi.fn(async () => 'value')
    await expect(settle(buildOnce('league', build))).rejects.toThrow(/database unavailable/)
    expect(build).not.toHaveBeenCalled()
  })

  it('just builds where the table does not exist (a fresh environment)', async () => {
    missingTable = true
    const build = vi.fn(async () => 'value')
    expect(await settle(buildOnce('league', build))).toBe('value')
    expect(build).toHaveBeenCalledTimes(1)
  })
})
