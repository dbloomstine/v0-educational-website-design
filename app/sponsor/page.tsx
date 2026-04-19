import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { ArrowRight, Mail, Check, Newspaper } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sponsor FundOps Daily | FundOpsHQ',
  description:
    'Sponsor the morning news brief for GPs, LPs, and fund service providers in private markets. Rate card, audience, and sample newsletter.',
  openGraph: {
    title: 'Sponsor FundOps Daily',
    description:
      'The morning news brief for private markets. Rate card, audience, and sample newsletter.',
    type: 'website',
    url: 'https://fundopshq.com/sponsor',
  },
  alternates: {
    canonical: 'https://fundopshq.com/sponsor',
  },
}

const today = new Date()
  .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  .toUpperCase()

// ─── Audience: reader companies (real, from subscriber DB) ───────────────────

const READER_GROUPS = [
  {
    label: 'GPs & Investors',
    firms: [
      'TPG',
      'Stonepoint',
      'Declaration Partners',
      'Ark PES',
      'ICG Capital',
      'S64 Capital',
      'Alphawave Global',
      'Alpaca VC',
      'Atomic VC',
      'Christofferson Robb',
      'Taproot Capital',
    ],
  },
  {
    label: 'Banks & Capital',
    firms: [
      'JPMorgan',
      'Silicon Valley Bank',
      'First Citizens',
      'Investec',
      'Flagstar',
      'Stifel',
      'Axos Bank',
      'Monex Europe',
      'Bridge Fund Finance',
    ],
  },
  {
    label: 'Law',
    firms: [
      'Kirkland & Ellis',
      'Paul Hastings',
      'King & Spalding',
      'DLA Piper',
      'Walkers',
      'VLP Law Group',
    ],
  },
  {
    label: 'Audit, Tax & Admin',
    firms: ['KPMG', 'Withum', 'RSM', 'IQ-EQ', 'Waystone', 'Centralis', 'Consero Global'],
  },
  {
    label: 'Fund Tech & Data',
    firms: [
      'Carta',
      'Juniper Square',
      'Allvue',
      'Standard Metrics',
      'Maybern',
      'Petra Funds',
      'With Intelligence',
      'Kyriba',
      'Workiva',
    ],
  },
] as const

// ─── Rate card ───────────────────────────────────────────────────────────────

const TIERS = [
  {
    no: '01',
    name: 'Single day',
    cadence: '1 edition',
    price: '$500',
    descriptor: 'Primary sponsor slot on one morning edition.',
    highlights: [
      'Top placement above the fold',
      'Logo, 60-word blurb, CTA link',
      'Good for testing an offer or a launch',
    ],
    accent: false,
  },
  {
    no: '02',
    name: 'One week',
    cadence: '7 editions',
    price: '$2,000',
    descriptor: 'Seven consecutive mornings. Saves $1,500 versus daily.',
    highlights: [
      'Top placement above the fold, every day',
      'Logo, 60-word blurb, CTA link',
      'One read on FundOpsHQ Live that week',
    ],
    accent: true,
  },
  {
    no: '03',
    name: 'One month',
    cadence: '30 editions',
    price: '$6,000',
    descriptor: 'Thirty consecutive mornings. Saves $9,000 versus daily.',
    highlights: [
      'Top placement above the fold, every day',
      'Logo, 60-word blurb, CTA link',
      'Four reads on FundOpsHQ Live',
      'One LinkedIn post from Danny',
    ],
    accent: false,
  },
] as const

// ─── Placement specs ─────────────────────────────────────────────────────────

