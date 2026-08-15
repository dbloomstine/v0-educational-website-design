/**
 * Resolve firm names to website domains using curated map + Clearbit Autocomplete API.
 * Checks the curated FIRM_DOMAIN_MAP first, then falls back to Clearbit.
 */

import { getFirmDomain } from './firm-logos';

const firmDomainCache = new Map<string, string | null>();

/** Strip corporate suffixes that cause Clearbit lookups to fail */
function normalizeFirmName(name: string): string {
  return name
    .replace(/,?\s*(Inc\.?|LLC|Ltd\.?|L\.?P\.?|PLC|Corp\.?|Co\.?|S\.?A\.?|AG|GmbH|N\.?V\.?|Group)$/i, '')
    .trim();
}

/** Tokens that don't distinguish one firm from another. */
const GENERIC_TOKENS = new Set([
  'inc', 'llc', 'ltd', 'lp', 'llp', 'plc', 'corp', 'co', 'company', 'group',
  'partners', 'capital', 'management', 'advisors', 'advisers', 'ventures',
  'holdings', 'asset', 'assets', 'fund', 'funds', 'investments', 'investment',
  'global', 'international', 'the', 'and', 'vc', 'pe',
]);

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

/**
 * Accept a Clearbit suggestion only when its company name actually matches
 * the firm we asked about. The unvalidated version took suggestion[0]
 * verbatim, which resolved the fund manager "EMERGING" to emergingtravel.com
 * (Emerging Travel Group) — a wrong favicon shipped to every subscriber. A
 * missed lookup renders as an initial tile; a wrong match renders as another
 * company's logo. The tile is the better failure.
 */
function isAcceptableSuggestion(query: string, suggestionName: string): boolean {
  const q = tokenize(query);
  const s = tokenize(suggestionName);
  const qDistinct = q.filter((t) => !GENERIC_TOKENS.has(t));
  const sDistinct = s.filter((t) => !GENERIC_TOKENS.has(t));

  // All-generic query ("Capital Group"): require exact full-name match.
  if (qDistinct.length === 0) return q.join(' ') === s.join(' ');

  // Every distinctive query token must appear in the suggestion (prefix
  // match tolerates plurals/possessives).
  const inSuggestion = (t: string) => s.some((st) => st.startsWith(t) || t.startsWith(st));
  if (!qDistinct.every(inSuggestion)) return false;

  // Single-token queries are the dangerous case ("Emerging", "Meridian"):
  // reject suggestions that add distinctive tokens of their own, since
  // those are usually a different company that merely shares the word.
  if (qDistinct.length === 1) {
    const inQuery = (t: string) => q.some((qt) => qt.startsWith(t) || t.startsWith(qt));
    if (sDistinct.some((t) => !inQuery(t))) return false;
  }

  return true;
}

/**
 * Resolve a firm name to its website domain.
 * First checks the curated domain map, then falls back to Clearbit autocomplete.
 * Returns the domain (e.g. "carlyle.com") or null if not found.
 */
export async function resolveFirmDomain(firmName: string): Promise<string | null> {
  if (!firmName) return null;

  const cached = firmDomainCache.get(firmName);
  if (cached !== undefined) return cached;

  // Check curated domain map first (instant, no API call)
  const curated = getFirmDomain(firmName) || getFirmDomain(normalizeFirmName(firmName));
  if (curated) {
    firmDomainCache.set(firmName, curated);
    return curated;
  }

  // Fall back to Clearbit autocomplete
  const namesToTry = [firmName];
  const normalized = normalizeFirmName(firmName);
  if (normalized !== firmName) namesToTry.push(normalized);

  for (const name of namesToTry) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(
        `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(name)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (!res.ok) continue;

      const results = (await res.json()) as Array<{ name: string; domain: string; logo: string }>;
      const match = (results ?? [])
        .slice(0, 3)
        .find((r) => r.domain && isAcceptableSuggestion(name, r.name));
      if (match) {
        firmDomainCache.set(firmName, match.domain);
        return match.domain;
      }
    } catch {
      // Timeout or network error — try next variant
    }
  }

  firmDomainCache.set(firmName, null);
  return null;
}
