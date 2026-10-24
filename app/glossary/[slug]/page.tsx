import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BackToTop } from '@/components/back-to-top'
import { Panel, RiverRow, SectionFlag } from '@/components/story/StoryBlocks'
import { SubscribePanel } from '@/components/home/Rail'
import { SponsorCard, SponsorStrip } from '@/components/sponsor/SponsorSlot'
import { GLOSSARY_TERMS, getTerm, glossaryHref, relatedTerms, storiesUsing } from '@/lib/glossary/terms'
import { loadStories } from '@/lib/news/front-page'
import { storyFirmRef } from '@/lib/news/firms'
import { loadFirmPages } from '@/lib/news/firm-pages'
import { KIND_LABEL } from '@/lib/news/sections'
import { breadcrumbJsonLd, metaDescription, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'

// One term (2026-10-12): the definition, the explanation, an example, why it
// matters, the terms next to it, and the stories of the past days that use
// it. All 88 are built at deploy and rebuilt once a day; the only read is the
// shared story window, which the front page has already built.

export const revalidate = 86400
export const dynamicParams = false

export function generateStaticParams() {
  return GLOSSARY_TERMS.map((t) => ({ slug: t.slug }))
}

type Params = { params: Promise<{ slug: string }> }

const day = (iso: string | null) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : null)

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const t = getTerm(slug)
  if (!t) return { title: 'Term not found', robots: { index: false } }
  const description = metaDescription(t.define)
  return {
    title: t.title,
    description,
    alternates: { canonical: `https://fundopshq.com${glossaryHref(t.slug)}` },
    ...shareCard(`${t.title} | FundOpsHQ`, description, glossaryHref(t.slug)),
  }
}

export default async function GlossaryTermPage({ params }: Params) {
  const { slug } = await params
  const t = getTerm(slug)
  if (!t) notFound()

  const related = relatedTerms(t)
  const [all, firmPages] = await Promise.all([loadStories(), loadFirmPages()])
  const stories = storiesUsing(t, all)
  const url = `https://fundopshq.com${glossaryHref(t.slug)}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': url,
    name: t.term,
    description: t.define,
    url,
    inDefinedTermSet: { '@type': 'DefinedTermSet', '@id': 'https://fundopshq.com/glossary', name: 'FundOpsHQ private markets glossary', url: 'https://fundopshq.com/glossary' },
  }
  const breadcrumbs = breadcrumbJsonLd([{ name: 'Glossary', path: '/glossary' }, { name: t.term }])

  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }} />
      <SiteHeader />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1320px] px-4 pb-4 pt-5 lg:px-6">
            <p className="font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400">
              <Link href="/glossary" className="hover:underline">Glossary</Link>
              <span className="text-foreground/40"> · </span>
              <span className="text-foreground/70">{t.group}</span>
            </p>
            <h1 className="mt-1.5 font-news text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[40px]">{t.title}</h1>
            <p className="mt-3 max-w-[68ch] font-news text-[19px] leading-[1.4] text-foreground sm:text-[21px]">{t.define}</p>
          </header>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-5 lg:px-6">
          <SponsorStrip className="mb-5" />
          <div className="grid gap-x-9 gap-y-8 lg:grid-cols-[minmax(0,1fr)_332px]">
            <article className="min-w-0 space-y-8">
              <section aria-label={`${t.term}, explained`}>
                <SectionFlag label="In practice" />
                <p className="mt-2 max-w-[68ch] font-news text-[17px] leading-[1.5] text-foreground/90">{t.explanation}</p>
              </section>

              <section aria-label="An example">
                <SectionFlag label="An example" note="Round numbers, not a real fund" />
                <p className="mt-2 max-w-[68ch] font-news text-[17px] leading-[1.5] text-foreground/90">{t.example}</p>
              </section>

              <section aria-label="Why it matters">
                <SectionFlag label="Why it matters" />
                <p className="mt-2 max-w-[68ch] font-news text-[17px] leading-[1.5] text-foreground/90">{t.why}</p>
              </section>

              {stories.length > 0 && (
                <section aria-label={`Stories that use the term ${t.term}`}>
                  <SectionFlag label="In the news" href="/news" note="Recent stories that use the term" />
                  <ul className="river">
                    {stories.map((s) => (
                      <RiverRow key={s.id} story={s} tags={[KIND_LABEL[s.kind]]} date={day(s.publishedDate ?? s.firstSeen)} firm={storyFirmRef(s, firmPages)} />
                    ))}
                  </ul>
                </section>
              )}

              <p className="font-ui text-[12.5px] text-muted-foreground">
                A definition, not advice; where usage varies the entry says so. Something wrong?{' '}
                <a href="mailto:danny@fundopshq.com" className="underline underline-offset-2 hover:text-foreground">Tell the desk</a>.
              </p>
            </article>

            <aside className="min-w-0 space-y-5">
              {related.length > 0 && (
                <Panel label="Related terms" href="/glossary">
                  <ul>
                    {related.map((r) => (
                      <li key={r.slug} className="border-b border-border/70 py-[7px] last:border-0">
                        <Link href={glossaryHref(r.slug)} className="hl font-news text-[15.5px] font-bold leading-tight text-foreground">{r.term}</Link>
                        <span className="block font-news text-[13.5px] leading-snug text-muted-foreground">{r.define}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
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
