import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SPONSOR_LABEL } from '@/lib/sponsor/label'
import type { BookedSponsor } from '@/lib/sponsor/bookings'

/**
 * How a sponsor is drawn on the site: the strip above the stories and the
 * card beside them. Nothing here reads the database, so the same two
 * components serve the live pages (components/sponsor/SponsorSlot.tsx) and
 * the builder on /sponsor, where a prospect watches their own ad take shape
 * (components/sponsor/SponsorBuilder.tsx).
 */

const kickerClass = 'font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400'
const buttonClass =
  'group inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-sm bg-foreground px-3.5 font-ui text-[11.5px] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-foreground/85'

/** What the views need of a sponsor. `sample` draws the mark as an empty box: the mock-up on the sponsor page. */
export type SlotSponsor = Pick<BookedSponsor, 'name' | 'blurb' | 'tagline' | 'ctaUrl' | 'ctaText' | 'logoUrl' | 'logoWidth'> & { sample?: boolean }

/** The sponsor's logo, or its name set as a wordmark. */
function Mark({ sponsor, height }: { sponsor: SlotSponsor; height: number }) {
  if (sponsor.logoUrl) {
    // A square mark set at a wordmark's height is a speck. `logoWidth` is the email's width for the logo, worked out from
    // its shape (lib/sponsor/packages.ts emailLogoWidth): at the bottom of its range the logo is near square, and gets more height here.
    if (sponsor.logoWidth != null && sponsor.logoWidth <= 80) height = Math.round(height * 1.45)
    // A plain <img>: next/image would need each host configured. `contain` keeps a very wide logo's shape when the width limit bites.
    return <img src={sponsor.logoUrl} alt={sponsor.name} style={{ height, width: 'auto', maxWidth: 220, objectFit: 'contain' }} className="block" />
  }
  return (
    <span
      className={
        sponsor.sample
          ? 'inline-block border border-dashed border-foreground/40 px-3 py-1 font-news text-[15px] font-bold uppercase tracking-[0.06em] text-foreground/60'
          : 'font-news font-bold leading-none tracking-[-0.01em] text-foreground'
      }
      style={sponsor.sample ? undefined : { fontSize: Math.round(height * 0.82) }}
    >
      {sponsor.name}
    </span>
  )
}

/** A paid link says so to search engines, and never passes the reader's origin on. */
const SPONSORED_REL = 'sponsored noopener noreferrer'

// ─── The strip ──────────────────────────────────────────────────────────────

export function SponsorStripView({ sponsor, line, className = '' }: { sponsor: SlotSponsor | null; line: string; className?: string }) {
  if (sponsor) {
    return (
      <section aria-label={`Sponsor: ${sponsor.name}`} className={`sponsor-slot ${className}`}>
        <div className="sponsor-frame flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
          <a href={sponsor.ctaUrl} target="_blank" rel={SPONSORED_REL} className="flex shrink-0 items-center gap-x-3">
            <span className={kickerClass}>{SPONSOR_LABEL}</span>
            <Mark sponsor={sponsor} height={26} />
          </a>
          <p className="hidden min-w-0 flex-1 font-news text-[15px] leading-[1.35] text-foreground/80 md:line-clamp-2 md:border-l md:border-border md:pl-5">
            {sponsor.tagline ?? sponsor.blurb}
          </p>
          <a href={sponsor.ctaUrl} target="_blank" rel={SPONSORED_REL} className={`${buttonClass} ml-auto`}>
            {sponsor.ctaText ?? 'Learn more'}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </div>
      </section>
    )
  }
  return (
    <section aria-label="Sponsor FundOps Daily" className={`sponsor-slot ${className}`}>
      <div className="sponsor-frame flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
        <p className="flex shrink-0 flex-wrap items-baseline gap-x-3">
          <span className={kickerClass}>Space available</span>
          <span className="font-news text-[23px] font-medium italic leading-none tracking-[-0.015em] text-foreground">
            Your firm here
            <span className="caret" aria-hidden="true" />
          </span>
        </p>
        <p className="hidden min-w-0 flex-1 font-news text-[15px] leading-[1.35] text-foreground/75 md:block md:border-l md:border-border md:pl-5">{line}</p>
        <Link href="/sponsor" className={`${buttonClass} ml-auto`}>
          Sponsor FundOps Daily
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

// ─── The card ───────────────────────────────────────────────────────────────

export function SponsorCardView({ sponsor }: { sponsor: SlotSponsor }) {
  return (
    <section aria-label={`Sponsor: ${sponsor.name}`} className="sponsor-slot">
      <div className="sponsor-frame px-4 pb-3.5 pt-3.5">
        <p className={kickerClass}>{SPONSOR_LABEL}</p>
        <a href={sponsor.ctaUrl} target="_blank" rel={SPONSORED_REL} className="mt-2 inline-block">
          <Mark sponsor={sponsor} height={30} />
        </a>
        <p className="mt-2 font-news text-[15px] leading-[1.42] text-foreground/85">{sponsor.blurb}</p>
        <a href={sponsor.ctaUrl} target="_blank" rel={SPONSORED_REL} className={`${buttonClass} mt-3`}>
          {sponsor.ctaText ?? 'Learn more'}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
