'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { LIMITS, NEWS_KINDS, NEWS_KIND_LABELS } from '@/lib/submit/fields'
import { signupSourceForRequest } from '@/lib/newsletter/signup-source'
import { markSubscribed } from '@/lib/newsletter/subscribed-flag'
import { cn } from '@/lib/utils'

// Modelled on components/events/SubmitEventForm.tsx: the same field styles, honeypot and states.
const inputClass =
  'w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring'
const labelClass = 'mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground'
const noteClass = 'normal-case tracking-normal font-sans font-normal'

type Newsletter = 'subscribed' | 'already' | 'failed' | null

export function SubmitNewsForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [newsletter, setNewsletter] = useState<Newsletter>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setErrorMsg('')

    const data = Object.fromEntries(new FormData(e.currentTarget).entries())

    try {
      const res = await fetch('/api/news/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, attribution: signupSourceForRequest() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMsg(json.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }
      const nl: Newsletter = json.newsletter === 'subscribed' || json.newsletter === 'already' || json.newsletter === 'failed' ? json.newsletter : null
      if (nl === 'subscribed' || nl === 'already') markSubscribed()
      setNewsletter(nl)
      setStatus('done')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div role="status" className="rounded-lg border border-emerald-800 bg-emerald-900/20 px-5 py-8 text-center">
        <p className="text-sm font-medium text-emerald-300">Thank you. Your news is with the desk.</p>
        <p className="mx-auto mt-2 max-w-[52ch] text-[13px] text-muted-foreground">
          We check every item against the announcement before it runs. If it checks out, it will be on the site and in
          FundOps Daily, usually within a day. We may email you with a question.
        </p>
        {newsletter === 'subscribed' && (
          <p className="mt-3 text-[13px] text-muted-foreground">You&apos;re on the list for FundOps Daily: look out for a welcome email.</p>
        )}
        {newsletter === 'already' && <p className="mt-3 text-[13px] text-muted-foreground">You&apos;re already on the FundOps Daily list.</p>}
        {newsletter === 'failed' && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            We couldn&apos;t add you to FundOps Daily just now. You can subscribe from the button at the top of the page.
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot: hidden from real people */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ns-firm" className={labelClass}>Firm *</label>
          <input id="ns-firm" name="firm" required minLength={2} maxLength={LIMITS.firm} className={inputClass} placeholder="e.g. Example Capital Partners" />
        </div>
        <div>
          <label htmlFor="ns-kind" className={labelClass}>What is it? *</label>
          <select id="ns-kind" name="kind" required className={inputClass} defaultValue="">
            <option value="" disabled>Select...</option>
            {NEWS_KINDS.map((k) => (
              <option key={k} value={k}>{NEWS_KIND_LABELS[k]}</option>
            ))}
          </select>
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
          className={inputClass}
          placeholder="e.g. Example Capital closes Fund III at $450M, above its $350M target"
        />
      </div>

      <div>
        <label htmlFor="ns-details" className={labelClass}>Details <span className={noteClass}>(a few lines: the fund, the amount, who, when)</span></label>
        <textarea id="ns-details" name="details" maxLength={LIMITS.details} rows={4} className={inputClass} />
      </div>

      <div>
        <label htmlFor="ns-url" className={labelClass}>
          Link to the announcement * <span className={noteClass}>(your firm&apos;s release or a news story)</span>
        </label>
        <input id="ns-url" name="url" type="url" required maxLength={LIMITS.url} className={inputClass} placeholder="https://..." />
        <p className="mt-1 text-[12px] text-muted-foreground">
          We only publish what a firm&apos;s own announcement or a credible outlet says, so we need the link.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="ns-name" className={labelClass}>Your name *</label>
          <input id="ns-name" name="contact_name" required minLength={2} maxLength={LIMITS.contactName} autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="ns-email" className={labelClass}>Your email *</label>
          <input id="ns-email" name="contact_email" type="email" required maxLength={LIMITS.contactEmail} autoComplete="email" className={inputClass} />
        </div>
        <div>
          <label htmlFor="ns-role" className={labelClass}>Your role</label>
          <input id="ns-role" name="contact_role" maxLength={LIMITS.contactRole} autoComplete="organization-title" className={inputClass} placeholder="e.g. Head of IR" />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-foreground/80">
        <input type="checkbox" name="wants_newsletter" className="mt-0.5 h-4 w-4 accent-[#E6B045]" />
        <span>Send me FundOps Daily, the morning email of the day&apos;s closes, launches, deals and moves. Free; unsubscribe anytime.</span>
      </label>

      {errorMsg && <p role="alert" className="text-[13px] text-red-400">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'sending'}
        className={cn(
          'inline-flex items-center gap-2 rounded-sm bg-foreground px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background transition-all hover:bg-amber-400 disabled:opacity-60'
        )}
      >
        {status === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Send to the news desk
      </button>
    </form>
  )
}
