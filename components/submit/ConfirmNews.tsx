'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

// The button on /submit/confirm (2026-10-22): posts the emailed token to
// /api/news/submit/confirm and says what happened, in plain words.

type State = 'idle' | 'sending' | 'confirmed' | 'already' | 'expired' | 'invalid' | 'error'

const MESSAGES: Record<Exclude<State, 'idle' | 'sending'>, { title: string; body: string }> = {
  confirmed: {
    title: 'Confirmed. Your news is with the desk.',
    body: 'We review and verify every submission before it runs, and may email you with a question. If it checks out it will be on the site and in FundOps Daily, usually within a day or two.',
  },
  already: {
    title: 'Already confirmed.',
    body: 'This submission is with the desk. There is nothing more to do.',
  },
  expired: {
    title: 'This link has expired.',
    body: 'Confirm links work for seven days. Please send your news again and we will email you a fresh one.',
  },
  invalid: {
    title: "This link doesn't work.",
    body: 'It may be incomplete: try copying the whole link from the email. Or send your news again.',
  },
  error: {
    title: 'Something went wrong.',
    body: 'Please try again in a minute.',
  },
}

export function ConfirmNews({ token }: { token: string }) {
  const [state, setState] = useState<State>(token ? 'idle' : 'invalid')

  async function confirm() {
    if (state === 'sending') return
    setState('sending')
    try {
      const res = await fetch('/api/news/submit/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const json = (await res.json().catch(() => ({}))) as { outcome?: string }
      const o = json.outcome
      setState(o === 'confirmed' || o === 'already' || o === 'expired' || o === 'invalid' ? o : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'idle' || state === 'sending') {
    return (
      <div>
        <p className="font-news text-[16px] leading-snug text-foreground/75">
          Press the button to confirm that you sent this news to FundOpsHQ. It then goes to the news desk for review.
        </p>
        <button
          type="button"
          onClick={confirm}
          disabled={state === 'sending'}
          className="mt-4 inline-flex items-center gap-2 rounded-sm bg-foreground px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {state === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Confirm my news
        </button>
      </div>
    )
  }

  const m = MESSAGES[state]
  const again = state === 'expired' || state === 'invalid'
  return (
    <div role="status">
      <p className="text-sm font-medium text-foreground">{m.title}</p>
      <p className="mt-2 text-[13px] text-muted-foreground">{m.body}</p>
      {again && (
        <Link href="/submit" className="mt-3 inline-block font-ui text-[13px] font-semibold text-foreground/80 underline underline-offset-2">
          Send your news
        </Link>
      )}
    </div>
  )
}
