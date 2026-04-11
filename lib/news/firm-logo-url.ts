/**
 * Shared firm-logo URL helpers used by both the web news feed
 * (components/news/ArticleRow.tsx) and the daily email newsletter
 * (lib/newsletter/email-template.ts). Keeping one resolver in one place
 * prevents the two surfaces from drifting apart.
 */

import { getFirmDomain, getSourceDomain } from './firm-logos'

/**
 * A "source name" that actually looks like a bare domain — e.g. when
 * the feed shows `barrons.com` or `wsj.com` as the source. Treat those
 * as the resolved domain directly instead of trying to map them.
 */
function domainLikeSourceName(sourceName: string | null): string | null {
  if (!sourceName) return null
  const trimmed = sourceName.trim().toLowerCase()
  if (!trimmed.includes('.') || /\s/.test(trimmed)) return null
  // Sanity: at least one alnum on both sides of each dot.
  if (!/^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+$/.test(trimmed)) return null
  return trimmed
}

/**
 * Resolve a firm/source to a website domain using five tiers:
 *   1. Curated FIRM_DOMAIN_MAP lookup by firm name (fixes wrong guesses
 *      from the ingestion-time Clearbit Autocomplete fallback).
 *   2. Domain stored on the article by the classification pipeline
 *      (extracted_data.firm_domain).
 *   3. SOURCE_DOMAIN_MAP lookup by publication name, so articles with
 *      no extracted firm still show the outlet's favicon.
 *   4. Curated FIRM_DOMAIN_MAP lookup by source name — some pubs double
 *      as firms (SS&C Technologies, Meyka), so this catches them
 *      without forcing duplicate entries in both maps.
 *   5. Pass-through for source names that are already bare domains
 *      (e.g. `wsj.com`, `moomoo.com`).
 */
export function resolveLogoDomain(
  firmName: string | null,
  firmDomain: string | null,
  sourceName: string | null,
): string | null {
  return (
    getFirmDomain(firmName) ??
    firmDomain ??
    getSourceDomain(sourceName) ??
    getFirmDomain(sourceName) ??
    domainLikeSourceName(sourceName)
  )
}

/**
 * Ordered list of logo URLs to try for a given domain. The web renderer
 * walks this list via `onError`; each later entry is a fallback for when
 * the previous source has no logo for the domain.
 *
 * Order rationale (post-2024, after Clearbit Logo CDN was retired):
 *   1. Google faviconV2 — broad coverage, sharp output, returns a real
 *      404 on miss so `onError` fires reliably.
 *   2. DuckDuckGo ip3 — independent index that often has favicons Google
 *      doesn't, covering the long tail of niche/boutique firms.
 */
export function getLogoCandidates(domain: string, size = 128): string[] {
  const host = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return [
    `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${host}&size=${size}`,
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
  ]
}

/**
 * First logo URL for a domain. Used by static renderers (email templates)
 * where a chained `onError` fallback isn't practical.
 */
export function getPrimaryLogoUrl(domain: string, size = 128): string {
  return getLogoCandidates(domain, size)[0]
}
