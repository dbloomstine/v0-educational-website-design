'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Mail, Plus, X } from 'lucide-react'
import { Stepper, type StepperStep, type SubmitResult } from '@/components/forms/Stepper'
import { AreaField, ChoiceCards, LineField, SelectField } from '@/components/forms/StepperFields'
import { useSessionDraft } from '@/components/forms/StepperDraft'
import { LIMITS, MAX_PEOPLE } from '@/lib/submit/fields'
import { DATE_DAYS_AHEAD, DATE_DAYS_BACK } from '@/lib/submit/validate'
import {
  CURRENCY_OPTIONS,
  NEWS_KIND_OPTIONS,
  emptyNewsDraft,
  localToday,
  newsPayload,
  newsReview,
  newsStepErrors,
  newsStepForField,
  restoreNewsDraft,
  type NewsDraft,
  type NewsStepId,
} from '@/lib/submit/news-steps'

// Version 3 (2026-10-22, Danny: "one question at a time… a lighter touch… lets them go back and review"):
// the same fields, checks and payload as version 2, asked one screen at a time by components/forms/Stepper.tsx
// (modelled on Typeform's one-question layout; see the note there). The steps, checks and review rows live in
// lib/submit/news-steps.ts. POST /api/news/submit is unchanged.

const DRAFT_KEY = 'fohq:submit-news:v1'

type Confirm = 'sent' | 'failed' | 'none'

function shiftDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return ''
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function SubmitNewsForm({ defaultFirm = '' }: { defaultFirm?: string }) {
  const initial = useMemo(() => emptyNewsDraft(defaultFirm), [defaultFirm])
  const [d, setDraft, { clear }] = useSessionDraft<NewsDraft>(DRAFT_KEY, initial, restoreNewsDraft)
  const [done, setDone] = useState<{ confirm: Confirm; email: string } | null>(null)
  const [round, setRound] = useState(0)
  const [today, setToday] = useState('')

  // Most news is sent the day it's announced: the date starts at today, read in the browser
  // (after the first render, so the server's page and the browser's agree).
  useEffect(() => {
    const t = localToday()
    setToday(t)
    setDraft((prev) => (prev.news_date ? prev : { ...prev, news_date: t }))
  }, [setDraft, round])

  const set =
    <K extends keyof NewsDraft>(k: K) =>
    (v: NewsDraft[K]) =>
      setDraft((prev) => ({ ...prev, [k]: v }))
  const check = (id: NewsStepId) => () => newsStepErrors(id, d) as Record<string, string>

  async function submit(honeypot: string): Promise<SubmitResult> {
    const payload = newsPayload(d, honeypot)
    try {
      const res = await fetch('/api/news/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        return {
          ok: false,
          error: json.error ?? 'Something went wrong on our side. Please try again.',
          field: typeof json.field === 'string' ? json.field : undefined,
        }
      }
      setDone({ confirm: json.confirm === 'failed' || json.confirm === 'none' ? json.confirm : 'sent', email: payload.contact_email })
      clear()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return { ok: true }
    } catch {
      return { ok: false, error: 'We couldn’t reach the desk. Check your connection and try again.' }
    }
  }

  if (done) {
    return (
      <div role="status" className="panel px-5 py-8 sm:px-8 sm:py-10">
        <p className="flex items-start gap-3 font-news text-[26px] font-medium leading-[1.15] tracking-[-0.014em] sm:text-[31px]">
          {done.confirm === 'sent' ? (
            <Mail className="mt-1.5 h-6 w-6 shrink-0 text-amber-400" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mt-1.5 h-6 w-6 shrink-0 text-emerald-400" aria-hidden="true" />
          )}
          {done.confirm === 'sent' ? 'Almost done: check your inbox.' : 'Thank you. Your news is with the desk.'}
        </p>
        <p className="mt-3 max-w-[56ch] font-ui text-[15px] leading-relaxed text-foreground/75 sm:ml-9">
          {done.confirm === 'sent' ? (
            <>
              We sent a link to <strong className="font-semibold text-foreground">{done.email || 'your work email'}</strong>. Click it
              to confirm, and your news goes to the desk for review. The link works for seven days. Nothing reaches the desk until
              you click it.
            </>
          ) : (
            <>We couldn&apos;t send the confirmation email just now, so we&apos;ll email you to confirm before we review it.</>
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            setDraft(emptyNewsDraft(''))
            setRound((n) => n + 1)
            setDone(null)
          }}
          className="mt-4 h-11 rounded-sm font-ui text-[14px] font-semibold text-foreground/80 underline decoration-foreground/30 underline-offset-[3px] hover:text-foreground sm:ml-9"
        >
          Send more news
        </button>
      </div>
    )
  }

  const steps: StepperStep[] = [
    {
      id: 'kind',
      title: 'What kind of news is it?',
      question: 'What kind of news is it?',
      help: 'Pick the closest fit.',
      validate: check('kind'),
      render: ({ questionId, helpId, errors, next }) => (
        <ChoiceCards
          labelledBy={questionId}
          describedBy={helpId}
          options={NEWS_KIND_OPTIONS}
          value={d.kind}
          errorId="ns-kind-err"
          error={errors.kind}
          onChoose={(v, advance) => {
            set('kind')(v as NewsDraft['kind'])
            if (advance) window.setTimeout(next, 260)
          }}
        />
      ),
    },
    {
      id: 'firm',
      title: 'Which firm is it about?',
      question: 'Which firm is it about?',
      help: 'News about your own firm only, please.',
      validate: check('firm'),
      render: ({ errors }) => (
        <div className="space-y-6">
          <LineField
            id="ns-firm"
            label="Firm name"
            value={d.firm}
            onValue={set('firm')}
            error={errors.firm}
            maxLength={LIMITS.firm}
            autoComplete="organization"
            placeholder="Example Capital Partners"
          />
          <LineField
            id="ns-firm_website"
            label="Firm website"
            value={d.firm_website}
            onValue={set('firm_website')}
            error={errors.firm_website}
            maxLength={LIMITS.firmWebsite}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="example.com"
          />
        </div>
      ),
    },
    {
      id: 'headline',
      title: 'Sum it up in one line.',
      question: 'Sum it up in one line.',
      help: 'Like a headline: who did what, and how much.',
      validate: check('headline'),
      render: ({ questionId, helpId, errors }) => (
        <LineField
          id="ns-headline"
          labelledBy={questionId}
          helpId={helpId}
          value={d.headline}
          onValue={set('headline')}
          error={errors.headline}
          maxLength={LIMITS.headline}
          placeholder="Example Capital closes Fund III at $450M"
        />
      ),
    },
    {
      id: 'details',
      title: 'What happened?',
      question: 'What happened?',
      help: 'The facts: who, what, how much and when. A few sentences is plenty.',
      validate: check('details'),
      render: ({ questionId, helpId, errors }) => (
        <AreaField
          id="ns-details"
          labelledBy={questionId}
          helpId={helpId}
          value={d.details}
          onValue={set('details')}
          error={errors.details}
          maxLength={LIMITS.details}
          placeholder="Type your answer here"
        />
      ),
    },
    {
      id: 'when',
      title: 'When was it announced, and how much?',
      question: 'When was it announced, and how much?',
      help: 'The day it was announced or took effect. Add an amount if there is one.',
      validate: check('when'),
      render: ({ errors }) => (
        <div className="space-y-6">
          <LineField
            id="ns-news_date"
            label="Date"
            type="date"
            value={d.news_date}
            onValue={set('news_date')}
            error={errors.news_date}
            min={today ? shiftDays(today, -DATE_DAYS_BACK) : undefined}
            max={today ? shiftDays(today, DATE_DAYS_AHEAD) : undefined}
            className="max-w-[260px]"
          />
          <div className="grid grid-cols-[minmax(0,1fr)_104px] items-start gap-4 sm:max-w-[440px]">
            <LineField
              id="ns-amount"
              label="Amount"
              optional
              value={d.amount}
              onValue={set('amount')}
              error={errors.amount}
              maxLength={LIMITS.amount}
              inputMode="decimal"
              placeholder="450M"
              note="Like 450M, 1.2bn or 450,000,000."
            />
            <SelectField id="ns-currency" label="Currency" value={d.currency} onValue={set('currency')} options={CURRENCY_OPTIONS} error={errors.currency} />
          </div>
        </div>
      ),
    },
    {
      id: 'link',
      title: 'Is there a public link?',
      question: 'Is there a public link?',
      help: 'A press release or story that backs it up. If there isn’t one yet, skip this.',
      optional: true,
      clear: () => set('url')(''),
      validate: check('link'),
      render: ({ questionId, helpId, errors }) => (
        <LineField
          id="ns-url"
          labelledBy={questionId}
          helpId={helpId}
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={d.url}
          onValue={set('url')}
          error={errors.url}
          maxLength={LIMITS.url}
          placeholder="https://"
        />
      ),
    },
    {
      id: 'people',
      title: 'Who was involved?',
      question: 'Who was involved?',
      help: `The deal team or the people named, up to ${MAX_PEOPLE}. For our records only: we don’t publish them.`,
      optional: true,
      clear: () => set('people')([{ name: '', role: '' }]),
      render: () => <PeopleRows people={d.people} onChange={set('people')} />,
    },
    {
      id: 'you',
      title: 'Last one: who are you?',
      question: 'Last one: who are you?',
      help: 'We’ll email you a link to confirm. Work addresses only, so no Gmail or Outlook.',
      validate: check('you'),
      render: ({ errors }) => (
        <div className="space-y-6">
          <LineField
            id="ns-contact_name"
            label="Your name"
            value={d.contact_name}
            onValue={set('contact_name')}
            error={errors.contact_name}
            maxLength={LIMITS.contactName}
            autoComplete="name"
          />
          <LineField
            id="ns-contact_role"
            label="Your role"
            value={d.contact_role}
            onValue={set('contact_role')}
            error={errors.contact_role}
            maxLength={LIMITS.contactRole}
            autoComplete="organization-title"
            placeholder="Head of IR"
          />
          <LineField
            id="ns-contact_email"
            label="Work email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={d.contact_email}
            onValue={set('contact_email')}
            error={errors.contact_email}
            maxLength={LIMITS.contactEmail}
            autoComplete="email"
            placeholder="you@yourfirm.com"
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
      stepForField={newsStepForField}
      onSubmit={submit}
      review={{
        question: 'Here’s what you’re sending.',
        help: 'Check it over. Use Edit to change anything.',
        rows: newsReview(d),
        submitLabel: 'Send to the news desk',
        extra: (
          <label className="flex cursor-pointer items-start gap-3 font-ui text-[14.5px] leading-snug text-foreground/80">
            <input
              type="checkbox"
              name="wants_newsletter"
              checked={d.wants_newsletter}
              onChange={(e) => set('wants_newsletter')(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ink)]"
            />
            <span>Send me FundOps Daily, the morning email of the day&apos;s closes, launches, deals and moves. Free; unsubscribe anytime.</span>
          </label>
        ),
      }}
    />
  )
}

function PeopleRows({ people, onChange }: { people: NewsDraft['people']; onChange: (p: NewsDraft['people']) => void }) {
  const rows = people.length ? people : [{ name: '', role: '' }]
  const edit = (i: number, k: 'name' | 'role') => (v: string) => onChange(rows.map((p, j) => (j === i ? { ...p, [k]: v } : p)))
  return (
    <div>
      <ol className="space-y-5">
        {rows.map((p, i) => (
          <li key={i} className="grid grid-cols-1 gap-3 border-border [&:not(:first-child)]:border-t [&:not(:first-child)]:pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end sm:gap-5">
            <LineField
              id={`ns-person_name_${i}`}
              label={
                <>
                  <span className="sr-only">Person {i + 1}: </span>Name
                </>
              }
              value={p.name}
              onValue={edit(i, 'name')}
              maxLength={LIMITS.personName}
              autoComplete="off"
              placeholder="Jane Smith"
            />
            <LineField
              id={`ns-person_role_${i}`}
              label={
                <>
                  <span className="sr-only">Person {i + 1}: </span>Role
                </>
              }
              value={p.role}
              onValue={edit(i, 'role')}
              maxLength={LIMITS.personRole}
              autoComplete="off"
              placeholder="Partner"
            />
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
                className="inline-flex h-11 items-center gap-1 justify-self-start rounded-sm font-ui text-[13.5px] font-semibold text-foreground/70 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Remove<span className="sr-only"> person {i + 1}</span>
              </button>
            )}
          </li>
        ))}
      </ol>
      {rows.length < MAX_PEOPLE && (
        <button
          type="button"
          onClick={() => {
            onChange([...rows, { name: '', role: '' }])
            // The cursor goes to the new row's name.
            window.setTimeout(() => document.getElementById(`ns-person_name_${rows.length}`)?.focus(), 0)
          }}
          className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-sm border-2 border-foreground/30 px-3.5 font-ui text-[14px] font-semibold text-foreground hover:border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add a person
        </button>
      )}
    </div>
  )
}
