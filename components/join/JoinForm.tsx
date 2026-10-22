'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { signupSourceForRequest } from '@/lib/newsletter/signup-source'
import { markSubscribed } from '@/lib/newsletter/subscribed-flag'
import { openSignupCard } from '@/components/newsletter/SubscribePrompt'
import { firstEditionSentence } from '@/lib/newsletter/first-edition'

/**
 * The one field on /join (2026-10-22). Same route and same after-the-fact question as the other forms
 * (components/news/SubscribeWidget.tsx), sent as form `join` from page `/join`, so the signups it brings are
 * counted on their own.
 */
export function JoinForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [already, setAlready] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), attribution: signupSourceForRequest(), form: 'join', page: '/join' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe')
      markSubscribed()
      setAlready(data.message === 'Already subscribed')
      setStatus('success')
      if (typeof data.preferencesToken === 'string') openSignupCard({ token: data.preferencesToken })
      else if (typeof data.preferencesTicket === 'string') openSignupCard({ ticket: data.preferencesTicket, already: true })
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'success') {
    return (
      <p role="status" className="font-news text-[19px] leading-snug text-foreground">
        {already ? 'You’re already on the list. See you at 7:30am ET.' : `You’re in. ${firstEditionSentence()}`}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:flex-row">
      <label htmlFor="join-email" className="sr-only">Email address</label>
      <input
        id="join-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@firm.com"
        required
        className="min-w-0 flex-1 rounded-[3px] border border-foreground/25 bg-background px-3.5 py-3 font-ui text-[17px] text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/60 focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="shrink-0 rounded-[3px] bg-foreground px-6 py-3 font-ui text-[16px] font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === 'loading' ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Get it free'}
      </button>
      {status === 'error' && <p className="font-ui text-[13px] text-red-700 sm:basis-full">{errorMsg}</p>}
    </form>
  )
}
