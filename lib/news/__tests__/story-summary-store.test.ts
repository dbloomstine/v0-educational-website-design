import { describe, it, expect, vi } from 'vitest'
import { loadMarks, readLongSummary, saveStatus, saveWritten } from '../story-summary-store'

/** A stand-in for the query builder: every method returns it, awaiting it gives `result`, and the calls are kept. */
function fakeDb(result: { data?: unknown; error?: { message: string } | null }) {
  const calls: [string, unknown[]][] = []
  const chain: Record<string, unknown> = {}
  for (const m of ['from', 'select', 'update', 'in', 'not', 'is', 'eq', 'gte', 'order', 'range']) {
    chain[m] = (...args: unknown[]) => { calls.push([m, args]); return chain }
  }
  chain.then = (resolve: (r: unknown) => void) => resolve({ data: result.data ?? null, error: result.error ?? null })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { db: chain as any, calls }
}

describe('story summary store', () => {
  it('reads the long summary of the story’s best row, else another row', async () => {
    const rows = [
      { id: 'm2', summary_long: 'Other row.', summary_long_at: '2026-10-08T10:00:00Z' },
      { id: 'best', summary_long: 'Best row.', summary_long_at: '2026-10-08T09:00:00Z' },
    ]
    const { db, calls } = fakeDb({ data: rows })
    expect(await readLongSummary(db, { id: 'best', memberIds: ['best', 'm2'] })).toBe('Best row.')
    expect(calls).toContainEqual(['in', ['id', ['best', 'm2']]])
    expect(calls).toContainEqual(['not', ['summary_long', 'is', null]])
    expect(await readLongSummary(fakeDb({ data: rows }).db, { id: 'other', memberIds: ['other', 'm2'] })).toBe('Other row.')
  })

  it('shows no long summary, and says so, when the read fails (the migration not applied yet, say)', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await readLongSummary(fakeDb({ error: { message: 'column news_items.summary_long does not exist' } }).db, { id: 'a', memberIds: ['a'] })).toBeNull()
    expect(log).toHaveBeenCalled()
    log.mockRestore()
  })

  it('writes a summary to one row, never over an existing one', async () => {
    const { db, calls } = fakeDb({})
    await saveWritten(db, 'best', 'Text.', 'claude-sonnet-5-5', Date.parse('2026-10-08T12:00:00Z'))
    expect(calls).toContainEqual(['update', [{ summary_long: 'Text.', summary_long_model: 'claude-sonnet-5-5', summary_long_at: '2026-10-08T12:00:00.000Z', summary_long_status: 'written' }]])
    expect(calls).toContainEqual(['eq', ['id', 'best']])
    expect(calls).toContainEqual(['is', ['summary_long', null]])
  })

  it('marks a status without touching the summary columns', async () => {
    const { db, calls } = fakeDb({})
    await saveStatus(db, 'best', 'retry')
    expect(calls).toContainEqual(['update', [{ summary_long_status: 'retry' }]])
  })

  it('reads the tried rows of the last ten days', async () => {
    const { db, calls } = fakeDb({ data: [{ id: 'a', summary_long_status: 'thin' }, { id: 'b', summary_long_status: 'retry' }] })
    const marks = await loadMarks(db, Date.parse('2026-10-08T12:00:00Z'))
    expect([...marks]).toEqual([['a', 'thin'], ['b', 'retry']])
    expect(calls).toContainEqual(['gte', ['published_date', '2026-09-28']])
    expect(calls).toContainEqual(['not', ['summary_long_status', 'is', null]])
  })

  it('throws when the marks cannot be read, rather than treating every story as untried', async () => {
    await expect(loadMarks(fakeDb({ error: { message: 'timeout' } }).db)).rejects.toThrow('timeout')
  })

  it('stamps a thin mark with the time, so a later change can be told from the mark itself', async () => {
    const { db, calls } = fakeDb({})
    await saveStatus(db, 'best', 'thin', Date.parse('2026-10-08T12:00:00Z'))
    expect(calls).toContainEqual(['update', [{ summary_long_status: 'thin', summary_long_at: '2026-10-08T12:00:00.000Z' }]])
    expect(calls).toContainEqual(['is', ['summary_long', null]])
  })
})
