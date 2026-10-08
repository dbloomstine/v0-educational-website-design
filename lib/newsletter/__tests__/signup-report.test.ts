import { describe, it, expect } from 'vitest'
import { tallySignups, NO_SOURCE, type SignupRow } from '../signup-report'

const now = new Date('2026-10-20T12:00:00Z')
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString()
const row = (over: Partial<SignupRow>): SignupRow => ({
  signup_source: null, signup_medium: null, status: 'confirmed', created_at: daysAgo(1), ...over,
})

describe('tallySignups', () => {
  const rows = [
    row({ signup_source: 'tiktok', signup_medium: 'bio', created_at: daysAgo(2) }),
    row({ signup_source: 'tiktok', signup_medium: 'bio', created_at: daysAgo(20) }),
    row({ signup_source: 'tiktok', signup_medium: 'video', created_at: daysAgo(40), status: 'unsubscribed' }),
    row({ signup_source: 'google', created_at: daysAgo(100), status: 'pending_confirmation' }),
    row({ created_at: daysAgo(200) }),
  ]
  const [d7, d30, d90, all] = tallySignups(rows, now)

  it('windows by signup date', () => {
    expect([d7.total.total, d30.total.total, d90.total.total, all.total.total]).toEqual([1, 2, 3, 5])
  })

  it('splits by source and medium, largest first, and by status', () => {
    expect(d90.rows.map((r) => [r.source, r.total])).toEqual([['tiktok / bio', 2], ['tiktok / video', 1]])
    expect(d90.total).toMatchObject({ confirmed: 2, unsubscribed: 1, unconfirmed: 0 })
    expect(all.rows.find((r) => r.source === 'google')).toMatchObject({ total: 1, unconfirmed: 1 })
  })

  it('files rows from before the columns existed under one label', () => {
    expect(all.rows.find((r) => r.source === NO_SOURCE)?.total).toBe(1)
  })

  it('counts a row with no date only in all time', () => {
    const w = tallySignups([row({ created_at: null })], now)
    expect(w.map((x) => x.total.total)).toEqual([0, 0, 0, 1])
  })
})
