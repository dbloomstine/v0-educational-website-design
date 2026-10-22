'use client'

import { useEffect, useRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { Check } from 'lucide-react'

/**
 * The fields the step-by-step forms (Stepper.tsx) put on a screen. Typeform's
 * answer line: large type on a single rule, no box, so the question leads.
 * The rule is the field's edge, drawn dark enough to see on cream (3:1), and
 * it turns solid ink when the field has the cursor.
 */

const lineInput =
  'block w-full rounded-none border-0 border-b-2 border-foreground/55 bg-transparent px-0 pb-2 pt-1 font-news text-[21px] leading-snug text-foreground placeholder:text-foreground/45 focus:border-foreground focus:outline-none focus-visible:outline-none aria-[invalid=true]:border-[var(--destructive)] sm:text-[24px]'

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-2 scroll-mb-28 font-ui text-[14px] font-medium leading-snug text-[var(--destructive)]">
      {message}
    </p>
  )
}

function describedBy(...ids: Array<string | false | null | undefined>): string | undefined {
  const s = ids.filter(Boolean).join(' ')
  return s || undefined
}

type Shared = {
  id: string
  /** A visible label, for a screen with more than one field. Without one, `labelledBy` names the field (the question). */
  label?: ReactNode
  labelledBy?: string
  /** The helper line under the question, read with the field. */
  helpId?: string
  /** A short note under the field. */
  note?: ReactNode
  error?: string
}

function Label({ id, label, optional }: { id: string; label: ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={id} className="mb-1 block font-ui text-[14px] font-semibold text-foreground/80">
      {label}
      {optional && <span className="font-normal text-foreground/65"> (optional)</span>}
    </label>
  )
}

export function LineField({
  id,
  label,
  labelledBy,
  helpId,
  note,
  error,
  optional,
  value,
  onValue,
  className = '',
  ...rest
}: Shared & { optional?: boolean; value: string; onValue: (v: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'id'>) {
  const errId = `${id}-err`
  const noteId = `${id}-note`
  return (
    <div>
      {label && <Label id={id} label={label} optional={optional} />}
      <input
        id={id}
        value={value}
        onChange={(e) => onValue(e.target.value)}
        aria-labelledby={label ? undefined : labelledBy}
        aria-describedby={describedBy(helpId, note ? noteId : undefined, error && errId)}
        aria-invalid={error ? true : undefined}
        {...rest}
        className={`${lineInput} ${className}`}
      />
      {note && (
        <p id={noteId} className="mt-1.5 font-ui text-[13px] leading-snug text-foreground/65">
          {note}
        </p>
      )}
      <FieldError id={errId} message={error} />
    </div>
  )
}

export function AreaField({
  id,
  label,
  labelledBy,
  helpId,
  error,
  value,
  onValue,
  maxLength,
  ...rest
}: Shared & { value: string; onValue: (v: string) => void } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'id'>) {
  const errId = `${id}-err`
  const noteId = `${id}-note`
  const ref = useRef<HTMLTextAreaElement>(null)
  // Grows with what is typed, up to a point, so the answer is all in view.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight + 2, 320)}px`
  }, [value])
  return (
    <div>
      {label && <Label id={id} label={label} />}
      <textarea
        ref={ref}
        id={id}
        value={value}
        rows={3}
        maxLength={maxLength}
        onChange={(e) => onValue(e.target.value)}
        aria-labelledby={label ? undefined : labelledBy}
        aria-describedby={describedBy(helpId, noteId, error && errId)}
        aria-invalid={error ? true : undefined}
        className={`${lineInput} resize-none`}
        {...rest}
      />
      <p id={noteId} className="mt-1.5 flex justify-between gap-3 font-ui text-[13px] text-foreground/65">
        <span>
          <span className="[@media(pointer:coarse)]:hidden">
            <strong className="font-semibold">Shift + Enter</strong> for a new line.
          </span>
        </span>
        {maxLength && (
          <span className="tabular-nums" aria-hidden="true">
            {value.length.toLocaleString('en-US')} / {maxLength.toLocaleString('en-US')}
          </span>
        )}
      </p>
      <FieldError id={errId} message={error} />
    </div>
  )
}

