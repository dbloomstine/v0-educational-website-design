import { describe, expect, it } from 'vitest'
import { MATERIAL_HOURS, MATERIAL_ROWS, MATERIAL_ROW_CHARS, MATERIAL_STORIES, MATERIAL_STORY_CHARS, materialIds, materialStories, reportsOf } from '../material'
import type { SourceRow } from '@/lib/news/story-summary'

const NOW = Date.parse('2026-10-10T12:00:00Z')
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString()
const story = (id: string, extra: Record<string, unknown> = {}) => ({ id, memberIds: [id], firstSeen: hoursAgo(5), coverage: [] as { source: string; url: string; headline: string }[], roundup: false, weight: 1, ...extra })
const also = (n: number) => Array.from({ length: n }, (_, i) => ({ source: `Outlet ${i}`, url: `https://example.com/${i}`, headline: 'A headline' }))
const sentence = (i: number) => `The fund drew commitments from pension plans in region ${i} and will lend to mid-sized companies there.`
const row = (id: string, text: string, extra: Partial<SourceRow> = {}): SourceRow => ({ id, title: `Ares closes fund ${id}`, description: text, full_text: null, source_name: 'AltAssets', published_date: '2026-10-10', ...extra })

describe('materialStories', () => {
  it('takes recent stories two outlets carried, or one with a fuller summary; never a roundup or an old one', () => {
    const stories = [
      story('one-outlet'),
      story('two-outlets', { coverage: also(1) }),
      story('long', { long: true }),
      story('roundup', { coverage: also(3), roundup: true }),
      story('old', { coverage: also(3), firstSeen: hoursAgo(MATERIAL_HOURS + 1) }),
    ]
    expect(materialStories(stories, (s) => 'long' in s, NOW).map((s) => s.id)).toEqual(['two-outlets', 'long'])
  })

  it('puts the best-covered first, then one with a fuller summary, then the weightier, and stops at its number', () => {
    const stories = [story('light', { coverage: also(1), weight: 1 }), story('heavy', { coverage: also(1), weight: 9 }), story('long', { coverage: also(1), long: true }), story('five', { coverage: also(4) })]
    expect(materialStories(stories, (s) => 'long' in s, NOW).map((s) => s.id)).toEqual(['five', 'long', 'heavy', 'light'])
    const many = Array.from({ length: MATERIAL_STORIES + 10 }, (_, i) => story(`s${String(i).padStart(2, '0')}`, { coverage: also(1) }))
    expect(materialStories(many, () => false, NOW)).toHaveLength(MATERIAL_STORIES)
  })
})

describe('materialIds', () => {
  it('lists every row of every story once', () => {
    expect(materialIds([{ id: 'a', memberIds: ['a', 'b'] }, { id: 'c', memberIds: [] }, { id: 'b', memberIds: ['b'] }])).toEqual(['a', 'b', 'c'])
  })
})

describe('reportsOf', () => {
  it('gives each report with text, the fullest first, and leaves out one that holds only its headline', () => {
    const rows = new Map<string, SourceRow>([
      ['a', row('a', sentence(1), { source_name: 'AltAssets' })],
      ['b', row('b', [sentence(2), sentence(3)].join(' '), { source_name: 'Buyouts' })],
      ['c', row('c', 'Ares closes fund c', { source_name: 'PE Hub' })],
    ])
    const got = reportsOf({ id: 'a', memberIds: ['a', 'b', 'c'] }, rows)
    expect(got?.map((r) => r.outlet)).toEqual(['Buyouts', 'AltAssets'])
    expect(got?.[0]).toMatchObject({ headline: 'Ares closes fund b' })
    expect(got?.[0].text).toContain('region 3')
  })

  it('joins a description and the stored text, and is null when nothing says more than a headline', () => {
    const rows = new Map<string, SourceRow>([['a', row('a', sentence(1), { full_text: [sentence(4), sentence(5)].join(' ') })], ['b', row('b', 'Ares closes fund b')]])
    expect(reportsOf({ id: 'a', memberIds: ['a'] }, rows)?.[0].text).toMatch(/region 1[\s\S]*region 5/)
    expect(reportsOf({ id: 'b', memberIds: ['b'] }, rows)).toBeNull()
    expect(reportsOf({ id: 'x', memberIds: ['x'] }, rows)).toBeNull()
  })

  it('keeps to five reports, to each report\'s share and to the story\'s', () => {
    const long = Array.from({ length: 60 }, (_, i) => sentence(i)).join(' ')
    const ids = Array.from({ length: 8 }, (_, i) => `r${i}`)
    const rows = new Map<string, SourceRow>(ids.map((id, i) => [id, row(id, long, { source_name: `Outlet ${i}` })]))
    const got = reportsOf({ id: 'r0', memberIds: ids }, rows)!
    expect(got.length).toBeLessThanOrEqual(MATERIAL_ROWS)
    for (const r of got) expect(r.text.length).toBeLessThanOrEqual(MATERIAL_ROW_CHARS)
    expect(got.reduce((n, r) => n + r.text.length, 0)).toBeLessThanOrEqual(MATERIAL_STORY_CHARS)
  })
})
