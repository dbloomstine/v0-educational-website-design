import { describe, it, expect } from 'vitest'
import { INTERESTS, interestCategories, interestKey, interestWords, preferenceColumns, sanitizeInterests, sanitizeRole, sanitizeSignupForm } from '../interests'
import { FOLLOWED_MAX, pullFollowed } from '../personalize'
import type { ArticleGroup, NewsletterArticle } from '../query-articles'

describe('what a signup may store', () => {
  it('keeps only ids on the list, once each, in list order', () => {
    expect(sanitizeInterests(['credit', 'PE', 'credit', 'crypto', 7, null, '<script>'])).toEqual(['PE', 'credit'])
    expect(sanitizeInterests('PE')).toEqual([])
    expect(sanitizeInterests(undefined)).toEqual([])
  })

  it('keeps a known role and a known form, nothing else', () => {
    expect(sanitizeRole('lp')).toBe('lp')
    expect(sanitizeRole('admin')).toBeUndefined()
    expect(sanitizeSignupForm('popup')).toBe('popup')
    expect(sanitizeSignupForm('drop table')).toBeUndefined()
  })

  it('writes a column only for what was given', () => {
    expect(preferenceColumns({ interests: [], role: undefined, form: 'hero' })).toEqual({ signup_form: 'hero' })
    expect(preferenceColumns({ interests: ['VC'], role: 'gp', form: 'popup' })).toEqual({ interests: ['VC'], reader_role: 'gp', signup_form: 'popup' })
    expect(preferenceColumns({})).toEqual({})
  })

  it('gives one key per set of choices whatever order they were ticked in', () => {
    expect(interestKey(['credit', 'PE'])).toBe(interestKey(['PE', 'credit']))
    expect(interestKey([])).toBe('')
  })

  it('covers GP stakes under secondaries, as the site tab does', () => {
    expect([...interestCategories(['secondaries'])]).toEqual(['secondaries', 'gp_stakes'])
  })

  it('names the choices in a sentence', () => {
    expect(interestWords(['credit'])).toBe('private credit')
    expect(interestWords(['real_estate', 'credit'])).toBe('private credit and real estate')
    expect(interestWords(['PE', 'VC', 'secondaries'])).toBe('private equity, venture and secondaries and GP stakes')
    expect(interestWords([])).toBe('')
  })
})

let seq = 0
const story = (fundCategories: string[]): NewsletterArticle => ({ id: `s${++seq}`, fundCategories }) as unknown as NewsletterArticle
const group = (category: string, articles: NewsletterArticle[]): ArticleGroup => ({ category, label: category, articles })

describe('the reader\'s own section', () => {
  it('moves matching stories out of their sections, in reading order', () => {
    const a = story(['PE']), b = story(['credit']), c = story(['credit', 'PE']), d = story(['real_estate'])
    const { followed, sections } = pullFollowed([group('fund', [a, b]), group('deals', [c, d])], ['credit'])
    expect(followed?.articles).toEqual([b, c])
    expect(sections.map((g) => [g.category, g.articles])).toEqual([['fund', [a]], ['deals', [d]]])
  })

  it('drops a section it has emptied', () => {
    const { sections } = pullFollowed([group('fund', [story(['VC'])]), group('deals', [story(['PE'])])], ['VC'])
    expect(sections.map((g) => g.category)).toEqual(['deals'])
  })

  it('leaves the edition alone with no choices, every choice, or no match', () => {
    const sections = [group('fund', [story(['PE'])])]
    expect(pullFollowed(sections, undefined)).toEqual({ followed: null, sections })
    expect(pullFollowed(sections, INTERESTS.map((i) => i.id))).toEqual({ followed: null, sections })
    expect(pullFollowed(sections, ['hedge'])).toEqual({ followed: null, sections })
  })

  it('stays a short list: the overflow keeps its usual place', () => {
    const many = Array.from({ length: FOLLOWED_MAX + 3 }, () => story(['PE']))
    const { followed, sections } = pullFollowed([group('fund', many)], ['PE'])
    expect(followed?.articles).toHaveLength(FOLLOWED_MAX)
    expect(sections[0].articles).toHaveLength(3)
  })
})

