'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Check, ChevronLeft, CornerDownLeft, Loader2 } from 'lucide-react'
import { positionKey, readSession, writeSession } from './StepperDraft'

/**
 * One question at a time (Danny, 2026-10-22: "you fill in the one thing and it
 * asks you to go to the next thing… a lighter touch psychologically").
 *
 * Modelled on Typeform's one-question layout: a numbered question in large
 * type with a short line under it, the answer field below, an "OK" button with
 * "press Enter ↵" beside it, A/B/C letter keys on choice cards, and the next
 * question sliding up into place. Kept from Typeform: the rhythm and the
 * keyboard. Not kept: its full-bleed colour screens and giant centred type;
 * this sits in the site's cream newsprint panel, with Newsreader for the
 * question and the signup box's amber button, so it looks like FundOpsHQ.
 *
 * The stepper owns the place (which step, the way back to the review screen),
 * the errors on the screen, the keyboard and the focus. The form that uses it
 * owns the answers and the checks: each step says how to check itself
 * (`validate`), and the review screen lists the rows the form gives it.
 *
 * Keyboard: Enter is OK (Shift+Enter is a new line in a text box); Back and
 * Skip are buttons in the tab order; choice cards answer to their letter
 * (see StepperFields.tsx). After every move the focus lands on the new
 * question's first field and a polite live region reads out "Step 3 of 9".
 */

export type FieldErrors = Record<string, string>

export interface StepContext {
  /** The question's id: a step with one field labels it with this. */
  questionId: string
  /** The helper line's id, for aria-describedby. */
  helpId: string
  errors: FieldErrors
  /** Check this step and move on (choice cards call it after a pick). */
  next: () => void
}

export interface StepperStep {
  id: string
  question: ReactNode
  /** Plain words for the live region and the review headings. */
  title: string
  help?: ReactNode
  /** Shows "Skip"; skipping calls `clear` and moves on unchecked. */
  optional?: boolean
  clear?: () => void
  /** The problems with this step's answers, keyed by field id. Empty or undefined: fine. */
  validate?: () => FieldErrors | undefined
  /** The OK button's label on this step (default "OK"). */
  okLabel?: string
  render: (ctx: StepContext) => ReactNode
}

export interface ReviewRow {
  stepId: string
  label: string
  /** null: not given (shown as such). */
  value: string | null
}

export type SubmitResult = { ok: true } | { ok: false; error: string; field?: string }

export interface StepperProps {
  /** Where the draft lives in sessionStorage (the answers are the form's; the place is kept under `<key>:pos`). */
  storageKey: string
  steps: StepperStep[]
  review: {
    question: ReactNode
    help?: ReactNode
    rows: ReviewRow[]
    /** Anything under the list: the newsletter tick. */
    extra?: ReactNode
    submitLabel: string
  }
  /** Which step holds a field the server refused. */
  stepForField?: (field: string) => string | undefined
  /** `honeypot` is the hidden field's value (empty for people). */
  onSubmit: (honeypot: string) => Promise<SubmitResult>
}

const FOCUSABLE =
  '[data-autofocus], input:not([type=hidden]):not([tabindex="-1"]), textarea, select, [role=radio][tabindex="0"]'

