// The adviser mapper (lib/news/advisers.ts, 2026-10-22). Every role string
// below is one the classifier really wrote in the ninety days to 2026-10-22.
import { describe, it, expect } from 'vitest'
import { adviserDisplayName, adviserKind, storyAdvisers } from '../advisers'
import { buildStories } from '../stories'

const ent = (name: string, role: string, confidence = 0.85, type = 'firm') => ({ name, role, confidence, type })

describe('adviserKind', () => {
  it('maps the legal roles the classifier writes', () => {
    for (const role of ['legal advisor', 'legal counsel', 'legal_advisor', 'Legal adviser', 'counsel', 'fund counsel', 'law firm advisor', 'law_firm', 'issuer counsel', 'target counsel', 'acquirer counsel', 'legal counsel to Peterson and Kelso', 'legal counsel to acquirer', 'legal_counsel'])
      expect(adviserKind(role, 'fund'), role).toBe('legal')
  })

  it('maps placement agents', () => {
    expect(adviserKind('placement agent', 'fund')).toBe('placement')
    expect(adviserKind('structuring advisor and placement agent', 'fund')).toBe('placement')
  })

  it('counts a lender only when the role says fund finance', () => {
    expect(adviserKind('fund finance lender', 'fund')).toBe('lender')
    // The deal's own lender, or the story's subject: not an adviser.
    for (const role of ['lender', 'lender/investor', 'lender/equity investor', 'senior lender', 'credit facility provider', 'borrower / digital lender', 'lender / fund manager'])
      expect(adviserKind(role, 'fund'), role).toBeNull()
  })

  it('maps financial advisers, and a bare "advisor" only on a deal', () => {
    for (const role of ['financial advisor', 'financial adviser', 'Financial advisor to Blackstone', 'M&A advisor', 'IPO adviser', 'buy-side advisor', 'financial adviser to target', 'advisor/banker'])
      expect(adviserKind(role, 'deal'), role).toBe('financial')
    expect(adviserKind('advisor', 'deal')).toBe('financial')
    expect(adviserKind('adviser to Proofpoint', 'deal')).toBe('financial')
    // On a fund a bare "advisor" may be its investment adviser (Burry, Meketa).
    expect(adviserKind('advisor', 'fund')).toBeNull()
    expect(adviserKind('financial advisor', 'fund')).toBe('financial') // Jefferies on a continuation vehicle
  })

  it('never maps fund administrators, custodians, auditors or depositaries', () => {
    for (const role of ['fund administrator', 'target / fund administrator', 'fund administrator, target', 'fund administrator (target)', 'acquirer / fund administrator', 'ai-native fund administrator; acquirer', 'SEC-registered investment adviser, fund administrator', 'custodian', 'auditor', 'depositary', 'legal counsel and fund administrator'])
      expect(adviserKind(role, 'fund'), role).toBeNull()
  })

  it('drops parties to the deal that merely carry an adviser word', () => {
    for (const role of ['co-sponsor, originator, advisor', 'adviser, tokenization platform', 'wholly owned adviser', 'acquirer (adviser)', 'acquired advisory firm', 'law firm target', 'law firm acquirer', 'portfolio company / law firm', 'senior adviser', 'operating advisor', 'financial sponsor', 'credit investor/new owner', 'adviser platform', 'arranger', 'subadviser', 'investor', 'owner'])
      expect(adviserKind(role, 'deal'), role).toBeNull()
  })
})

describe('adviserDisplayName', () => {
  it('drops suffixes and applies the aliases', () => {
    expect(adviserDisplayName('Kirkland & Ellis LLP')).toBe('Kirkland & Ellis')
    expect(adviserDisplayName('Kirkland')).toBe('Kirkland & Ellis')
    expect(adviserDisplayName('Proskauer Rose LLP')).toBe('Proskauer')
    expect(adviserDisplayName('Paul Hastings LLP')).toBe('Paul Hastings')
    expect(adviserDisplayName('Piper Sandler & Co.')).toBe('Piper Sandler')
    expect(adviserDisplayName('Robert W. Baird & Co.')).toBe('Baird')
    expect(adviserDisplayName('Evercore Private Funds Group')).toBe('Evercore')
    expect(adviserDisplayName('McDermott Will & Emery')).toBe('McDermott Will & Schulte')
    expect(adviserDisplayName('Campbell Lutyens')).toBe('Campbell Lutyens')
  })
})

