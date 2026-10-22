'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Stepper, type StepperStep, type SubmitResult } from '@/components/forms/Stepper'
import { AreaField, ChoiceCards, LineField } from '@/components/forms/StepperFields'
import { useSessionDraft } from '@/components/forms/StepperDraft'
import {
  EVENT_COST_OPTIONS,
  EVENT_FORMAT_OPTIONS,
  EVENT_KIND_OPTIONS,
  LIMITS,
  emptyEventDraft,
  eventPayload,
  eventReview,
  eventStepErrors,
  restoreEventDraft,
  type EventDraft,
  type EventStepId,
} from '@/lib/events/submit-steps'

// 2026-10-22: one question at a time (Danny: "a lighter touch psychologically… not get overwhelmed"), drawn by
// components/forms/Stepper.tsx (modelled on Typeform's one-question layout; see the note there). The same fields
// and payload as the one-page form; the route's rules are checked on the step they belong to
// (lib/events/submit-steps.ts). POST /api/events/submit is unchanged.
//
// Format: the board lists in-person events only (Danny, 2026-09-05), with one way in for a webinar: its
// organizer submits it (2026-10-13). Until then the form offered no virtual option, and an organizer with
// a webinar chose "hybrid".

const DRAFT_KEY = 'fohq:submit-event:v1'

