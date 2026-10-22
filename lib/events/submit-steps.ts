/**
 * "Submit an event" (/events/submit) as one question at a time (2026-10-22):
 * the steps, their checks, the review rows and the payload. Browser-safe and
 * free of React; tested in lib/events/__tests__/submit-steps.test.ts and drawn
 * by components/events/SubmitEventForm.tsx with components/forms/Stepper.tsx.
 *
 * The checks are POST /api/events/submit's own rules (name of 5+ characters,
 * an http(s) address with a dot in it, YYYY-MM-DD dates, an email shape),
 * asked on the step they belong to, plus one the route never needed to make:
 * an end date before the start. The payload is what the one-page form's
 * FormData sent. The route is unchanged.
 */
import { withScheme } from '@/lib/submit/news-steps'

export interface EventDraft {
  name: string
  event_url: string
  start_date: string
  end_date: string
  organizer_name: string
  city: string
  event_format: string
  event_kind: string
  cost_type: string
  description: string
  submitter_name: string
  submitter_email: string
}

export type EventStepId = 'name' | 'link' | 'dates' | 'where' | 'format' | 'kind' | 'cost' | 'about' | 'you'
export type EventField = keyof EventDraft

export const EVENT_STEPS: ReadonlyArray<{ id: EventStepId; fields: readonly EventField[]; optional?: boolean }> = [
  { id: 'name', fields: ['name'] },
  { id: 'link', fields: ['event_url'] },
  { id: 'dates', fields: ['start_date', 'end_date'], optional: true },
  { id: 'where', fields: ['organizer_name', 'city'], optional: true },
  { id: 'format', fields: ['event_format'], optional: true },
  { id: 'kind', fields: ['event_kind'], optional: true },
  { id: 'cost', fields: ['cost_type'], optional: true },
  { id: 'about', fields: ['description'], optional: true },
  { id: 'you', fields: ['submitter_name', 'submitter_email'], optional: true },
]

/** The same lists and stored values as the route (FORMATS, KINDS, COSTS); the labels the old form used. */
export const EVENT_FORMAT_OPTIONS = [
  { value: 'in_person', label: 'In person' },
  { value: 'hybrid', label: 'Hybrid', hint: 'In person, and streamed' },
  { value: 'virtual', label: 'Virtual or webinar' },
] as const
export const EVENT_KIND_OPTIONS = [
  { value: 'conference', label: 'Conference' },
  { value: 'summit', label: 'Summit' },
  { value: 'forum', label: 'Forum' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'training', label: 'Training' },
  { value: 'networking', label: 'Networking' },
  { value: 'roundtable', label: 'Roundtable' },
  { value: 'awards', label: 'Awards' },
  { value: 'other', label: 'Other' },
] as const
export const EVENT_COST_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
  { value: 'member_only', label: 'Members only' },
  { value: 'invite_only', label: 'Invite only' },
  { value: 'mixed', label: 'Mixed', hint: 'Free for some, paid for others' },
] as const

export const LIMITS = { name: 200, event_url: 500, organizer_name: 200, city: 100, description: 1000, submitter_name: 200, submitter_email: 200 } as const

export function emptyEventDraft(): EventDraft {
  return {
    name: '',
    event_url: '',
    start_date: '',
    end_date: '',
    organizer_name: '',
    city: '',
    event_format: '',
    event_kind: '',
    cost_type: '',
    description: '',
    submitter_name: '',
    submitter_email: '',
  }
}

export function restoreEventDraft(saved: Partial<EventDraft>, initial: EventDraft): EventDraft {
  const out = { ...initial }
  for (const k of Object.keys(initial) as EventField[]) {
    if (typeof saved[k] === 'string') out[k] = saved[k] as string
  }
  return out
}

/** What POST /api/events/submit receives: the one-page form's FormData, with https:// added to a bare address. */
export function eventPayload(d: EventDraft, honeypot = ''): Record<string, string> {
  return { website: honeypot, ...d, event_url: withScheme(d.event_url), submitter_email: d.submitter_email.trim() }
}

const URL_SHAPE = /^https?:\/\/[^\s]+\.[^\s]+/
const DAY = /^\d{4}-\d{2}-\d{2}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The problems on one step, keyed by field. Empty: move on. */
export function eventStepErrors(stepId: EventStepId, d: EventDraft): Partial<Record<EventField, string>> {
  const e: Partial<Record<EventField, string>> = {}
  const p = eventPayload(d)
  switch (stepId) {
    case 'name':
      if (p.name.trim().length < 5) e.name = p.name.trim() ? 'That name is a little short. Use the full event name (at least 5 characters).' : 'Add the name of the event.'
      break
    case 'link':
      if (!p.event_url) e.event_url = 'Add the page where the date is published, so we can check it.'
      else if (!URL_SHAPE.test(p.event_url) || p.event_url.length > LIMITS.event_url) e.event_url = "That doesn't look like a web address. Try something like example.com/event."
      break
    case 'dates':
      if (p.start_date && !DAY.test(p.start_date)) e.start_date = 'Choose a start date from the calendar.'
      if (p.end_date && !DAY.test(p.end_date)) e.end_date = 'Choose an end date from the calendar.'
      else if (p.start_date && p.end_date && p.end_date < p.start_date) e.end_date = 'The end date is before the start date.'
      break
    case 'you':
      if (p.submitter_email && !EMAIL.test(p.submitter_email)) e.submitter_email = 'Check the email address, like you@example.com.'
      break
  }
  return e
}

const nonEmpty = (s: string) => (s.trim() ? s.trim() : null)
const labelOf = (list: ReadonlyArray<{ value: string; label: string }>, v: string) => list.find((o) => o.value === v)?.label ?? null

function day(ymd: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) return nonEmpty(ymd)
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-US', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })
}

export interface EventReviewRow {
  stepId: EventStepId
  label: string
  value: string | null
}

export function eventReview(d: EventDraft): EventReviewRow[] {
  const start = day(d.start_date)
  const end = day(d.end_date)
  const dates = start && end && start !== end ? `${start} to ${end}` : start ?? (end ? `Ends ${end}` : null)
  return [
    { stepId: 'name', label: 'Event', value: nonEmpty(d.name) },
    { stepId: 'link', label: 'Event page', value: nonEmpty(d.event_url) ? withScheme(d.event_url) : null },
    { stepId: 'dates', label: 'Dates', value: dates },
    { stepId: 'where', label: 'Organizer', value: nonEmpty(d.organizer_name) },
    { stepId: 'where', label: 'City', value: nonEmpty(d.city) },
    { stepId: 'format', label: 'Format', value: labelOf(EVENT_FORMAT_OPTIONS, d.event_format) },
    { stepId: 'kind', label: 'Type', value: labelOf(EVENT_KIND_OPTIONS, d.event_kind) },
    { stepId: 'cost', label: 'Cost', value: labelOf(EVENT_COST_OPTIONS, d.cost_type) },
    { stepId: 'about', label: 'About it', value: nonEmpty(d.description) },
    { stepId: 'you', label: 'Your name', value: nonEmpty(d.submitter_name) },
    { stepId: 'you', label: 'Your email', value: nonEmpty(d.submitter_email) },
  ]
}
