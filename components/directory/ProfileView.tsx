import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ClaimedMark, Crumbs, PracticeTags } from '@/components/directory/parts'
import { OUTBOUND } from '@/components/story/StoryLink'
import { loadPeople, loadPerson } from '@/lib/directory/data'
import { LANDING_MIN, landingPath, peopleFor } from '@/lib/directory/landing'
import { cityOf, officeLabel } from '@/lib/directory/places'
import {
  asOf,
  displayDomain,
  isIndexable,
  isPublic,
  personJsonLd,
  practiceAreas,
  primaryOffice,
  profileDescription,
  profilePath,
  profileTitle,
  safeHttpsUrl,
} from '@/lib/directory/people'
import { DIRECTORY_PATH, directoryEnabled, type Category } from '@/lib/directory/taxonomy'
import { firmPageHref } from '@/lib/news/firms'
import { loadFirmPages } from '@/lib/news/firm-pages'
import { breadcrumbJsonLd, metaDescription, shareCard } from '@/lib/seo'
import { jsonLdScript } from '@/lib/news/story-jsonld'

// A directory profile, any trade (2026-10-24). Every fact says where it came
// from: the firm's own bio page, dated, linked; or the person, once they
// claimed the profile and the desk approved what they wrote. No photo unless
// claimed. The route files set `revalidate = 3600` and build on first request
// (or until a hide or a removal request clears the `directory` tag).

async function load(CATEGORY: Category, slug: string) {
  if (!directoryEnabled() || !CATEGORY.live) return null
  const p = await loadPerson(CATEGORY.id, slug)
  return p && isPublic(p) ? p : null
}

export async function profileMetadata(CATEGORY: Category, slug: string): Promise<Metadata> {
  const p = await load(CATEGORY, slug)
  if (!p) return { title: 'Not found', robots: { index: false } }
  const title = profileTitle(p, CATEGORY)
  const description = metaDescription(profileDescription(p, CATEGORY))
  return {
    title: { absolute: `${title} | FundOpsHQ` },
    description,
    alternates: { canonical: `https://fundopshq.com${profilePath(p)}` },
    // Danny, 2026-10-24: an unclaimed profile is indexed once it has substance (lib/directory/people.ts isIndexable).
    robots: isIndexable(p) ? undefined : { index: false, follow: true },
    ...shareCard(`${title} | FundOpsHQ`, description, profilePath(p)),
  }
}

const factHead = 'font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-foreground/60'

