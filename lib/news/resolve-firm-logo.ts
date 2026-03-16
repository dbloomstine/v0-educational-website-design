/**
 * Resolve firm names to website domains using Clearbit Autocomplete API.
 * Free, no API key needed. Results are cached in-memory per run.
 */

const firmDomainCache = new Map<string, string | null>();

/** Strip corporate suffixes that cause Clearbit lookups to fail */
function normalizeFirmName(name: string): string {
  return name
    .replace(/,?\s*(Inc\.?|LLC|Ltd\.?|L\.?P\.?|PLC|Corp\.?|Co\.?|S\.?A\.?|AG|GmbH|N\.?V\.?)$/i, '')
    .trim();
}

/**
 * Resolve a firm name to its website domain via Clearbit autocomplete.
 * Returns the domain (e.g. "carlyle.com") or null if not found.
 * Uses a 3-second timeout to avoid slowing down classification.
 */
export async function resolveFirmDomain(firmName: string): Promise<string | null> {
  if (!firmName) return null;

  const cached = firmDomainCache.get(firmName);
  if (cached !== undefined) return cached;

  // Try the original name first, then the normalized version without suffixes
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
