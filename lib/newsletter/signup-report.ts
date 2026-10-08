/**
 * The counting behind scripts/signup-sources.ts: subscribers by where they came
 * from, over the last 7, 30 and 90 days and all time. Pure, so it can be tested.
 */

export interface SignupRow {
  signup_source: string | null
  signup_medium: string | null
  status: string | null
  created_at: string | null
}

export interface SourceCounts {
  source: string
  total: number
  confirmed: number
  /** Signed up but never confirmed (the old double opt-in's pending rows). */
  unconfirmed: number
  unsubscribed: number
}

export interface SignupWindow {
  label: string
  rows: SourceCounts[]
  total: SourceCounts
}

export const NO_SOURCE = '(not recorded)'

const WINDOWS: { label: string; days: number | null }[] = [
  { label: 'last 7 days', days: 7 },
  { label: 'last 30 days', days: 30 },
  { label: 'last 90 days', days: 90 },
  { label: 'all time', days: null },
]

function emptyCounts(source: string): SourceCounts {
  return { source, total: 0, confirmed: 0, unconfirmed: 0, unsubscribed: 0 }
}

/** "tiktok / bio", or just "tiktok" with no medium; rows from before the columns existed are "(not recorded)". */
export function sourceLabel(row: Pick<SignupRow, 'signup_source' | 'signup_medium'>): string {
  if (!row.signup_source) return NO_SOURCE
  return row.signup_medium ? `${row.signup_source} / ${row.signup_medium}` : row.signup_source
}

export function tallySignups(rows: SignupRow[], now: Date = new Date()): SignupWindow[] {
  return WINDOWS.map(({ label, days }) => {
    const since = days === null ? -Infinity : now.getTime() - days * 86_400_000
    const bySource = new Map<string, SourceCounts>()
    const total = emptyCounts('all sources')
    for (const row of rows) {
      const at = row.created_at ? Date.parse(row.created_at) : NaN
      // A row with no usable date is counted only in "all time".
      if (days !== null && !(at >= since)) continue
      const key = sourceLabel(row)
      const c = bySource.get(key) ?? emptyCounts(key)
      bySource.set(key, c)
      for (const t of [c, total]) {
        t.total++
        if (row.status === 'confirmed') t.confirmed++
        else if (row.status === 'unsubscribed') t.unsubscribed++
        else t.unconfirmed++
      }
    }
    const sorted = [...bySource.values()].sort((a, b) => b.total - a.total || a.source.localeCompare(b.source))
    return { label, rows: sorted, total }
  })
}
