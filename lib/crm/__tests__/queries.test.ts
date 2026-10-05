/**
 * The desk's list query. Pinned because each of these has gone wrong or would
 * be easy to regress:
 *   - PostgREST returns at most 1,000 rows a request, so the desk reads pages;
 *   - the grid must not carry the drawer-only text (notes, research) for
 *     every row — that was a quarter of an 8 MB page load;
 *   - a lead written between two page reads can arrive twice.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

type Call = { cols: string; opts: unknown; from: number; to: number; eq?: [string, string] }
const calls: Call[] = []
let table: { id: string }[] = []
let failAt: number | null = null
let dupAcrossPages = false

function builder() {
  const call: Call = { cols: '', opts: undefined, from: 0, to: 0 }
  const b = {
    select(cols: string, opts?: unknown) { call.cols = cols; call.opts = opts; return b },
    order() { return b },
    eq(k: string, v: string) { call.eq = [k, v]; return b },
    range(from: number, to: number) {
      call.from = from; call.to = to; calls.push(call)
      if (failAt === from) return Promise.resolve({ data: null, error: { message: 'boom' }, count: null })
      let data = table.slice(from, to + 1)
      // a row written between two reads pushes the last row of one page onto the next
      if (dupAcrossPages && from > 0) data = [table[from - 1], ...data.slice(0, -1)]
      return Promise.resolve({ data, error: null, count: from === 0 ? table.length : null })
    },
    maybeSingle() {
      calls.push(call)
      const row = table.find(r => r.id === call.eq?.[1]) ?? null
      return Promise.resolve({ data: row, error: null })
    },
  }
  return b
}

vi.mock('../supabase', () => ({ getCrmAdmin: () => ({ from: () => builder() }) }))

import { fetchDeskRows, fetchLeadDetail, GRID_COLUMNS, DETAIL_COLUMNS } from '../queries'

beforeEach(() => {
  calls.length = 0; failAt = null; dupAcrossPages = false
  table = Array.from({ length: 3477 }, (_, i) => ({ id: `lead-${i}` }))
})

describe('fetchDeskRows', () => {
  it('returns every lead, past the 1,000-row cap', async () => {
    const rows = await fetchDeskRows()
    expect(rows).toHaveLength(3477)
    expect(calls.map(c => [c.from, c.to])).toEqual([[0, 999], [1000, 1999], [2000, 2999], [3000, 3999]])
  })

  it('asks for the total once, on the first page only', async () => {
    await fetchDeskRows()
    expect(calls[0].opts).toEqual({ count: 'exact' })
    expect(calls.slice(1).every(c => c.opts === undefined)).toBe(true)
  })

  it('reads one page when the desk fits in one', async () => {
    table = table.slice(0, 87)
    expect(await fetchDeskRows()).toHaveLength(87)
    expect(calls).toHaveLength(1)
  })

  it('never ships the drawer-only text with the list', async () => {
    await fetchDeskRows()
    const cols = calls[0].cols.split(',')
    for (const heavy of ['notes', 'firm_notes', 'research_summary']) expect(cols).not.toContain(heavy)
    expect(calls[0].cols).not.toBe('*')
    // …while keeping what the grid shows and copies
    for (const needed of ['id', 'email', 'email_subject', 'email_body', 'work_state', 'firm_name']) {
      expect(cols).toContain(needed)
    }
    expect(cols).toEqual([...GRID_COLUMNS])
  })

  it('keeps one copy of a row that arrives on two pages', async () => {
    dupAcrossPages = true
    const rows = await fetchDeskRows()
    expect(new Set(rows.map(r => r.id)).size).toBe(rows.length)
  })

  it('fails loudly when any page fails, never returning a short list', async () => {
    failAt = 2000
    await expect(fetchDeskRows()).rejects.toThrow(/Lead Desk query failed: boom/)
  })
})

describe('fetchLeadDetail', () => {
  it('reads the drawer-only fields for one lead', async () => {
    const d = await fetchLeadDetail('lead-42')
    expect(d).toEqual({ id: 'lead-42' })
    expect(calls[0].cols).toBe(DETAIL_COLUMNS.join(','))
    expect(calls[0].eq).toEqual(['id', 'lead-42'])
  })

  it('returns null for a lead that is not in the desk', async () => {
    expect(await fetchLeadDetail('nope')).toBeNull()
  })
})
