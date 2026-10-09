'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, ArrowRight, Mail } from 'lucide-react'
import { signupSourceForRequest } from '@/lib/newsletter/signup-source'
import { markSubscribed } from '@/lib/newsletter/subscribed-flag'

/**
 * Decode the `?e=<base64url>` query param that the outreach pipeline
 * appends to the subscribe deep-link. Returns null on any failure —
 * invalid base64, non-email string, garbage from a mangled share — so
 * the form falls back to the empty state gracefully.
 */
function decodePrefillEmail(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const token = new URLSearchParams(window.location.search).get('e')
    if (!token) return null
    // Browser atob uses standard base64. Convert base64url back (- → +, _ → /).
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '==='.slice(0, (4 - (b64.length % 4)) % 4)
    const decoded = atob(padded)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(decoded)) return null
    return decoded
  } catch {
    return null
  }
}

/**
 * The subscribe band: one line under the section tabs, on the homepage only.
 * The newsletter is the site's main funnel, so the ask sits above the lead
 * story — but as a single line, because the stories are the pitch.
 *
 * Keeps the contracts other code relies on: the section id `subscribe`, the
 * input id `newsletter-email`, and the `?e=` prefill from outreach links.
 */
export function HeroSubscribe() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [prefilled, setPrefilled] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Outreach deep-link prefill (?e=<base64url-email>) — one-click subscribe state.
  useEffect(() => {
    const prefill = decodePrefillEmail()
    if (prefill) {
      setEmail(prefill)
      setPrefilled(true)
    }
  }, [])

  // Focus the email input whenever the URL lands on #subscribe.
  useEffect(() => {
    const focusIfTargeted = () => {
      if (window.location.hash === '#subscribe') {
        requestAnimationFrame(() => {
          emailInputRef.current?.focus({ preventScroll: true })
        })
      }
    }
    focusIfTargeted()
    window.addEventListener('hashchange', focusIfTargeted)
    return () => window.removeEventListener('hashchange', focusIfTargeted)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), attribution: signupSourceForRequest(), form: 'hero' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to subscribe')
      }

      markSubscribed()
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <section id="subscribe" className="scroll-mt-14 border-b border-border bg-card">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:px-6">
        <p className="min-w-0 font-news text-[15.5px] leading-snug text-foreground">
          <span className="font-bold">FundOps Daily</span>
          <span className="text-foreground/75"> — fund closes, launches, deals and moves, in your inbox before the open.</span>
          <span className="hidden whitespace-nowrap font-ui text-[12px] text-muted-foreground xl:inline"> Free, every morning.</span>
        </p>

        <div className="w-full shrink-0 sm:w-auto">
          {status === 'success' ? (
            <div className="flex items-center gap-2 rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="font-ui text-[13px] text-emerald-300">Subscribed — your first edition lands tomorrow morning.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex w-full items-stretch gap-2 sm:w-[390px]">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  ref={emailInputRef}
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@firm.com"
                  required
                  aria-label="Email address"
                  className="h-9 w-full rounded-sm border border-foreground/25 bg-background px-3 pl-8 font-ui text-[14px] text-foreground placeholder:text-muted-foreground/70 focus:border-foreground focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="group inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-sm bg-foreground px-4 font-ui text-[12px] font-bold uppercase tracking-[0.08em] text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {prefilled && email ? 'Subscribe' : 'Subscribe free'}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          )}
          {status === 'error' && <p className="mt-1 font-ui text-xs text-red-400">{errorMsg}</p>}
        </div>
      </div>
    </section>
  )
}
