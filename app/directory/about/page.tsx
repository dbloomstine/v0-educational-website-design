import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Crumbs } from '@/components/directory/parts'
import { loadDirectorySummary } from '@/lib/directory/data'
import { LANDING_MIN, LANDING_MIN_FIRMS } from '@/lib/directory/landing'
import { MISSING_GRACE_DAYS, listJoin } from '@/lib/directory/people'
import { CATEGORIES, DIRECTORY_ABOUT_PATH, DIRECTORY_PATH, LIVE_CATEGORIES, directoryEnabled, lowerNoun } from '@/lib/directory/taxonomy'
import { EDITOR } from '@/lib/brand/social'
import { brandedTitle, breadcrumbJsonLd, metaDescription, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'

// /directory/about (2026-10-24, the SEO audit's methodology page): who is listed, where each fact comes from, how fresh
// it is, what the lists are and are not, and how to claim, correct or remove a profile. Facts only, each one true of the
// code today: the rules quoted here are the constants the pages use (LANDING_MIN, MISSING_GRACE_DAYS, the partner rule
// in lib/directory/taxonomy.ts). Allowed past robots.txt's /directory/ block (app/robots.ts).

export const dynamic = 'force-dynamic'

const n = (x: number) => x.toLocaleString('en-US')
const TITLE = 'How the FundOpsHQ Directory Works'
const DESCRIPTION =
  'Who the FundOpsHQ Directory lists (US partners at law and accounting firms with a private funds practice), where each fact comes from, how fresh it is, and how to claim, correct or remove a profile.'

export async function generateMetadata(): Promise<Metadata> {
  if (!directoryEnabled()) return { title: 'Not found', robots: { index: false } }
  return {
    title: { absolute: brandedTitle(TITLE) },
    description: metaDescription(DESCRIPTION),
    alternates: { canonical: `https://fundopshq.com${DIRECTORY_ABOUT_PATH}` },
    ...shareCard(TITLE, metaDescription(DESCRIPTION), DIRECTORY_ABOUT_PATH),
  }
}

const h2 = 'border-t-2 border-foreground pt-1.5 font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground'
const body = 'mt-2 font-news text-[17px] leading-[1.55] text-foreground/90'
const list = 'mt-2 list-disc space-y-1.5 pl-5 font-news text-[17px] leading-[1.5] text-foreground/90'
const link = 'font-semibold text-foreground underline underline-offset-2'

export default async function DirectoryAbout() {
  if (!directoryEnabled()) notFound()
  const s = await loadDirectorySummary()
  const live = s.categories.filter((c) => c.count > 0)
  const total = live.reduce((a, c) => a + c.count, 0)
  const firms = new Set(s.firms.map((f) => f.domain)).size
  const counts = listJoin(live.map((c) => `${n(c.count)} ${lowerNoun(CATEGORIES[c.id], c.count)}`))
  const trades = LIVE_CATEGORIES.map((c) => ({ c, href: `/${c.slug}` }))
  const crumbs = [{ name: 'Directory', path: DIRECTORY_PATH }, { name: 'How it works' }]

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd([{ name: 'Directory', path: DIRECTORY_PATH }, { name: 'How it works', path: DIRECTORY_ABOUT_PATH }])) }} />
      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[760px] px-4 pb-5 pt-5 lg:px-6">
            <Crumbs crumbs={crumbs} />
            <h1 className="mt-3 font-news text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[40px]">{TITLE}</h1>
            <p className="mt-2 font-news text-[17px] leading-snug text-foreground/80">
              A free list of the US partners who work on private funds at law and accounting firms
              {total > 0 ? (
                <>
                  : {counts}, {n(total)} in all, at {n(firms)} firms
                </>
              ) : null}
              . Run by FundOpsHQ, the private markets news site, and edited by{' '}
              <a href={EDITOR.href} className={link} rel="noopener noreferrer" target="_blank">
                {EDITOR.name}
              </a>
              .
            </p>
          </header>
        </div>

        <div className="mx-auto max-w-[760px] space-y-8 px-4 pb-14 pt-6 lg:px-6">
          <section aria-labelledby="who">
            <h2 id="who" className={h2}>
              Who is listed
            </h2>
            <p className={body}>A person is listed when all three of these hold:</p>
            <ul className={list}>
              <li>
                <span className="font-semibold">In the US.</span> The firm&rsquo;s page gives them an office in a US city or state.
              </li>
              <li>
                <span className="font-semibold">Partner level or higher.</span> Partner, Shareholder, Member, Principal (an accounting firm&rsquo;s
                non-CPA partner) or Chair. Not Counsel, Of Counsel, Director, an accounting firm&rsquo;s Managing Director, associates or staff.
              </li>
              <li>
                <span className="font-semibold">A private funds practice, on the firm&rsquo;s own page.</span> For lawyers: fund formation, fund
                finance, funds regulatory or secondaries work, or a place in the firm&rsquo;s investment funds group; a corporate lawyer who acts for
                private equity firms only on portfolio company deals is not listed. For auditors and tax advisors: audit or tax work for investment
                funds and their managers; fund administration, outsourced fund accounting or investor tax reporting, and outsourced CFO services are
                not.
              </li>
            </ul>
            <p className={body}>
              The directory covers {listJoin(trades.map(({ c }) => c.plural.toLowerCase()))}:{' '}
              {trades.map(({ c, href }, i) => (
                <span key={c.id}>
                  {i > 0 ? ', ' : ''}
                  <Link href={href} className={link}>
                    {c.plural}
                  </Link>
                </span>
              ))}
              .
            </p>
          </section>

          <section aria-labelledby="sources">
            <h2 id="sources" className={h2}>
              Where the facts come from
            </h2>
            <p className={body}>
              Each profile is read from a public page about the person, almost always their bio on their firm&rsquo;s own website, and links to it.
              Title, offices, practice areas, the kinds of clients named, bar admissions or licences and education are taken only from what that
              page says. Software reads the page, including an AI model that sorts what the bio says into the directory&rsquo;s practice areas; the
              rules above are then checked before anyone is published, and nothing is guessed or filled in from elsewhere.
            </p>
            <p className={body}>
              When the facts come from somewhere other than a firm bio (a conference speaker page or a firm&rsquo;s press release), the profile says
              so above its facts. When an office city comes from a firm&rsquo;s contact or team page rather than the person&rsquo;s own, the profile
              says that too.
            </p>
          </section>

          <section aria-labelledby="fresh">
            <h2 id="fresh" className={h2}>
              How fresh it is
            </h2>
            <p className={body}>
              Every profile shows the date its source was last read (&ldquo;Last verified&rdquo;), and every list shows the span of those dates for the
              people on it. When a person&rsquo;s page is gone from their firm&rsquo;s site at a later check, their profile says so; after{' '}
              {MISSING_GRACE_DAYS} days it comes down.
            </p>
          </section>

          <section aria-labelledby="lists">
            <h2 id="lists" className={h2}>
              What the lists are, and are not
            </h2>
            <ul className={list}>
              <li>Lists are in surname order. There are no ranks, ratings, reviews or &ldquo;best&rdquo; labels.</li>
              <li>Nobody pays to be listed, to be placed higher or to be left out.</li>
              <li>
                A practice, city or state page exists only with at least {LANDING_MIN} people at {LANDING_MIN_FIRMS} or more firms. A state has its own
                page only when it adds people beyond its main city; otherwise its address leads to the city&rsquo;s page.
              </li>
              <li>A firm&rsquo;s page counts only its people listed here; it is not a profile of the firm.</li>
            </ul>
          </section>

          <section aria-labelledby="claim">
            <h2 id="claim" className={h2}>
              Claim, correct or remove a profile
            </h2>
            <ul className={list}>
              <li>
                <span className="font-semibold">Claim it.</span> &ldquo;Is this you? Claim this profile&rdquo; on any profile sends a link to your work
                email at your firm&rsquo;s domain. Once claimed, you can add a headline, a description, a photo, a contact link and notable matters; each
                change is reviewed before it shows, and is marked as written by you.
              </li>
              <li>
                <span className="font-semibold">Correct it or have it removed.</span> &ldquo;Request a correction or removal&rdquo; at the foot of every
                profile. Each request is reviewed by a person.
              </li>
              <li>
                <span className="font-semibold">Missing someone?</span> The directory adds people from the firms&rsquo; own pages; a firm or a partner
                who should be listed can say so from the{' '}
                <Link href="/about" className={link}>
                  contact details on our About page
                </Link>
                .
              </li>
            </ul>
            <p className={body}>
              How the directory handles personal data is set out in the{' '}
              <Link href="/privacy#directory" className={link}>
                privacy notice
              </Link>
              .
            </p>
          </section>

          <p className="border-t border-border pt-4 font-ui text-[13px]">
            <Link href={DIRECTORY_PATH} className={link}>
              Back to the directory
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
