'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
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

export function HeroSubscribe() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [prefilled, setPrefilled] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  // On mount: if ?e=<base64url-email> is in the URL, pre-fill the form
  // and flip into a one-click state. This is the landing for clicks
  // from the outreach pipeline (see subscribeDeepLink in
  // lib/outreach/template.ts) — the recipient sees their own email in
  // the input and a button that says "Subscribe you@example.com".
  useEffect(() => {
    const prefill = decodePrefillEmail()
    if (prefill) {
      setEmail(prefill)
      setPrefilled(true)
    }
  }, [])

  // Focus the email input whenever the URL lands on #subscribe — covers cross-page
  // navigation from /about etc. and hash-change clicks from the header/footer.
  // Same-hash repeat clicks are handled imperatively in site-header.tsx.
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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase()

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
    <section
      id="subscribe"
      className="relative isolate overflow-hidden border-b-2 border-foreground/15 scroll-mt-16"
    >
      {/* ─── Massive editorial wordmark in background ─── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-12 -bottom-12 flex items-end justify-center select-none"
      >
        <span
          className="font-display italic font-black tracking-[-0.05em] leading-[0.78] whitespace-nowrap"
          style={{
            fontSize: 'clamp(220px, 34vw, 560px)',
            background:
              'linear-gradient(180deg, oklch(0.98 0 0 / 0.13) 0%, oklch(0.98 0 0 / 0.05) 50%, oklch(0.98 0 0 / 0.01) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            fontVariationSettings: '"opsz" 144, "SOFT" 100',
          }}
        >
          FundOpsHQ
        </span>
      </div>

      {/* Hairline grid overlay for editorial texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, oklch(0.98 0 0) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.98 0 0) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Radial vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, oklch(0.32 0.055 250 / 0.55) 100%)',
        }}
      />

      {/* ─── Newspaper masthead bar ─── */}
      <div className="relative z-10 border-b border-foreground/10">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
          <span className="flex items-center gap-3">
            <span className="text-foreground/90">Vol. I</span>
            <span aria-hidden="true" className="text-foreground/20">·</span>
            <span>{today}</span>
          </span>
          <span className="flex items-center gap-3">
            <span className="hidden sm:inline">The Daily Brief for Private Markets</span>
            <span aria-hidden="true" className="hidden sm:inline text-foreground/20">·</span>
            <a
              href="https://www.youtube.com/@dbloomstine/streams"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              Live Show on YouTube
            </a>
          </span>
        </div>
      </div>

      {/* ─── Main hero content ─── */}
      <div className="relative z-10 container mx-auto px-4 py-14 sm:py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 items-center">
          {/* Left: Editorial lede */}
          <div className="lg:col-span-7 xl:col-span-7">
            <div className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              <span className="h-px w-8 bg-foreground/40" />
              No. 001 · The Front Page
            </div>

            <h1
              className="font-display text-foreground"
              style={{
                fontSize: 'clamp(40px, 6.8vw, 96px)',
                lineHeight: 0.92,
                letterSpacing: '-0.035em',
                fontWeight: 500,
                fontVariationSettings: '"opsz" 144, "SOFT" 30',
              }}
            >
              News, newsletter
              <br />
              and the{' '}
              <span
                className="italic"
                style={{
                  fontWeight: 400,
                  fontVariationSettings: '"opsz" 144, "SOFT" 100',
                  color: 'oklch(0.85 0.12 85)',
                }}
              >
                live&nbsp;show.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Real-time fund news, a morning briefing in your inbox, and a weekly broadcast with the people running
              the back office of PE, VC and credit.
            </p>

            {/* Channels strip — News · Newsletter · Show */}
            <dl className="mt-8 grid grid-cols-3 gap-4 max-w-md border-y border-foreground/10 py-4">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">News</dt>
                <dd className="mt-1 font-display text-2xl text-foreground">Hourly</dd>
              </div>
              <div className="border-l border-foreground/10 pl-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">Newsletter</dt>
                <dd className="mt-1 font-display text-2xl text-foreground">Daily</dd>
              </div>
              <div className="border-l border-foreground/10 pl-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">Show</dt>
                <dd className="mt-1 font-display text-2xl text-foreground">Weekly</dd>
              </div>
            </dl>
          </div>

          {/* Right: Subscribe card */}
          <div className="lg:col-span-5 xl:col-span-5">
            <div className="relative">
              {/* Card */}
              <div className="relative rounded-sm border-2 border-foreground/15 bg-card/95 p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-md">
                {/* Top label tab */}
                <div className="absolute -top-3 left-6 bg-background px-3">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Morning Edition
                  </span>
                </div>

                {/* Headshot + heading row */}
                <div className="mb-5 flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 -m-1 rounded-full bg-amber-400/10 blur-md" />
                    <Image
                      src="/danny-headshot-nobg.png"
                      alt="Danny Bloomstine"
                      width={72}
                      height={72}
                      className="relative h-[72px] w-[72px] rounded-full border-2 border-foreground/20 bg-muted/30 object-cover"
                      priority
                    />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                      Edited by
                    </p>
                    <p className="font-display text-xl text-foreground leading-tight" style={{ fontVariationSettings: '"opsz" 36' }}>
                      Danny Bloomstine
                    </p>
                  </div>
                </div>

                <h2
                  className="font-display text-foreground mb-2"
                  style={{
                    fontSize: '28px',
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 60',
                  }}
                >
                  Get <span className="italic" style={{ fontVariationSettings: '"opsz" 60, "SOFT" 100' }}>FundOps&nbsp;Daily</span>{' '}
                  in your inbox.
                </h2>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  Every morning before the market opens. Top stories, fund launches, exec moves, and the briefing for the week ahead.
                </p>

                {/* Form */}
                {status === 'success' ? (
                  <div className="flex items-center gap-2.5 rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-sm text-emerald-300">You&apos;re subscribed. Your first edition lands tomorrow morning.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-2.5">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                      <input
                        ref={emailInputRef}
                        id="newsletter-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@email.com"
                        required
                        aria-label="Email address"
                        className="w-full rounded-sm border-2 border-foreground/15 bg-background/70 px-4 py-3 pl-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-foreground/50 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="group flex w-full items-center justify-center gap-2 rounded-sm bg-foreground px-5 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-background transition-all hover:bg-foreground/90 disabled:opacity-50"
                    >
                      {status === 'loading' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : prefilled && email ? (
                        <>
                          Subscribe {email}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </>
                      ) : (
                        <>
                          Subscribe Free
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
                {status === 'error' && (
                  <p className="mt-2 text-center text-xs text-red-400">{errorMsg}</p>
                )}

                {/* Footer link */}
                <div className="mt-5 flex items-center justify-between border-t border-foreground/10 pt-4">
                  <Link
                    href="#news"
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60 transition-colors hover:text-foreground"
                  >
                    Skip → The Wire
                  </Link>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/40">
                    5 min read
                  </span>
                </div>
              </div>

              {/* Decorative corner ticks */}
              <div className="pointer-events-none absolute -top-1 -left-1 h-3 w-3 border-l-2 border-t-2 border-amber-400/40" />
              <div className="pointer-events-none absolute -top-1 -right-1 h-3 w-3 border-r-2 border-t-2 border-amber-400/40" />
              <div className="pointer-events-none absolute -bottom-1 -left-1 h-3 w-3 border-l-2 border-b-2 border-amber-400/40" />
              <div className="pointer-events-none absolute -bottom-1 -right-1 h-3 w-3 border-r-2 border-b-2 border-amber-400/40" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