export async function ProfileView({ category: CATEGORY, slug }: { category: Category; slug: string }) {
  const p = await load(CATEGORY, slug)
  if (!p) notFound()

  const [firmPages, everyone] = await Promise.all([loadFirmPages(), loadPeople(CATEGORY.id)])
  const firmHref = firmPageHref(p.firm_name, firmPages)
  const office = primaryOffice(p)
  const city = office ? cityOf(office) : null
  const domain = displayDomain(p.firm_domain)
  const fetched = asOf(p.fetched_at)
  const bio = safeHttpsUrl(p.bio_url) ?? (p.bio_url?.startsWith('http://') ? p.bio_url : null)
  const colleagues = everyone.filter((x) => x.firm_domain === p.firm_domain && x.id !== p.id && isPublic(x)).length
  const cityPage = city && peopleFor(everyone, { topic: null, place: { kind: 'city', slug: city.slug, name: city.name, state: city.state } }).length >= LANDING_MIN
  const claimed = Boolean(p.claimed_at)
  const photo = claimed ? safeHttpsUrl(p.photo_url) : null
  const contact = claimed ? safeHttpsUrl(p.contact_url) : null

  const crumbs = [
    { name: 'Directory', path: DIRECTORY_PATH },
    { name: CATEGORY.plural, path: `/${CATEGORY.slug}` },
    ...(cityPage && city ? [{ name: city.name, path: landingPath(CATEGORY, { topic: null, place: { kind: 'city', slug: city.slug, name: city.name, state: city.state } }) }] : []),
    { name: p.full_name },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(personJsonLd(p)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(crumbs)) }} />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[920px] px-4 pb-6 pt-5 lg:px-6">
            <Crumbs crumbs={crumbs} />
            <div className="mt-4 flex items-start gap-4">
              {photo && (
                <img src={photo} alt={p.full_name} width={88} height={88} className="h-[88px] w-[88px] shrink-0 rounded-sm border border-border object-cover" />
              )}
              <div className="min-w-0">
                <p className="font-ui text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-400">{CATEGORY.singular}</p>
                <h1 className="mt-1 font-news text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[40px]">{p.full_name}</h1>
                <p className="mt-2 font-ui text-[15px] leading-snug text-foreground/80">
                  {p.title && <span>{p.title} · </span>}
                  {firmHref ? (
                    <Link href={firmHref} className="font-semibold text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground">
                      {p.firm_name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-foreground">{p.firm_name}</span>
                  )}
                  {office && <span> · {officeLabel(office)}</span>}
                </p>
                <PracticeTags areas={practiceAreas(p)} className="mt-2.5" />
                <div className="mt-3">
                  {claimed ? (
                    <ClaimedMark />
                  ) : (
                    <Link
                      href={`/directory/claim?p=${p.slug}`}
                      className="font-ui text-[13px] font-semibold text-foreground/85 underline decoration-foreground/30 underline-offset-2 hover:text-foreground"
                    >
                      Is this you? Claim this profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </header>
        </div>

        <div className="mx-auto max-w-[920px] space-y-7 px-4 pb-12 pt-6 lg:px-6">
          {p.missing_since && (
            <p role="note" className="border-l-4 border-[#E6B045] bg-card px-3 py-2 font-ui text-[13px] text-foreground/80">
              This profile was not on {domain} when we last checked ({asOf(p.missing_since)}). {p.full_name} may have left the firm.
            </p>
          )}

          {claimed && (p.headline || p.description || contact) && (
            <section aria-labelledby="own-words" className="panel panel-lead">
              <h2 id="own-words" className={factHead}>
                In their own words
              </h2>
              {p.headline && <p className="mt-2 font-news text-[19px] font-semibold leading-snug text-foreground">{p.headline}</p>}
              {p.description && <p className="mt-2 whitespace-pre-line font-news text-[16.5px] leading-[1.5] text-foreground/80">{p.description}</p>}
              {contact && (
                <a href={contact} {...OUTBOUND} className="mt-3 inline-flex items-center gap-1 font-ui text-[13px] font-semibold text-foreground underline underline-offset-2">
                  Contact {p.full_name.split(' ')[0]}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">(opens {displayDomain(new URL(contact).hostname)})</span>
                </a>
              )}
            </section>
          )}

          <section aria-labelledby="from-firm">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-t-2 border-foreground pt-1.5">
              <h2 id="from-firm" className="font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
                From {domain}
                {fetched ? <span className="font-semibold normal-case tracking-normal text-muted-foreground"> (as of {fetched})</span> : null}
              </h2>
              {bio && (
                <a href={bio} {...OUTBOUND} rel="nofollow noopener noreferrer" className="inline-flex items-center gap-1 font-ui text-[13px] font-semibold text-foreground underline underline-offset-2">
                  Full bio on {domain}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
            <dl className="mt-2 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {p.offices.length > 0 && (
                <div>
                  <dt className={factHead}>{p.offices.length === 1 ? 'Office' : 'Offices'}</dt>
                  <dd className="mt-1 font-news text-[16px] leading-snug text-foreground">{p.offices.map(officeLabel).join('; ')}</dd>
                </div>
              )}
              {p.bar_admissions.length > 0 && (
                <div>
                  <dt className={factHead}>{CATEGORY.credentialLabel}</dt>
                  <dd className="mt-1 font-news text-[16px] leading-snug text-foreground">{p.bar_admissions.join(', ')}</dd>
                </div>
              )}
              {p.education.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className={factHead}>Education</dt>
                  <dd className="mt-1">
                    <ul className="font-news text-[16px] leading-snug text-foreground">
                      {p.education.map((e, i) => (
                        <li key={i}>
                          {e.school}
                          {e.degree ? `, ${e.degree}` : ''}
                          {e.year ? ` (${e.year})` : ''}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {claimed && p.notable.length > 0 && (
            <section aria-labelledby="notable">
              <h2 id="notable" className="border-t-2 border-foreground pt-1.5 font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
                Notable matters <span className="font-semibold normal-case tracking-normal text-muted-foreground">(self-reported)</span>
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 font-news text-[16px] leading-snug text-foreground/85">
                {p.notable.map((n, i) => (
                  <li key={i}>
                    {n.text}
                    {n.year ? ` (${n.year})` : ''}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {colleagues > 0 && (
            <p className="font-ui text-[13.5px] text-foreground/80">
              <Link prefetch={false} href={`/${CATEGORY.slug}?firm=${encodeURIComponent(p.firm_domain)}`} className="font-semibold text-foreground underline underline-offset-2">
                {colleagues.toLocaleString('en-US')} other {colleagues === 1 ? CATEGORY.singular.toLowerCase() : CATEGORY.plural.toLowerCase()} at {p.firm_name}
              </Link>
            </p>
          )}

          <footer className="border-t border-border pt-4 font-ui text-[12.5px] leading-relaxed text-muted-foreground">
            <p>
              FundOpsHQ lists facts the firm publishes on its own site and links to the source. No ranking, no reviews, and nobody pays to be listed.{' '}
              <Link href={`/directory/request?p=${p.slug}`} className="font-semibold text-foreground/85 underline underline-offset-2 hover:text-foreground">
                Request a correction or removal
              </Link>
              .
            </p>
          </footer>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
