import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { ArrowRight, Mail, Check, Newspaper, Download } from 'lucide-react'

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
    name: 'One week',
    cadence: '7 editions',
    price: '$500',
    perEdition: '$71 / edition',
    descriptor: 'Seven consecutive mornings. Good for testing a launch or an offer.',
    highlights: [
      'Logo + 60 words + CTA link, top AND bottom of every edition',
      'Shared slate (max 5 sponsors) — you pick your preferred dates',
      'Weekly delivery + open report',
    ],
    accent: false,
  },
  {
    no: '02',
    name: 'One month',
    cadence: '30 editions',
    price: '$1,500',
    perEdition: '$50 / edition',
    descriptor: 'Thirty consecutive mornings. Saves $500 vs. weekly.',
    highlights: [
      'Logo + 60 words + CTA link, top AND bottom of every edition',
      'Shared slate (max 5 sponsors) — locked dates',
      'Monthly delivery + open report, swap creative with 48h notice',
    ],
    accent: true,
  },
  {
    no: '03',
    name: 'One quarter',
    cadence: '90 editions',
    price: '$4,000',
    perEdition: '$44 / edition',
    descriptor: 'Ninety consecutive mornings. Saves $2,000 vs. monthly.',
    highlights: [
      'Logo + 60 words + CTA link, top AND bottom of every edition',
      'Shared slate (max 5 sponsors) — locked dates',
      'Monthly delivery + open report, rotate up to three creatives',
    ],
    accent: false,
  },
] as const

// ─── Placement specs ─────────────────────────────────────────────────────────

