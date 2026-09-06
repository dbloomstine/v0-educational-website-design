import { describe, it, expect } from 'vitest'
import { LOOKALIKE_SEGMENTS, segmentForDate, titleMatchesSegment } from '../segments'
import { composeLookalikeEmail, qualityGateLookalike, CAN_SPAM_FOOTER, LOOKALIKE_SUBJECT } from '../template'
import { sha256Hex } from '../suppression'

describe('lookalike segments', () => {
  it('rotates through every segment over five consecutive days', () => {
    const keys = new Set(['2026-09-07','2026-09-08','2026-09-09','2026-09-10','2026-09-11'].map((d) => segmentForDate(d).key))
    expect(keys.size).toBe(LOOKALIKE_SEGMENTS.length)
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
