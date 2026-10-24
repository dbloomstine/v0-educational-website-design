import { describe, expect, it, vi } from 'vitest'
import { card } from './fixtures'

const rows = [
  card({ category: 'placement_agent', slug: 'a' }),
  card({ category: 'fund_lawyer', slug: 'b' }),
  card({ category: 'fund_lawyer', slug: 'c', status: 'published', missing_since: '2020-01-01' }),
]
const calls: string[] = []
vi.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseAdmin: () => {
    const q = {
      select: () => q,
      eq: (col: string) => {
        calls.push(col)
        return q
      },
      order: () => q,
      range: async () => ({ data: rows, error: null }),
    }
    return { from: () => q }
  },
}))

describe('loadAllPeople', () => {
  it('reads every trade in one query and groups the public people by trade', async () => {
    const { loadAllPeople } = await import('../data')
    const all = await loadAllPeople()
    // One query: filtered on status only, never once per trade.
    expect(calls).toEqual(['status'])
    expect(all.get('placement_agent')?.map((p) => p.slug)).toEqual(['a'])
    expect(all.get('fund_lawyer')?.map((p) => p.slug)).toEqual(['b'])
    expect(all.get('fund_auditor')).toEqual([])
  })
})
