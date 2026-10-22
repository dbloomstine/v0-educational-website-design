// 2026-10-22: JD Supra alerts are credited to the firm that wrote them, with the shapes the feeds really send.
import { describe, it, expect } from 'vitest'
import { bylineFirm, cleanFirmName, creditOutlet, isRepublisher, sourceCredit, stripByline } from '../source-credit'
import { prepareRows } from '../story-summary'
import { sourceTier } from '@/lib/newsletter/query-articles'
import { normalizeSourceName } from '../constants'

const STORED = 'audiences. Our Investment Funds Group examines the exception’s requirements, safeguards, and limits....By: Alston & Bird'

describe('sourceCredit', () => {
  it('credits the firm from an old row’s description (no author)', () => {
    expect(sourceCredit({ sourceName: 'JD Supra Securities Law', author: null, description: STORED })).toBe('Alston & Bird via JD Supra')
    expect(sourceCredit({ sourceName: 'JD Supra Finance & Banking', description: 'oach can work, until a different question comes up: How did you decide that was the right decision?...By: Saul Ewing LLP' }))
      .toBe('Saul Ewing LLP via JD Supra')
    expect(sourceCredit({ sourceName: 'JD Supra Finance & Banking', description: 'issuers should evaluate federal and state regulatory pathways....By: Ankura' })).toBe('Ankura via JD Supra')
    expect(sourceCredit({ sourceName: 'JD Supra Securities Law', description: 'cations that would qualify natural persons for accredited investor status....By: Sheppard, Mullin, Richter & Hampton LLP' }))
      .toBe('Sheppard, Mullin, Richter & Hampton LLP via JD Supra')
  })

  it('prefers the stored author (first dc:creator), decoding a twice-escaped name', () => {
    expect(sourceCredit({ sourceName: 'JD Supra Securities Law', author: 'A&amp;O Shearman', description: STORED })).toBe('A&O Shearman via JD Supra')
    expect(sourceCredit({ sourceName: 'JD Supra Securities Law', author: '  Morgan Lewis ' })).toBe('Morgan Lewis via JD Supra')
  })

  it('reads the raw feed markup too', () => {
    const raw = 'The SEC has approved amendments to FINRA Rule 2210....<BR />By: <a href="https://www.jdsupra.com/profile/morgan-lewis/">Morgan Lewis</a>'
    expect(bylineFirm(raw)).toBe('Morgan Lewis')
    expect(sourceCredit({ sourceName: 'JD Supra Securities Law', description: raw })).toBe('Morgan Lewis via JD Supra')
  })

  it('falls back to the outlet when no firm is found', () => {
    expect(sourceCredit({ sourceName: 'JD Supra Securities Law', description: 'No byline here.' })).toBe('JD Supra')
    expect(sourceCredit({ sourceName: 'JD Supra Securities Law', description: null })).toBe('JD Supra')
    expect(sourceCredit({ sourceName: 'JD Supra Securities Law', author: 'https://www.jdsupra.com/x' })).toBe('JD Supra')
  })

  it('leaves every other outlet as it was', () => {
    expect(sourceCredit({ sourceName: 'Law360 Private Equity', description: 'Something....By: Someone' })).toBe(sourceCredit({ sourceName: 'Law360 Private Equity' }))
    expect(sourceCredit({ sourceName: 'Bloomberg.com', author: 'A Reporter' })).toBe(normalizeSourceName('Bloomberg.com'))
    expect(sourceCredit({ sourceName: null })).toBeNull()
    expect(isRepublisher('Law360 Asset Management')).toBe(false)
    expect(isRepublisher('JD Supra Finance & Banking')).toBe(true)
  })
})

describe('cleanFirmName / creditOutlet', () => {
  it('keeps the name as given, trimmed', () => {
    expect(cleanFirmName(' Proskauer - Regulatory & Compliance ')).toBe('Proskauer - Regulatory & Compliance')
    expect(cleanFirmName('Hudson Cook, LLP')).toBe('Hudson Cook, LLP')
    expect(cleanFirmName('')).toBeNull()
    expect(cleanFirmName('JD Supra')).toBeNull()
  })
  it('names the outlet behind a credit', () => {
    expect(creditOutlet('Morgan Lewis via JD Supra')).toBe('JD Supra')
    expect(creditOutlet('Reuters')).toBe('Reuters')
    expect(sourceTier('Morgan Lewis via JD Supra')).toBe(sourceTier('JD Supra'))
  })
})

describe('stripByline', () => {
  it('takes the closing byline off a JD Supra description', () => {
    expect(stripByline(STORED, 'JD Supra Securities Law')).toBe('audiences. Our Investment Funds Group examines the exception’s requirements, safeguards, and limits…')
    expect(stripByline('Top stories include: • The Cornell scandal offers lessons for high-stakes...By: Thomas Fox - Compliance Evangelist', 'JD Supra Finance & Banking'))
      .toBe('Top stories include: • The Cornell scandal offers lessons for high-stakes…')
    expect(stripByline('A finished sentence.<BR />By: <a href="https://www.jdsupra.com/profile/x/">Walkers</a>', 'JD Supra Securities Law')).toBe('A finished sentence.')
  })
  it('leaves other outlets’ text alone', () => {
    expect(stripByline('Written... By: Jane Doe', 'Reuters')).toBe('Written... By: Jane Doe')
    expect(stripByline(null, 'JD Supra Securities Law')).toBe('')
  })
  it('keeps the byline out of the material the summary writer and social job read, and credits the firm', () => {
    const [row] = prepareRows([
      { id: '1', title: 'SEC Approves FINRA Rule Change', description: `The rule lets broker-dealers share projected performance with qualified purchasers and institutional ${STORED}`, full_text: null, source_name: 'JD Supra Securities Law' },
    ])
    expect(row.outlet).toBe('Alston & Bird via JD Supra')
    expect(row.description).not.toMatch(/By:/)
  })
})
