import { describe, it, expect } from 'vitest'
import {
  NEWS_STEPS,
  emptyNewsDraft,
  newsPayload,
  newsReview,
  newsStepErrors,
  newsStepForField,
  restoreNewsDraft,
  withScheme,
  type NewsDraft,
} from '../news-steps'
import { FREE_MAIL_ERROR, NEWS_FIELDS, validateNewsSubmission } from '../validate'

const NOW = new Date('2026-10-22T15:00:00Z')

const good = (over: Partial<NewsDraft> = {}): NewsDraft => ({
  ...emptyNewsDraft('', '2026-10-21'),
  kind: 'fund_close',
  firm: 'Example Capital',
  firm_website: 'example.com',
  headline: 'Example Capital closes Fund III at $450M',
  details: 'Example Capital held the final close of Fund III at $450M, above its $350M target.',
  amount: '450M',
  contact_name: 'Pat Lee',
  contact_role: 'Head of IR',
  contact_email: 'pat@example.com',
  ...over,
})

describe('news steps', () => {
  it('ask for every field the server checks, each on exactly one step', () => {
    const asked = NEWS_STEPS.flatMap((s) => s.fields)
    expect([...asked].sort()).toEqual([...NEWS_FIELDS].sort())
    expect(new Set(asked).size).toBe(asked.length)
  })

  it('a complete draft passes every step and the server', () => {
    const d = good()
    for (const s of NEWS_STEPS) expect(newsStepErrors(s.id, d, NOW)).toEqual({})
    expect(validateNewsSubmission(newsPayload(d), NOW).ok).toBe(true)
  })

  it('an empty draft stops on each required step, and only on its own fields', () => {
    const d = emptyNewsDraft()
    expect(Object.keys(newsStepErrors('kind', d, NOW))).toEqual(['kind'])
    expect(Object.keys(newsStepErrors('firm', d, NOW)).sort()).toEqual(['firm', 'firm_website'])
    expect(Object.keys(newsStepErrors('headline', d, NOW))).toEqual(['headline'])
    expect(Object.keys(newsStepErrors('details', d, NOW))).toEqual(['details'])
    expect(Object.keys(newsStepErrors('when', d, NOW))).toEqual(['news_date'])
    expect(newsStepErrors('link', d, NOW)).toEqual({})
    expect(newsStepErrors('people', d, NOW)).toEqual({})
    expect(Object.keys(newsStepErrors('you', d, NOW)).sort()).toEqual(['contact_email', 'contact_name', 'contact_role'])
  })

  it('refuses free mail on the email step, in the server’s words', () => {
    expect(newsStepErrors('you', good({ contact_email: 'pat@gmail.com' }), NOW)).toEqual({ contact_email: FREE_MAIL_ERROR })
  })

  it('checks the amount and the date on the "when" step', () => {
    expect(newsStepErrors('when', good({ amount: 'lots' }), NOW)).toHaveProperty('amount')
    expect(newsStepErrors('when', good({ news_date: '2020-01-01' }), NOW)).toHaveProperty('news_date')
    expect(newsStepErrors('when', good({ amount: '' }), NOW)).toEqual({})
  })

  it('adds https:// to a bare link and refuses a broken one', () => {
    expect(newsStepErrors('link', good({ url: 'example.com/news/fund-iii' }), NOW)).toEqual({})
    expect(newsPayload(good({ url: 'example.com/news' })).url).toBe('https://example.com/news')
    expect(newsStepErrors('link', good({ url: 'not a link' }), NOW)).toHaveProperty('url')
    expect(withScheme('  ')).toBe('')
    expect(withScheme('http://x.com')).toBe('http://x.com')
  })

  it('sends the payload the one-page form sent', () => {
    const p = newsPayload(good({ people: [{ name: 'Ana Ruiz', role: 'Partner' }, { name: '', role: '' }] }), '')
    expect(p).toMatchObject({
      website: '',
      kind: 'fund_close',
      firm: 'Example Capital',
      firm_website: 'example.com',
      currency: 'USD',
      news_date: '2026-10-21',
      person_name_0: 'Ana Ruiz',
      person_role_0: 'Partner',
      person_name_1: '',
    })
    expect(p).not.toHaveProperty('wants_newsletter')
    expect(newsPayload(good({ wants_newsletter: true })).wants_newsletter).toBe('on')
    expect(newsPayload(good(), 'bot').website).toBe('bot')
  })

  it('maps a server refusal back to its step', () => {
    expect(newsStepForField('contact_email')).toBe('you')
    expect(newsStepForField('news_date')).toBe('when')
    expect(newsStepForField('firm_website')).toBe('firm')
    expect(newsStepForField('person_name_2')).toBe('people')
    expect(newsStepForField('nope')).toBeUndefined()
  })
})

describe('news review', () => {
  it('lists every answer under the step that asked it, in order', () => {
    const rows = newsReview(good({ people: [{ name: 'Ana Ruiz', role: 'Partner' }, { name: 'Bo Chen', role: '' }], url: 'example.com/pr' }))
    const steps = NEWS_STEPS.map((s) => s.id)
    // Every row belongs to a real step, and rows come in step order.
    const at = rows.map((r) => steps.indexOf(r.stepId))
    expect(at.every((i) => i >= 0)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
    const v = Object.fromEntries(rows.map((r) => [r.label, r.value]))
    expect(v).toMatchObject({
      'Kind of news': 'Fund close',
      Firm: 'Example Capital',
      Date: 'October 21, 2026',
      Amount: '450M USD',
      'Public link': 'https://example.com/pr',
      'People involved': 'Ana Ruiz, Partner\nBo Chen',
      'Work email': 'pat@example.com',
    })
  })

  it('shows a skipped answer as not given', () => {
    const v = Object.fromEntries(newsReview(good({ amount: '', url: '' })).map((r) => [r.label, r.value]))
    expect(v.Amount).toBeNull()
    expect(v['Public link']).toBeNull()
    expect(v['People involved']).toBeNull()
  })
})

describe('restoreNewsDraft', () => {
  it('keeps what was typed and drops what is malformed', () => {
    const init = emptyNewsDraft('Linked Firm', '2026-10-22')
    const r = restoreNewsDraft({ headline: 'Saved', kind: 'bogus' as never, people: 'x' as never, firm: '' }, init)
    expect(r.headline).toBe('Saved')
    expect(r.kind).toBe('')
    expect(r.people).toEqual([{ name: '', role: '' }])
    expect(r.firm).toBe('Linked Firm')
    expect(restoreNewsDraft({ firm: 'Typed Firm' }, init).firm).toBe('Typed Firm')
  })
})