const SPECS = [
  { label: 'Format', value: 'Hosted PNG logo + up to 60 words of copy + one CTA link' },
  { label: 'Logo', value: 'PNG, ~400–600 px wide, navy-safe (we render on cream)' },
  { label: 'Copy', value: 'You write it. We proofread. No edits without approval.' },
  { label: 'Delivery', value: '48 hours before the first send' },
  { label: 'Exclusivity', value: 'Primary sponsor slot is exclusive for your run' },
  { label: 'Payment', value: 'Invoiced net-15. Wire or card.' },
] as const

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SponsorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* ─── Masthead bar ─── */}
        <div className="border-b border-foreground/10">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
            <span className="flex items-center gap-3">
              <span className="text-foreground/90">Vol. I</span>
              <span aria-hidden="true" className="text-foreground/20">·</span>
              <span>{today}</span>
            </span>
            <span className="flex items-center gap-3">
              <span>Section E</span>
              <span aria-hidden="true" className="text-foreground/20">·</span>
              <span className="text-foreground/80">Sponsor the Paper</span>
            </span>
          </div>
        </div>

        {/* ─── Hero ─── */}
        <section className="relative isolate overflow-hidden border-b-2 border-foreground/15">
          {/* Background editorial wordmark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-12 -bottom-12 flex items-end justify-center select-none"
          >
            <span
              className="font-display italic font-black tracking-[-0.05em] leading-[0.78] whitespace-nowrap"
              style={{
                fontSize: 'clamp(220px, 32vw, 520px)',
                background:
                  'linear-gradient(180deg, oklch(0.98 0 0 / 0.12) 0%, oklch(0.98 0 0 / 0.04) 60%, transparent 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                fontVariationSettings: '"opsz" 144, "SOFT" 100',
              }}
            >
              Sponsor
            </span>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(to right, oklch(0.98 0 0) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.98 0 0) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />

          <div className="relative z-10 container mx-auto px-4 py-16 sm:py-24">
            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                <span className="h-px w-8 bg-foreground/40" />
                Rate Card · FundOps Daily
              </div>

              <h1
                className="font-display text-foreground"
                style={{
                  fontSize: 'clamp(44px, 7vw, 104px)',
                  lineHeight: 0.92,
                  letterSpacing: '-0.035em',
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144, "SOFT" 30',
                }}
              >
                Sponsor the{' '}
                <span
                  className="italic"
                  style={{
                    fontVariationSettings: '"opsz" 144, "SOFT" 100',
                    color: 'oklch(0.85 0.12 85)',
                  }}
                >
                  morning brief
                </span>
                <br />
                for private markets.
              </h1>

              <p className="mt-8 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
                FundOps Daily goes to 98 confirmed readers at GPs, LPs, and fund service providers.
                Ops, finance, IR, legal, and partner-level roles. Seven days a week, before the
                open. New list, narrow audience, real firms.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <a
                  href="mailto:sponsor@fundopshq.com?subject=FundOps%20Daily%20sponsorship"
                  className="group inline-flex items-center gap-2 rounded-sm bg-foreground px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background transition-colors hover:bg-amber-400"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Book a slot
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/newsletter/sample"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-sm border-2 border-foreground/20 bg-card/40 px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-foreground/40 hover:bg-card/70"
                >
                  <Newspaper className="h-4 w-4" />
                  See a sample
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Audience ─── */}
        <section className="relative border-b-2 border-foreground/15 bg-background">
          <div className="border-b border-foreground/10">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="flex items-center gap-3">
                  <span className="text-foreground/80">Section E.1</span>
                  <span aria-hidden="true" className="text-foreground/20">·</span>
                  <span>Audience</span>
                </span>
                <span className="hidden sm:inline">98 readers · 7 days a week</span>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-16 sm:py-20">
            <div className="mb-12 max-w-3xl">
              <h2
                className="font-display text-foreground"
                style={{
                  fontSize: 'clamp(36px, 5vw, 64px)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.03em',
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Small but{' '}
                <span
                  className="italic"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
                >
                  narrow.
                </span>
              </h2>
              <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                98 confirmed subscribers, growing weekly. All inside private markets. No marketers
                forwarding to list-builders, no general finance audience. If your buyer is a GP, LP,
                or fund service provider, this is where they start their day.
              </p>
            </div>

            {/* Quick stats */}
            <div className="mb-12 grid gap-px bg-foreground/10 sm:grid-cols-3 border border-foreground/15">
              {[
                { kpi: '98', label: 'Confirmed subscribers' },
                { kpi: '7×', label: 'Sends per week' },
                { kpi: '60+', label: 'Firms represented' },
              ].map((s) => (
                <div key={s.label} className="bg-background p-8">
                  <div
                    className="font-display text-foreground"
                    style={{
                      fontSize: 'clamp(48px, 6vw, 72px)',
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                      fontWeight: 500,
                      fontVariationSettings: '"opsz" 144',
                    }}
                  >
                    {s.kpi}
                  </div>
                  <div className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/60">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Reader company grid */}
            <div>
              <p className="mb-6 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/60">
                Readers work at firms including
              </p>

              <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                {READER_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
                      {group.label}
                    </p>
                    <ul className="space-y-2">
                      {group.firms.map((firm) => (
                        <li
                          key={firm}
                          className="border-b border-foreground/10 pb-2 text-base text-foreground"
                        >
                          {firm}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/50">
                Partial list. Not an endorsement.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Rate card ─── */}
        <section className="relative border-b-2 border-foreground/15 bg-background">
          <div className="border-b border-foreground/10">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="flex items-center gap-3">
                  <span className="text-foreground/80">Section E.2</span>
                  <span aria-hidden="true" className="text-foreground/20">·</span>
                  <span>Rate Card</span>
                </span>
                <span className="hidden sm:inline">Newsletter sponsorship</span>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-16 sm:py-20">
            <div className="mb-12 max-w-3xl">
              <h2
                className="font-display text-foreground"
                style={{
                  fontSize: 'clamp(36px, 5vw, 64px)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.03em',
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Three{' '}
                <span
                  className="italic"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
                >
                  ways in.
                </span>
              </h2>
              <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                Launch rates. These go up as the list grows. No minimum commitment after the first
                run. Primary sponsor slot is exclusive for your dates.
              </p>
            </div>

            <div className="grid gap-px bg-foreground/10 md:grid-cols-3 border border-foreground/15">
              {TIERS.map((tier) => (
                <div
                  key={tier.no}
                  className={`relative flex flex-col bg-background p-8 ${
                    tier.accent ? 'ring-2 ring-amber-400/60 ring-inset' : ''
                  }`}
                >
                  {tier.accent && (
                    <span className="absolute -top-0.5 left-0 right-0 mx-auto w-fit -translate-y-1/2 bg-amber-400 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-background">
                      Best value
                    </span>
                  )}

                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/60">
                      Tier {tier.no} · {tier.cadence}
                    </span>
                  </div>

                  <h3
                    className="font-display text-foreground"
                    style={{
                      fontSize: '28px',
                      lineHeight: 1.05,
                      letterSpacing: '-0.02em',
                      fontWeight: 500,
                      fontVariationSettings: '"opsz" 60',
                    }}
                  >
                    {tier.name}
                  </h3>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span
                      className="font-display text-foreground"
                      style={{
                        fontSize: '56px',
                        lineHeight: 1,
                        letterSpacing: '-0.03em',
                        fontWeight: 500,
                        fontVariationSettings: '"opsz" 144',
                      }}
                    >
                      {tier.price}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
                      flat
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {tier.descriptor}
                  </p>

                  <ul className="mt-6 space-y-2.5">
                    {tier.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm text-foreground/90">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={`mailto:sponsor@fundopshq.com?subject=FundOps%20Daily%20sponsorship%20%E2%80%94%20${encodeURIComponent(
                      tier.name,
                    )}`}
                    className="mt-8 group inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:text-amber-400"
                  >
                    Book {tier.name.toLowerCase()}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              ))}
            </div>

            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/50">
              Multi-month commitments and custom packages available. Email for quote.
            </p>
          </div>
        </section>

        {/* ─── Placement specs ─── */}
        <section className="relative border-b-2 border-foreground/15 bg-background">
          <div className="border-b border-foreground/10">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="text-foreground/80">Section E.3</span>
                <span aria-hidden="true" className="text-foreground/20">·</span>
                <span>Placement &amp; Delivery</span>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-16 sm:py-20">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <h2
                  className="font-display text-foreground"
                  style={{
                    fontSize: 'clamp(36px, 5vw, 64px)',
                    lineHeight: 0.95,
                    letterSpacing: '-0.03em',
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  What you{' '}
                  <span
                    className="italic"
                    style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
                  >
                    send us.
                  </span>
                </h2>
                <p className="mt-6 max-w-md text-base text-muted-foreground leading-relaxed">
                  Keep it simple. We handle layout, email client compatibility, and QA. You approve
                  the live proof before the first send.
                </p>
              </div>

              <div className="lg:col-span-7">
                <ul>
                  {SPECS.map((spec, i) => (
                    <li
                      key={spec.label}
                      className="grid grid-cols-[auto_1fr] items-baseline gap-6 border-b border-foreground/10 py-5"
                    >
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/50 tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
                          {spec.label}
                        </p>
                        <p className="mt-1 text-base text-foreground/90">{spec.value}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Closing CTA ─── */}
        <section className="relative bg-background">
          <div className="container mx-auto px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                <span className="h-px w-8 bg-foreground/40" />
                Ready to book
                <span className="h-px w-8 bg-foreground/40" />
              </div>
              <h2
                className="font-display text-foreground"
                style={{
                  fontSize: 'clamp(36px, 5vw, 60px)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.03em',
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Say hello to{' '}
                <span
                  className="italic"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
                >
                  Danny.
                </span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                Email{' '}
                <a
                  href="mailto:sponsor@fundopshq.com"
                  className="text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-amber-400"
                >
                  sponsor@fundopshq.com
                </a>{' '}
                with the tier you want and your preferred start date. Answer within the business
                day. If dates are taken we will offer the next available.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="mailto:sponsor@fundopshq.com?subject=FundOps%20Daily%20sponsorship"
                  className="group inline-flex items-center gap-2 rounded-sm bg-foreground px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background transition-colors hover:bg-amber-400"
                >
                  <Mail className="h-3.5 w-3.5" />
                  sponsor@fundopshq.com
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
                <Link
                  href="/newsletter/sample"
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-sm border-2 border-foreground/20 bg-card/40 px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-foreground/40 hover:bg-card/70"
                >
                  <Newspaper className="h-4 w-4" />
                  See a sample
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
