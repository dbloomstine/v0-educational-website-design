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
      const domain = results?.[0]?.domain ?? null;
      if (domain) {
        firmDomainCache.set(firmName, domain);
        return domain;
      }
    } catch {
      // Timeout or network error — try next variant
    }
  }

  firmDomainCache.set(firmName, null);
  return null;
}
