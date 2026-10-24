import { provenance } from '@/lib/directory/provenance'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AboutLine, ClaimedMark, Crumbs, LandingLinks, PracticeTags } from '@/components/directory/parts'
import { FirmMark } from '@/components/directory/FirmMark'
import { FIRM_MIN, firmPath, firmsOf, peopleAtFirm } from '@/lib/directory/firms'
import { logoFor, monogram } from '@/lib/directory/logos'
import { displayTitle, seniority, visiblePractices } from '@/lib/directory/quality'
import { OUTBOUND } from '@/components/story/StoryLink'
import { loadPeople, loadPerson } from '@/lib/directory/data'
import { allLandings, type Landing } from '@/lib/directory/landing'
import { peersOf } from '@/lib/directory/peers'
import { cityOf, officeCity, officeLabel } from '@/lib/directory/places'
import {
  asOf,
  bySurname,
  displayDomain,
  displayName,
  firmUrl,
  isIndexable,
  isPublic,
  personJsonLd,
  primaryOffice,
  profileDescription,
  profilePath,
  profileTitle,
  safeHttpsUrl,
  type PersonCard,
} from '@/lib/directory/people'
import { DIRECTORY_ABOUT_PATH, DIRECTORY_PATH, SENIOR_ONLY, directoryEnabled, lowerNoun, practiceLabel, practiceLower, type Category } from '@/lib/directory/taxonomy'
import { firmPageHref } from '@/lib/news/firms'
import { peekFirmPages } from '@/lib/news/firm-pages'
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

const factHead = 'font-ui text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/70'
const sectionHead = 'border-t-2 border-foreground pt-1.5 font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground'
const n = (x: number) => x.toLocaleString('en-US')

/**
 * The profile (2026-10-24 night, redesigned). Structure from Chambers and Partners' lawyer pages (the firm's mark and
 * name beside the person, practice areas up top, offices, then the detail) and Crunchbase's people pages (the "works
 * at" card, colleagues at the same organisation, where to go next). The source of every fact sits right under the
 * facts: the firm's domain, the date it was read, and the link to the bio itself.
 */