export function SelectField({
  id,
  label,
  labelledBy,
  error,
  value,
  onValue,
  options,
  className = '',
}: Shared & { value: string; onValue: (v: string) => void; options: ReadonlyArray<{ value: string; label: string }>; className?: string }) {
  const errId = `${id}-err`
  return (
    <div className={className}>
      {label && <Label id={id} label={label} />}
      <select
        id={id}
        value={value}
        onChange={(e) => onValue(e.target.value)}
        aria-labelledby={label ? undefined : labelledBy}
        aria-describedby={error ? errId : undefined}
        aria-invalid={error ? true : undefined}
        className={`${lineInput} cursor-pointer`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError id={errId} message={error} />
    </div>
  )
}

/** A–Z, for the letter keys on the cards. */
export const choiceKey = (i: number) => String.fromCharCode(65 + i)

function typingInField(): boolean {
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  if (el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true
  return el.tagName === 'INPUT' && !/^(checkbox|radio|button|submit)$/.test((el as HTMLInputElement).type)
}

/**
 * Large tappable answer cards, one pick, Typeform style: each has a letter
 * (press it to choose), a click or Enter or Space chooses and moves on, the
 * arrow keys move between cards. A radio group to a screen reader. With
 * `allowNone`, picking the chosen card again clears it (for optional steps).
 */
export function ChoiceCards({
  labelledBy,
  describedBy: help,
  options,
  value,
  onChoose,
  error,
  errorId,
  columns = 1,
}: {
  labelledBy: string
  describedBy?: string
  options: ReadonlyArray<{ value: string; label: string; hint?: string }>
  value: string
  /** `advance` is false for a move with the arrow keys (the pick is made, the step stays). */
  onChoose: (value: string, advance: boolean) => void
  error?: string
  errorId: string
  columns?: 1 | 2
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const latest = useRef({ options, onChoose })
  latest.current = { options, onChoose }

  // The letter keys, while this step is on screen (and the cursor isn't in a text field).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1 || typingInField()) return
      const i = e.key.toUpperCase().charCodeAt(0) - 65
      const o = latest.current.options[i]
      if (!o) return
      e.preventDefault()
      refs.current[i]?.focus()
      latest.current.onChoose(o.value, true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const checked = options.findIndex((o) => o.value === value)
  const tabStop = checked >= 0 ? checked : 0

  function onArrow(e: React.KeyboardEvent, i: number) {
    const delta = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const to = (i + delta + options.length) % options.length
    refs.current[to]?.focus()
    onChoose(options[to].value, false)
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy(help, error && errorId)}
        aria-invalid={error ? true : undefined}
        className={`grid gap-2.5 ${columns === 2 ? 'sm:grid-cols-2' : ''} max-w-[560px]`}
      >
        {options.map((o, i) => {
          const on = i === checked
          return (
            <button
              key={o.value}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={i === tabStop ? 0 : -1}
              onClick={() => onChoose(o.value, true)}
              onKeyDown={(e) => onArrow(e, i)}
              className={`group flex min-h-[52px] w-full items-center gap-3 rounded-sm border-2 px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
                on ? 'border-foreground bg-foreground text-background' : 'border-foreground/30 bg-card text-foreground hover:border-foreground'
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] border font-ui text-[13px] font-bold ${
                  on ? 'border-background/60 bg-background text-foreground' : 'border-foreground/40 text-foreground/80'
                }`}
              >
                {choiceKey(i)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-ui text-[16px] font-semibold leading-tight">{o.label}</span>
                {o.hint && (
                  <span className={`mt-0.5 block font-ui text-[13px] leading-snug ${on ? 'text-background/80' : 'text-foreground/65'}`}>{o.hint}</span>
                )}
              </span>
              {on && <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />}
            </button>
          )
        })}
      </div>
      <p className="mt-2.5 hidden font-ui text-[13px] text-foreground/65 [@media(pointer:fine)]:block" aria-hidden="true">
        Press a letter to choose.
      </p>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
