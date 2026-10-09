import { getSponsorAudience } from '@/lib/sponsor/stats'
import { getSiteSponsorState } from '@/lib/sponsor/bookings'
import { SponsorCardView, SponsorStripView } from './SponsorViews'

// The two views are drawn in ./SponsorViews (no database there, so the builder on /sponsor can use them too).
export { SponsorCardView, SponsorStripView, type SlotSponsor } from './SponsorViews'

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

/** The strip above the stories: today's sponsor, or the house notice. */
export async function SponsorStrip({ className = '' }: { className?: string }) {
  const [{ sponsor }, line] = await Promise.all([getSiteSponsorState(), audienceLine()])
  return <SponsorStripView sponsor={sponsor} line={line} className={className} />
}

/** The card in the right-hand column: a booked sponsor's full copy. Nothing while the slot is open — the strip above carries the house notice. */
export async function SponsorCard() {
  const { sponsor } = await getSiteSponsorState()
  return sponsor ? <SponsorCardView sponsor={sponsor} /> : null
}
