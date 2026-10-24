'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import type { Completeness } from '@/lib/directory/completeness'
import type { ViewSummary } from '@/lib/directory/views'

// The owner side's small pieces (2026-10-24, workstream B): the view beacon on a profile, the empty-search
// beacon, the completeness meter, the badge snippet, the newsletter offer and the views panel on the edit page.

const ss = {
  get(k: string) {
    try {
      return window.sessionStorage.getItem(k)
    } catch {
      return null
    }
  },
  set(k: string, v: string) {
    try {
      window.sessionStorage.setItem(k, v)
    } catch {
      /* private mode: count anyway, at most once per page load */
    }
  },
}

function beacon(url: string, body: unknown) {
  const data = JSON.stringify(body)
  try {
    if (navigator.sendBeacon?.(url, new Blob([data], { type: 'application/json' }))) return
  } catch {
    /* fall through */
  }
  fetch(url, { method: 'POST', body: data, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
}

/** One view of a profile, once per browser tab session. Renders nothing. */
export function ViewBeacon({ id }: { id: string }) {
  useEffect(() => {
    const key = `fohq-dir-view:${id}`
    if (ss.get(key)) return
    ss.set(key, '1')
    // A moment's wait: a visitor bouncing straight off (or a tab opened in the background and closed) is not a view.
    const t = window.setTimeout(() => {
      if (document.visibilityState === 'visible') beacon('/api/directory/view', { id })
    }, 1500)
    return () => window.clearTimeout(t)
  }, [id])
  return null
}

/** Logs a search that found nobody, once it has settled for two seconds; each query once per tab session. */
export function SearchMissBeacon({ trade, q }: { trade: string; q: string }) {
  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) return
    const key = `fohq-dir-miss:${trade}:${query.toLowerCase()}`
    if (ss.get(key)) return
    const t = window.setTimeout(() => {
      ss.set(key, '1')
      beacon('/api/directory/search-miss', { trade, q: query })
    }, 2000)
    return () => window.clearTimeout(t)
  }, [trade, q])
  return null
}

export function CompletenessMeter({ c }: { c: Completeness }) {
  const missing = c.items.filter((i) => !i.done)
  return (
    <section aria-label="How complete your profile is" className="border border-border bg-card px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/75">Your profile</p>
        <p className="font-ui text-[13px] font-semibold text-foreground">
          {c.done} of {c.total} added
        </p>
      </div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={c.total}
        aria-valuenow={c.done}
        aria-label={`${c.done} of ${c.total} added`}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-foreground/10"
      >
        <div className="h-full rounded-full bg-[#1d6b43] transition-[width] duration-300" style={{ width: `${c.percent}%` }} />
      </div>
      {missing.length > 0 ? (
        <p className="mt-2 font-ui text-[12.5px] leading-relaxed text-foreground/75">Still to add: {missing.map((m) => m.label.toLowerCase()).join(', ')}.</p>
      ) : (
        <p className="mt-2 font-ui text-[12.5px] text-foreground/75">Everything a profile can have. Send it for review below.</p>
      )}
    </section>
  )
}

export function ViewsPanel({ v }: { v: ViewSummary }) {
  const n = (x: number) => x.toLocaleString('en-US')
  const since = v.since ? new Date(`${v.since}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : null
  return (
    <section aria-labelledby="views-head" className="border-t border-border pt-5">
      <h2 id="views-head" className="font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
        Profile views
      </h2>
      <dl className="mt-2 grid grid-cols-3 gap-3">
        {(
          [
            ['Last 7 days', v.last7],
            ['Last 30 days', v.last30],
            ['Last month', v.lastMonth],
          ] as const
        ).map(([label, x]) => (
          <div key={label}>
            <dt className="font-ui text-[11.5px] font-bold uppercase tracking-[0.08em] text-foreground/65">{label}</dt>
            <dd className="font-news text-[24px] font-semibold leading-tight text-foreground">{n(x)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 font-ui text-[12.5px] leading-relaxed text-muted-foreground">
        People who opened your profile, not search engines or bots, and not you. {since ? `Counted since ${since}.` : 'Counting has started.'}
      </p>
    </section>
  )
}

export function BadgeSnippet({ snippet, imageUrl, words }: { snippet: string; imageUrl: string; words: string }) {
  const [copied, setCopied] = useState(false)
  const box = useRef<HTMLTextAreaElement>(null)
  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      box.current?.select()
    }
  }
  return (
    <section aria-labelledby="badge-head" className="border-t border-border pt-5">
      <h2 id="badge-head" className="font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
        A badge for your own site
      </h2>
      <p className="mt-1.5 font-ui text-[13.5px] leading-relaxed text-foreground/75">It says only that you are listed, and links to your profile.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={words} width={248} height={66} className="mt-3" />
      <label htmlFor="badge-code" className="mt-3 block font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/75">
        HTML to paste
      </label>
      <textarea
        id="badge-code"
        ref={box}
        readOnly
        rows={3}
        value={snippet}
        onFocus={(e) => e.currentTarget.select()}
        className="mt-1 w-full rounded-sm border border-foreground/25 bg-card px-3 py-2 font-mono text-[12.5px] text-foreground"
      />
      <button
        type="button"
        onClick={copy}
        className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-foreground/40 px-3 py-1.5 font-ui text-[12.5px] font-bold uppercase tracking-[0.08em] text-foreground hover:border-foreground"
      >
        {copied && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
        {copied ? 'Copied' : 'Copy the code'}
      </button>
      <span role="status" className="sr-only">
        {copied ? 'Copied to the clipboard' : ''}
      </span>
    </section>
  )
}

/** "Send me FundOps Daily" on the edit page, to the address the session was confirmed from. */
export function NewsletterOffer({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState<string | null>(null)
  async function join() {
    if (state === 'sending') return
    setState('sending')
    try {
      const res = await fetch('/api/directory/newsletter', { method: 'POST' })
      const json = (await res.json().catch(() => ({}))) as { error?: string; newsletter?: string }
      if (!res.ok) {
        setMsg(json.error ?? 'Something went wrong. Please try again.')
        return setState('error')
      }
      setMsg(json.newsletter === 'already' ? `${email} already gets FundOps Daily.` : `Done. FundOps Daily comes to ${email} each weekday morning.`)
      setState('done')
    } catch {
      setMsg('Could not reach FundOpsHQ. Check your connection and try again.')
      setState('error')
    }
  }
  return (
    <section aria-labelledby="nl-head" className="border-t border-border pt-5">
      <h2 id="nl-head" className="font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
        FundOps Daily
      </h2>
      <p className="mt-1.5 font-ui text-[13.5px] leading-relaxed text-foreground/75">
        The morning news brief for GPs, LPs and fund service providers: fund closes, launches and people moves. Free; unsubscribe in one click.
      </p>
      {state === 'done' ? (
        <p role="status" className="mt-3 font-ui text-[13.5px] font-semibold text-foreground">
          {msg}
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={join}
            disabled={state === 'sending'}
            className="mt-3 inline-flex items-center gap-2 rounded-sm border border-foreground/40 px-4 py-2 font-ui text-[12.5px] font-bold uppercase tracking-[0.08em] text-foreground hover:border-foreground disabled:opacity-60"
          >
            {state === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Send it to {email}
          </button>
          {state === 'error' && msg && (
            <p role="alert" className="mt-2 font-ui text-[13px] font-semibold text-[#9b1c1c]">
              {msg}
            </p>
          )}
        </>
      )}
    </section>
  )
}
