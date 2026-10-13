import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { SectionFlag } from '@/components/story/StoryBlocks'
import { SubscribePanel } from '@/components/home/Rail'
import { SponsorCard, SponsorStrip } from '@/components/sponsor/SponsorSlot'
import { GLOSSARY_TERMS, glossaryHref, termsByGroup } from '@/lib/glossary/terms'
import { breadcrumbJsonLd, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'

// The glossary's index (2026-10-12): every term under its part of the market,
// with its definition, in the directory style of /firms. Built once a day; it
// reads nothing from the database.

export const revalidate = 86400

const TITLE = 'Private markets glossary'
const DESCRIPTION = `${GLOSSARY_TERMS.length} terms of private markets, defined plainly, with an example and why each matters: carried interest, waterfalls, NAV loans, continuation vehicles, DPI, Form PF and the rest.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://fundopshq.com/glossary' },
  ...shareCard(`${TITLE} | FundOpsHQ`, DESCRIPTION, '/glossary'),
}

const anchor = (group: string) => group.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export default function GlossaryPage() {
  const groups = termsByGroup()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': 'https://fundopshq.com/glossary',
    name: `FundOpsHQ ${TITLE.toLowerCase()}`,
    description: DESCRIPTION,
    url: 'https://fundopshq.com/glossary',
    hasDefinedTerm: GLOSSARY_TERMS.map((t) => ({
      '@type': 'DefinedTerm',
      '@id': `https://fundopshq.com${glossaryHref(t.slug)}`,
      name: t.term,
      description: t.define,
      url: `https://fundopshq.com${glossaryHref(t.slug)}`,
    })),
  }
  const breadcrumbs = breadcrumbJsonLd([{ name: 'Glossary' }])

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }} />
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-4 pt-5 lg:px-6">
            <h1 className="font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">Glossary</h1>
            <p className="mt-2 max-w-[72ch] font-news text-[16px] leading-snug text-foreground/70">
              The terms of private markets as they turn up in the news — fund economics, fundraising, a fund’s life,
              structures, deals, and the rules — each defined in a sentence, with an example and why it matters.
            </p>
            <nav aria-label="Jump to a group" className="tab-scroll mt-3 flex gap-x-1.5 overflow-x-auto">
              {groups.map((g) => (
                <a
                  key={g.group}
                  href={`#${anchor(g.group)}`}
                  className="inline-flex h-7 shrink-0 items-center rounded-sm border border-border bg-card px-2.5 font-ui text-[12px] font-bold text-foreground hover:border-foreground"
                >
                  {g.group}
                </a>
              ))}
            </nav>
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
          <SponsorStrip className="mb-5" />
          <div className="grid gap-x-9 gap-y-8 lg:grid-cols-[minmax(0,1fr)_332px]">
            <div className="min-w-0">
              <SectionFlag label="A to Z, by group" note={`${GLOSSARY_TERMS.length} terms`} />
              {groups.map((g) => (
                <section key={g.group} id={anchor(g.group)} aria-label={g.group} className="scroll-mt-16">
                  <h2 className="day-head">{g.group}</h2>
                  <dl className="pb-2 pt-1">
                    {g.terms.map((t) => (
                      <div key={t.slug} className="grid gap-x-6 border-b border-border/70 py-2 last:border-0 sm:grid-cols-[220px_minmax(0,1fr)]">
                        <dt className="font-news text-[17px] font-bold leading-snug text-foreground">
                          <Link href={glossaryHref(t.slug)} className="hl">{t.term}</Link>
                        </dt>
                        <dd className="mt-0.5 font-news text-[15.5px] leading-[1.4] text-foreground/80 sm:mt-0">{t.define}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              <p className="mt-5 font-ui text-[12.5px] text-muted-foreground">
                Definitions, not advice; where usage varies the entry says so. A term wrong or missing?{' '}
                <a href="mailto:dbloomstine@gmail.com" className="underline underline-offset-2 hover:text-foreground">Tell the desk</a>.
              </p>
            </div>

            <aside className="min-w-0 space-y-5">
              <SubscribePanel title="The terms, in the news each morning." body="FundOps Daily carries the day’s fund closes, deals and moves across private markets. Free, seven days a week." />
              <SponsorCard />
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