describe('storyAdvisers', () => {
  it('merges rows: one entry per firm, counsel first', () => {
    // Audax Private Debt DLS III, three outlets.
    const rows = [
      { entities_raw: [ent('Audax Private Debt', 'manager', 0.95), ent('Campbell Lutyens', 'placement agent'), ent('Ropes & Gray', 'fund counsel')] },
      { entities_raw: [ent('Ropes & Gray LLP', 'legal counsel', 0.9)] },
      { entities_raw: null },
    ]
    expect(storyAdvisers(rows, 'fund_close', ['Audax Private Debt'])).toEqual([
      { name: 'Ropes & Gray', kind: 'legal', label: 'fund counsel' },
      { name: 'Campbell Lutyens', kind: 'placement', label: 'placement agent' },
    ])
  })

  it('applies the confidence floor and skips people', () => {
    const rows = [{ entities_raw: [ent('Latham & Watkins', 'legal counsel', 0.6), ent('Jane Doe', 'legal counsel', 0.9, 'person'), ent('Monument Group', 'placement agent', 0.9)] }]
    expect(storyAdvisers(rows, 'fund_close').map((a) => a.name)).toEqual(['Monument Group'])
  })

  it('never shows the story’s own firm as its adviser', () => {
    // "Apollo weighs expanding SoftBank’s Vision Fund loan to $9bn"
    const rows = [{ entities_raw: [ent('Apollo Global Management', 'fund finance lender', 0.95)] }]
    expect(storyAdvisers(rows, 'capital_raise', ['Apollo'])).toEqual([])
    expect(storyAdvisers(rows, 'capital_raise', [])).toEqual([{ name: 'Apollo Global Management', kind: 'lender', label: 'fund finance' }])
  })

  it('never shows an administrator, even under an adviser’s role', () => {
    const rows = [{ entities_raw: [ent('Alter Domus', 'financial advisor', 0.9), ent('IQ-EQ', 'legal counsel', 0.9)] }]
    expect(storyAdvisers(rows, 'acquisition')).toEqual([])
  })

  it('labels deal counsel "legal counsel" and works only on fund and deal stories', () => {
    const rows = [{ entities_raw: [ent('Orrick', 'law firm advisor', 0.9), ent('Kirkland', 'law firm advisor', 0.9), ent('Goldman Sachs', 'financial advisor', 0.9)] }]
    expect(storyAdvisers(rows, 'acquisition')).toEqual([
      { name: 'Orrick', kind: 'legal', label: 'legal counsel' },
      { name: 'Kirkland & Ellis', kind: 'legal', label: 'legal counsel' },
      { name: 'Goldman Sachs', kind: 'financial', label: 'financial adviser' },
    ])
    expect(storyAdvisers(rows, 'executive_hire')).toEqual([])
    expect(storyAdvisers(rows, null)).toEqual([])
  })

  it('says "legal counsel", not "fund counsel", for counsel to someone else on a fund', () => {
    const rows = [{ entities_raw: [ent('Simpson Thacher', 'legal counsel to StepStone', 0.85)] }]
    expect(storyAdvisers(rows, 'fund_close')).toEqual([{ name: 'Simpson Thacher & Bartlett', kind: 'legal', label: 'legal counsel' }])
  })
})

describe('buildStories carries the advisers', () => {
  it('sets advisers on a close and leaves the field off a story without any', () => {
    const base = {
      source_url: 'https://example.com/a', source_name: 'PE Hub', published_date: '2026-10-20', created_at: '2026-10-20T14:00:00Z',
      fund_categories: ['PE'], is_high_signal: true, relevance_score: 0.8, classification_status: 'complete',
    }
    const stories = buildStories([
      {
        ...base, id: '00000000-0000-4000-8000-000000000101', event_type: 'fund_close', article_type: 'fund_close',
        title: 'Consonance Capital Partners Closes Fund III at $1.35 Billion Hard Cap',
        tldr: 'Consonance Capital Partners closed its third healthcare fund at its $1.35 billion hard cap.',
        entities_raw: [ent('Consonance Capital Partners', 'manager', 0.95), ent('Monument Group', 'placement agent', 0.9), ent('Latham & Watkins LLP', 'legal counsel', 0.9)],
        extracted_data: { firm_name: 'Consonance Capital Partners', fund_name: 'Consonance Capital Partners III', fund_size_usd_millions: 1350, close_type: 'hard_cap' },
      },
      {
        ...base, id: '00000000-0000-4000-8000-000000000102', source_url: 'https://example.com/b', event_type: 'executive_hire', article_type: 'people_move',
        title: 'Jane Smith Joins Northwind Capital as CFO', tldr: 'Northwind Capital hired Jane Smith as chief financial officer.',
        entities_raw: [ent('Northwind Capital', 'employer', 0.9)],
        extracted_data: { firm_name: 'Northwind Capital', person_name: 'Jane Smith', person_title: 'CFO' },
      },
    ])
    const close = stories.find((s) => s.eventType === 'fund_close')
    expect(close?.advisers).toEqual([
      { name: 'Latham & Watkins', kind: 'legal', label: 'fund counsel' },
      { name: 'Monument Group', kind: 'placement', label: 'placement agent' },
    ])
    for (const s of stories.filter((s) => s.eventType !== 'fund_close')) expect(s.advisers).toBeUndefined()
  })
})
