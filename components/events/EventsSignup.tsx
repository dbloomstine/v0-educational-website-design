'use client'

import { useEffect } from 'react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useSubscribe } from '@/lib/newsletter/use-subscribe'
import { eventSignupTags } from '@/lib/newsletter/interests'
import { openSignupCard } from '@/components/newsletter/SubscribePrompt'
import { eventsOfferHeadline } from '@/lib/events/offer'

/**
 * The events offer (2026-10-22): one email field under an event's details, on
 * the city pages and on /events. Event pages bring more search visitors than
 * the front page (fund CFOs, controllers and ops people looking up an event by
 * name) and almost none of them signed up; this asks them in the terms they
 * came for.
 *
 * It subscribes through the same route as every other form (single opt-in,
 * welcome email), as form `events`, and records the opt-in as interest tags
 * ("events", "city:chicago") so a Monday events email can be sent to them.
 * Like the rail's form, it then opens the signup box at its tick-boxes.
 *
 * `data-signup-events` tells the signup box it is on an events page, and for
 * which city, so its wording can follow (components/newsletter/SubscribePrompt.tsx);
 * `data-signup-events-monday` tells it whether the Monday events email is live.
 *
 * `monday`: the page passes `mondayEmailLive()` (lib/events/weekly-mode.ts). Only
 * then does the line promise a Monday email.
 */
export function EventsSignup({ city, monday = false, className = '' }: { city: string | null; monday?: boolean; className?: string }) {
  const sub = useSubscribe('events', () => ({ interests: eventSignupTags(city) }))

  useEffect(() => {
    if (sub.status === 'success' && sub.preferencesToken) openSignupCard({ token: sub.preferencesToken })
    if (sub.status === 'already' && sub.preferencesTicket) openSignupCard({ ticket: sub.preferencesTicket, already: true })
  }, [sub.status, sub.preferencesToken, sub.preferencesTicket])

  const headline = eventsOfferHeadline(city, { monday })

  return (
    <section
      aria-label="Get the week's events by email"
      data-signup-events={city ?? ''}
      data-signup-events-monday={monday ? '1' : '0'}
      className={`events-offer border-t-[3px] border-[var(--tab)] bg-card px-4 py-4 sm:px-5 ${className}`}
    >
      {sub.status === 'success' || sub.status === 'already' ? (
        <p className="flex items-start gap-2 font-news text-[17px] leading-snug text-foreground" role="status">
          <CheckCircle2 className="mt-[3px] h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
          {sub.status === 'already'
            ? 'You’re already on the list. The morning email carries the week’s events.'
            : `You’re in. ${city ? `${city} events and the` : 'The week’s events and the'} morning news are on their way.`}
        </p>
      ) : (
        <form onSubmit={sub.submit} className="grid gap-x-6 gap-y-3 md:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] md:items-center">
          <div>
            <p className="font-news text-[19px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground sm:text-[21px]">
              {headline} <span className="italic" style={{ color: 'var(--display-accent)' }}>Free.</span>
            </p>
            <p className="mt-1 font-ui text-[12px] text-muted-foreground">
              Every date checked at the organizer. Unsubscribe in one click.
            </p>
          </div>
          <div>
            <div className="flex items-stretch gap-2">
              <input
                type="email"
                value={sub.email}
                onChange={(e) => sub.setEmail(e.target.value)}
                placeholder="name@firm.com"
                required
                autoComplete="email"
                inputMode="email"
                aria-label="Email address"
                className="h-11 min-w-0 flex-1 rounded-sm border-2 border-foreground/35 bg-background px-3 font-ui text-[16px] text-foreground placeholder:text-muted-foreground/70 focus:border-foreground focus:outline-none"
              />
              <button
                type="submit"
                disabled={sub.status === 'loading'}
                className="group inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-sm px-4 font-ui text-[12.5px] font-extrabold uppercase tracking-[0.07em] transition-[filter] hover:brightness-95 disabled:opacity-50"
                style={{ background: 'var(--tab)', color: 'var(--ink)' }}
              >
                {sub.status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Get them <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </>
                )}
              </button>
            </div>
            {sub.status === 'error' && (
              <p className="mt-1.5 font-ui text-xs text-red-400" role="alert">
                {sub.errorMsg}
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