const SPECS = [
  { label: 'Placement', value: 'Top AND bottom of every edition. Same slot, every day of your run.' },
  { label: 'Format', value: 'Hosted PNG logo + up to 60 words of copy + one CTA link' },
  { label: 'Logo', value: 'PNG, ~400–600 px wide, navy-safe (we render on cream)' },
  { label: 'Copy', value: 'You write it. We proofread. No edits without approval.' },
  { label: 'Slate', value: 'Shared — up to five sponsors per edition. No single-sponsor exclusivity.' },
  { label: 'Delivery', value: '48 hours before the first send' },
  { label: 'Payment', value: 'Invoiced net-15. Wire or card.' },
] as const

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'How many sponsors are in each edition?',
    a: 'Up to five. You share the slate with up to four other sponsors at the top AND bottom of the newsletter. Every card gets the same treatment — logo, 60 words, and a CTA.',
  },
  {
    q: 'Is there an exclusive / single-sponsor option?',
    a: 'Not right now. Keeping the slate shared lets the launch rates stay this low. If your firm needs solo placement, email us and we will quote it separately.',
  },
  {
    q: 'Can I swap creative mid-run?',
    a: 'Yes. One free swap on weekly, unlimited swaps on monthly and quarterly with 48 hours notice. No charge to update copy, logo, or CTA link.',
  },
  {
    q: 'What reporting do I get?',
    a: 'A delivery and open-rate report after each cycle (weekly, monthly, or monthly-of-quarter). Raw CSV available on request.',
  },
  {
    q: 'Do you accept any advertiser?',
    a: 'We say no to anything off-topic for GPs, LPs, or fund service providers. No retail crypto, no gambling, no generic B2B. We also decline competitors to existing sponsors for the run.',
  },
  {
    q: 'What if my firm is mentioned in the news that day?',
    a: 'We disclose the sponsorship in the footer of that edition. Editorial stays editorial — coverage is not traded for ad dollars and never will be.',
  },
  {
    q: 'When do I need to get creative in?',
    a: '48 hours before your first send. Send us a PNG logo (400–600 px wide), up to 60 words of copy, and one CTA URL. We lay it out and send a proof for approval.',
  },
  {
    q: 'Can I cancel?',
    a: 'Weekly runs are non-refundable once creative is approved. Monthly and quarterly runs can be cancelled at the cycle boundary — email us and we will prorate the remaining cycle if it has not yet started.',
  },
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
                <a
                  href="/sponsor-fundops-daily.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-sm border-2 border-foreground/20 bg-card/40 px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-foreground/40 hover:bg-card/70"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
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
            <div className="mb-12 grid gap-px bg-foreground/10 sm:grid-cols-2 lg:grid-cols-4 border border-foreground/15">
              {[
                { kpi: '98', label: 'Confirmed subscribers' },
                { kpi: '56%', label: '7-day open rate' },
                { kpi: '15%', label: '7-day click rate' },
                { kpi: '7×', label: 'Sends per week' },
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

        {/* ─── Reader note (testimonial) ─── */}
        <section className="relative border-b-2 border-foreground/15 bg-card/30">
          <div className="border-b border-foreground/10">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="text-foreground/80">Section E.2</span>
                <span aria-hidden="true" className="text-foreground/20">·</span>
                <span>Reader Note</span>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-16 sm:py-20">
            <figure className="mx-auto max-w-3xl">
              <div className="mb-6 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">
                Unsolicited · April 2026
              </div>
              <blockquote
                className="font-display italic text-foreground"
                style={{
                  fontSize: 'clamp(28px, 3.8vw, 44px)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  fontWeight: 500,
                  fontVariationSettings: '"opsz" 144, "SOFT" 100',
                }}
              >
                &ldquo;I&rsquo;ve enjoyed the newsletter. It&rsquo;s a great aggregated news space
                relevant for us. You&rsquo;re doing great with it, and it&rsquo;s been valuable to
                people like me and our teams.&rdquo;
              </blockquote>
              <figcaption className="mt-8 border-t border-foreground/10 pt-6">
                <p className="font-display text-lg text-foreground" style={{ fontVariationSettings: '"opsz" 60', fontWeight: 500 }}>
                  Paul Pisani
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Senior Director, Alternative Investments &middot; KPMG LLP
                </p>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ─── Rate card ─── */}
        <section className="relative border-b-2 border-foreground/15 bg-background">
          <div className="border-b border-foreground/10">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="flex items-center gap-3">
                  <span className="text-foreground/80">Section E.3</span>
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
                Launch rates. These go up as the list grows. One card at the top AND one at the
                bottom of every edition. Shared slate, up to five sponsors per send.
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
                      {tier.perEdition}
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
              Half-year and year-long packages available. Email for quote.
            </p>
          </div>
        </section>

        {/* ─── Placement specs ─── */}
        <section className="relative border-b-2 border-foreground/15 bg-background">
          <div className="border-b border-foreground/10">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="text-foreground/80">Section E.4</span>
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

        {/* ─── FAQ ─── */}
        <section className="relative border-b-2 border-foreground/15 bg-background">
          <div className="border-b border-foreground/10">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="text-foreground/80">Section E.5</span>
                <span aria-hidden="true" className="text-foreground/20">·</span>
                <span>Frequently Asked</span>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-16 sm:py-20">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
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
                  Common{' '}
                  <span
                    className="italic"
                    style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
                  >
                    questions.
                  </span>
                </h2>
                <p className="mt-6 text-base text-muted-foreground leading-relaxed">
                  If something&rsquo;s not answered here, email{' '}
                  <a
                    href="mailto:sponsor@fundopshq.com"
                    className="text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-amber-400"
                  >
                    sponsor@fundopshq.com
                  </a>{' '}
                  and we&rsquo;ll reply within the business day.
                </p>
              </div>

              <div className="lg:col-span-8">
                <dl>
                  {FAQS.map((f, i) => (
                    <div
                      key={f.q}
                      className="grid grid-cols-[auto_1fr] items-baseline gap-6 border-b border-foreground/10 py-6"
                    >
                      <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/50 tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </dt>
                      <div>
                        <p className="font-display text-lg text-foreground" style={{ fontVariationSettings: '"opsz" 60', fontWeight: 500, letterSpacing: '-0.01em' }}>
                          {f.q}
                        </p>
                        <dd className="mt-2 text-base text-muted-foreground leading-relaxed">
                          {f.a}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
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
