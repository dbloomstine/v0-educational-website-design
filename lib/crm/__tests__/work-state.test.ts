/**
 * Marking a batch done. Pinned because select-all on 713 to-do rows failed with
 * "Lookup failed: Bad Request" on 2026-10-05: every id went into one filter and
 * the URL was too long. The desk draws 200 rows at a time but select-all takes
 * every matching row, so a batch longer than one request is the normal case.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

type Kind = 'select' | 'update' | 'insert'
type Op = { table: string; kind: Kind; ids?: string[]; rows?: unknown[] }
const ops: Op[] = []
let failOn: { kind: Kind; call: number } | null = null
const seen: Record<string, number> = {}

function hit(kind: Kind) {
  seen[kind] = (seen[kind] ?? 0) + 1
  return failOn !== null && failOn.kind === kind && failOn.call === seen[kind]
}

function from(table: string) {
  let kind: Kind = 'select'
  const b = {
    select() { kind = 'select'; return b },
    update() { kind = 'update'; return b },
    insert(rows: unknown[]) {
      ops.push({ table, kind: 'insert', rows })
      return Promise.resolve({ error: hit('insert') ? { message: 'boom' } : null })
    },
    in(_col: string, ids: string[]) {
      ops.push({ table, kind, ids })
      if (hit(kind)) return Promise.resolve({ data: null, error: { message: 'Bad Request' } })
      const data = kind === 'select' ? ids.map(id => ({ id, firm_id: `f-${id}`, person_id: `p-${id}` })) : null
      return Promise.resolve({ data, error: null })
    },
  }
  return b
}

vi.mock('../supabase', () => ({ getCrmAdmin: () => ({ from }) }))

import { setWorkState } from '../queries'

const ids = (n: number) => Array.from({ length: n }, (_, i) => `lead-${i}`)

beforeEach(() => {
  ops.length = 0
  failOn = null
  for (const k of Object.keys(seen)) delete seen[k]
})

describe('setWorkState', () => {
  it('marks 713 rows done without ever putting more than 200 ids in one request', async () => {
    const res = await setWorkState(ids(713), 'done', 'contacted')
    expect(res).toEqual({ updated: 713, logged: 713 })
    const filters = ops.filter(o => o.ids)
    expect(Math.max(...filters.map(o => o.ids!.length))).toBe(200)
    expect(filters.filter(o => o.kind === 'update').flatMap(o => o.ids)).toEqual(ids(713))
  })

  it('writes one contact_log row per lead, as contacted by email', async () => {
    await setWorkState(ids(3), 'done', 'contacted')
    const rows = ops.filter(o => o.kind === 'insert').flatMap(o => o.rows) as Record<string, string>[]
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({
      firm_id: 'f-lead-0', person_id: 'p-lead-0', event_type: 'contacted', channel: 'email', created_by: 'danny',
    })
  })

  it('logs a group before it marks that group done', async () => {
    await setWorkState(ids(250), 'done', 'researched')
    expect(ops.map(o => o.kind)).toEqual(['select', 'insert', 'update', 'select', 'insert', 'update'])
  })

  it('writes no contact_log row when the state is not done', async () => {
    const res = await setWorkState(ids(5), 'parked', null)
    expect(res).toEqual({ updated: 5, logged: 0 })
    expect(ops.some(o => o.kind === 'insert')).toBe(false)
  })

  it('says how far it got when a later group fails, and leaves that group untouched', async () => {
    failOn = { kind: 'select', call: 3 }
    await expect(setWorkState(ids(713), 'done', 'contacted')).rejects.toThrow(
      'Lookup failed: Bad Request (400 of 713 rows were updated before this)'
    )
    expect(ops.filter(o => o.kind === 'update')).toHaveLength(2)
    expect(ops.filter(o => o.kind === 'insert')).toHaveLength(2)
  })

  it('does nothing for an empty selection', async () => {
    expect(await setWorkState([], 'done', 'contacted')).toEqual({ updated: 0, logged: 0 })
    expect(ops).toHaveLength(0)
  })
})
