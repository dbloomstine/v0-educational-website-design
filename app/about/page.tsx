import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { ArrowRight, Linkedin, Youtube, Mail, Newspaper, Radio, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About FundOpsHQ',
  description:
    'FundOpsHQ is a daily news feed, morning newsletter, and weekly live show for fund operators — by Danny Bloomstine.',
  openGraph: {
    title: 'About FundOpsHQ',
    description: 'A daily feed, morning newsletter, and weekly live show for fund operations.',
    type: 'website',
    url: 'https://fundops.com/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About FundOpsHQ',
    description: 'A daily feed, morning newsletter, and weekly live show for fund operations.',
  },
  alternates: {
    canonical: 'https://fundops.com/about',
  },
}

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
}).toUpperCase()

const PILLARS = [
  {
    no: '01',
    eyebrow: 'The Wire',
    title: 'Real-time fund news',
    body:
      'A continuously updated feed of fund launches, capital raises, executive moves, M&A and regulatory actions across PE, VC, credit and alternatives — sourced from 200+ publications.',
    icon: Newspaper,
    href: '/',
    cta: 'Read the wire',
  },
  {
    no: '02',
    eyebrow: 'Morning Edition',
    title: 'FundOps Daily newsletter',
    body:
      'Every morning before the open. The biggest fund moves, the briefing for the week ahead, and what every operator should be paying attention to — written like a newsroom desk note.',
    icon: Mail,
    href: '/#subscribe',
    cta: 'Subscribe free',
  },
  {
    no: '03',
    eyebrow: 'The Broadcast',
    title: 'FundOpsHQ Live',
    body:
      'A weekly live show on YouTube. Two guests from the front lines of fund administration, compliance, tax and operations — plus the week\'s biggest stories.',
    icon: Radio,
    href: '/#show',
    cta: 'Watch the show',
  },
] as const

const COVERAGE = [
  'CFO & Finance',
  'Compliance & Regulatory',
  'Fund Administration',
  'Investor Relations',
  'Tax & K-1 Preparation',
  'Banking & Treasury',
  'Fundraising & Capital',
  'Insurance & Risk',
  'Audit & Reporting',
  'Cybersecurity & IT',
] as const

const FUND_TYPES = [
  'Private Equity',
  'Venture Capital',
  'Private Credit',
  'Hedge Funds',
  'Real Estate',
  'Infrastructure',
  'Secondaries',
  'GP Stakes',
] as const

