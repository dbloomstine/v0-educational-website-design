import { describe, it, expect } from 'vitest'
import { splitHeadlineByEntities } from '../constants'

// The headline is the row's whole visual weight now, so what gets bolded is
// what a reader's eye lands on. Wrong bolding is worse than none: it points
// the eye at the wrong actor.

const bolded = (title: string, entities: (string | null)[]) =>
  splitHeadlineByEntities(title, entities)
    .filter((s) => s.bold)
    .map((s) => s.text)

const rebuild = (title: string, entities: (string | null)[]) =>
  splitHeadlineByEntities(title, entities)
    .map((s) => s.text)
    .join('')

describe('splitHeadlineByEntities', () => {
  it('bolds a firm named exactly in the headline', () => {
    expect(bolded('Crescent lands $232m for second CLO equity fund', ['Crescent'])).toEqual([
      'Crescent',
    ])
  })

  it('bolds the distinctive core of a longer firm name', () => {
    expect(
      bolded('StepStone raises $1.7bn for first dedicated infrastructure secondaries fund', [
        'StepStone Group',
      ]),
    ).toEqual(['StepStone'])
    expect(
      bolded('GenNx360 scores $865m Fund IV close after $1.3bn of realisations', [
        'GenNx360 Capital Partners',
      ]),
    ).toEqual(['GenNx360'])
  })

  it('prefers the full name when the headline carries all of it', () => {
    expect(
      bolded('LGT Capital Partners beats target with €850m European small buyout fund close', [
        'LGT Capital Partners',
      ]),
    ).toEqual(['LGT Capital Partners'])
  })

  it('bolds both a person and their firm', () => {
    expect(
      bolded("Rahul Seth's Industrial47 marks first close of debut fund at Rs 85 crore", [
        'Industrial47',
        'Rahul Seth',
      ]),
    ).toEqual(['Rahul Seth', 'Industrial47'])
  })

  it('leaves the headline unbolded when it never names the entity', () => {
    const segs = splitHeadlineByEntities('Buying the Platform Does Not Buy You Liquidity', [
      'Victory Capital',
    ])
    expect(segs).toEqual([{ text: 'Buying the Platform Does Not Buy You Liquidity', bold: false }])
  })

  it('does not match inside a longer word', () => {
    // "Crescent" must not bold the "Crescent" inside "Crescendo".
    expect(bolded('Crescendo Partners exits its stake', ['Crescent'])).toEqual([])
  })

  it('handles possessives without swallowing the suffix', () => {
    const segs = splitHeadlineByEntities("Vijay Pande on Leaving a16z's $4B Bio Fund", ['Vijay Pande'])
    expect(segs.filter((s) => s.bold).map((s) => s.text)).toEqual(['Vijay Pande'])
    expect(segs[segs.length - 1].text).toContain("a16z's")
  })

  it('never drops or duplicates any characters', () => {
    const title = "Rahul Seth's Industrial47 marks first close of debut fund"
    expect(rebuild(title, ['Industrial47', 'Rahul Seth'])).toBe(title)
    expect(rebuild(title, [])).toBe(title)
    expect(rebuild(title, [null, 'Nonexistent Firm'])).toBe(title)
  })

  it('ignores entities too short to be distinctive', () => {
    expect(bolded('AB raises a fund', ['AB'])).toEqual([])
  })

  it('is case-insensitive', () => {
    expect(bolded('BRIDGEPOINT SEALS DEAL', ['Bridgepoint'])).toEqual(['BRIDGEPOINT'])
  })
})
