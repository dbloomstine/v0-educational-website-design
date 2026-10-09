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
