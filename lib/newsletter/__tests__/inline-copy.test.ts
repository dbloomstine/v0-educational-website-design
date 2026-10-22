import { describe, expect, it } from 'vitest'
import { STORY_LINE, firmLine, leagueLine } from '../inline-copy'
import { sanitizeSignupForm } from '../interests'

describe('the in-page asks', () => {
  it('say what the reader gets and when', () => {
    expect(STORY_LINE).toBe('Get stories like this every morning by 7:30am ET.')
    expect(firmLine('KKR', true)).toBe('Get every KKR close the morning it’s reported.')
    expect(firmLine('Kirkland & Ellis', false)).toBe('Get Kirkland & Ellis’ news the morning it’s reported.')
    expect(firmLine('Ares', false)).toBe('Get Ares’ news the morning it’s reported.')
    expect(firmLine('Blackstone', false)).toBe('Get Blackstone’s news the morning it’s reported.')
    expect(leagueLine()).toBe('Get the biggest closes every morning by 7:30am ET.')
    expect(leagueLine('private credit')).toBe('Get the biggest private credit closes every morning by 7:30am ET.')
  })

  it('are recorded under their own form names', () => {
    for (const f of ['inline-story', 'inline-event', 'inline-firm', 'inline-league']) expect(sanitizeSignupForm(f)).toBe(f)
    expect(sanitizeSignupForm('inline-other')).toBeUndefined()
  })

  it('never call the brand educational', () => {
    for (const l of [STORY_LINE, firmLine('X', true), leagueLine()]) expect(l.toLowerCase()).not.toContain('educational')
  })
})
