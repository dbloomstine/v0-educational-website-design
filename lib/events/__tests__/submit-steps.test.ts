import { describe, it, expect } from 'vitest'
import { EVENT_STEPS, emptyEventDraft, eventPayload, eventReview, eventStepErrors, restoreEventDraft, type EventDraft } from '../submit-steps'

const good = (over: Partial<EventDraft> = {}): EventDraft => ({
  ...emptyEventDraft(),
  name: 'Private Funds CFO Forum 2027',
  event_url: 'https://example.com/cfo-forum',
  ...over,
})

describe('event steps', () => {
  it('ask for every field the one-page form had, once each', () => {
    const asked = EVENT_STEPS.flatMap((s) => s.fields)
    expect([...asked].sort()).toEqual(Object.keys(emptyEventDraft()).sort())
    expect(new Set(asked).size).toBe(asked.length)
  })

  it('only the name and the link are required (the route’s rules)', () => {
    const d = emptyEventDraft()
    expect(eventStepErrors('name', d)).toHaveProperty('name')
    expect(eventStepErrors('link', d)).toHaveProperty('event_url')
    for (const s of EVENT_STEPS.filter((s) => s.id !== 'name' && s.id !== 'link')) expect(eventStepErrors(s.id, d)).toEqual({})
    expect(EVENT_STEPS.filter((s) => !s.optional).map((s) => s.id)).toEqual(['name', 'link'])
  })

  it('a name needs five characters', () => {
    expect(eventStepErrors('name', good({ name: 'Expo' }))).toHaveProperty('name')
    expect(eventStepErrors('name', good({ name: 'Expo 1' }))).toEqual({})
  })

  it('reads a bare address as https and refuses one without a dot', () => {
    expect(eventStepErrors('link', good({ event_url: 'example.com/event' }))).toEqual({})
    expect(eventPayload(good({ event_url: 'example.com/event' })).event_url).toBe('https://example.com/event')
    expect(eventStepErrors('link', good({ event_url: 'localhost' }))).toHaveProperty('event_url')
  })

  it('refuses an end date before the start', () => {
    expect(eventStepErrors('dates', good({ start_date: '2027-03-02', end_date: '2027-03-01' }))).toHaveProperty('end_date')
    expect(eventStepErrors('dates', good({ start_date: '2027-03-02', end_date: '2027-03-03' }))).toEqual({})
    expect(eventStepErrors('dates', good({ start_date: '2027-03-02' }))).toEqual({})
  })

  it('checks the email only when one is given', () => {
    expect(eventStepErrors('you', good({ submitter_email: 'nope' }))).toHaveProperty('submitter_email')
    expect(eventStepErrors('you', good({ submitter_email: 'a@b.co' }))).toEqual({})
    expect(eventStepErrors('you', good())).toEqual({})
  })

  it('sends the one-page form’s fields plus the honeypot', () => {
    const p = eventPayload(good({ event_format: 'hybrid', cost_type: 'free' }), '')
    expect(Object.keys(p).sort()).toEqual(['website', ...Object.keys(emptyEventDraft())].sort())
    expect(p).toMatchObject({ website: '', event_format: 'hybrid', cost_type: 'free', start_date: '' })
  })
})

describe('event review', () => {
  it('labels every answer and joins the dates', () => {
    const v = Object.fromEntries(
      eventReview(good({ start_date: '2027-03-02', end_date: '2027-03-03', event_kind: 'forum', event_format: 'in_person' })).map((r) => [r.label, r.value]),
    )
    expect(v).toMatchObject({ Event: 'Private Funds CFO Forum 2027', Dates: 'March 2, 2027 to March 3, 2027', Type: 'Forum', Format: 'In person', Cost: null })
  })

  it('every row belongs to a step, in step order', () => {
    const steps = EVENT_STEPS.map((s) => s.id)
    const at = eventReview(good()).map((r) => steps.indexOf(r.stepId))
    expect(at.every((i) => i >= 0)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
  })

  it('restores only string answers', () => {
    expect(restoreEventDraft({ name: 'Saved', city: 3 as never }, emptyEventDraft())).toMatchObject({ name: 'Saved', city: '' })
  })
})
