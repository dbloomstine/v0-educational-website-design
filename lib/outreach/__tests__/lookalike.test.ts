import { describe, it, expect } from 'vitest'
import { LOOKALIKE_SEGMENTS, segmentForDate, titleMatchesSegment, isCompetitor } from '../segments'
import { composeLookalikeEmail, qualityGateLookalike, CAN_SPAM_FOOTER, LOOKALIKE_SUBJECT } from '../template'
import { sha256Hex } from '../suppression'

describe('lookalike segments', () => {
  it('rotates through every segment over N consecutive days', () => {
    const days = LOOKALIKE_SEGMENTS.map((_, i) => new Date(Date.UTC(2026, 8, 7 + i)).toISOString().slice(0, 10))
    const keys = new Set(days.map((d) => segmentForDate(d).key))
    expect(keys.size).toBe(LOOKALIKE_SEGMENTS.length)
  })
  it('never targets IQ-EQ competitor segments', () => {
    const keys = LOOKALIKE_SEGMENTS.map((s) => s.key)
    expect(keys).not.toContain('fund_admin_accounting')
    expect(keys).not.toContain('emerging_gp_ops')
    for (const s of LOOKALIKE_SEGMENTS) expect(s.keywords).not.toMatch(/fund administration|compliance consult/i)
  })
  it('competitor screen catches admins and compliance consultants by title or firm', () => {
    expect(isCompetitor('Head of Fund Administration', 'Some Bank')).toBe(true)
    expect(isCompetitor('Partner', 'Alter Domus')).toBe(true)
    expect(isCompetitor('Managing Director', 'ACA Group')).toBe(true)
    expect(isCompetitor('Director, Fund Services', 'Anything LLC')).toBe(true)
    expect(isCompetitor('Partner', 'Kirkland & Ellis')).toBe(false)
    expect(isCompetitor('Audit Partner', 'Withum')).toBe(false)
    expect(isCompetitor(null, null)).toBe(false)
  })
  it('matches titles case-insensitively by substring', () => {
    const lawyers = LOOKALIKE_SEGMENTS.find((s) => s.key === 'fund_lawyers')!
    expect(titleMatchesSegment('Partner, Investment Funds', lawyers)).toBe(true)
    expect(titleMatchesSegment('Senior Associate', lawyers)).toBe(false)
    expect(titleMatchesSegment(null, lawyers)).toBe(false)
  })
})

describe('lookalike email', () => {
  const seg = LOOKALIKE_SEGMENTS[0]
  const { subject, body } = composeLookalikeEmail({ firstName: 'Sam', segment: seg, recipientEmail: 'sam@example.com' })
  it('passes its own gate', () => {
    expect(qualityGateLookalike(body, subject)).toEqual({ ok: true })
  })
  it('carries the link, signature, footer, and no dashes', () => {
    expect(subject).toBe(LOOKALIKE_SUBJECT)
    expect(body).toContain('fundopshq.com')
    expect(body).toMatch(/\nDanny\n/)
    expect(body).toContain(CAN_SPAM_FOOTER)
    expect(body).not.toMatch(/[–—]/)
    expect(body.startsWith('Hi Sam,')).toBe(true)
  })
  it('is generic: no segment language, offers an easy out and a pass-along', () => {
    expect(body).not.toMatch(/readers are|people like you|folks like yourself/i)
    expect(body).toMatch(/pass it along/)
    expect(body).toMatch(/no worries/)
    expect(body).toMatch(/feedback/)
  })
  it('gate rejects a body missing the footer', () => {
    expect(qualityGateLookalike(body.replace(CAN_SPAM_FOOTER, ''), subject)).toEqual({ ok: false, reason: 'missing_can_spam_footer' })
  })
})

describe('suppression hashing', () => {
  it('is case- and whitespace-insensitive and matches Postgres sha256(lower(trim()))', () => {
    expect(sha256Hex('  Danny@Example.com ')).toBe(sha256Hex('danny@example.com'))
    expect(sha256Hex('danny@example.com')).toHaveLength(64)
  })
})
