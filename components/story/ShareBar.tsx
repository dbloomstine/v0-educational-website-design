'use client'

import { useState } from 'react'
import { Check, Link2, Mail, Share2 } from 'lucide-react'

const LINKEDIN_PATH =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'

const btn =
  'inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-card px-3 font-ui text-[12.5px] font-semibold text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground'

/**
 * Share a story page. LinkedIn and email first — that is where this audience
 * passes things along — plus copy-link, and the phone's own share sheet when
 * there is one.
 */
export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked (insecure context, permissions): select-and-copy is still possible from the address bar.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d={LINKEDIN_PATH} />
        </svg>
        Share
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}\n\nvia FundOpsHQ`)}`}
        className={btn}
      >
        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
        Email
      </a>
      <button type="button" onClick={copy} className={btn} aria-live="polite">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" /> : <Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
      {canNativeShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title, url }).catch(() => undefined)}
          className={`${btn} sm:hidden`}
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
          More
        </button>
      )}
    </div>
  )
}
