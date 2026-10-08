import { describe, it, expect } from 'vitest'
import { storyIsThin, storyRobots } from '../story-index'

// A story page is worth a search engine's time when it says something the
// publisher's page does not: a fuller summary, or a second outlet.
const one = { coverage: [] }
const two = { coverage: [{ source: 'Law360', url: 'https://example.com/l', headline: 'h' }] }

describe('a thin story page', () => {
  it('is one outlet and no fuller summary', () => {
    expect(storyIsThin(one, false)).toBe(true)
  })
  it('stops being thin with a fuller summary', () => {
    expect(storyIsThin(one, true)).toBe(false)
  })
  it('stops being thin with a second outlet', () => {
    expect(storyIsThin(two, false)).toBe(false)
  })
  it('is not thin with both', () => {
    expect(storyIsThin(two, true)).toBe(false)
  })
})

describe('the robots metadata', () => {
  it('is noindex, follow for a thin page', () => {
    expect(storyRobots(one, false)).toEqual({ index: false, follow: true })
  })
  it('says nothing for a page with substance, so it is indexed', () => {
    expect(storyRobots(one, true)).toBeUndefined()
    expect(storyRobots(two, false)).toBeUndefined()
  })
  it('says nothing when the fuller summary could not be read', () => {
    expect(storyRobots(one, null)).toBeUndefined()
  })
})
