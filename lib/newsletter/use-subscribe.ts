'use client'

import { useState } from 'react'
import { signupSourceForRequest } from './signup-source'
import { markSubscribed } from './subscribed-flag'

export type SubscribeStatus = 'idle' | 'loading' | 'success' | 'already' | 'error'

/**
 * One email field's worth of state, for the signup card and the rail form.
 * `form` is recorded with the signup so each form's yield can be counted.
 * `extra` is whatever else the form asked (the card's tick-boxes), read at
 * the moment of sending.
 * `preferencesToken` comes back for a new signup only: it lets the reader
 * say what they follow without another step (see the subscribe route).
 */
export function useSubscribe(form: string, extra?: () => Record<string, unknown>) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<SubscribeStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [preferencesToken, setPreferencesToken] = useState<string | null>(null)

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!email.trim() || status === 'loading') return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), attribution: signupSourceForRequest(), form, ...extra?.() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe')
      markSubscribed()
      setPreferencesToken(typeof data.preferencesToken === 'string' ? data.preferencesToken : null)
      setStatus(data.message === 'Already subscribed' ? 'already' : 'success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return { email, setEmail, status, errorMsg, preferencesToken, submit }
}
