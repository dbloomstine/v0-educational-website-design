'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, BadgeCheck, X } from 'lucide-react'
import { FirmMark } from '@/components/directory/FirmMark'
import type { RowFirm } from '@/lib/directory/search'
import { facetLabel, yearsIn, type XRow } from '@/lib/directory/explore'
import type { PersonDetail } from '@/lib/directory/explore-detail'
import { DIRECTORY_ABOUT_PATH, practiceLabel } from '@/lib/directory/taxonomy'
import { useModal } from './use-modal'

/**
 * A person, opened from the table (2026-10-24): beside it on a desk (the table stays usable and the panel follows the
 * arrow keys, as the Lead Desk's drawer does), over it on a phone (a dialog: focus held inside, Escape closes, focus
 * goes back to the row).
 *
 * Reaching out: the person's own contact link when they have claimed the profile and set one; otherwise the firm's
 * bio page, which is where a firm publishes its people's contact details. Never an email address or a phone number.
 */

const cache = new Map<string, PersonDetail | 'missing'>()

const OUT = { target: '_blank', rel: 'nofollow noopener noreferrer' } as const

export function PersonPanel({
  row,
  slug,
  trade,
  firm,
  year,
  onClose,
}: {
  row: XRow | null
  slug: string
  trade: { slug: string; plural: string; singular: string; credentialLabel: string }
  firm?: RowFirm
  year: number
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [detail, setDetail] = useState<PersonDetail | 'missing' | null>(() => cache.get(slug) ?? null)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    const m = window.matchMedia('(max-width: 1023px)')
    const on = () => setModal(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    if (cache.has(slug)) {
      setDetail(cache.get(slug)!)
      return
    }
    let gone = false
    fetch(`/api/directory/person?trade=${encodeURIComponent(trade.slug)}&slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : r.status === 404 ? 'missing' : Promise.reject(new Error(String(r.status)))))
      .then((d: PersonDetail | 'missing') => {
        cache.set(slug, d)
        if (!gone) setDetail(d)
      })
      .catch(() => !gone && setDetail('missing'))
    return () => {
      gone = true
    }
  }, [slug, trade.slug])

  // A dialog on a phone; on a desk, focus moves to the panel's heading and Escape closes it.
  useModal(ref, onClose, modal)
  useEffect(() => {
    if (modal) return
    ;(ref.current?.querySelector('h2') as HTMLElement | null)?.focus({ preventScroll: true })
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) onClose()
    }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
    // Focus the heading once per person opened (the component is keyed by slug).
  }, [modal, onClose])

  const d = detail && detail !== 'missing' ? detail : null
  const name = row?.n ?? slug
  const first = name.split(' ')[0]
  const years = row ? yearsIn(row.y, year) : null
  const profile = `/${trade.slug}/people/${slug}`
  const firmHref = firm?.page ? `/${trade.slug}/firms/${firm.slug}` : null

  const facts: [string, React.ReactNode][] = []
  if (row) {
    if (row.p.length)
      facts.push([
        'Practices',
        <ul key="p" className="flex flex-wrap gap-1">
          {[...(row.pp ? [row.pp] : []), ...row.p.filter((x) => x !== row.pp)].map((x) => (
            <li key={x} className={`rounded-sm border px-1.5 py-[1px] font-ui text-[12px] leading-[1.5] ${x === row.pp ? 'border-foreground/60 font-semibold text-foreground' : 'border-foreground/15 bg-foreground/[0.035] text-foreground/80'}`}>
              {practiceLabel(x)}
              {x === row.pp && <span className="sr-only"> (primary)</span>}
            </li>
          ))}
        </ul>,
      ])
    if (years !== null) facts.push(['Experience', `${years} years (since ${row.y})`])
    if (row.cf.length) facts.push(['Client focus', row.cf.map((x) => facetLabel('focus', x)).join(', ')])
    if (row.rp.length) facts.push(['Represents', row.rp.map((x) => facetLabel('side', x)).join(', ')])
  }
  const education = d?.education.length ? d.education : row?.sc.map((school) => ({ school, degree: null, year: null })) ?? []
  if (education.length)
    facts.push([
      'Education',
      <ul key="e" className="space-y-0.5">
        {education.map((e, i) => (
          <li key={i}>
            {e.school}
            {(e.degree || e.year) && <span className="text-foreground/65">{`, ${[e.degree, e.year].filter(Boolean).join(' ')}`}</span>}
          </li>
        ))}
      </ul>,
    ])
  if (row?.pf.length) facts.push(['Prior firms', row.pf.join(', ')])
  if (row?.lg.length) facts.push(['Languages', row.lg.join(', ')])
  if (d?.admissions.length) facts.push([trade.credentialLabel, d.admissions.join(', ')])

  return (
    <>
      {modal && <div className="fixed inset-0 z-[70] bg-[rgba(19,35,58,0.45)]" onClick={onClose} aria-hidden="true" />}
      <div
        ref={ref}
        role="dialog"
        aria-modal={modal || undefined}
        aria-labelledby="xp-panel-name"
        className="paper fixed bottom-0 right-0 top-0 z-[71] flex w-full flex-col border-l border-foreground/25 bg-background shadow-[-12px_0_32px_-18px_rgba(19,35,58,0.5)] sm:w-[440px] max-lg:top-auto max-lg:h-[92dvh] max-lg:rounded-t-[6px] max-lg:border-l-0 max-lg:border-t lg:top-[var(--dir-sticky,42px)]"
      >
        <div className="flex items-start gap-3 border-b border-border bg-[var(--band)] px-4 pb-3 pt-3.5">
          <div className="min-w-0 flex-1">
            {firm && <FirmMark name={firm.name} logo={firm.logo} mono={firm.mono} size="sm" decorative className="mb-2" />}
            <h2 id="xp-panel-name" tabIndex={-1} className="font-news text-[26px] font-medium leading-[1.1] tracking-[-0.01em] text-foreground outline-none">
              {name}
            </h2>
            {row && (
              <p className="mt-1 font-ui text-[14px] leading-snug text-foreground/85">
                {row.t && <>{row.t}, </>}
                {firmHref ? (
                  <Link prefetch={false} href={firmHref} className="font-semibold text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground">
                    {row.f}
                  </Link>
                ) : (
                  <span className="font-semibold text-foreground">{row.f}</span>
                )}
              </p>
            )}
            {row?.o && (
              <p className="mt-0.5 font-ui text-[13px] text-foreground/70">
                {row.o}
                {row.om > 0 && ` and ${row.om} more ${row.om === 1 ? 'office' : 'offices'}`}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="-mr-1.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] text-foreground hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground" aria-label={`Close ${name}`}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4">
          {d?.missing && (
            <p role="note" className="mb-3 border-l-4 border-[#E6B045] bg-card px-3 py-2 font-ui text-[13px] text-foreground/85">
              Not on the firm&rsquo;s site when last checked ({d.missing}). {first} may have left.
            </p>
          )}

          {/* Reaching out. */}
          <section aria-labelledby="xp-reach" className="border-t-2 border-foreground pt-2">
            <h3 id="xp-reach" className="font-ui text-[14px] font-bold text-foreground">
              Reach out
            </h3>
            {d === null && detail === null ? (
              <p className="mt-2 font-ui text-[13px] text-foreground/65">Loading…</p>
            ) : d?.contact ? (
              <>
                <a href={d.contact} {...OUT} className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-[3px] bg-foreground px-3.5 font-ui text-[13.5px] font-semibold text-background hover:bg-foreground/85">
                  Contact {first}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">(opens their own page in a new tab)</span>
                </a>
                <p className="mt-1.5 font-ui text-[12.5px] leading-relaxed text-foreground/70">{first}&rsquo;s own link, added when they claimed this profile.</p>
                {d.source.url && (
                  <a href={d.source.url} {...OUT} className="mt-2 inline-flex items-center gap-1 font-ui text-[13px] font-semibold text-foreground underline underline-offset-2">
                    {d.source.text}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                )}
              </>
            ) : d?.source.url ? (
              <>
                <a href={d.source.url} {...OUT} className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-[3px] bg-foreground px-3.5 font-ui text-[13.5px] font-semibold text-background hover:bg-foreground/85">
                  {d.source.text}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                <p className="mt-1.5 font-ui text-[12.5px] leading-relaxed text-foreground/70">
                  {d.source.fromFirm ? 'The firm’s bio page is where it lists how to reach its people.' : 'The page these facts came from.'} We never publish email addresses or phone numbers.
                </p>
              </>
            ) : (
              <p className="mt-2 font-ui text-[13px] text-foreground/70">No link on file. The full profile has what we know.</p>
            )}
            {d?.headline && <p className="mt-3 font-news text-[16.5px] leading-snug text-foreground">&ldquo;{d.headline}&rdquo;</p>}
          </section>

          {facts.length > 0 && (
            <dl className="mt-5 divide-y divide-border border-y border-border">
              {facts.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 py-2">
                  <dt className="font-ui text-[12.5px] font-semibold text-foreground/70">{k}</dt>
                  <dd className="font-ui text-[13.5px] leading-snug text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <Link prefetch={false} href={profile} className="inline-flex h-10 items-center rounded-[3px] border border-foreground/35 bg-card px-3.5 font-ui text-[13.5px] font-semibold text-foreground hover:border-foreground">
              Open the full profile
            </Link>
            {row?.cl || d?.claimed ? (
              <span className="inline-flex items-center gap-1 font-ui text-[12.5px] font-semibold text-[#1d6b43]">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                Claimed by {first}
              </span>
            ) : (
              <Link prefetch={false} href={`/directory/claim?p=${encodeURIComponent(slug)}`} className="font-ui text-[13px] font-semibold text-foreground underline underline-offset-2">
                Is this you? Claim it, free
              </Link>
            )}
          </div>

          <p className="mt-5 font-ui text-[12px] leading-relaxed text-foreground/65">
            {d?.verified ? (
              <>
                {d.source.label}. Last verified {d.verified} against {d.against}.{' '}
              </>
            ) : null}
            <Link href={DIRECTORY_ABOUT_PATH} className="underline underline-offset-2 hover:text-foreground">
              How we check
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
