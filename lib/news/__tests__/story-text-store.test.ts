import { describe, it, expect } from 'vitest'
import { loadFetchRows, loadRowTextState, loadThinStamps } from '../story-text-store'

/** A stand-in for the query builder; each awaited query takes the next result and the calls are kept. */
function fakeDb(results: { data?: unknown; error?: { message: string } | null }[]) {
  const calls: [string, unknown[]][] = []
  let i = 0
  const chain: Record<string, unknown> = {}
  for (const m of ['from', 'select', 'in', 'not', 'is', 'eq', 'gte', 'order', 'range']) {
    chain[m] = (...args: unknown[]) => { calls.push([m, args]); return chain }
  }
  chain.then = (resolve: (r: unknown) => void) => {
    const r = results[Math.min(i++, results.length - 1)]
    resolve({ data: r.data ?? null, error: r.error ?? null })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { db: chain as any, calls }
}

describe('story text store', () => {
  it('reads whether a row has stored text without reading the text', async () => {
    const { db, calls } = fakeDb([
      { data: [{ id: 'a' }] },
      { data: [{ id: 'a', created_at: '2026-10-08T10:00:00Z', enriched_at: '2026-10-08T10:20:00Z' }, { id: 'b', created_at: '2026-10-08T11:00:00Z', enriched_at: null }] },
    ])
    const state = await loadRowTextState(db, ['a', 'b'])
    expect(state.get('a')).toEqual({ createdAt: '2026-10-08T10:00:00Z', enrichedAt: '2026-10-08T10:20:00Z', hasText: true })
    expect(state.get('b')).toEqual({ createdAt: '2026-10-08T11:00:00Z', enrichedAt: null, hasText: false })
    expect(calls).toContainEqual(['select', ['id']])
    expect(calls).toContainEqual(['not', ['full_text', 'is', null]])
    expect(calls.find(([m, a]) => m === 'select' && String(a[0]).includes('full_text'))).toBeUndefined()
  })

  it('asks for ids in chunks of a hundred, never all at once', async () => {
    const { db, calls } = fakeDb([{ data: [] }])
    await loadRowTextState(db, Array.from({ length: 250 }, (_, i) => `id${i}`))
    const sizes = calls.filter(([m]) => m === 'in').map(([, a]) => (a[1] as string[]).length)
    expect(sizes).toEqual([100, 100, 50, 100, 100, 50])
  })

  it('reads the rows the text pass may fetch, from the last 48 hours only', async () => {
    const { db, calls } = fakeDb([
      { data: [] },
      { data: [{ id: 'a', source_url: 'https://x.example/a', description: 'd', created_at: '2026-10-08T10:00:00Z', enriched_at: null, enrichment_error: null }] },
    ])
    const rows = await loadFetchRows(db, ['a'], '2026-10-06T14:00:00.000Z')
    expect(rows).toEqual([{ id: 'a', sourceUrl: 'https://x.example/a', description: 'd', createdAt: '2026-10-08T10:00:00Z', enrichedAt: null, enrichmentError: null, hasText: false }])
    expect(calls).toContainEqual(['gte', ['created_at', '2026-10-06T14:00:00.000Z']])
  })

  it('reads when thin marks were made, over the index of tried rows', async () => {
    const { db, calls } = fakeDb([{ data: [{ id: 'a', summary_long_at: '2026-10-08T09:00:00Z' }, { id: 'b', summary_long_at: null }] }])
    const stamps = await loadThinStamps(db, Date.parse('2026-10-08T12:00:00Z'))
    expect([...stamps]).toEqual([['a', '2026-10-08T09:00:00Z'], ['b', null]])
    expect(calls).toContainEqual(['eq', ['summary_long_status', 'thin']])
    expect(calls).toContainEqual(['gte', ['published_date', '2026-09-28']])
  })

  it('throws when a read fails, rather than reporting rows with no text', async () => {
    await expect(loadRowTextState(fakeDb([{ error: { message: 'timeout' } }]).db, ['a'])).rejects.toThrow('timeout')
    await expect(loadThinStamps(fakeDb([{ error: { message: 'timeout' } }]).db)).rejects.toThrow('timeout')
  })
})
