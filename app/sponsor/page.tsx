import { Metadata } from 'next'
import { ArrowRight, Mail, Newspaper } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { SectionFlag } from '@/components/story/StoryBlocks'
import { getSponsorStats, type SponsorStats } from '@/lib/sponsor/stats'

export const metadata: Metadata = {
  title: 'Sponsor FundOps Daily',
  description:
    'Sponsor the morning news brief read by GPs, LPs and fund service providers in private markets. Who reads it, what a sponsor gets, and how to book.',
  openGraph: {
    title: 'Sponsor FundOps Daily',
    description: 'The morning news brief for private markets. Who reads it, what a sponsor gets, and how to book.',
    type: 'website',
    url: 'https://fundopshq.com/sponsor',
  },
  alternates: { canonical: 'https://fundopshq.com/sponsor' },
}

// Rebuilt hourly; the numbers behind it refresh every twelve hours
// (lib/sponsor/stats.ts). Nothing on this page is a typed-in figure.
export const revalidate = 3600

const MAILTO = 'mailto:sponsor@fundopshq.com?subject=FundOps%20Daily%20sponsorship'

const PLACEMENT = [
  { label: 'Where', value: 'A sponsor card at the top and at the bottom of every edition in your run.' },
  { label: 'What', value: 'Your logo, up to 60 words, and one link. You write it; we proof it and send you a preview before anything ships.' },
  { label: 'Run', value: 'By the week, the month or the quarter. The slate is shared with at most four other sponsors.' },
  { label: 'Report', value: 'Delivery, opens and clicks at the end of the run.' },
]

const FAQS = [
  {
    q: 'Do you take any advertiser?',
    a: 'No. A sponsor has to be useful to a GP, an LP or a fund service provider. We also turn down a direct competitor of a sponsor already booked for the same dates.',
  },
  {
    q: 'What if our firm is in the news that day?',
    a: 'It runs as it would have. Coverage is not traded for sponsorship, and an edition that covers a sponsor says so in its footer.',
  },
  {
    q: 'How far ahead do you need the creative?',
    a: '48 hours before the first send: a PNG logo, your copy, and the link.',
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
  const stats = await getSponsorStats().catch(() => null)
  const tiles = stats ? figures(stats) : []
  const asOf = stats
    ? new Date(stats.asOf).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
    : null

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="mx-auto max-w-[1000px] px-4 pb-14 pt-7 lg:px-6">
          {/* ─── The pitch ─── */}
          <header className="border-b border-border pb-7">
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
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={MAILTO}
                className="group inline-flex h-10 items-center gap-2 rounded-sm bg-foreground px-5 font-ui text-[13px] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-foreground/85"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email about sponsoring
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

          {/* ─── The numbers, live ─── */}
          {tiles.length > 0 && (
            <section aria-label="Audience figures" className="mt-8">
              <SectionFlag label="The numbers" note={asOf ? `As of ${asOf}` : undefined} />
              <dl className="grid grid-cols-2 gap-x-8 sm:grid-cols-3">
                {tiles.map((t) => (
                  <div key={t.label} className="border-b border-border/70 py-3.5">
                    <dd className="font-news text-[38px] font-medium leading-none tracking-[-0.02em] text-foreground">{t.value}</dd>
                    <dt className="mt-1.5 font-ui text-[12.5px] font-semibold text-foreground/85">{t.label}</dt>
                    {t.note && <p className="font-ui text-[11.5px] text-muted-foreground">{t.note}</p>}
                  </div>
                ))}
              </dl>
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
              {PLACEMENT.map((p) => (
                <div key={p.label} className="grid gap-x-6 border-b border-border/70 py-2.5 sm:grid-cols-[110px_minmax(0,1fr)]">
                  <dt className="font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:pt-1">{p.label}</dt>
                  <dd className="font-news text-[16px] leading-[1.45] text-foreground">{p.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ─── Rates: by conversation ─── */}
          <section aria-label="Rates" className="mt-10 border-y-2 border-foreground py-5">
            <h2 className="font-news text-[26px] font-medium leading-tight tracking-[-0.01em] text-foreground">Rates and open dates</h2>
            <p className="mt-2 max-w-[62ch] font-news text-[16.5px] leading-[1.45] text-foreground/80">
              Sponsorship is booked by the week, the month or the quarter. The list is young and growing, so rates are
              quoted for the dates you want rather than printed here. Tell us what you are promoting and when, and you
              will have a rate and the open dates within one business day.
            </p>
            <a
              href={MAILTO}
              className="mt-3 inline-flex items-center gap-1.5 font-ui text-[14px] font-bold text-foreground underline underline-offset-4 hover:no-underline"
            >
              sponsor@fundopshq.com
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
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
    </div>
  )
}
