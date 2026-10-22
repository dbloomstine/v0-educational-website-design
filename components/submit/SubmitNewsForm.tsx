'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { CURRENCIES, LIMITS, MAX_PEOPLE, NEWS_KINDS, NEWS_KIND_LABELS } from '@/lib/submit/fields'
import { cn } from '@/lib/utils'

// Modelled on components/events/SubmitEventForm.tsx: the same field styles, honeypot and states.
// Version 2 (2026-10-22): work email confirmed by a link, firm website, amount, date, people involved.
const inputClass =
  'w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring'
const labelClass = 'mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground'
const noteClass = 'normal-case tracking-normal font-sans font-normal'
const legendClass = 'mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground'

type Confirm = 'sent' | 'failed' | 'none'

export function SubmitNewsForm({ defaultFirm = '' }: { defaultFirm?: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [errorField, setErrorField] = useState('')
  const [confirm, setConfirm] = useState<Confirm>('sent')
  const [email, setEmail] = useState('')
  const [peopleRows, setPeopleRows] = useState(1)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setErrorMsg('')
    setErrorField('')

    const data = Object.fromEntries(new FormData(e.currentTarget).entries())

    try {
      const res = await fetch('/api/news/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMsg(json.error ?? 'Something went wrong. Please try again.')
        setErrorField(typeof json.field === 'string' ? json.field : '')
        setStatus('error')
        if (typeof json.field === 'string') document.getElementById(`ns-${json.field}`)?.focus()
        return
      }
      setConfirm(json.confirm === 'failed' || json.confirm === 'none' ? json.confirm : 'sent')
      setEmail(String(data.contact_email ?? ''))
      setStatus('done')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div role="status" className="rounded-[3px] border border-emerald-700/40 bg-emerald-50 px-5 py-8 text-center">
        {confirm === 'sent' ? (
          <>
            <p className="text-sm font-medium text-emerald-800">Almost done: check your inbox.</p>
            <p className="mx-auto mt-2 max-w-[52ch] text-[13px] text-muted-foreground">
              We sent a link to {email || 'your work email'}. Click it to confirm, and your news goes to the desk for review.
              The link works for seven days. Nothing is sent to the desk until you click it.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-emerald-800">Thank you. Your news is with the desk.</p>
            <p className="mx-auto mt-2 max-w-[52ch] text-[13px] text-muted-foreground">
              We couldn&apos;t send the confirmation email just now, so we&apos;ll confirm with you by email before we review it.
            </p>
          </>
        )}
      </div>
    )
  }

  const err = (field: string) => (errorField === field ? 'border-red-500' : '')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot: hidden from real people */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ns-kind" className={labelClass}>What is it? *</label>
          <select id="ns-kind" name="kind" required className={cn(inputClass, err('kind'))} defaultValue="">
            <option value="" disabled>Select...</option>
            {NEWS_KINDS.map((k) => (
              <option key={k} value={k}>{NEWS_KIND_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ns-news_date" className={labelClass}>Date * <span className={noteClass}>(announced or effective)</span></label>
          <input id="ns-news_date" name="news_date" type="date" required className={cn(inputClass, err('news_date'))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ns-firm" className={labelClass}>Firm *</label>
          <input
            id="ns-firm"
            name="firm"
            required
            minLength={2}
            maxLength={LIMITS.firm}
            defaultValue={defaultFirm}
            autoComplete="organization"
            className={cn(inputClass, err('firm'))}
            placeholder="e.g. Example Capital Partners"
          />
        </div>
        <div>
          <label htmlFor="ns-firm_website" className={labelClass}>Firm website *</label>
          <input
            id="ns-firm_website"
            name="firm_website"
            required
            maxLength={LIMITS.firmWebsite}
            inputMode="url"
            className={cn(inputClass, err('firm_website'))}
            placeholder="example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ns-headline" className={labelClass}>Headline * <span className={noteClass}>(one line)</span></label>
        <input
          id="ns-headline"
          name="headline"
          required
          minLength={10}
          maxLength={LIMITS.headline}
          className={cn(inputClass, err('headline'))}
          placeholder="e.g. Example Capital closes Fund III at $450M, above its $350M target"
        />
      </div>

      <div>
        <label htmlFor="ns-details" className={labelClass}>What happened * <span className={noteClass}>(the facts: who, what, how much, when)</span></label>
        <textarea id="ns-details" name="details" required minLength={20} maxLength={LIMITS.details} rows={5} className={cn(inputClass, err('details'))} />
      </div>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="ns-amount" className={labelClass}>Amount <span className={noteClass}>(if any)</span></label>
          <input id="ns-amount" name="amount" maxLength={LIMITS.amount} inputMode="decimal" className={cn(inputClass, err('amount'))} placeholder="e.g. 450M" />
        </div>
        <div>
          <label htmlFor="ns-currency" className={labelClass}>Currency</label>
          <select id="ns-currency" name="currency" className={cn(inputClass, err('currency'))} defaultValue="USD">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="ns-url" className={labelClass}>
          Public link <span className={noteClass}>(a press release or story backing it, if there is one)</span>
        </label>
        <input id="ns-url" name="url" type="url" maxLength={LIMITS.url} className={cn(inputClass, err('url'))} placeholder="https://..." />
      </div>

      <fieldset>
        <legend className={legendClass}>
          Deal team / people involved <span className={noteClass}>(optional, up to {MAX_PEOPLE}; for our records, not published)</span>
        </legend>
        <div className="space-y-2">
          {Array.from({ length: peopleRows }, (_, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2">
              <input name={`person_name_${i}`} maxLength={LIMITS.personName} aria-label={`Person ${i + 1}: name`} className={inputClass} placeholder="Name" />
              <input name={`person_role_${i}`} maxLength={LIMITS.personRole} aria-label={`Person ${i + 1}: role`} className={inputClass} placeholder="Role, e.g. Partner" />
            </div>
          ))}
        </div>
        {peopleRows < MAX_PEOPLE && (
          <button
            type="button"
            onClick={() => setPeopleRows((n) => Math.min(MAX_PEOPLE, n + 1))}
            className="mt-2 font-ui text-[12px] font-semibold text-foreground/70 underline decoration-foreground/25 underline-offset-2 hover:text-foreground"
          >
            + Add a person
          </button>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="ns-contact_name" className={labelClass}>Your name *</label>
          <input id="ns-contact_name" name="contact_name" required minLength={2} maxLength={LIMITS.contactName} autoComplete="name" className={cn(inputClass, err('contact_name'))} />
        </div>
        <div>
          <label htmlFor="ns-contact_role" className={labelClass}>Your role *</label>
          <input id="ns-contact_role" name="contact_role" required maxLength={LIMITS.contactRole} autoComplete="organization-title" className={cn(inputClass, err('contact_role'))} placeholder="e.g. Head of IR" />
        </div>
        <div>
          <label htmlFor="ns-contact_email" className={labelClass}>Work email *</label>
          <input id="ns-contact_email" name="contact_email" type="email" required maxLength={LIMITS.contactEmail} autoComplete="email" className={cn(inputClass, err('contact_email'))} placeholder="you@yourfirm.com" />
        </div>
      </div>
      <p className="-mt-2 text-[12px] text-muted-foreground">We email you a link to confirm. Work addresses only, no Gmail or Outlook.</p>

      <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-foreground/80">
        <input type="checkbox" name="wants_newsletter" className="mt-0.5 h-4 w-4 accent-[#E6B045]" />
        <span>Send me FundOps Daily, the morning email of the day&apos;s closes, launches, deals and moves. Free; unsubscribe anytime.</span>
      </label>

      {errorMsg && <p role="alert" className="text-[13px] text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-flex items-center gap-2 rounded-sm bg-foreground px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Send to the news desk
      </button>
    </form>
  )
}
