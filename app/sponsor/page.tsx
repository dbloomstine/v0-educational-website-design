import { Metadata } from 'next'
import { ArrowRight, Newspaper } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { SectionFlag } from '@/components/story/StoryBlocks'
import { getSponsorStats, type SponsorStats } from '@/lib/sponsor/stats'
import { fetchBookingRows, getSiteSponsorState } from '@/lib/sponsor/bookings'
import { PACKAGES, openMondays, usd } from '@/lib/sponsor/packages'
import { SponsorBuilder } from '@/components/sponsor/SponsorBuilder'
import { ReaderBeacon } from '@/components/sponsor/ReaderBeacon'

export const metadata: Metadata = {
  title: 'Sponsor FundOps Daily',
  description:
    'Sponsor the morning news brief read by GPs, LPs and fund service providers in private markets. Who reads it, what it costs, and a builder to write your ad, see it as it will run, and book it.',
  openGraph: {
    title: 'Sponsor FundOps Daily',
    description: 'The morning news brief for private markets. Who reads it, what a sponsor gets, and how to book.',
    type: 'website',
    url: 'https://fundopshq.com/sponsor',
  },
  alternates: { canonical: 'https://fundopshq.com/sponsor' },
}

// Rebuilt hourly; the numbers behind it refresh every twelve hours
// (lib/sponsor/stats.ts). No audience figure on this page is typed in. The
// prices are, in one place: lib/sponsor/packages.ts.
export const revalidate = 3600

const MAILTO = 'mailto:sponsor@fundopshq.com?subject=FundOps%20Daily%20sponsorship'

/** What a sponsor gets. `open` is read from the bookings table, never typed. */
function placement(open: string): { label: string; value: string }[] {
  return [
    {
      label: 'Where',
      value:
        'In the email, under the masthead and again at the foot of every edition in your run. On the site, above the stories on every page and in the column beside them.',
    },
    { label: 'What', value: 'Your logo, up to 60 words, and one link. You add them in the builder below and see the ad as it will run; we read it before anything ships.' },
    { label: 'Run', value: 'A full takeover for one week, four weeks or a quarter, starting on a Monday. One sponsor at a time: for your dates, the newsletter and the site are yours alone.' },
    { label: 'Open', value: open },
    { label: 'Report', value: 'Delivery, opens and clicks for the email, at the end of the run.' },
  ]
}

const longDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })

