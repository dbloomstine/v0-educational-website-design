import { describe, it, expect } from 'vitest'
import { isStaleAtIngest, MAX_ARTICLE_AGE_DAYS } from '../ingest-worker'

const DAY = 86_400_000
const NOW = Date.parse('2026-10-12T12:00:00Z')

describe('isStaleAtIngest', () => {
  it('drops an item a Google News feed lists years after it was published', () => {
    // Real rows ingested 2026-09-30 to 2026-10-10 from `site:` mirrors and topic searches.
    expect(isStaleAtIngest('2017-11-02', NOW)).toBe(true) // CPPIB's Wiseman heads to BlackRock
    expect(isStaleAtIngest('2019-02-26', NOW)).toBe(true) // PIMCO targets $1bn for its latest credit fund
    expect(isStaleAtIngest('2006-03-31', NOW)).toBe(true) // Hedge funds should form a larger part of multi-asset allocations
  })

  it('keeps anything inside the window, and the day at its edge', () => {
    expect(isStaleAtIngest('2026-10-12', NOW)).toBe(false)
    expect(isStaleAtIngest('2026-10-01', NOW)).toBe(false)
    expect(isStaleAtIngest(new Date(NOW - MAX_ARTICLE_AGE_DAYS * DAY).toISOString().slice(0, 10), NOW)).toBe(false)
    expect(isStaleAtIngest(new Date(NOW - (MAX_ARTICLE_AGE_DAYS + 2) * DAY).toISOString().slice(0, 10), NOW)).toBe(true)
  })

  it('keeps an item whose feed gives no usable date', () => {
    expect(isStaleAtIngest(null, NOW)).toBe(false)
    expect(isStaleAtIngest(undefined, NOW)).toBe(false)
    expect(isStaleAtIngest('not a date', NOW)).toBe(false)
  })

  it('reads a full timestamp by its day', () => {
    expect(isStaleAtIngest('2026-10-10T08:00:00.000Z', NOW)).toBe(false)
    expect(isStaleAtIngest('2026-08-10T08:00:00.000Z', NOW)).toBe(true)
  })
})
