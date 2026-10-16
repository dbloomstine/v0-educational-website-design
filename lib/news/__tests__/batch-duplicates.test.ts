import { describe, expect, it } from 'vitest'
import { batchDuplicateMarks, corroborated, duplicateNoteTargets, type BatchRow } from '../batch-duplicates'

describe('duplicateNoteTargets', () => {
  // Every form the classifier wrote in the fortnight to 2026-10-16.
  it('reads the id out of each wording', () => {
    expect(duplicateNoteTargets('Duplicate of article id 1; same story from different wire.')).toEqual([1])
    expect(duplicateNoteTargets('Duplicate of article ID 5; life sciences venture fund with Asia-focused strategies.')).toEqual([5])
    expect(duplicateNoteTargets('Duplicate of articles ID 5 and 7; two life sciences funds totaling $3B.')).toEqual([5, 7])
    expect(duplicateNoteTargets('Duplicate of id 0; snippet lacks substantive detail.')).toEqual([0])
    expect(duplicateNoteTargets('Duplicate of id 0: portfolio company M&A, not fund activity.')).toEqual([0])
    expect(duplicateNoteTargets('Duplicate/abbreviated version of article id=5; minimal snippet provided; Thoma Bravo-backed Proofpoint acquiring Varonis')).toEqual([5])
    expect(duplicateNoteTargets('Duplicate/variant of article id 7; same EQT-Stockbridge deal; Stockbridge is real estate fund operator/service provider.')).toEqual([7])
    expect(duplicateNoteTargets('LP governance letter to portfolio company on IPO; not about fund launch, close, or capital raise. Duplicate of id 8.')).toEqual([8])
    expect(duplicateNoteTargets('Snippet is paywall placeholder, no article content. Duplicate of ID 3; startup Series D, not institutional fund.')).toEqual([3])
    expect(duplicateNoteTargets('Snippet truncated; appears to be duplicate of article id 6')).toEqual([6])
    expect(duplicateNoteTargets('Duplicates item 4.')).toEqual([4])
  })
  it('says nothing when no id is given, or the note is about something else', () => {
    expect(duplicateNoteTargets('Duplicate coverage of Nauta Fund VI first close; 75% LP retention detail added.')).toEqual([])
    expect(duplicateNoteTargets('Fund size not disclosed in snippet; article id 5 unrelated.')).toEqual([])
    expect(duplicateNoteTargets('Portfolio company M&A, not fund activity.')).toEqual([])
    expect(duplicateNoteTargets(null)).toEqual([])
  })
})

const row = (o: Partial<BatchRow> & { id: string; title: string }): BatchRow => ({
  sourceName: null, textLength: 500, firmName: null, fundName: null, fundSizeUsdMillions: null, note: null, ...o,
})

describe('batchDuplicateMarks', () => {
  it('marks the noted row as the copy of the row it points at, when the rows bear it out', () => {
    const rows = [
      row({ id: 'a', title: 'Thoma Bravo-backed Proofpoint to acquire Varonis for $5.5bn', firmName: 'Thoma Bravo', fundSizeUsdMillions: 5500, sourceName: 'Reuters' }),
      row({ id: 'b', title: 'Proofpoint to buy Varonis in $5.5 billion deal', firmName: 'Thoma Bravo', fundSizeUsdMillions: 5500, sourceName: 'PE Hub', textLength: 80, note: 'Duplicate/abbreviated version of article id=0; minimal snippet' }),
    ]
    expect(batchDuplicateMarks(rows)).toEqual([{ id: 'b', canonicalId: 'a', reason: 'same story by the site’s rules' }])
  })
  it('ignores a note the rows do not bear out, the row itself, and an id outside the batch', () => {
    const rows = [
      row({ id: 'a', title: 'Arch Venture raises $2bn for life sciences fund', firmName: 'Arch Venture Partners', fundSizeUsdMillions: 2000 }),
      row({ id: 'b', title: 'Flagship Pioneering closes $1bn Asia fund', firmName: 'Flagship Pioneering', fundSizeUsdMillions: 1000, note: 'Duplicate of articles ID 0 and 9; two life sciences funds totaling $3B.' }),
      row({ id: 'c', title: 'A story that calls itself a copy', note: 'Duplicate of id 2.' }),
    ]
    expect(batchDuplicateMarks(rows)).toEqual([])
  })
  it('the same article twice (direct feed and a mirror) is the copy, by headline', () => {
    const rows = [
      row({ id: 'a', title: 'Hedgeweek: Millennium adds veteran fixed-income exec as senior adviser', sourceName: 'Hedge Week' }),
      row({ id: 'b', title: 'Millennium adds veteran fixed-income exec as senior adviser', sourceName: 'Hedgeweek', note: 'Duplicate of article id 0; same story from different wire.' }),
    ]
    expect(batchDuplicateMarks(rows)).toEqual([{ id: 'b', canonicalId: 'a', reason: 'near-identical headlines' }])
  })
  it('when each points at the other, the thinner row is the copy, and a row is marked once', () => {
    const rows = [
      row({ id: 'a', title: 'EQT agrees to buy Stockbridge', firmName: 'EQT', fundSizeUsdMillions: 1200, textLength: 90, note: 'Duplicate/variant of article id 1' }),
      row({ id: 'b', title: 'EQT to acquire real estate manager Stockbridge', firmName: 'EQT', fundSizeUsdMillions: 1200, textLength: 900, note: 'Duplicate of id 0' }),
    ]
    expect(batchDuplicateMarks(rows)).toEqual([{ id: 'a', canonicalId: 'b', reason: 'same story by the site’s rules' }])
  })
  it('corroborated: same outlet needs overlapping headlines; different outlets need the site’s rules', () => {
    expect(corroborated(row({ id: 'a', title: 'KKR closes Fund XIV at $20bn', sourceName: 'Buyouts' }), row({ id: 'b', title: 'KKR hires new head of Asia', sourceName: 'Buyouts' }))).toBeNull()
    expect(corroborated(row({ id: 'a', title: 'KKR closes Fund XIV at $20bn', sourceName: 'Buyouts' }), row({ id: 'b', title: 'KKR wraps up Fund XIV fundraise with $20bn in commitments', sourceName: 'Buyouts' }))).toBe('same outlet, overlapping headlines')
  })
})