export async function ProfileView({ category: CATEGORY, slug }: { category: Category; slug: string }) {
  const p = await load(CATEGORY, slug)
  if (!p) notFound()

  // The news firm-page set is an extra: read only if it comes within a second (never wait on a cold build of it).
  const [firmPages, everyone] = await Promise.all([peekFirmPages(1000), loadPeople(CATEGORY.id)])
  const newsHref = firmPages ? firmPageHref(p.firm_name, firmPages) : null
  const office = primaryOffice(p)
  const city = office ? cityOf(office) : null
  const domain = displayDomain(p.firm_domain)
  const fetched = asOf(p.fetched_at)
  // Where the facts were read (2026-10-25): a firm bio, a conference speaker page or a press release, said plainly.
  const prov = provenance({ source: p.source, source_url: p.source_url, bio_url: p.bio_url, firm_name: p.firm_name, firm_domain: p.firm_domain, city_basis: p.city_basis, office_source_url: p.office_source_url })
  const fromFirm = prov.source === 'firm_site'
  const bio = safeHttpsUrl(prov.url) ?? (prov.url?.startsWith('http://') ? prov.url : null)
  const officeUrl = safeHttpsUrl(prov.officeUrl)
  const claimed = Boolean(p.claimed_at)
  const photo = claimed ? safeHttpsUrl(p.photo_url) : null
  const contact = claimed ? safeHttpsUrl(p.contact_url) : null
  const title = displayTitle(p.title)
  const practices = visiblePractices(p, CATEGORY)

  const firms = firmsOf(everyone, CATEGORY)
  const firm = firms.find((f) => f.domain === p.firm_domain.toLowerCase()) ?? null
  const firmHref = firm && firm.count >= FIRM_MIN ? firmPath(CATEGORY, firm.slug) : null
  const logo = logoFor(p.firm_domain)
  const site = firmUrl(p.firm_domain)

  // Colleagues: the same firm, the same city first, then partners and MDs, then A to Z.
  const myCities = new Set(p.offices.flatMap((o) => (cityOf(o) ? [cityOf(o)!.slug] : [])))
  const colleaguesAll = peopleAtFirm(everyone, p.firm_domain).filter((x) => x.id !== p.id)
  const rank = (x: PersonCard) => (x.offices.some((o) => myCities.has(cityOf(o)?.slug ?? '')) ? 0 : 2) + (seniority(x.title) === 'senior' ? 0 : 1)
  const colleagues = [...colleaguesAll].sort((a, b) => rank(a) - rank(b) || bySurname(a, b)).slice(0, 8)

  // Partners in the same city with practices in common, at other firms (2026-10-24): who else a reader might call.
  const peers = city ? peersOf(p, everyone, city.slug, CATEGORY) : []

  // Related pages that exist: the city, then each of the person's practices (in the city first, then anywhere).
  const landings = allLandings(CATEGORY, everyone)
  const related: Landing[] = []
  const add = (l?: Landing) => l && !related.some((r) => r.path === l.path) && related.push(l)
  if (city) add(landings.find((l) => !l.topic && l.place?.slug === city.slug))
  for (const id of practices) {
    if (city) add(landings.find((l) => l.topic?.kind === 'practice' && l.topic.id === id && l.place?.slug === city.slug))
    add(landings.find((l) => l.topic?.kind === 'practice' && l.topic.id === id && !l.place))
  }
  const cityPage = city ? landings.find((l) => !l.topic && l.place?.slug === city.slug) : undefined

  const name = displayName(p.full_name)
  const crumbs = [
    { name: 'Directory', path: DIRECTORY_PATH },
    { name: CATEGORY.plural, path: `/${CATEGORY.slug}` },
    ...(cityPage && city ? [{ name: city.name, path: cityPage.path }] : []),
    { name },
  ]
  const ld = personJsonLd(p, {
    sameAs: fromFirm ? bio : null,
    knowsAbout: practices.map(practiceLabel),
    description: profileDescription(p, CATEGORY),
  })

  const firmName = firmHref ? (
    <Link href={firmHref} className="font-semibold text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground">
      {p.firm_name}
    </Link>
  ) : (
    <span className="font-semibold text-foreground">{p.firm_name}</span>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(crumbs)) }} />

      <main id="main-content" className="paper flex-1">
        <div className="band">
          <header className="mx-auto max-w-[1080px] px-4 pb-6 pt-5 lg:px-6">
            <Crumbs crumbs={crumbs} />
            <div className="mt-4 flex items-start gap-4 sm:gap-5">
              {photo ? (
                <img src={photo} alt={name} width={96} height={96} className="h-[72px] w-[72px] shrink-0 rounded-[3px] border border-border object-cover sm:h-[96px] sm:w-[96px]" />
              ) : null}
              <div className="min-w-0 flex-1">
                <FirmMark name={p.firm_name} logo={logo} mono={monogram(p.firm_name)} size="md" eager decorative className="mb-3 sm:hidden" />
                <h1 className="font-news text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[42px]">{name}</h1>
                <p className="mt-2 font-ui text-[15.5px] leading-snug text-foreground/85">
                  {title ? (
                    <>
                      {title}, {firmName}
                    </>
                  ) : (
                    firmName
                  )}
                </p>
                {p.offices.length > 0 && <p className="mt-0.5 font-ui text-[14.5px] leading-snug text-foreground/75">{p.offices.map(officeLabel).join(' · ')}</p>}
                <PracticeTags areas={practices} className="mt-3" />
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {bio && (
                    <a
                      href={bio}
                      {...OUTBOUND}
                      rel="nofollow noopener noreferrer"
                      className="inline-flex h-10 items-center gap-1.5 rounded-[3px] bg-foreground px-3.5 font-ui text-[13.5px] font-semibold text-background hover:bg-foreground/85"
                    >
                      {fromFirm ? <>Full bio on {domain}</> : prov.linkText}
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                  {claimed ? (
                    <ClaimedMark />
                  ) : (
                    <Link
                      href={`/directory/claim?p=${p.slug}`}
                      className="inline-flex h-10 items-center rounded-[3px] border border-foreground/35 bg-card px-3.5 font-ui text-[13.5px] font-semibold text-foreground hover:border-foreground"
                    >
                      Is this you? Claim this profile
                    </Link>
                  )}
                </div>
                {fetched && (
                  <p className="mt-3 font-ui text-[12.5px] text-foreground/70">
                    Last verified {fetched} against {fromFirm ? domain : `the ${prov.label.replace(/^./, (c) => c.toLowerCase())}`}.{' '}
                    <Link href={DIRECTORY_ABOUT_PATH} className="underline underline-offset-2 hover:text-foreground">
                      How we check
                    </Link>
                  </p>
                )}
              </div>
              <div className="hidden shrink-0 sm:block">
                {firmHref ? (
                  <Link href={firmHref} aria-label={`${p.firm_name}: all ${CATEGORY.plural.toLowerCase()} at the firm`}>
                    <FirmMark name={p.firm_name} logo={logo} mono={monogram(p.firm_name)} size="lg" eager className="border border-border bg-card" />
                  </Link>
                ) : (
                  <FirmMark name={p.firm_name} logo={logo} mono={monogram(p.firm_name)} size="lg" eager className="border border-border bg-card" />
                )}
              </div>
            </div>
          </header>
        </div>

        <div className="mx-auto grid max-w-[1080px] gap-x-10 gap-y-8 px-4 pb-12 pt-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-6">
          <div className="min-w-0 space-y-7">
            {p.missing_since && (
              <p role="note" className="border-l-4 border-[#E6B045] bg-card px-3 py-2 font-ui text-[13px] text-foreground/85">
                This profile was not on {domain} when we last checked ({asOf(p.missing_since)}). {name} may have left the firm.
              </p>
            )}

            {claimed && (p.headline || p.description || contact) && (
              <section aria-labelledby="own-words" className="panel panel-lead">
                <h2 id="own-words" className={factHead}>
                  In their own words
                </h2>
                {p.headline && <p className="mt-2 font-news text-[19px] font-semibold leading-snug text-foreground">{p.headline}</p>}
                {p.description && <p className="mt-2 whitespace-pre-line font-news text-[16.5px] leading-[1.5] text-foreground/85">{p.description}</p>}
                {contact && (
                  <a href={contact} {...OUTBOUND} className="mt-3 inline-flex items-center gap-1 font-ui text-[13px] font-semibold text-foreground underline underline-offset-2">
                    Contact {name.split(' ')[0]}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">(opens {displayDomain(new URL(contact).hostname)})</span>
                  </a>
                )}
              </section>
            )}

            <section aria-labelledby="from-firm">
              <h2 id="from-firm" className={sectionHead}>
                {fromFirm ? <>From the firm&rsquo;s bio</> : prov.label}
              </h2>
              <dl className="mt-3 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {p.offices.length > 0 && (
                  <div>
                    <dt className={factHead}>{p.offices.length === 1 ? 'Office' : 'Offices'}</dt>
                    <dd className="mt-1 font-news text-[16.5px] leading-snug text-foreground">{p.offices.map(officeLabel).join('; ')}</dd>
                  </div>
                )}
                {p.bar_admissions.length > 0 && (
                  <div>
                    <dt className={factHead}>{CATEGORY.credentialLabel}</dt>
                    <dd className="mt-1 font-news text-[16.5px] leading-snug text-foreground">{p.bar_admissions.join(', ')}</dd>
                  </div>
                )}
                {p.education.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className={factHead}>Education</dt>
                    <dd className="mt-1">
                      <ul className="font-news text-[16.5px] leading-snug text-foreground">
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
              <p className="mt-4 font-ui text-[13px] leading-relaxed text-foreground/75">
                Source: {fromFirm ? domain : prov.label}
                {fetched ? `, as of ${fetched}` : ''}.{' '}
                {bio && (
                  <a href={bio} {...OUTBOUND} rel="nofollow noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-foreground underline underline-offset-2">
                    {prov.linkText}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
                {prov.officeNote && (
                  <>
                    {' '}
                    {officeUrl ? (
                      <a href={officeUrl} {...OUTBOUND} rel="nofollow noopener noreferrer" className="underline underline-offset-2">
                        {prov.officeNote}
                      </a>
                    ) : (
                      prov.officeNote
                    )}
                  </>
                )}
              </p>
            </section>

            {claimed && p.notable.length > 0 && (
              <section aria-labelledby="notable">
                <h2 id="notable" className={sectionHead}>
                  Notable matters <span className="font-semibold normal-case tracking-normal text-foreground/70">(self-reported)</span>
                </h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 font-news text-[16px] leading-snug text-foreground/85">
                  {p.notable.map((x, i) => (
                    <li key={i}>
                      {x.text}
                      {x.year ? ` (${x.year})` : ''}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {colleagues.length >= 2 && (
              <section aria-labelledby="colleagues">
                <div className="flex items-baseline justify-between gap-3 border-t-2 border-foreground pt-1.5">
                  <h2 id="colleagues" className="font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
                    Colleagues at {p.firm_name}
                  </h2>
                  {firmHref && colleaguesAll.length > colleagues.length && (
                    <Link prefetch={false} href={firmHref} className="shrink-0 font-ui text-[12.5px] font-semibold text-foreground underline underline-offset-2">
                      All {n(colleaguesAll.length + 1)}
                    </Link>
                  )}
                </div>
                <ul className="mt-1 grid sm:grid-cols-2 sm:gap-x-8">
                  {colleagues.map((c) => {
                    const o = primaryOffice(c)
                    return (
                      <li key={c.id} className="border-b border-border/60 py-2">
                        <Link prefetch={false} href={profilePath(c)} className="hl font-news text-[16px] font-bold leading-snug text-foreground">
                          {displayName(c.full_name)}
                        </Link>
                        <p className="font-ui text-[12.5px] leading-snug text-foreground/70">{[displayTitle(c.title), o ? officeCity(o) : null].filter(Boolean).join(' · ')}</p>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {city && peers.length >= 2 && (
              <section aria-labelledby="peers">
                <div className="flex items-baseline justify-between gap-3 border-t-2 border-foreground pt-1.5">
                  <h2 id="peers" className="font-ui text-[12px] font-extrabold uppercase tracking-[0.12em] text-foreground">
                    {CATEGORY.plural} in {city.name} at other firms
                  </h2>
                  {cityPage && (
                    <Link prefetch={false} href={cityPage.path} className="shrink-0 font-ui text-[12.5px] font-semibold text-foreground underline underline-offset-2">
                      All {n(cityPage.count)}
                    </Link>
                  )}
                </div>
                <p className="mt-1 font-ui text-[12.5px] text-foreground/70">
                  {SENIOR_ONLY.includes(CATEGORY.id) ? 'Partners' : 'People'} with practices in common with {name.split(' ')[0]}, most in common first.
                </p>
                <ul className="mt-1 grid sm:grid-cols-2 sm:gap-x-8">
                  {peers.map(({ person: c, shared }) => (
                    <li key={c.id} className="border-b border-border/60 py-2">
                      <Link prefetch={false} href={profilePath(c)} className="hl font-news text-[16px] font-bold leading-snug text-foreground">
                        {displayName(c.full_name)}
                      </Link>
                      <p className="font-ui text-[12.5px] leading-snug text-foreground/70">
                        {c.firm_name}
                        <span aria-hidden="true"> · </span>
                        <span className="sr-only">Practices in common: </span>
                        {shared.slice(0, 2).map(practiceLower).join(', ')}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="min-w-0 space-y-6" aria-label="The firm and related pages">
            <section aria-labelledby="firm-card" className="panel px-4 py-4">
              <h2 id="firm-card" className="sr-only">
                The firm
              </h2>
              <p className=" font-news text-[18px] font-semibold leading-snug text-foreground">{p.firm_name}</p>
              {firm && (
                <p className="mt-0.5 font-ui text-[13px] text-foreground/75">
                  {n(firm.count)} {lowerNoun(CATEGORY, firm.count)} listed{firm.cities.length > 1 ? ` in ${n(firm.cities.length)} cities` : ''}
                </p>
              )}
              <ul className="mt-3 space-y-1.5 font-ui text-[13px] font-semibold">
                {firmHref && (
                  <li>
                    <Link prefetch={false} href={firmHref} className="text-foreground underline underline-offset-2">
                      {CATEGORY.plural} at {p.firm_name}
                    </Link>
                  </li>
                )}
                {newsHref && (
                  <li>
                    <Link href={newsHref} className="text-foreground underline underline-offset-2">
                      {p.firm_name} in the news
                    </Link>
                  </li>
                )}
                {site && (
                  <li>
                    <a href={site} {...OUTBOUND} className="inline-flex items-center gap-1 text-foreground underline underline-offset-2">
                      {domain}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </li>
                )}
              </ul>
            </section>
            <LandingLinks title="Related pages" items={related.slice(0, 6)} />
          </aside>

          <footer className="border-t border-border pt-4 font-ui text-[12.5px] leading-relaxed text-foreground/70 lg:col-span-2">
            <p>
              FundOpsHQ lists facts the firm publishes on its own site and links to the source. No ranking, no reviews, and nobody pays to be listed.{' '}
              <Link href={`/directory/request?p=${p.slug}`} className="font-semibold text-foreground/90 underline underline-offset-2 hover:text-foreground">
                Request a correction or removal
              </Link>
              . <AboutLine />
            </p>
          </footer>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
