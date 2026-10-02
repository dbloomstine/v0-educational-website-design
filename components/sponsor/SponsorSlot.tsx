import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSponsorAudience } from '@/lib/sponsor/stats'

/**
 * The house ad: "Your firm here."
 *
 * Danny, 2026-10-01: "add like a 'your ad here' type thing but make it cool
 * and chill and classy but also a little exciting." It is set like a
 * tombstone — the framed announcement the financial pages have always run
 * when a deal closes — because that is the one ad format this audience grew
 * up reading. The frame, the centred serif and the closing line are the
 * tombstone's; the blinking caret after "Your firm here" is the only thing
 * on the site that moves, and it says the name is still to be typed.
 *
 * The audience figure follows the sponsor-page rule: counted, never typed
 * (lib/sponsor/stats.ts). If the count is unavailable the sentence does
 * without it.
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

const KICKER = 'Space available'
const HEADLINE = 'Your firm here'
const CTA = 'Sponsor FundOps Daily'
/** The line every tombstone ends on. */
const OF_RECORD = 'This announcement appears as a matter of record only.'

function Headline({ className }: { className: string }) {
  return (
    <p className={className}>
      {HEADLINE}
      <span className="caret" aria-hidden="true" />
    </p>
  )
}

function Cta() {
  return (
    <Link
      href="/sponsor"
      className="group inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-sm bg-foreground px-4 font-ui text-[12px] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-foreground/85"
    >
      {CTA}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

/** The rail version: a framed card, centred, the way a tombstone sits on a page. */
export async function SponsorCard() {
  const line = await audienceLine()
  return (
    <section aria-label="Sponsor FundOps Daily" className="sponsor-slot">
      <div className="sponsor-frame px-4 pb-3.5 pt-4 text-center">
        <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">{KICKER}</p>
        <Headline className="mt-2 font-news text-[30px] font-medium italic leading-none tracking-[-0.015em] text-foreground" />
        <p className="mx-auto mt-2.5 max-w-[30ch] text-balance font-news text-[15px] leading-[1.4] text-foreground/75">{line}</p>
        <div className="mt-3.5">
          <Cta />
        </div>
        <p className="mt-3.5 text-balance border-t border-border pt-2 font-ui text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{OF_RECORD}</p>
      </div>
    </section>
  )
}

/** The in-column version, for the front page: the same announcement on one line. */
export async function SponsorStrip({ className = '' }: { className?: string }) {
  const line = await audienceLine()
  return (
    <section aria-label="Sponsor FundOps Daily" className={`sponsor-slot ${className}`}>
      <div className="sponsor-frame">
        <div className="flex flex-col gap-x-7 gap-y-3 px-5 pb-3.5 pt-4 sm:flex-row sm:items-center">
          <div className="shrink-0">
            <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">{KICKER}</p>
            <Headline className="mt-1.5 font-news text-[30px] font-medium italic leading-none tracking-[-0.015em] text-foreground" />
          </div>
          <p className="min-w-0 flex-1 font-news text-[15.5px] leading-[1.4] text-foreground/75 sm:border-l sm:border-border sm:pl-7">{line}</p>
          <Cta />
        </div>
        <p className="border-t border-border px-5 py-1.5 text-center font-ui text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{OF_RECORD}</p>
      </div>
    </section>
  )
}
