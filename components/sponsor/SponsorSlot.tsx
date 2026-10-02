import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSponsorAudience } from '@/lib/sponsor/stats'
import { getSiteSponsorState, SPONSOR_LABEL, type BookedSponsor } from '@/lib/sponsor/bookings'

/**
 * The sponsor slot — and, while nobody has booked it, the house notice:
 * "Your firm here."
 *
 * WHERE IT IS. One strip, directly above the stories, on every news page —
 * in view when the page loads (Danny, 2026-10-02: "in view toward the top of
 * the page… dont have to scroll to see it… doesnt have to be huge"). When a
 * sponsor is booked it also gets a card, second in the right-hand column,
 * with room for its full copy.
 *
 * WHO IS IN IT. The sponsor whose run covers today (lib/sponsor/bookings.ts —
 * the same booking the morning's email carries). With none in force, the
 * strip shows the house notice and the card shows nothing.
 *
 * HOW IT LOOKS. Like a tombstone, the framed announcement the financial pages
 * run when a deal closes — the one ad format this audience grew up reading
 * (Danny, 2026-10-01: "cool and chill and classy but also a little
 * exciting"). An ink rule outside, a hairline inside, an italic serif; and in
 * the house notice a blinking caret after "Your firm here": the name is still
 * to be typed.
 *
 * The audience figure in the house notice is counted, never typed
 * (lib/sponsor/stats.ts; a test holds it to that).
 */
async function audienceLine(): Promise<string> {
  const audience = await getSponsorAudience().catch(() => null)
  const firms = audience?.firms ?? 0
  // Below a couple of dozen firms the number is not the argument; say who reads it instead.
  if (firms >= 24) {
    return `FundOps Daily is read each morning at ${firms.toLocaleString('en-US')} firms: GPs, LPs, and fund service providers.`
  }
  return 'FundOps Daily is the morning brief for GPs, LPs, and fund service providers.'
}

const kickerClass = 'font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400'
const buttonClass =
  'group inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-sm bg-foreground px-3.5 font-ui text-[11.5px] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-foreground/85'

/** What the views need of a sponsor. `sample` draws the mark as an empty box: the mock-up on the sponsor page. */
export type SlotSponsor = Pick<BookedSponsor, 'name' | 'blurb' | 'tagline' | 'ctaUrl' | 'ctaText' | 'logoUrl' | 'logoWidth'> & { sample?: boolean }

/** The sponsor's logo, or its name set as a wordmark. */
function Mark({ sponsor, height }: { sponsor: SlotSponsor; height: number }) {
  if (sponsor.logoUrl) {
    // A sponsor's logo is hosted wherever the sponsor keeps it, so a plain <img>: next/image would need each host configured.
    return <img src={sponsor.logoUrl} alt={sponsor.name} style={{ height, width: 'auto', maxWidth: 220 }} className="block" />
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

/** The strip above the stories: today's sponsor, or the house notice. */
export async function SponsorStrip({ className = '' }: { className?: string }) {
  const [{ sponsor }, line] = await Promise.all([getSiteSponsorState(), audienceLine()])
  return <SponsorStripView sponsor={sponsor} line={line} className={className} />
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

/** The card in the right-hand column: a booked sponsor's full copy. Nothing while the slot is open — the strip above carries the house notice. */
export async function SponsorCard() {
  const { sponsor } = await getSiteSponsorState()
  return sponsor ? <SponsorCardView sponsor={sponsor} /> : null
}
