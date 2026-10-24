/**
 * Where a profile's facts came from (2026-10-25). Every row says what kind of
 * page it was read on (`source`), the page itself (`source_url`, or the bio for
 * a firm_site row), and how its office city is known (`city_basis`, with
 * `office_source_url` when that is a different page). The profile cites this
 * instead of always saying "From the firm's bio".
 *
 * Columns: supabase/migrations/20261025_directory_sources.sql. Pure, tested.
 */

export type PersonSource = 'firm_site' | 'event_speaker' | 'press_release'
export type CityBasis = 'person' | 'brokercheck' | 'firm_single_office' | 'team_page'

export const PERSON_SOURCES: PersonSource[] = ['firm_site', 'event_speaker', 'press_release']
export const CITY_BASES: CityBasis[] = ['person', 'brokercheck', 'firm_single_office', 'team_page']
export const isPersonSource = (v: unknown): v is PersonSource => PERSON_SOURCES.includes(v as PersonSource)
export const isCityBasis = (v: unknown): v is CityBasis => CITY_BASES.includes(v as CityBasis)

/** Hosts of speaker pages and newswires, named as people know them. Unknown hosts show their domain. */
export const SOURCE_HOSTS: Record<string, string> = {
  'fundfinanceassociation.com': 'Fund Finance Association',
  'superreturn.com': 'SuperReturn',
  'informaconnect.com': 'Informa Connect',
  'ilpa.org': 'ILPA',
  'privateequityinternational.com': 'Private Equity International',
  'peimedia.com': 'PEI',
  'businesswire.com': 'Business Wire',
  'prnewswire.com': 'PR Newswire',
  'globenewswire.com': 'GlobeNewswire',
}

export function hostName(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

/** "Fund Finance Association" for fundfinanceassociation.com and its subdomains, else the bare domain. */
export function hostLabel(url: string | null | undefined): string | null {
  const h = hostName(url)
  if (!h) return null
  const known = Object.keys(SOURCE_HOSTS).find((d) => h === d || h.endsWith(`.${d}`))
  return known ? SOURCE_HOSTS[known] : h
}

export interface ProvenanceInput {
  source?: string | null
  source_url?: string | null
  bio_url?: string | null
  firm_name: string
  firm_domain: string
  city_basis?: string | null
  office_source_url?: string | null
}

export interface Provenance {
  source: PersonSource
  /** The heading over the facts: "Firm bio, kirkland.com", "Speaker bio, Fund Finance Association", "Press release, M&T Bank". */
  label: string
  /** The page the facts were read on. */
  url: string | null
  /** The link text: "View the bio", "View the speaker page", "View the press release". */
  linkText: string
  /** A line on how the office city is known, when it is not the person's own page; else null. */
  officeNote: string | null
  /** Where that office came from, when a different page. */
  officeUrl: string | null
}

export function provenance(p: ProvenanceInput): Provenance {
  const source: PersonSource = isPersonSource(p.source) ? p.source : 'firm_site'
  const url = (source === 'firm_site' ? p.bio_url || p.source_url : p.source_url || p.bio_url) ?? null
  const label =
    source === 'event_speaker'
      ? `Speaker bio, ${hostLabel(url) ?? 'conference page'}`
      : source === 'press_release'
        ? `Press release, ${p.firm_name}`
        : `Firm bio, ${p.firm_domain.replace(/^www\./, '')}`
  const linkText = source === 'event_speaker' ? 'View the speaker page' : source === 'press_release' ? 'View the press release' : 'View the bio'
  const basis = isCityBasis(p.city_basis) ? p.city_basis : 'person'
  const officeNote =
    basis === 'brokercheck'
      ? 'Office city from FINRA BrokerCheck.'
      : basis === 'firm_single_office'
        ? `Office city from ${p.firm_name}’s contact page, which lists one office.`
        : basis === 'team_page'
          ? `Office city from ${p.firm_name}’s team page.`
          : null
  return { source, label, url, linkText, officeNote, officeUrl: basis === 'person' ? null : (p.office_source_url ?? null) }
}