const TEXT_FIELDS = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([tabindex="-1"]), textarea, select'

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function Stepper({ storageKey, steps, review, stepForField, onSubmit }: StepperProps) {
  const uid = useId()
  const total = steps.length + 1 // the review screen counts as the last step
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  /** Came here from the review screen's "Edit": OK goes straight back there. */
  const [fromReview, setFromReview] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  /** A refusal from the server, shown on its field until the next move (the form's own checks may not know it). */
  const [serverErrors, setServerErrors] = useState<FieldErrors>({})
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [announce, setAnnounce] = useState('')

  const rootRef = useRef<HTMLFormElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const honeypotRef = useRef<HTMLInputElement>(null)
  const moved = useRef(false)
  /** The latest props and place, for callbacks fired after a re-render (a picked card advances a beat later). */
  const latest = useRef({ steps, index, fromReview })
  latest.current = { steps, index, fromReview }

  const onReview = index >= steps.length
  const step = onReview ? null : steps[index]

  // Where the sender was, after a reload.
  useEffect(() => {
    const pos = readSession<{ index?: number; fromReview?: boolean }>(positionKey(storageKey))
    if (pos && typeof pos.index === 'number') {
      setIndex(Math.max(0, Math.min(pos.index, steps.length)))
      setFromReview(!!pos.fromReview)
    }
    // Only on arrival: the step list is fixed for a form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const go = useCallback(
    (to: number, opts: { fromReview?: boolean } = {}) => {
      const from = latest.current.index
      moved.current = true
      setDir(to >= from ? 'fwd' : 'back')
      setIndex(to)
      setFromReview(!!opts.fromReview)
      setErrors({})
      setServerErrors({})
      setSubmitError('')
      writeSession(positionKey(storageKey), { index: to, fromReview: !!opts.fromReview })
    },
    [storageKey],
  )

  const next = useCallback(() => {
    const { steps: s, index: i, fromReview: back } = latest.current
    const current = s[i]
    if (!current) return
    const found = current.validate?.() ?? {}
    if (Object.keys(found).length) {
      setErrors(found)
      // The first field with a problem takes the focus; its message is read out with it.
      requestAnimationFrame(() => {
        const panel = panelRef.current
        panel?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus({ preventScroll: true })
        // Into view above the pinned buttons on a phone (the message has a bottom scroll margin for them).
        panel?.querySelector<HTMLElement>('[role="alert"]')?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      })
      return
    }
    go(back ? s.length : i + 1)
  }, [go])

  const skip = useCallback(() => {
    const { steps: s, index: i, fromReview: back } = latest.current
    s[i]?.clear?.()
    go(back ? s.length : i + 1)
  }, [go])

  const backOne = useCallback(() => {
    const { index: i, fromReview: back, steps: s } = latest.current
    if (back) return go(s.length)
    if (i > 0) go(i - 1)
  }, [go])

  // As the sender fixes a field, its message goes (the others stay until the next OK).
  const liveErrors = useRef(errors)
  liveErrors.current = errors
  // Runs after every render on purpose (the answers live in the form, not here); it only ever shrinks the list, so it settles.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!step?.validate || !Object.keys(liveErrors.current).length) return
    const now = step.validate() ?? {}
    const kept = Object.fromEntries(Object.entries(liveErrors.current).filter(([k]) => k in now).map(([k]) => [k, now[k]]))
    if (Object.keys(kept).length !== Object.keys(liveErrors.current).length) setErrors(kept)
  })

  // After a move: focus the new question's first field, bring it into view, and say where we are.
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const title = onReview ? 'Review your answers' : latest.current.steps[index]?.title ?? ''
    if (!moved.current) {
      // On arrival, only a desk (a fine pointer) gets the cursor: on a phone it would throw up the keyboard over the intro.
      let fine = false
      try {
        fine = window.matchMedia('(pointer: fine)').matches
      } catch {
        // no matchMedia: leave the focus where it is
      }
      if (fine && !onReview) panel.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true })
      return
    }
    setAnnounce(`Step ${index + 1} of ${total}. ${title}`)
    const target = onReview ? panel.querySelector<HTMLElement>('h2') : panel.querySelector<HTMLElement>(FOCUSABLE)
    target?.focus({ preventScroll: true })
    const top = rootRef.current?.getBoundingClientRect().top ?? 0
    // 56px: the site's tab bar stays pinned at the top (the form's scroll margin clears it).
    if (top < 56 || top > window.innerHeight * 0.5) {
      rootRef.current?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    }
    // Only after a move: the steps are rebuilt on every keystroke, and re-running this would pull the cursor away.
  }, [index, onReview, total])

  async function submit() {
    if (sending) return
    setSending(true)
    setSubmitError('')
    const result = await onSubmit(honeypotRef.current?.value ?? '').catch(
      (): SubmitResult => ({ ok: false, error: 'We couldn’t reach the desk. Check your connection and try again.' }),
    )
    setSending(false)
    if (result.ok) return
    const target = result.field ? stepForField?.(result.field) : undefined
    const at = target ? steps.findIndex((s) => s.id === target) : -1
    if (at >= 0 && result.field) {
      go(at, { fromReview: true })
      setServerErrors({ [result.field]: result.error })
      return
    }
    setSubmitError(result.error)
  }

  /** OK, pressed from `from`: on a screen with several fields, Enter in one that isn't the last moves to the next, as Tab would. */
  function okFrom(from: Element | null) {
    const fields = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(TEXT_FIELDS) ?? [])
    const at = from ? fields.indexOf(from as HTMLElement) : -1
    if (at >= 0 && at < fields.length - 1) return fields[at + 1].focus()
    next()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // A click on OK (Enter in a field is handled below, so this is the button). Safari doesn't focus a clicked
    // button, so the focused field can't tell us where the press came from: OK always means "check and go on".
    if (onReview) void submit()
    else next()
  }

  // Enter in a field is OK (Shift+Enter keeps a new line in a text box); in a field that isn't the screen's last, it moves on to the next field.
  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    const t = e.target as HTMLElement
    const field = t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || (t.tagName === 'INPUT' && t.matches(TEXT_FIELDS))
    if (field && !onReview) {
      e.preventDefault()
      okFrom(t)
    }
  }

  const questionId = `${uid}-q`
  const helpId = `${uid}-help`
  const shown = index + 1
  const okLabel = fromReview ? 'Back to review' : index === steps.length - 1 ? 'Review' : step?.okLabel ?? 'OK'

  return (
    <form
      ref={rootRef}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      noValidate
      className="panel relative scroll-mt-16"
      aria-labelledby={questionId}
    >
      {/* Honeypot: hidden from real people; bots fill it. */}
      <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {/* Progress: the panel's top rule fills in ink as you go. */}
      <div className="flex items-center gap-3 px-4 pt-3 sm:px-7 sm:pt-4">
        <div
          className="h-[3px] flex-1 overflow-hidden bg-border"
          role="progressbar"
          aria-label="Progress"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={shown}
          aria-valuetext={`${shown} of ${total}`}
        >
          <div
            className="h-full bg-[var(--ink)] transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${(shown / total) * 100}%` }}
          />
        </div>
        <span className="shrink-0 font-ui text-[12.5px] font-semibold tabular-nums text-foreground/70" aria-hidden="true">
          {shown} of {total}
        </span>
      </div>

      <p className="sr-only" aria-live="polite">{announce}</p>

      <div
        ref={panelRef}
        key={index}
        className={`${dir === 'fwd' ? 'stepper-in-fwd' : 'stepper-in-back'} px-4 pb-5 pt-6 sm:min-h-[340px] sm:px-7 sm:pb-6 sm:pt-9`}
      >
        <h2
          id={questionId}
          tabIndex={-1}
          className="flex items-start gap-2.5 font-news text-[25px] font-medium leading-[1.15] tracking-[-0.014em] text-foreground outline-none sm:text-[31px]"
        >
          <span
            aria-hidden="true"
            className="mt-[0.42em] inline-flex shrink-0 items-center gap-0.5 font-ui text-[13px] font-bold leading-none text-amber-400 sm:text-[14px]"
          >
            {onReview ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : shown}
            <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </span>
          <span>{onReview ? review.question : step?.question}</span>
        </h2>
        {(onReview ? review.help : step?.help) && (
          <p id={helpId} className="mt-2 max-w-[60ch] font-ui text-[15px] leading-snug text-foreground/70 sm:ml-[34px]">
            {onReview ? review.help : step?.help}
          </p>
        )}

        <div className="mt-6 sm:ml-[34px] sm:mt-7">
          {onReview ? (
            <ReviewList rows={review.rows} steps={steps} onEdit={(id) => go(steps.findIndex((s) => s.id === id), { fromReview: true })} />
          ) : (
            step?.render({ questionId, helpId: step.help ? helpId : '', errors: { ...serverErrors, ...errors }, next })
          )}
          {onReview && review.extra && <div className="mt-5">{review.extra}</div>}
          {onReview && submitError && (
            <p role="alert" className="mt-4 font-ui text-[14px] font-medium text-[var(--destructive)]">
              {submitError}
            </p>
          )}
        </div>
      </div>

      {/* The buttons. On a phone they stay pinned to the bottom of the screen while the form is in view. */}
      <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t border-border bg-card/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:gap-3 sm:border-t-0 sm:bg-transparent sm:px-7 sm:pb-7 sm:pt-0 sm:backdrop-blur-none">
        {/* Editing from the review screen, the one way on is the main button: "Back to review". */}
        {index > 0 && !fromReview && (
          <button
            type="button"
            onClick={backOne}
            className="inline-flex h-11 items-center gap-1 rounded-sm px-2 font-ui text-[14px] font-semibold text-foreground/75 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:-ml-2"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
        )}
        <span className="flex-1" />
        {step?.optional && !fromReview && (
          <button
            type="button"
            onClick={skip}
            className="h-11 rounded-sm px-2 font-ui text-[14px] font-semibold text-foreground/75 underline decoration-foreground/30 underline-offset-[3px] hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Skip
          </button>
        )}
        <span className="hidden items-center gap-1 font-ui text-[12.5px] text-foreground/65 [@media(pointer:fine)]:sm:inline-flex" aria-hidden="true">
          press <strong className="font-semibold text-foreground/80">Enter</strong>
          <CornerDownLeft className="h-3 w-3" />
        </span>
        <button
          type="submit"
          disabled={sending}
          className="group inline-flex h-11 min-w-[96px] items-center justify-center gap-1.5 rounded-sm px-5 font-ui text-[14px] font-extrabold tracking-[0.02em] transition-[filter] hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-60"
          style={{ background: 'var(--tab)', color: 'var(--ink)' }}
        >
          {onReview ? (
            sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…
              </>
            ) : (
              <>
                {review.submitLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </>
            )
          ) : (
            <>
              {okLabel}
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </form>
  )
}

function ReviewList({ rows, steps, onEdit }: { rows: ReviewRow[]; steps: StepperStep[]; onEdit: (stepId: string) => void }) {
  // One block per step, in the order they were asked, with one Edit link each.
  const groups = steps
    .map((s) => ({ step: s, rows: rows.filter((r) => r.stepId === s.id) }))
    .filter((g) => g.rows.length)
  return (
    <ol className="divide-y divide-border border-y border-border">
      {groups.map(({ step, rows: rs }) => (
        <li key={step.id} className="flex items-start gap-3 py-3">
          <dl className="min-w-0 flex-1 space-y-1.5">
            {rs.map((r, i) => (
              <div key={`${r.label}-${i}`} className="sm:flex sm:gap-4">
                <dt className="shrink-0 font-ui text-[13px] font-semibold text-foreground/70 sm:w-[150px] sm:pt-[3px]">{r.label}</dt>
                <dd
                  className={
                    r.value
                      ? 'min-w-0 whitespace-pre-line break-words font-news text-[17px] leading-snug text-foreground'
                      : 'font-ui text-[14px] italic text-foreground/60'
                  }
                >
                  {r.value ?? 'Not given'}
                </dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={() => onEdit(step.id)}
            aria-label={`Edit: ${step.title}`}
            className="-my-1 inline-flex h-11 shrink-0 items-center rounded-sm px-2 font-ui text-[13.5px] font-semibold text-foreground/80 underline decoration-foreground/30 underline-offset-[3px] hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Edit
          </button>
        </li>
      ))}
    </ol>
  )
}
