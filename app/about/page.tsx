import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { ArrowRight, Linkedin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About FundOpsHQ',
  description:
    'FundOpsHQ is the hub for the investment funds industry — real-time fund news, the verified industry events calendar, and the FundOps Daily morning newsletter. By Danny Bloomstine.',
  openGraph: {
    title: 'About FundOpsHQ',
    description:
      'The hub for the investment funds industry — fund news, the industry events calendar, and the FundOps Daily morning newsletter.',
    type: 'website',
    url: 'https://fundopshq.com/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About FundOpsHQ',
    description:
      'The hub for the investment funds industry — fund news, the industry events calendar, and the FundOps Daily morning newsletter.',
  },
  alternates: {
    canonical: 'https://fundopshq.com/about',
  },
}

// Rewritten 2026-08-30 (Danny: "way trimmed down and much more professional
// and concise"). The previous version ran ~525 lines across four numbered
// "Section C.x" acts with icon cards, a plate-numbered editor portrait and two
// tag clouds. This says the same things in a fraction of the space, following
// the density doctrine the rest of the site now uses.

const CHANNELS = [
  {
    href: '/news',
    name: 'News',
    body: 'Fund launches, closes, LP commitments, executive moves, M&A and regulatory actions — tracked across 200+ publications and de-duplicated into single stories.',
  },
  {
    href: '/events',
    name: 'Events',
    body: 'Conferences, forums, training and free webinars across North America. Filterable by city, topic and date, with every date verified at the organizer rather than copied from an aggregator.',
  },
  {
    href: '/#subscribe',
    name: 'FundOps Daily',
    body: 'One email before the open: the morning’s headlines by strategy, then the next two weeks of events grouped by day. Free.',
  },
] as const

const FUND_TYPES =
  'Private Equity · Venture Capital · Private Credit · Hedge Funds · Real Estate · Infrastructure · Secondaries · GP Stakes'

const STORY_TYPES =
  'Fund launches · First and final closes · Capital raises · LP commitments · Executive moves · M&A and take-privates · Regulatory actions · Service provider moves'

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Section masthead — same furniture as /news and /events */}
        <div className="border-t-2 border-foreground/15 border-b border-foreground/10">
          <div className="container mx-auto max-w-[1400px] px-4">
            <div className="flex items-center justify-between gap-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              <span className="flex items-center gap-3 whitespace-nowrap">
                <span className="text-foreground/80">Section C</span>
                <span aria-hidden="true" className="text-foreground/20">·</span>
                <span>About</span>
              </span>
              <span className="whitespace-nowrap text-amber-400/90">Est. 2026 · New York</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-[900px] px-4 py-6 sm:py-8">
          <h1
            className="font-display text-foreground"
            style={{
              fontSize: 'clamp(24px, 3.4vw, 38px)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144',
            }}
          >
            A daily newsroom for{' '}
            <span
              className="italic"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'oklch(0.85 0.12 85)' }}
            >
              private markets.
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            FundOpsHQ is the news desk, events calendar and morning briefing for GPs, LPs and the
            fund service providers working around them — across private equity, venture, credit,
            hedge, real estate and the rest of alternatives. Written and edited by{' '}
            <span className="font-medium text-foreground">Danny Bloomstine</span>.
          </p>

          {/* ─── Channels ─── */}
          <h2 className="mt-8 border-b-2 border-foreground/15 pb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Three ways to read it
          </h2>
          <div className="mt-3 space-y-2">
            {CHANNELS.map((channel) => (
              <Link
                key={channel.name}
                href={channel.href}
                className="group grid gap-x-4 gap-y-1 rounded px-2 py-2 transition-colors hover:bg-accent/30 sm:grid-cols-[150px_1fr]"
              >
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-foreground transition-colors group-hover:text-amber-400">
                  {channel.name}
                </span>
                <span className="text-[14px] leading-snug text-muted-foreground">{channel.body}</span>
              </Link>
            ))}
          </div>

          {/* ─── Editor ─── */}
          <h2 className="mt-8 border-b-2 border-foreground/15 pb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            The editor
          </h2>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Transparent cutout: it needs a light backdrop or the dark suit
                vanishes into the page. Amber matches the welcome email. */}
            <Image
              src="/danny-headshot-nobg.png"
              alt="Danny Bloomstine"
              width={112}
              height={112}
              className="h-28 w-28 shrink-0 rounded-full bg-amber-400 object-cover ring-1 ring-foreground/10"
            />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-foreground">Danny Bloomstine</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
                Founder &amp; Editor · Managing Director, IQ-EQ
              </p>
              <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
                Danny has spent a decade at the intersection of capital markets, technology and fund
                operations — S&amp;P Capital IQ, an early role at VTS, business development at Juniper
                Square, and now IQ-EQ, where he helps investment managers evaluate fund
                administration, compliance, tax and CFO solutions. He started FundOpsHQ to give the
                operational side of the industry the coverage it does not otherwise get.
              </p>
              <a
                href="https://www.linkedin.com/in/danny-bloomstine/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-amber-400"
              >
                <Linkedin className="h-3 w-3" />
                Connect on LinkedIn
              </a>
            </div>
          </div>

          {/* ─── Coverage ─── */}
          <h2 className="mt-8 border-b-2 border-foreground/15 pb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            What we cover
          </h2>
          <dl className="mt-3 space-y-2">
            <div className="grid gap-x-4 gap-y-1 px-2 sm:grid-cols-[150px_1fr]">
              <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
                Asset classes
              </dt>
              <dd className="text-[14px] leading-snug text-muted-foreground">{FUND_TYPES}</dd>
            </div>
            <div className="grid gap-x-4 gap-y-1 px-2 sm:grid-cols-[150px_1fr]">
              <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
                Story types
              </dt>
              <dd className="text-[14px] leading-snug text-muted-foreground">{STORY_TYPES}</dd>
            </div>
          </dl>

          {/* ─── Close ─── */}
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-foreground/10 pt-5">
            <Link
              href="/#subscribe"
              className="group inline-flex items-center gap-2 rounded-sm bg-foreground px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-background transition-colors hover:bg-amber-400"
            >
              Subscribe free
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
              Questions or story tips?{' '}
              <a
                href="mailto:dbloomstine@gmail.com"
                className="text-foreground/70 underline transition-colors hover:text-amber-400"
              >
                Email the desk
              </a>
            </span>
          </div>
        </div>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