describe('event opt-ins (2026-10-22)', () => {
  it('makes city tags from the same slugs as the city pages', async () => {
    const { cityTag, citySlug, eventSignupTags } = await import('../interests')
    expect(citySlug('Washington DC')).toBe('washington-dc')
    expect(citySlug('Montréal')).toBe('montreal')
    expect(cityTag('New York')).toBe('city:new-york')
    expect(cityTag('  ')).toBeNull()
    expect(cityTag(null)).toBeNull()
    expect(eventSignupTags('Chicago')).toEqual(['events', 'city:chicago'])
    expect(eventSignupTags(null)).toEqual(['events'])
  })

  it('keeps "events" and one well-formed city from a request', async () => {
    const { sanitizeEventTags } = await import('../interests')
    expect(sanitizeEventTags(['city:boston', 'events', 'city:miami'])).toEqual(['events', 'city:boston'])
    expect(sanitizeEventTags(['city:chicago'])).toEqual(['events', 'city:chicago'])
    expect(sanitizeEventTags(['city:Chicago', 'city:a b', 'city:', 'city:-x', 'PE', 7])).toEqual([])
    expect(sanitizeEventTags('events')).toEqual([])
  })

  it('never lets event tags into the story interests the daily email reads', async () => {
    const { sanitizeSignupInterests } = await import('../interests')
    const stored = sanitizeSignupInterests(['events', 'city:chicago', 'credit'])
    expect(stored).toEqual(['credit', 'events', 'city:chicago'])
    expect(sanitizeInterests(stored)).toEqual(['credit'])
    expect(interestKey(stored)).toBe('credit')
    expect(interestWords(stored)).toBe('private credit')
  })

  it('keeps the event tags on file when story choices are rewritten', async () => {
    const { withEventTags } = await import('../interests')
    expect(withEventTags(['VC'], ['PE', 'events', 'city:boston', 'city:new-york'])).toEqual(['VC', 'events', 'city:boston', 'city:new-york'])
    expect(withEventTags([], ['events'])).toEqual(['events'])
    expect(withEventTags(['PE'], null)).toEqual(['PE'])
  })

  it('merges a returning signup: sent story choices win, else the ones on file; event tags from both', async () => {
    const { mergeSignupInterests } = await import('../interests')
    expect(mergeSignupInterests(['events', 'city:miami'], ['PE', 'events', 'city:boston'])).toEqual(['PE', 'events', 'city:boston', 'city:miami'])
    expect(mergeSignupInterests(['credit'], ['PE'])).toEqual(['credit'])
    expect(mergeSignupInterests([], null)).toEqual([])
  })

  it('knows the two new forms', () => {
    expect(sanitizeSignupForm('events')).toBe('events')
    expect(sanitizeSignupForm('firstvisit')).toBe('firstvisit')
  })
})

describe('the Monday events email’s readers (2026-10-22)', () => {
  it('are those whose interests carry the events tag (or a city tag, which implies it)', async () => {
    const { wantsEventsEmail } = await import('../interests')
    expect(wantsEventsEmail(['PE', 'events', 'city:chicago'])).toBe(true)
    expect(wantsEventsEmail(['city:chicago'])).toBe(true)
    expect(wantsEventsEmail(['PE', 'credit'])).toBe(false)
    expect(wantsEventsEmail([])).toBe(false)
    expect(wantsEventsEmail(null)).toBe(false)
    expect(wantsEventsEmail(['city:'])).toBe(false)
  })

  it('know their cities', async () => {
    const { readerCitySlugs } = await import('../interests')
    expect(readerCitySlugs(['PE', 'events', 'city:chicago', 'city:new-york', 'city:chicago'])).toEqual(['chicago', 'new-york'])
    expect(readerCitySlugs(['events'])).toEqual([])
    expect(readerCitySlugs(['city:Bad Slug'])).toEqual([])
  })

  it('stop it by losing every event tag, and only those', async () => {
    const { withoutEventTags, wantsEventsEmail } = await import('../interests')
    const left = withoutEventTags(['PE', 'events', 'city:chicago', 'lps'])
    expect(left).toEqual(['PE', 'lps'])
    expect(wantsEventsEmail(left)).toBe(false)
    expect(withoutEventTags(null)).toEqual([])
  })
})
