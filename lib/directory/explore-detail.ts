/**
 * What the explorer's side panel fetches when a row is opened (2026-10-24): the parts of a profile the compact index
 * leaves out (degrees and years, admissions, where the facts were read, the person's own contact link). Pure, so
 * tested; served by /api/directory/person.
 *
 * Contact: the person's own link, and only once they have claimed the profile and set one (the profile page's rule).
 * Otherwise the way to reach someone is the firm's bio page, which is where a firm publishes its people's contact
 * details. The directory never holds, scrapes or shows an email address or a phone number.
 */
import { asOf, displayDomain, profilePath, safeHttpsUrl, type Person } from './people'
import { provenance } from './provenance'
import { normalizeSchool } from './explore'

export interface PersonDetail {
  slug: string
  education: { school: string; degree: string | null; year: string | null }[]
  admissions: string[]
  /** The page the facts were read on, and how to name the link. */
  source: { url: string | null; text: string; fromFirm: boolean; label: string }
  /** "Oct 24, 2026", and the site it was checked against. */
  verified: string | null
  against: string
  /** The person's own contact link (claimed profiles only). */
  contact: string | null
  headline: string | null
  claimed: boolean
  /** The bio page was missing when last checked: the date. */
  missing: string | null
  profile: string
}

const str = (x: unknown, max = 160) => (typeof x === 'string' && x.trim() ? x.trim().slice(0, max) : null)

export function personDetail(p: Person): PersonDetail {
  const prov = provenance({ source: p.source, source_url: p.source_url, bio_url: p.bio_url, firm_name: p.firm_name, firm_domain: p.firm_domain, city_basis: p.city_basis, office_source_url: p.office_source_url })
  const fromFirm = prov.source === 'firm_site'
  const domain = displayDomain(p.firm_domain)
  const url = safeHttpsUrl(prov.url) ?? (prov.url?.startsWith('http://') ? prov.url : null)
  const claimed = Boolean(p.claimed_at)
  return {
    slug: p.slug,
    education: (Array.isArray(p.education) ? p.education : [])
      .map((e) => ({ school: str(e?.school) ?? '', degree: str(e?.degree, 60), year: e?.year === null || e?.year === undefined ? null : str(String(e.year), 8) }))
      // A licence filed as a school ("CPA") is not education.
      .filter((e) => e.school && normalizeSchool(e.school)),
    admissions: (Array.isArray(p.bar_admissions) ? p.bar_admissions : []).map((x) => str(x, 80)).filter((x): x is string => Boolean(x)),
    source: { url, text: fromFirm ? `Full bio on ${domain}` : prov.linkText, fromFirm, label: prov.label },
    verified: asOf(p.fetched_at),
    against: fromFirm ? domain : `the ${prov.label.replace(/^./, (c) => c.toLowerCase())}`,
    contact: claimed ? safeHttpsUrl(p.contact_url) : null,
    headline: claimed ? str(p.headline, 200) : null,
    claimed,
    missing: p.missing_since ? asOf(p.missing_since) : null,
    profile: profilePath(p),
  }
}
