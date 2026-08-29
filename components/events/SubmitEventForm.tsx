'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring'
const labelClass = 'mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70'

export function SubmitEventForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setErrorMsg('')

    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    try {
      const res = await fetch('/api/events/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrorMsg(json.error ?? 'Something went wrong — please try again.')
        setStatus('error')
        return
      }
      setStatus('done')
    } catch {
      setErrorMsg('Something went wrong — please try again.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-lg border border-emerald-800 bg-emerald-900/20 px-5 py-8 text-center">
        <p className="text-sm font-medium text-emerald-300">Submission received — thank you.</p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          We verify every date at the organizer&apos;s site before publishing. If it checks out, it&apos;ll be on the board within a week.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot — hidden from real users */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div>
        <label htmlFor="ev-name" className={labelClass}>Event name *</label>
        <input id="ev-name" name="name" required minLength={5} maxLength={200} className={inputClass} placeholder="e.g. Private Funds CFO Forum 2027" />
      </div>

      <div>
        <label htmlFor="ev-url" className={labelClass}>Event page URL * <span className="normal-case tracking-normal font-sans font-normal">(where the date is published)</span></label>
        <input id="ev-url" name="event_url" type="url" required maxLength={500} className={inputClass} placeholder="https://..." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ev-start" className={labelClass}>Start date</label>
          <input id="ev-start" name="start_date" type="date" className={inputClass} />
        </div>
        <div>
          <label htmlFor="ev-end" className={labelClass}>End date</label>
          <input id="ev-end" name="end_date" type="date" className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ev-org" className={labelClass}>Organizer</label>
          <input id="ev-org" name="organizer_name" maxLength={200} className={inputClass} placeholder="Firm or association" />
        </div>
        <div>
          <label htmlFor="ev-city" className={labelClass}>City <span className="normal-case tracking-normal font-sans font-normal">(blank if virtual)</span></label>
          <input id="ev-city" name="city" maxLength={100} className={inputClass} placeholder="e.g. New York" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="ev-format" className={labelClass}>Format</label>
          <select id="ev-format" name="event_format" className={inputClass} defaultValue="">
            <option value="">Select...</option>
            <option value="in_person">In-person</option>
            <option value="virtual">Virtual</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <label htmlFor="ev-kind" className={labelClass}>Type</label>
          <select id="ev-kind" name="event_kind" className={inputClass} defaultValue="">
            <option value="">Select...</option>
            <option value="conference">Conference</option>
            <option value="summit">Summit</option>
            <option value="forum">Forum</option>
            <option value="webinar">Webinar</option>
            <option value="training">Training</option>
            <option value="networking">Networking</option>
            <option value="roundtable">Roundtable</option>
            <option value="awards">Awards</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="ev-cost" className={labelClass}>Cost</label>
          <select id="ev-cost" name="cost_type" className={inputClass} defaultValue="">
            <option value="">Select...</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="member_only">Members only</option>
            <option value="invite_only">Invite only</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="ev-desc" className={labelClass}>What is it, and who&apos;s it for?</label>
        <textarea id="ev-desc" name="description" maxLength={1000} rows={3} className={inputClass} placeholder="One or two sentences — audience, focus, anything that helps us categorize it." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ev-sname" className={labelClass}>Your name</label>
          <input id="ev-sname" name="submitter_name" maxLength={200} className={inputClass} />
        </div>
        <div>
          <label htmlFor="ev-semail" className={labelClass}>Your email <span className="normal-case tracking-normal font-sans font-normal">(if we have questions)</span></label>
          <input id="ev-semail" name="submitter_email" type="email" maxLength={200} className={inputClass} />
        </div>
      </div>

      {errorMsg && <p className="text-[13px] text-red-400">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'sending'}
        className={cn(
          'inline-flex items-center gap-2 rounded-sm bg-foreground px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background transition-all hover:bg-amber-400 disabled:opacity-60'
        )}
      >
        {status === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Submit Event
      </button>
    </form>
  )
}