/** "Now." — or the day after the run in force ends. */
function openLine(bookedThrough: string | null): string {
  if (!bookedThrough) return 'Now. The space is open today.'
  const next = new Date(`${bookedThrough}T12:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return `From ${longDate(next.toISOString().slice(0, 10))}. The space is booked through ${longDate(bookedThrough)}.`
}

/** How a booking goes, start to finish. */
const STEPS = [
  { n: '1', title: 'Build it', body: 'Choose a length and a start date, write your ad, add your logo. You see it as it will run while you type.' },
  { n: '2', title: 'We read it', body: 'Every ad is read by the editor before it runs. You have a yes or a no within one business day.' },
  { n: '3', title: 'We invoice you', body: 'Only after a yes. Nothing is charged when you submit, and there is no card to enter.' },
  { n: '4', title: 'It runs', body: 'From your Monday you are the sponsor of all of it: every edition and every news page. It ends by itself, and a short report follows.' },
]

const FAQS = [
  {
    q: 'Do you take any advertiser?',
    a: 'No. A sponsor has to be useful to a GP, an LP or a fund service provider, and every ad is read before it runs. There is one sponsor at a time, so yours never runs beside a competitor.',
  },
  {
    q: 'How and when do we pay?',
    a: 'By invoice, sent once we have said yes. Nothing is charged when you submit and there is no card to enter.',
  },
  {
    q: 'Can we change the copy, or cancel?',
    a: 'Change the copy whenever you like, before or during the run: reply to any of our emails with the new wording. Cancel up to three business days before your start and you owe nothing. Once a run has started it is billed in full, but the copy can still change.',
  },
  {
    q: 'How is the ad marked?',
    a: 'With the words “Presented by” above your name, in the email and on the site, and the links are marked as sponsored for search engines.',
  },
  {
    q: 'What if our firm is in the news that day?',
    a: 'It runs as it would have. Coverage is not traded for sponsorship, and an edition that covers a sponsor says so in its footer.',
  },
  {
    q: 'How far ahead do you need it?',
    a: 'The soonest start is the first Monday at least three days away. The builder only offers dates that are open.',
  },
]

function fmtMonth(iso: string | null): string | null {
  if (!iso) return null
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Only the figures we could actually compute, in the order a sponsor asks about them. */
function figures(s: SponsorStats): { value: string; label: string; note?: string }[] {
  const out: { value: string; label: string; note?: string }[] = []
  if (s.subscribers != null) out.push({ value: s.subscribers.toLocaleString('en-US'), label: 'Confirmed subscribers', note: 'Double opt-in' })
  if (s.openRate != null) out.push({ value: `${s.openRate}%`, label: 'Open rate', note: `Last ${s.editionsMeasured} editions` })
  if (s.weeklyReach != null) out.push({ value: `${s.weeklyReach}%`, label: 'Open at least once a week' })
  if (s.firms != null) out.push({ value: s.firms.toLocaleString('en-US'), label: 'Firms reading' })
  if (s.editionsSent != null) {
    const since = fmtMonth(s.firstEdition)
    out.push({ value: s.editionsSent.toLocaleString('en-US'), label: 'Editions sent', note: since ? `Daily since ${since}` : undefined })
  }
  return out
}

export default async function SponsorPage() {
  const [stats, { bookedThrough }, booked] = await Promise.all([getSponsorStats().catch(() => null), getSiteSponsorState(), fetchBookingRows().catch(() => [])])
  // The Mondays the builder offers: read from the bookings, never typed.
  const openWeeks = openMondays(new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }), booked)
  const from = PACKAGES.reduce((low, p) => Math.min(low, p.priceUsd), Infinity)
  const tiles = stats ? figures(stats) : []
  const asOf = stats
    ? new Date(stats.asOf).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
    : null

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        {/* ─── The pitch ─── */}
        <div className="band">
          <header className="mx-auto max-w-[1000px] px-4 pb-7 pt-7 lg:px-6">
            <p className="font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400">Sponsorship</p>
            <h1 className="mt-2 font-news text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[46px]">
              Sponsor <span className="italic" style={{ color: 'var(--display-accent)' }}>FundOps Daily.</span>
            </h1>
            <p className="mt-3 max-w-[62ch] font-news text-[18px] leading-[1.45] text-foreground/80">
              The morning brief on fund closes, launches, deals and moves across private markets
              {stats?.subscribers != null && (
                <>
                  , read by <strong className="font-bold text-foreground">{stats.subscribers.toLocaleString('en-US')}</strong> people
                </>
              )}{' '}
              at fund managers, their investors, and the law firms, banks, auditors, administrators and software companies
              that serve them. It goes out seven mornings a week, before the open.
            </p>
            <p className="mt-2 max-w-[62ch] font-news text-[18px] leading-[1.45] text-foreground/80">
              Sponsorship is a <strong className="font-bold text-foreground">full takeover</strong>: one sponsor at a time, in every
              edition of the newsletter and on every news page of the site.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="#book"
                className="group inline-flex h-10 items-center gap-2 rounded-sm px-5 font-ui text-[13px] font-extrabold uppercase tracking-[0.06em] transition-[filter] hover:brightness-95"
                style={{ background: 'var(--tab)', color: 'var(--ink)' }}
              >
                Build your ad · from {usd(from)}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
              <a
                href="/newsletter/sample"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-sm border border-foreground/30 bg-card px-5 font-ui text-[13px] font-bold uppercase tracking-[0.06em] text-foreground transition-colors hover:border-foreground"
              >
                <Newspaper className="h-4 w-4" aria-hidden="true" />
                See an edition
              </a>
            </div>
          </header>
        </div>
        <div className="mx-auto max-w-[1000px] px-4 pb-14 pt-1 lg:px-6">
          {/* ─── The numbers, live ─── */}
          {tiles.length > 0 && (
            <section aria-label="Audience figures" className="mt-8">
              <div className="panel">
                <div className="panel-head">
                  <h2 className="font-ui text-[11.5px] font-extrabold uppercase tracking-[0.13em]">The numbers</h2>
                  {asOf && <span className="note whitespace-nowrap font-ui text-[11px]">As of {asOf}</span>}
                </div>
              <dl className="grid grid-cols-2 gap-x-8 px-5 pt-1 sm:grid-cols-3">
                {tiles.map((t) => (
                  <div key={t.label} className="py-3.5">
                    <dd className="font-news text-[38px] font-medium leading-none tracking-[-0.02em] text-foreground">{t.value}</dd>
                    <dt className="mt-1.5 font-ui text-[12.5px] font-semibold text-foreground/85">{t.label}</dt>
                    {t.note && <p className="font-ui text-[11.5px] text-muted-foreground">{t.note}</p>}
                  </div>
                ))}
              </dl>
              </div>
              <p className="mt-2 font-ui text-[11.5px] leading-snug text-muted-foreground">
                Counted automatically from the subscriber list and delivery records, and refreshed twice a day. Opens are as reported by the mail
                platform and include automatic opens by some mail apps.
              </p>
            </section>
          )}

          {/* ─── Who reads it ─── */}
          {stats && stats.readerFirms.length > 0 && (
            <section aria-label="Who reads it" className="mt-10">
              <SectionFlag label="Where it is read" note="Firms with a confirmed subscriber today" />
              <div className="grid gap-x-8 sm:grid-cols-2">
                {stats.readerFirms.map((g) => (
                  <div key={g.group} className="border-b border-border/70 py-3">
                    <h3 className="font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{g.group}</h3>
                    <p className="mt-1 font-news text-[16px] leading-[1.45] text-foreground">{g.firms.join(' · ')}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 font-ui text-[11.5px] leading-snug text-muted-foreground">
                A firm is listed only while someone there is subscribed. Readers are never named or shared.
              </p>
            </section>
          )}

          {/* ─── What a sponsor gets ─── */}
          <section aria-label="What a sponsor gets" className="mt-10">
            <SectionFlag label="What a sponsor gets" />
            <dl>
              {placement(openLine(bookedThrough)).map((p) => (
                <div key={p.label} className="grid gap-x-6 border-b border-border/70 py-2.5 sm:grid-cols-[110px_minmax(0,1fr)]">
                  <dt className="font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:pt-1">{p.label}</dt>
                  <dd className="font-news text-[16px] leading-[1.45] text-foreground">{p.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ─── What it costs ─── */}
          <section aria-label="Rates" className="mt-10">
            <SectionFlag label="What it costs" note="The newsletter and the website, together" />
            <div className="grid gap-3 pt-3 sm:grid-cols-3">
              {PACKAGES.map((p) => (
                <div key={p.id} className="panel px-4 pb-4 pt-3.5">
                  <h3 className="font-ui text-[12px] font-extrabold uppercase tracking-[0.1em] text-foreground">{p.name}</h3>
                  <p className="mt-1.5 font-news text-[40px] font-medium leading-none tracking-[-0.02em] text-foreground">{usd(p.priceUsd)}</p>
                  <p className="mt-1.5 font-ui text-[12px] text-muted-foreground">
                    {p.editions} editions of the newsletter + {p.days} days across the website
                  </p>
                  <p className="mt-2 font-news text-[15.5px] leading-[1.4] text-foreground/85">{p.line}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-ui text-[11.5px] leading-snug text-muted-foreground">
              Flat prices in US dollars. Every length is the full takeover: the top and the foot of each edition, and both places on
              the site, every day of the run. There is no newsletter-only or site-only option, and never a second sponsor.
            </p>
          </section>

          {/* ─── How it works ─── */}
          <section aria-label="How it works" className="mt-10">
            <SectionFlag label="How it works" />
            <ol className="grid gap-x-6 sm:grid-cols-4">
              {STEPS.map((st) => (
                <li key={st.n} className="border-b border-border/70 py-3 sm:border-b-0">
                  <p className="font-news text-[30px] font-medium leading-none text-amber-400">{st.n}</p>
                  <h3 className="mt-1.5 font-ui text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-foreground">{st.title}</h3>
                  <p className="mt-1 font-news text-[15.5px] leading-[1.4] text-foreground/80">{st.body}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* ─── The builder: write it, see it, send it for approval ─── */}
          <section id="book" aria-label="Build your ad" className="mt-10 scroll-mt-16">
            <SectionFlag label="Build your ad" note="The site and the newsletter, drawn as you type" />
            <div className="pt-4">
              <SponsorBuilder openWeeks={openWeeks} taken={booked.map((b) => ({ starts_on: b.starts_on, ends_on: b.ends_on }))} />
            </div>
            <p className="mt-6 font-ui text-[13px] text-foreground/80">
              Rather talk first, or want something that is not here?{' '}
              <a href={MAILTO} className="font-semibold underline underline-offset-2">
                sponsor@fundopshq.com
              </a>
            </p>
          </section>

          {/* ─── Questions ─── */}
          <section aria-label="Questions" className="mt-10">
            <SectionFlag label="Questions" />
            <dl>
              {FAQS.map((f) => (
                <div key={f.q} className="border-b border-border/70 py-3 last:border-0">
                  <dt className="font-news text-[17px] font-bold leading-snug text-foreground">{f.q}</dt>
                  <dd className="mt-1 max-w-[70ch] font-news text-[16px] leading-[1.45] text-foreground/80">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </main>

      <SiteFooter />
      <BackToTop />
      <ReaderBeacon />
    </div>
  )
}
