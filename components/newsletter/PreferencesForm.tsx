'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { INTERESTS, ROLES } from '@/lib/newsletter/interests'
import { markSubscribed } from '@/lib/newsletter/subscribed-flag'
import { ChoiceChips } from './ChoiceChips'

/**
 * The form on /preferences. The token is the one from the reader's own email;
 * the save route checks it, so this component only carries it along.
 */
export function PreferencesForm({
  token,
  initialInterests,
  initialRole,
  resubscribe = false,
}: {
  token: string
  initialInterests: string[]
  initialRole: string | null
  /** The address is not on the list: saving puts it back. */
  resubscribe?: boolean
}) {
  const [interests, setInterests] = useState<string[]>(initialInterests)
  const [role, setRole] = useState<string[]>(initialRole ? [initialRole] : [])
  const [status, setStatus] = useState<'idle' | 'loading' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Whoever opens this page from their email subscribes: the signup card stays away.
  useEffect(() => {
    if (!resubscribe) markSubscribed()
  }, [resubscribe])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/newsletter/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, interests, role: role[0], resubscribe: resubscribe || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not save')
      markSubscribed()
      setStatus('saved')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const changed = () => status === 'saved' && setStatus('idle')

  return (
    <form onSubmit={handleSubmit} className="panel panel-pad mt-6 max-w-[640px]">
      <div className="space-y-5">
        <ChoiceChips
          legend="I follow"
          options={INTERESTS}
          selected={interests}
          onChange={(next) => {
            setInterests(next)
            changed()
          }}
        />
        <ChoiceChips
          legend="I’m at a"
          options={ROLES}
          selected={role}
          single
          onChange={(next) => {
            setRole(next)
            changed()
          }}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-foreground px-5 font-ui text-[12px] font-bold uppercase tracking-[0.08em] text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
        >
          {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : resubscribe ? 'Subscribe again and save' : 'Save'}
        </button>
        {status === 'saved' && (
          <p className="flex items-center gap-1.5 font-ui text-[13.5px] text-emerald-400" role="status">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {resubscribe ? 'You’re back on the list. ' : ''}{interests.length > 0 ? 'Saved. It takes effect with tomorrow’s edition.' : 'Saved. You’ll get the edition as everyone does.'}
          </p>
        )}
        {status === 'error' && <p className="font-ui text-[13px] text-red-400" role="alert">{errorMsg}</p>}
      </div>

      <p className="mt-4 font-ui text-[12.5px] leading-snug text-muted-foreground">
        Nothing is left out of your email. The stories that match are gathered under “What you follow”, after the
        top stories. Untick everything to go back to the standard edition.
      </p>
    </form>
  )
}
