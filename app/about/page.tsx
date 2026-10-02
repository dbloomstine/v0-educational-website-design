import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { ArrowRight, Linkedin } from 'lucide-react'
import { SectionFlag } from '@/components/story/StoryBlocks'
import { SECTIONS, sectionHref } from '@/lib/news/sections'
import { OG_IMAGES } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'About',
  description:
    'FundOpsHQ is the hub for the investment funds industry — real-time fund news, the verified industry events calendar, and the FundOps Daily morning newsletter. By Danny Bloomstine.',
  openGraph: {
    title: 'About FundOpsHQ',
    description:
      'The hub for the investment funds industry — fund news, the industry events calendar, and the FundOps Daily morning newsletter.',
    type: 'website',
    url: 'https://fundopshq.com/about',
    images: OG_IMAGES,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About FundOpsHQ',
    description:
      'The hub for the investment funds industry — fund news, the industry events calendar, and the FundOps Daily morning newsletter.',
    images: OG_IMAGES.map((i) => i.url),
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
    body: 'One email before the open: the morning’s headlines by strategy, then the week ahead in events grouped by day. Free.',
  },
] as const

const METHOD = [
  {
    label: 'Gathered',
    body: 'Every hour, from more than 200 trade publications, wires, law-firm and regulator pages. Each headline links to its publisher; we do not republish their articles.',
  },
  {
    label: 'Grouped',
    body: 'Reports of the same close, deal or hire are joined into one story, with every outlet listed on the story’s page.',
  },
  {
    label: 'Summarised',
    body: 'The one-line summary and the facts beside a story — firm, fund, size, stage — are extracted from the reports by software and can be wrong. The linked article is the source of record.',
  },
  {
    label: 'Corrected',
    body: 'If we have a fund, a figure or a name wrong, tell us and we will fix it.',
  },
] as const

export default function AboutPage() {
  const byType = SECTIONS.filter((s) => s.group === 'type')
  const byAsset = SECTIONS.filter((s) => s.group === 'asset')
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="mx-auto max-w-[1000px] px-4 pb-14 pt-7 lg:px-6">
          <header className="border-b border-border pb-6">
            <p className="font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400">About</p>
            <h1 className="mt-2 font-news text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[46px]">
              A daily newsroom for <span className="italic" style={{ color: 'var(--display-accent)' }}>private markets.</span>
            </h1>
            <p className="mt-3 max-w-[62ch] font-news text-[18px] leading-[1.45] text-foreground/80">
              FundOpsHQ is the news desk, events calendar and morning briefing for GPs, LPs and the fund service
              providers working around them — across private equity, venture, credit, hedge funds, real estate and
              infrastructure. Edited by Danny Bloomstine in New York.
            </p>
          </header>

          <section aria-label="Three ways to read it" className="mt-8">
            <SectionFlag label="Three ways to read it" />
            <dl>
              {CHANNELS.map((channel) => (
                <div key={channel.name} className="grid gap-x-6 border-b border-border/70 py-2.5 sm:grid-cols-[130px_minmax(0,1fr)]">
                  <dt className="font-ui text-[13px] font-bold text-foreground sm:pt-0.5">
                    <Link href={channel.href} className="underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground">
                      {channel.name}
                    </Link>
                  </dt>
                  <dd className="font-news text-[16px] leading-[1.45] text-foreground/85">{channel.body}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-label="How it is made" className="mt-10">
            <SectionFlag label="How it is made" />
            <dl>
              {METHOD.map((m) => (
                <div key={m.label} className="grid gap-x-6 border-b border-border/70 py-2.5 sm:grid-cols-[130px_minmax(0,1fr)]">
                  <dt className="font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:pt-1">{m.label}</dt>
                  <dd className="font-news text-[16px] leading-[1.45] text-foreground/85">{m.body}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-label="What we cover" className="mt-10">
            <SectionFlag label="What we cover" />
            <div className="grid gap-x-6 border-b border-border/70 py-2.5 sm:grid-cols-[130px_minmax(0,1fr)]">
              <h3 className="font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:pt-1">By story</h3>
              <p className="font-news text-[16px] leading-[1.6] text-foreground">
                {byType.map((s, i) => (
                  <span key={s.slug}>
                    {i > 0 && <span className="text-muted-foreground"> · </span>}
                    <Link href={sectionHref(s.slug)} className="underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground">{s.title}</Link>
                  </span>
                ))}
              </p>
            </div>
            <div className="grid gap-x-6 border-b border-border/70 py-2.5 sm:grid-cols-[130px_minmax(0,1fr)]">
              <h3 className="font-ui text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:pt-1">By market</h3>
              <p className="font-news text-[16px] leading-[1.6] text-foreground">
                {byAsset.map((s, i) => (
                  <span key={s.slug}>
                    {i > 0 && <span className="text-muted-foreground"> · </span>}
                    <Link href={sectionHref(s.slug)} className="underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground">{s.title}</Link>
                  </span>
                ))}
              </p>
            </div>
          </section>

          <section aria-label="The editor" className="mt-10">
            <SectionFlag label="The editor" />
            <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-start">
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
                <p className="font-news text-[20px] font-bold leading-tight text-foreground">Danny Bloomstine</p>
                <p className="mt-0.5 font-ui text-[12px] text-muted-foreground">Founder and editor · Managing Director, IQ-EQ</p>
                <p className="mt-2.5 max-w-[62ch] font-news text-[16px] leading-[1.5] text-foreground/85">
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
                  className="mt-3 inline-flex items-center gap-1.5 font-ui text-[12.5px] font-semibold text-foreground underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground"
                >
                  <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                  Connect on LinkedIn
                </a>
              </div>
            </div>
          </section>

          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t-2 border-foreground pt-5">
            <Link
              href="/#subscribe"
              className="group inline-flex h-10 items-center gap-2 rounded-sm bg-foreground px-5 font-ui text-[13px] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-foreground/85"
            >
              Subscribe free
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <p className="font-ui text-[13px] text-muted-foreground">
              Story tips and corrections:{' '}
              <a href="mailto:dbloomstine@gmail.com" className="font-semibold text-foreground underline underline-offset-4 hover:no-underline">
                email the desk
              </a>
              . Sponsorship: <Link href="/sponsor" className="font-semibold text-foreground underline underline-offset-4 hover:no-underline">see the sponsor page</Link>.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
