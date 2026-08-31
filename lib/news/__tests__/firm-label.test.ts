import { describe, it, expect } from 'vitest'
import { firmLabelFor } from '../constants'

// firmLabelFor decides whether a headline already identifies the firm. It
// replaced the firm favicon as the row's identity anchor on 2026-08-30, so
// the failure modes matter in both directions: a needless label steals width
// from the headline, a missing one leaves the story unattributed.

describe('firmLabelFor', () => {
  it('hides the firm when the headline contains its full name', () => {
    expect(
      firmLabelFor('LGT Capital Partners', 'LGT Capital Partners beats target with €850m European small buyout fund'),
    ).toBeNull()
  })

  it('hides the firm when the headline contains its distinctive core', () => {
    expect(
      firmLabelFor('GenNx360 Capital Partners', 'GenNx360 scores $865m Fund IV close after $1.3bn of realisations'),
    ).toBeNull()
    expect(
      firmLabelFor('StepStone Group', 'StepStone raises $1.7bn for first dedicated infrastructure secondaries fund'),
    ).toBeNull()
  })

  it('shows the firm when the headline omits it entirely', () => {
    expect(firmLabelFor('Victory Capital', 'Buying the Platform Does Not Buy You Liquidity')).toBe(
      'Victory Capital',
    )
  })

  it('shows the firm when the headline uses only a nickname', () => {
    expect(
      firmLabelFor('Andreessen Horowitz', "Vijay Pande on Leaving a16z's $4B Bio Fund to Bet Small"),
    ).toBe('Andreessen Horowitz')
  })

  it('matches across punctuation and casing differences', () => {
    expect(firmLabelFor('KKR & Co.', 'KKR closes $5bn credit vehicle')).toBeNull()
    expect(firmLabelFor("Bridgepoint", 'BRIDGEPOINT SEALS DEAL')).toBeNull()
  })

  it('falls back to the full-name test for all-generic names', () => {
    // "Capital Group" has no distinctive core; matching on "capital" alone
    // would hide the label on any headline containing the word.
    expect(firmLabelFor('Capital Group', 'A new capital raise for private credit')).toBe('Capital Group')
    expect(firmLabelFor('Capital Group', 'Capital Group launches its first interval fund')).toBeNull()
  })

  it('does not match on cores too short to be distinctive', () => {
    expect(firmLabelFor('AB Capital', 'A big fund closes in Boston')).toBe('AB Capital')
  })

  it('handles missing input', () => {
    expect(firmLabelFor(null, 'Some headline')).toBeNull()
    expect(firmLabelFor('Blackstone', '')).toBe('Blackstone')
  })
})

describe('parenthetical asides', () => {
  it('ignores a parenthetical when deciding redundancy', () => {
    // The "&" inside the parens used to halt core extraction, so the whole
    // name leaked into the meta line beside a title that already said it.
    expect(firmLabelFor('AdvancingVC (Tim Hsia & Neil Devani)', 'AdvancingVC Summit')).toBeNull()
  })

  it('strips the aside from the label it does show', () => {
    expect(firmLabelFor('AdvancingVC (Tim Hsia & Neil Devani)', 'A summit for founders')).toBe(
      'AdvancingVC',
    )
  })
})
