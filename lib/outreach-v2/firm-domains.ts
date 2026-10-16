/**
 * Which web domain a firm is known to own, for the news notes (2026-10-16).
 *
 * The EQT draft of 2026-10-15 was addressed to a person at eqt.co, a record
 * label: Apollo's company search matched the three letters and nothing
 * checked that the company's domain was EQT's. So now a contact's company
 * domain must agree with what is known of the firm: the domain in the hand-
 * kept list (firm-sites.json, copied from the social desk's library) or the
 * domain a report of the story was published on (a firm's own press release);
 * and a firm whose name is four letters or fewer is never matched on its
 * name alone.
 *
 * Browser-safe: no server imports.
 */
import { normalizeFirmName } from '@/lib/news/story-dedup'
import sites from './firm-sites.json'

interface SiteEntry { names: string[]; site: string }

/** "https://www.kkr.com/" → "kkr.com". */
export const bareDomain = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#:]/)[0]

const byKey = new Map<string, string[]>()
for (const f of (sites as { firms: SiteEntry[] }).firms) {
  const domain = bareDomain(f.site)
  if (!domain) continue
  for (const name of f.names) {
    const key = normalizeFirmName(name)
    if (!key) continue
    const list = byKey.get(key) ?? []
    if (!list.includes(domain)) list.push(domain)
    byKey.set(key, list)
  }
}

/** The domains the list gives for a firm name, or none. */
export function knownFirmDomains(firm: string): string[] {
  const key = normalizeFirmName(firm)
  return key ? [...(byKey.get(key) ?? [])] : []
}

/** True when `domain` is `known` or a subdomain of it, or the other way about ("eqtgroup.com" ~ "www.eqtgroup.com"). */
export function domainsAgree(domain: string, known: string): boolean {
  const a = bareDomain(domain), b = bareDomain(known)
  if (!a || !b) return false
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`)
}

/** Letters only: "H.I.G." is three, "EQT" three, "Carlyle" seven. */
export const nameLetters = (firm: string): number => firm.replace(/[^A-Za-z]/g, '').length

/** A firm this short is matched on its domain or not at all. */
export const SHORT_NAME_LETTERS = 4

/**
 * Whether a contact's company domain may stand for the firm. `known` is what
 * is known of the firm's domains (the list, and where the story was reported).
 */
export function domainCheck(firm: string, orgDomain: string, known: string[]): { ok: true } | { ok: false; reason: string } {
  const d = bareDomain(orgDomain)
  if (!d) return { ok: false, reason: 'no firm domain' }
  if (known.length) {
    if (known.some((k) => domainsAgree(d, k))) return { ok: true }
    return { ok: false, reason: `company domain ${d} is not the firm's (${known.map(bareDomain).filter(Boolean).join(', ')})` }
  }
  if (nameLetters(firm) <= SHORT_NAME_LETTERS) return { ok: false, reason: `"${firm}" is too short a name to match without a known domain (${d})` }
  return { ok: true }
}
