'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { openSignupCard } from '@/components/newsletter/SubscribePrompt'
import { ChoiceChips } from '@/components/newsletter/ChoiceChips'
import { INTERESTS, ROLES, interestWords } from '@/lib/newsletter/interests'
import { useSubscribe } from '@/lib/newsletter/use-subscribe'
import { firstEditionSentence } from '@/lib/newsletter/first-edition'

/**
 * The one field on /join (2026-10-22). Same route as the other forms, sent as form `join` from page `/join`, so the
 * signups it brings are counted on their own.
 *
 * Later the same day (design review): it asks what the signup box asks and looks like it. The tick-boxes for what the
 * reader follows and where they sit come under the field, optional, and go with the address; the button is the
 * box's gold one. Whoever ticks nothing is asked afterwards, in the box, as before. An address already on the list
 * that ticked boxes has them saved with the ticket the route hands back, as the box does.
 */
export function JoinForm() {
  const [followed, setFollowed] = useState<string[]>([])
  const [role, setRole] = useState<string[]>([])
  const sub = useSubscribe('join', () => ({ interests: followed, role: role[0], page: '/join' }))
  const ticked = followed.length > 0 || role.length > 0

  // After the address is in: ask the tick-boxes in the box only when none were ticked here.
  useEffect(() => {
    if (sub.status === 'success' && sub.preferencesToken && !ticked) openSignupCard({ token: sub.preferencesToken })
    if (sub.status === 'already' && sub.preferencesTicket) {
      if (ticked) {
        fetch('/api/newsletter/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket: sub.preferencesTicket, interests: followed, role: role[0] }),
        }).catch(() => {})
      } else {
        openSignupCard({ ticket: sub.preferencesTicket, already: true })
      }
    }
    // Once, when the answer arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub.status])

  if (sub.status === 'success' || sub.status === 'already') {
    const words = interestWords(followed)
    return (
      <p role="status" className="font-news text-[19px] leading-snug text-foreground">
        {sub.status === 'already'
          ? 'You’re already on the list. See you at 7:30am ET.'
          : `You’re in. ${firstEditionSentence()}${words ? ` Stories on ${words} will be grouped for you.` : ''}`}
      </p>
    )
  }

  return (
    <form onSubmit={sub.submit}>
      <div className="flex items-stretch gap-2">
        <label htmlFor="join-email" className="sr-only">Email address</label>
        <input
          id="join-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={sub.email}
          onChange={(e) => sub.setEmail(e.target.value)}
          placeholder="name@firm.com"
          required
          className="h-12 min-w-0 flex-1 rounded-sm border-2 border-foreground/35 bg-background px-3 font-ui text-[16px] text-foreground placeholder:text-muted-foreground/70 focus:border-foreground focus:outline-none sm:h-[52px] sm:text-[17px]"
        />
        <button
          type="submit"
          disabled={sub.status === 'loading'}
          className="group inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-sm px-4 font-ui text-[13px] font-extrabold uppercase tracking-[0.07em] transition-[filter] hover:brightness-95 disabled:opacity-50 sm:h-[52px] sm:px-6"
          style={{ background: 'var(--tab)', color: 'var(--ink)' }}
        >
          {sub.status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-label="Subscribing" role="img" />
          ) : (
            <>
              Get it free <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </>
          )}
        </button>
      </div>
      {sub.status === 'error' && <p className="mt-1.5 font-ui text-[13px] text-red-700" role="alert">{sub.errorMsg}</p>}
      <p className="mt-2 font-ui text-[12.5px] text-muted-foreground">One email a day. Unsubscribe in one click.</p>

      <div className="mt-5 border-t border-foreground/10 pt-4">
        <p className="mb-3 font-ui text-[13.5px] leading-snug text-foreground/75">
          If you like, tick what you follow and we’ll group those stories for you.
        </p>
        <div className="space-y-3 sm:hidden">
          <ChoiceChips legend="I follow" options={INTERESTS} selected={followed} onChange={setFollowed} compact />
          <ChoiceChips legend="I’m at a" options={ROLES} selected={role} onChange={setRole} single compact inline />
        </div>
        <div className="hidden space-y-4 sm:block">
          <ChoiceChips legend="I follow" options={INTERESTS} selected={followed} onChange={setFollowed} />
          <ChoiceChips legend="I’m at a" options={ROLES} selected={role} onChange={setRole} single inline />
        </div>
      </div>
    </form>
  )
}
