'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, ArrowRight, Mail } from 'lucide-react'

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
 * Compact hub hero (density redesign 2026-08-30): a slim editorial band —
 * masthead bar, one-line headline, inline subscribe — so the news feed and
 * events rail land above the fold. The old full-viewport hero is gone by
 * design: the content IS the pitch now.
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

  const today = new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <section id="subscribe" className="relative isolate overflow-hidden border-b border-foreground/10 scroll-mt-16">
      {/* Faint wordmark texture, tucked behind the band */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 flex items-center overflow-hidden select-none"
      >
        <span
          className="font-display italic font-black tracking-[-0.05em] leading-none whitespace-nowrap translate-x-16"
          style={{
            fontSize: '110px',
            background: 'linear-gradient(180deg, oklch(0.98 0 0 / 0.07) 0%, oklch(0.98 0 0 / 0.02) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            fontVariationSettings: '"opsz" 144, "SOFT" 100',
          }}
        >
          FundOpsHQ
        </span>
      </div>

      {/* Masthead bar */}
      <div className="relative z-10 border-b border-foreground/10">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
          <span className="flex items-center gap-3">
            <span className="text-foreground/90">Vol. I</span>
            <span aria-hidden="true" className="text-foreground/20">
              ·
            </span>
            <span>{today}</span>
          </span>
          <span className="flex items-center gap-3">
            <span className="hidden sm:inline">The Hub for Private Markets</span>
            <span aria-hidden="true" className="hidden sm:inline text-foreground/20">
              ·
            </span>
            <Link href="/about" className="text-amber-400 hover:text-amber-300 transition-colors">
              About
            </Link>
          </span>
        </div>
      </div>

      {/* Slim hero band: headline left, inline subscribe right */}
      <div className="relative z-10 container mx-auto max-w-[1400px] px-4 py-2.5 sm:py-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1
              className="font-display text-foreground"
              style={{
                fontSize: 'clamp(17px, 1.9vw, 26px)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Fund news, events, and{' '}
              <span
                className="italic"
                style={{
                  fontWeight: 400,
                  fontVariationSettings: '"opsz" 144, "SOFT" 100',
                  color: 'oklch(0.85 0.12 85)',
                }}
              >
                a morning newsletter.
              </span>
            </h1>
            <p className="mt-0.5 hidden sm:block font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
              200+ sources · Hourly news · Verified events calendar ·{' '}
              <span className="text-foreground/60">Edited by Danny Bloomstine</span>
            </p>
          </div>

          {/* Inline subscribe */}
          <div className="w-full lg:w-auto lg:shrink-0">
            {status === 'success' ? (
              <div className="flex items-center gap-2.5 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-sm text-emerald-300">Subscribed — first edition lands tomorrow morning.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex w-full items-stretch gap-2 lg:w-[400px]">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    ref={emailInputRef}
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    required
                    aria-label="Email address"
                    className="h-9 w-full rounded-sm border-2 border-foreground/15 bg-background/70 px-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/50 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="group inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-sm bg-foreground px-4 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-background transition-all hover:bg-amber-400 disabled:opacity-50"
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
            {status === 'error' && <p className="mt-1 text-xs text-red-400">{errorMsg}</p>}
            {status !== 'success' && (
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/50">
                FundOps Daily · every morning before the open · free
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
