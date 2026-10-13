import { describe, it, expect } from 'vitest'
import {
  SHORT_ID_LENGTH, SLUG_MAX_LENGTH, findStoryByRef, isCanonicalStoryParam, parseStoryParam, pickBySlug, shortId, shortIdRange,
  storyPath, storyPathOf, storySlug,
} from '../story-path'
import { storyImageUrl, storyPermalink } from '../story-jsonld'

// A story's address since 2026-10-12: /story/<slug>-<short id>. The slug is
// the headline; the short id is the first eight hex characters of the uuid;
// any older /story/<uuid> link still resolves and is redirected.
const ID = '3f9a2b7c-1d4e-4a6b-9c8d-0123456789ab'
const story = { id: ID, memberIds: [ID, 'aaaaaaaa-0000-4000-8000-000000000002'], headline: 'Conversant beats debut real estate fund target by 40% with $705m close' }

describe('a headline as a slug', () => {
  it('is lower-case ASCII words joined by hyphens, with nothing hanging off the ends', () => {
    expect(storySlug('Conversant beats debut real estate fund target by 40% with $705m close')).toBe('conversant-beats-debut-real-estate-fund-target-by-40-with-705m-close')
    expect(storySlug('  KKR’s “Ascendant” fund — €1.2bn, first close!  ')).toBe('kkr-s-ascendant-fund-1-2bn-first-close')
    expect(storySlug('Société Générale & Crédit Agricole back Ardian')).toBe('societe-generale-and-credit-agricole-back-ardian')
    expect(storySlug('')).toBe('')
    expect(storySlug(null)).toBe('')
    expect(storySlug('日本の年金基金')).toBe('')
  })

  it('is cut at the limit, on a word', () => {
    const long = 'Blackstone Strategic Partners closes its ninth secondaries fund at twenty two billion dollars after eighteen months of fundraising'
    const slug = storySlug(long)
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH)
    expect(slug).toBe('blackstone-strategic-partners-closes-its-ninth-secondaries-fund-at')
    expect(slug.endsWith('-')).toBe(false)
    // A single word longer than the limit is simply cut.
    expect(storySlug('a'.repeat(100)).length).toBe(SLUG_MAX_LENGTH)
  })
})

describe('the story path', () => {
  it('is the slug and the first eight hex characters of the id', () => {
    expect(SHORT_ID_LENGTH).toBe(8)
    expect(shortId(ID)).toBe('3f9a2b7c')
    expect(shortId(ID.toUpperCase())).toBe('3f9a2b7c')
    expect(storyPath(story)).toBe('/story/conversant-beats-debut-real-estate-fund-target-by-40-with-705m-close-3f9a2b7c')
    expect(storyPathOf(ID, 'conversant')).toBe('/story/conversant-3f9a2b7c')
    // No slug at all (a headline with no ASCII in it): the short id alone.
    expect(storyPath({ id: ID, headline: '日本' })).toBe('/story/3f9a2b7c')
  })

  it('is what the permalink, the share image and every link use', () => {
    expect(storyPermalink(story)).toBe(`https://fundopshq.com${storyPath(story)}`)
    expect(storyImageUrl(story)).toBe(`https://fundopshq.com${storyPath(story)}/opengraph-image`)
  })

  it('knows when a request is already at the canonical address', () => {
    expect(isCanonicalStoryParam('conversant-beats-debut-real-estate-fund-target-by-40-with-705m-close-3f9a2b7c', story)).toBe(true)
    expect(isCanonicalStoryParam(ID, story)).toBe(false) // the old uuid form: redirect
    expect(isCanonicalStoryParam('old-headline-3f9a2b7c', story)).toBe(false) // a stale slug: redirect
    expect(isCanonicalStoryParam('3f9a2b7c', story)).toBe(false)
  })
})

describe('reading a /story/ address', () => {
  it('reads a whole uuid, in any case, as the old form', () => {
    expect(parseStoryParam(ID)).toEqual({ kind: 'uuid', id: ID })
    expect(parseStoryParam(ID.toUpperCase())).toEqual({ kind: 'uuid', id: ID })
  })

  it('reads a slug and short id, a stale slug, or a short id alone', () => {
    expect(parseStoryParam('conversant-beats-debut-3f9a2b7c')).toEqual({ kind: 'short', short: '3f9a2b7c', slug: 'conversant-beats-debut' })
    expect(parseStoryParam('whatever-3f9a2b7c')).toEqual({ kind: 'short', short: '3f9a2b7c', slug: 'whatever' })
    expect(parseStoryParam('3f9a2b7c')).toEqual({ kind: 'short', short: '3f9a2b7c', slug: '' })
    // A slug that itself ends in eight hex characters still splits at the last hyphen.
    expect(parseStoryParam('fund-deadbeef-3f9a2b7c')).toEqual({ kind: 'short', short: '3f9a2b7c', slug: 'fund-deadbeef' })
  })

  it('rejects anything else', () => {
    for (const bad of ['', 'conversant', 'conversant-3f9a2b7', 'conversant-3F9A2B7C', 'conversant-3f9a2b7c/', '../etc', '3f9a2b7c-1d4e']) {
      expect(parseStoryParam(bad), bad).toBeNull()
    }
  })

  it('turns a short id into the uuid range an index can scan', () => {
    expect(shortIdRange('3f9a2b7c')).toEqual({ lo: '3f9a2b7c-0000-0000-0000-000000000000', hi: '3f9a2b7c-ffff-ffff-ffff-ffffffffffff' })
    expect(shortIdRange('3F9A2B7C').lo).toBe('3f9a2b7c-0000-0000-0000-000000000000')
  })
})

describe('finding the story an address names', () => {
  const other = { id: 'aaaaaaaa-0000-4000-8000-000000000001', memberIds: ['aaaaaaaa-0000-4000-8000-000000000001'], headline: 'Ares hires a head of ABF' }
  const stories = [other, story]

  it('by its own id, by a member row’s id, by its short id, and by a member’s short id', () => {
    expect(findStoryByRef({ kind: 'uuid', id: ID }, stories)).toBe(story)
    expect(findStoryByRef({ kind: 'uuid', id: 'aaaaaaaa-0000-4000-8000-000000000002' }, stories)).toBe(story)
    expect(findStoryByRef({ kind: 'short', short: '3f9a2b7c', slug: 'stale' }, stories)).toBe(story)
    expect(findStoryByRef({ kind: 'uuid', id: 'bbbbbbbb-0000-4000-8000-000000000000' }, stories)).toBeUndefined()
  })

  it('lets the slug choose when two stories share a short id', () => {
    // `other`'s own id and `story`'s member row share the prefix aaaaaaaa.
    const ref = (slug: string) => ({ kind: 'short' as const, short: 'aaaaaaaa', slug })
    expect(findStoryByRef(ref('ares-hires-a-head-of-abf'), stories)).toBe(other)
    expect(findStoryByRef(ref(storySlug(story.headline)), stories)).toBe(story)
    expect(findStoryByRef(ref('neither'), stories)).toBe(other) // the first, rather than nothing
  })

  it('does the same among rows read from the database', () => {
    const rows = [{ id: 'x', headline: 'One headline' }, { id: 'y', headline: 'Another headline' }]
    expect(pickBySlug(rows, 'another-headline')?.id).toBe('y')
    expect(pickBySlug(rows, 'stale')?.id).toBe('x')
    expect(pickBySlug([], 'x')).toBeUndefined()
  })
})
