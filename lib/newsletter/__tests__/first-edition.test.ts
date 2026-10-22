import { describe, expect, it } from 'vitest'
import { firstEditionWhen } from '../first-edition'

describe('when a new reader’s first edition arrives', () => {
  it('is this morning before 7:15 New York time, tomorrow after', () => {
    expect(firstEditionWhen(new Date('2026-10-22T10:00:00Z'))).toBe('this morning by 7:30am ET') // 6:00 EDT
    expect(firstEditionWhen(new Date('2026-10-22T11:20:00Z'))).toBe('tomorrow by 7:30am ET') // 7:20 EDT
    expect(firstEditionWhen(new Date('2026-10-22T18:00:00Z'))).toBe('tomorrow by 7:30am ET') // 2pm
  })
  it('follows New York’s clock through daylight saving', () => {
    expect(firstEditionWhen(new Date('2026-12-01T11:30:00Z'))).toBe('this morning by 7:30am ET') // 6:30 EST
    expect(firstEditionWhen(new Date('2026-12-01T12:20:00Z'))).toBe('tomorrow by 7:30am ET') // 7:20 EST
  })
})
