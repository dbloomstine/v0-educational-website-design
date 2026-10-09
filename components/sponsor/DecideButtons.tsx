'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

/** The owner's two buttons. Each asks once more before it acts: a yes books a run and writes to the sponsor. */
export function DecideButtons({ token, company }: { token: string; company: string }) {
  const [state, setState] = useState<'idle' | 'working' | 'approved' | 'declined' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function decide(action: 'approve' | 'decline') {
    const ask = action === 'approve' ? `Book ${company} for these dates and tell them?` : `Decline ${company} and tell them?`
    if (!window.confirm(ask)) return
    setState('working')
    setMessage('')
    try {
      const res = await fetch('/api/sponsor/decide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, action }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'That did not go through.')
      setState(data.status === 'approved' ? 'approved' : 'declined')
    } catch (err) {
      setState('error')
      setMessage(err instanceof Error ? err.message : 'That did not go through.')
    }
  }

  if (state === 'approved' || state === 'declined') {
    return (
      <p className="flex items-start gap-2 font-news text-[20px] leading-snug" role="status">
        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
        {state === 'approved' ? `Booked. ${company} has been told, and the ad starts by itself on the first day.` : `Declined. ${company} has been told.`}
      </p>
    )
  }
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={state === 'working'} onClick={() => decide('approve')} className="inline-flex h-11 items-center gap-2 rounded-sm px-6 font-ui text-[13px] font-extrabold uppercase tracking-[0.06em] disabled:opacity-50" style={{ background: 'var(--tab)', color: 'var(--ink)' }}>
          {state === 'working' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve and book'}
        </button>
        <button type="button" disabled={state === 'working'} onClick={() => decide('decline')} className="inline-flex h-11 items-center rounded-sm border border-foreground/40 bg-card px-6 font-ui text-[13px] font-bold uppercase tracking-[0.06em] hover:border-foreground disabled:opacity-50">
          Decline
        </button>
      </div>
      {message && <p className="mt-2 font-ui text-[13.5px] text-red-400" role="alert">{message}</p>}
    </div>
  )
}