export default function AboutPage() {
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
              <span>Section C</span>
              <span aria-hidden="true" className="text-foreground/20">·</span>
              <span className="text-foreground/80">About the Paper</span>
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
              About
            </span>
          </div>

          {/* Hairline grid */}
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
                Colophon · About FundOpsHQ
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
                A daily{' '}
                <span
                  className="italic"
                  style={{
                    fontVariationSettings: '"opsz" 144, "SOFT" 100',
                    color: 'oklch(0.85 0.12 85)',
                  }}
                >
                  newsroom
                </span>
                <br />
                for fund operators.
              </h1>

              <p className="mt-8 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
                FundOpsHQ is the news desk, morning briefing, and weekly broadcast for the people running funds —
                covering PE, VC, credit, hedge, real estate and the rest of the alternative investment industry.
                Built and edited by <span className="text-foreground font-medium">Danny Bloomstine</span>.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Three pillars ─── */}
        <section className="relative border-b-2 border-foreground/15 bg-background">
          <div className="border-b border-foreground/10">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="flex items-center gap-3">
                  <span className="text-foreground/80">Section C.1</span>
                  <span aria-hidden="true" className="text-foreground/20">·</span>
                  <span>Three Channels</span>
                </span>
                <span className="hidden sm:inline">News · Newsletter · Show</span>
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
                Three ways{' '}
                <span
                  className="italic"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
                >
                  to read it.
                </span>
              </h2>
            </div>

            <div className="grid gap-px bg-foreground/10 md:grid-cols-3 border border-foreground/15">
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon
                return (
                  <Link
                    key={pillar.no}
                    href={pillar.href}
                    className="group relative flex flex-col bg-background p-8 transition-colors hover:bg-card/40"
                  >
                    <div className="mb-6 flex items-start justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/60">
                        No. {pillar.no} · {pillar.eyebrow}
                      </span>
                      <Icon className="h-5 w-5 text-muted-foreground/50 transition-colors group-hover:text-amber-400" />
                    </div>

                    <h3
                      className="font-display text-foreground mb-4"
                      style={{
                        fontSize: '30px',
                        lineHeight: 1.05,
                        letterSpacing: '-0.02em',
                        fontWeight: 500,
                        fontVariationSettings: '"opsz" 60',
                      }}
                    >
                      {pillar.title}
                    </h3>

                    <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
                      {pillar.body}
                    </p>

                    <div className="mt-auto flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors group-hover:text-amber-400">
                      {pillar.cta}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── Editor (Danny bio) ─── */}
        <section className="relative border-b-2 border-foreground/15 bg-background">
          <div className="border-b border-foreground/10">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="text-foreground/80">Section C.2</span>
                <span aria-hidden="true" className="text-foreground/20">·</span>
                <span>The Editor</span>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-16 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
              {/* Left column: Headshot card */}
              <div className="lg:col-span-4">
                <div className="relative">
                  <div className="relative overflow-hidden rounded-sm border-2 border-foreground/15 bg-card/60 p-3">
                    <div className="relative aspect-square">
                      <Image
                        src="/danny-headshot-nobg.png"
                        alt="Danny Bloomstine"
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 30vw"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-foreground/10 pt-3">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                        Editor
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/40">
                        Plate №01
                      </span>
                    </div>
                  </div>
                  {/* Corner ticks */}
                  <div className="pointer-events-none absolute -top-1 -left-1 h-3 w-3 border-l-2 border-t-2 border-amber-400/40" />
                  <div className="pointer-events-none absolute -top-1 -right-1 h-3 w-3 border-r-2 border-t-2 border-amber-400/40" />
                  <div className="pointer-events-none absolute -bottom-1 -left-1 h-3 w-3 border-l-2 border-b-2 border-amber-400/40" />
                  <div className="pointer-events-none absolute -bottom-1 -right-1 h-3 w-3 border-r-2 border-b-2 border-amber-400/40" />
                </div>
              </div>

              {/* Right column: Bio */}
              <div className="lg:col-span-8">
                <div className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                  <span className="h-px w-8 bg-foreground/40" />
                  Editor &amp; Founder
                </div>

                <h2
                  className="font-display text-foreground"
                  style={{
                    fontSize: 'clamp(40px, 5.5vw, 76px)',
                    lineHeight: 0.92,
                    letterSpacing: '-0.035em',
                    fontWeight: 500,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  Danny{' '}
                  <span
                    className="italic"
                    style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
                  >
                    Bloomstine.
                  </span>
                </h2>

                <div className="mt-6 space-y-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                  <p>
                    Danny is a Managing Director at IQ-EQ, where he helps investment managers evaluate and implement
                    fund administration, compliance, tax and CFO solutions.
                  </p>
                  <p>
                    Over the past decade he&apos;s worked at the intersection of capital markets, technology and fund
                    operations — beginning at S&amp;P Capital IQ, joining VTS as an early employee, growing business
                    development at Juniper Square, and now at IQ-EQ helping firms make operational decisions.
                  </p>
                  <p>
                    He started FundOpsHQ to bring more visibility to the operational side of the industry — through
                    real-time news, a daily briefing, and conversations with the people doing the work.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href="https://www.linkedin.com/in/danny-bloomstine/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-sm border-2 border-foreground/20 bg-card/40 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-foreground/40 hover:bg-card/70"
                  >
                    <Linkedin className="h-4 w-4" />
                    Connect on LinkedIn
                  </a>
                  <a
                    href="https://www.youtube.com/@dbloomstine/streams"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-sm bg-red-600 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-red-500"
                  >
                    <Youtube className="h-4 w-4" />
                    Watch the show
                  </a>
                  <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                    <Building2 className="h-3.5 w-3.5" />
                    MD at IQ-EQ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Coverage ─── */}
        <section className="relative border-b-2 border-foreground/15 bg-background">
          <div className="border-b border-foreground/10">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                <span className="text-foreground/80">Section C.3</span>
                <span aria-hidden="true" className="text-foreground/20">·</span>
                <span>Coverage</span>
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
                  What we{' '}
                  <span
                    className="italic"
                    style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
                  >
                    cover.
                  </span>
                </h2>
                <p className="mt-6 max-w-md text-base text-muted-foreground leading-relaxed">
                  Across every major alternative asset class and every operational function. From the back office to
                  the C-suite, from launch to wind-down.
                </p>
              </div>

              <div className="lg:col-span-7 grid gap-10 sm:grid-cols-2">
                <div>
                  <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/60">
                    Fund types
                  </p>
                  <ul className="space-y-2.5">
                    {FUND_TYPES.map((type) => (
                      <li
                        key={type}
                        className="flex items-baseline gap-3 border-b border-foreground/10 pb-2.5 text-base text-foreground"
                      >
                        <span className="font-mono text-[10px] text-muted-foreground/40 tabular-nums">
                          {String(FUND_TYPES.indexOf(type) + 1).padStart(2, '0')}
                        </span>
                        <span>{type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/60">
                    Operational areas
                  </p>
                  <ul className="space-y-2.5">
                    {COVERAGE.map((area, i) => (
                      <li
                        key={area}
                        className="flex items-baseline gap-3 border-b border-foreground/10 pb-2.5 text-base text-foreground"
                      >
                        <span className="font-mono text-[10px] text-muted-foreground/40 tabular-nums">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
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
                Get the paper
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
                Read it{' '}
                <span
                  className="italic"
                  style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
                >
                  every morning.
                </span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                The FundOps Daily newsletter lands in your inbox before the open. The wire updates continuously. The
                show streams weekly.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/#subscribe"
                  className="group inline-flex items-center gap-2 rounded-sm bg-foreground px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-background transition-colors hover:bg-amber-400"
                >
                  Subscribe to FundOps Daily
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-sm border-2 border-foreground/20 bg-card/40 px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-foreground/40 hover:bg-card/70"
                >
                  Read the wire
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