export function SubmitEventForm() {
  const [d, setDraft, { clear }] = useSessionDraft<EventDraft>(DRAFT_KEY, emptyEventDraft(), restoreEventDraft)
  const [done, setDone] = useState(false)
  const [round, setRound] = useState(0)

  const set = (k: keyof EventDraft) => (v: string) => setDraft((prev) => ({ ...prev, [k]: v }))
  const check = (id: EventStepId) => () => eventStepErrors(id, d) as Record<string, string>

  async function submit(honeypot: string): Promise<SubmitResult> {
    try {
      const res = await fetch('/api/events/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload(d, honeypot)),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) return { ok: false, error: json.error ?? 'Something went wrong on our side. Please try again.' }
      setDone(true)
      clear()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return { ok: true }
    } catch {
      return { ok: false, error: 'We couldn’t send it. Check your connection and try again.' }
    }
  }

  if (done) {
    return (
      <div role="status" className="panel px-5 py-8 sm:px-8 sm:py-10">
        <p className="flex items-start gap-3 font-news text-[26px] font-medium leading-[1.15] tracking-[-0.014em] sm:text-[31px]">
          <CheckCircle2 className="mt-1.5 h-6 w-6 shrink-0 text-emerald-400" aria-hidden="true" />
          Thank you. We&apos;ve got your event.
        </p>
        <p className="mt-3 max-w-[56ch] font-ui text-[15px] leading-relaxed text-foreground/75 sm:ml-9">
          We check every date on the organizer&apos;s own page before it goes up. If it checks out, it&apos;ll be on the board within a day.
        </p>
        <button
          type="button"
          onClick={() => {
            setDraft(emptyEventDraft())
            setRound((n) => n + 1)
            setDone(false)
          }}
          className="mt-4 h-11 rounded-sm font-ui text-[14px] font-semibold text-foreground/80 underline decoration-foreground/30 underline-offset-[3px] hover:text-foreground sm:ml-9"
        >
          Submit another event
        </button>
      </div>
    )
  }

  const choice = (
    field: 'event_format' | 'event_kind' | 'cost_type',
    options: ReadonlyArray<{ value: string; label: string; hint?: string }>,
    columns: 1 | 2 = 1,
  ): StepperStep['render'] =>
    function ChoiceStep({ questionId, helpId, next }) {
      return (
        <ChoiceCards
          labelledBy={questionId}
          describedBy={helpId}
          options={options}
          value={d[field]}
          errorId={`ev-${field}-err`}
          columns={columns}
          onChoose={(v, advance) => {
            set(field)(v)
            if (advance) window.setTimeout(next, 260)
          }}
        />
      )
    }

  const steps: StepperStep[] = [
    {
      id: 'name',
      title: 'What’s the event called?',
      question: 'What’s the event called?',
      help: 'The full name, as the organizer writes it.',
      validate: check('name'),
      render: ({ questionId, helpId, errors }) => (
        <LineField
          id="ev-name"
          labelledBy={questionId}
          helpId={helpId}
          value={d.name}
          onValue={set('name')}
          error={errors.name}
          maxLength={LIMITS.name}
          placeholder="Private Funds CFO Forum 2027"
        />
      ),
    },
    {
      id: 'link',
      title: 'Where is the date published?',
      question: 'Where is the date published?',
      help: 'The event’s own page. We check the date there before it goes on the board.',
      validate: check('link'),
      render: ({ questionId, helpId, errors }) => (
        <LineField
          id="ev-url"
          labelledBy={questionId}
          helpId={helpId}
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={d.event_url}
          onValue={set('event_url')}
          error={errors.event_url}
          maxLength={LIMITS.event_url}
          placeholder="https://"
        />
      ),
    },
    {
      id: 'dates',
      title: 'When is it?',
      question: 'When is it?',
      help: 'Leave the end date empty for a one-day event.',
      optional: true,
      clear: () => setDraft((prev) => ({ ...prev, start_date: '', end_date: '' })),
      validate: check('dates'),
      render: ({ errors }) => (
        <div className="grid gap-6 sm:max-w-[520px] sm:grid-cols-2">
          <LineField id="ev-start" label="Start date" type="date" value={d.start_date} onValue={set('start_date')} error={errors.start_date} />
          <LineField
            id="ev-end"
            label="End date"
            optional
            type="date"
            min={d.start_date || undefined}
            value={d.end_date}
            onValue={set('end_date')}
            error={errors.end_date}
          />
        </div>
      ),
    },
    {
      id: 'where',
      title: 'Who’s hosting it, and where?',
      question: 'Who’s hosting it, and where?',
      optional: true,
      clear: () => setDraft((prev) => ({ ...prev, organizer_name: '', city: '' })),
      render: () => (
        <div className="space-y-6">
          <LineField
            id="ev-org"
            label="Organizer"
            value={d.organizer_name}
            onValue={set('organizer_name')}
            maxLength={LIMITS.organizer_name}
            autoComplete="organization"
            placeholder="Firm or association"
          />
          <LineField id="ev-city" label="City" value={d.city} onValue={set('city')} maxLength={LIMITS.city} placeholder="New York" />
        </div>
      ),
    },
    {
      id: 'format',
      title: 'Is it in person or online?',
      question: 'Is it in person or online?',
      optional: true,
      clear: () => set('event_format')(''),
      render: choice('event_format', EVENT_FORMAT_OPTIONS),
    },
    {
      id: 'kind',
      title: 'What kind of event is it?',
      question: 'What kind of event is it?',
      help: 'Pick the closest fit.',
      optional: true,
      clear: () => set('event_kind')(''),
      render: choice('event_kind', EVENT_KIND_OPTIONS, 2),
    },
    {
      id: 'cost',
      title: 'What does it cost to attend?',
      question: 'What does it cost to attend?',
      optional: true,
      clear: () => set('cost_type')(''),
      render: choice('cost_type', EVENT_COST_OPTIONS),
    },
    {
      id: 'about',
      title: 'What is it, and who’s it for?',
      question: 'What is it, and who’s it for?',
      help: 'One or two sentences: the audience, the focus, anything that helps us list it in the right place.',
      optional: true,
      clear: () => set('description')(''),
      render: ({ questionId, helpId }) => (
        <AreaField
          id="ev-desc"
          labelledBy={questionId}
          helpId={helpId}
          value={d.description}
          onValue={set('description')}
          maxLength={LIMITS.description}
          placeholder="Type your answer here"
        />
      ),
    },
    {
      id: 'you',
      title: 'Last one: who are you?',
      question: 'Last one: who are you?',
      help: 'Optional. Only so we can reach you if something needs checking.',
      optional: true,
      clear: () => setDraft((prev) => ({ ...prev, submitter_name: '', submitter_email: '' })),
      validate: check('you'),
      render: ({ errors }) => (
        <div className="space-y-6">
          <LineField id="ev-sname" label="Your name" value={d.submitter_name} onValue={set('submitter_name')} maxLength={LIMITS.submitter_name} autoComplete="name" />
          <LineField
            id="ev-semail"
            label="Your email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={d.submitter_email}
            onValue={set('submitter_email')}
            error={errors.submitter_email}
            maxLength={LIMITS.submitter_email}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
      ),
    },
  ]

  return (
    <Stepper
      key={round}
      storageKey={DRAFT_KEY}
      steps={steps}
      onSubmit={submit}
      review={{
        question: 'Here’s your event.',
        help: 'Check it over. Use Edit to change anything.',
        rows: eventReview(d),
        submitLabel: 'Submit the event',
      }}
    />
  )
}
