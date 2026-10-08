import { describe, it, expect, vi } from 'vitest'
import { jsonLdScript, storyImageUrl, storyJsonLd, storyPermalink } from '../story-jsonld'
import { readLongSummaryDetail } from '../story-long'
import type { Story } from '../stories'

const story: Story = {
  id: '00000000-0000-4000-8000-000000000001',
  memberIds: ['00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'],
  headline: 'Conversant beats debut real estate fund target by 40% with $705m close',
  url: 'https://example.com/original',
  source: 'AltAssets',
  summary: 'Conversant closes debut real estate fund at $705M, 40% above target.',
  coverage: [], kind: 'fundraising', assetClasses: ['real_estate'], eventType: 'fund_close', closeType: 'final_close', sizeUsdM: 705,
  firmName: 'Conversant Capital', fundName: null, personName: null, geography: [], entities: [], firms: ['Conversant Capital'],
  leadEligible: true, roundup: false, firstSeen: '2026-10-07T14:00:00Z', publishedDate: '2026-10-07', weight: 1,
}

describe('the story’s structured data', () => {
  it('is a NewsArticle with its dates, its page, its image and an Organization as author', () => {
    const ld = storyJsonLd(story, '2026-10-08T09:45:00Z')
    expect(ld['@type']).toBe('NewsArticle')
    expect(ld.headline).toBe(story.headline)
    expect(ld.datePublished).toBe('2026-10-07T14:00:00Z')
    expect(ld.dateModified).toBe('2026-10-08T09:45:00.000Z')
    expect(ld.url).toBe(`https://fundopshq.com/story/${story.id}`)
    expect(ld.mainEntityOfPage).toEqual({ '@type': 'WebPage', '@id': `https://fundopshq.com/story/${story.id}` })
    expect(ld.image).toEqual([`https://fundopshq.com/story/${story.id}/opengraph-image`])
    expect(storyImageUrl(story)).toBe(ld.image[0])
    expect(ld.author).toEqual({ '@type': 'Organization', name: 'FundOpsHQ', url: 'https://fundopshq.com' })
    expect(ld.publisher).toEqual(ld.author)
    // It says what it is based on, and does not claim the publisher's article as its own text.
    expect(ld.isBasedOn).toBe('https://example.com/original')
    expect(ld).not.toHaveProperty('articleBody')
  })

  it('keeps the short summary as the description, whatever the fuller one says', () => {
    expect(storyJsonLd(story, '2026-10-08T09:45:00Z').description).toBe(story.summary)
    expect(storyJsonLd({ ...story, summary: null }).description).toBeUndefined()
  })

  it('is modified when published unless a later time is known, and never before it was published', () => {
    expect(storyJsonLd(story).dateModified).toBe(story.firstSeen)
    expect(storyJsonLd(story, null).dateModified).toBe(story.firstSeen)
    expect(storyJsonLd(story, 'not a date').dateModified).toBe(story.firstSeen)
    expect(storyJsonLd(story, '2026-10-01T00:00:00Z').dateModified).toBe(story.firstSeen)
  })

  it('cannot be closed early by a headline', () => {
    const out = jsonLdScript(storyJsonLd({ ...story, headline: 'A </script><script>alert(1)</script> close' }))
    expect(out).not.toContain('</script>')
    expect(JSON.parse(out).headline).toBe('A </script><script>alert(1)</script> close')
    expect(storyPermalink(story)).toBe(`https://fundopshq.com/story/${story.id}`)
  })
})

describe('reading the fuller summary with its time', () => {
  const db = (data: unknown, error: { message: string } | null = null) => {
    const chain: Record<string, unknown> = {}
    for (const m of ['from', 'select', 'in', 'not']) chain[m] = () => chain
    chain.then = (resolve: (r: unknown) => void) => resolve({ data, error })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return chain as any
  }

  it('gives the best row’s text and when it was written', async () => {
    const rows = [
      { id: 'other', summary_long: 'Other row.', summary_long_at: '2026-10-08T10:00:00Z' },
      { id: 'best', summary_long: 'Best row.', summary_long_at: '2026-10-08T09:00:00Z' },
    ]
    expect(await readLongSummaryDetail(db(rows), { id: 'best', memberIds: ['best', 'other'] })).toEqual({ text: 'Best row.', at: '2026-10-08T09:00:00Z' })
    expect(await readLongSummaryDetail(db(rows), { id: 'neither', memberIds: ['neither', 'other'] })).toEqual({ text: 'Other row.', at: '2026-10-08T10:00:00Z' })
  })

  it('gives nothing when no row has one, and nothing — with a log line — when the read fails', async () => {
    expect(await readLongSummaryDetail(db([]), { id: 'a', memberIds: ['a'] })).toBeNull()
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await readLongSummaryDetail(db(null, { message: 'timeout' }), { id: 'a', memberIds: ['a'] })).toBeNull()
    expect(log).toHaveBeenCalled()
    log.mockRestore()
  })
})
