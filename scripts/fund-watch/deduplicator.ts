/**
 * Fund Watch Automation System - Deduplicator
 *
 * Detects and merges duplicate fund entries using exact and fuzzy matching.
 */

import { distance } from 'fastest-levenshtein';
import type { ExtractedFund, Fund, DedupeKey, DedupeResult } from './types';
import { FIRM_STOPWORDS, FUND_NUMBER_PATTERN, PIPELINE_CONFIG } from './config';

/**
 * Normalize firm name for deduplication
 * Removes common stopwords and special characters
 */
function normalizeFirmName(firm: string): string {
  let normalized = firm.toLowerCase();

  // Remove stopwords
  for (const word of FIRM_STOPWORDS) {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }

  // Remove special characters, keep only alphanumeric
  normalized = normalized.replace(/[^a-z0-9]/g, '');

  // Trim to first 15 chars for key generation
  return normalized.slice(0, 15);
}

/**
 * Extract fund number (I, II, III, IV, V, 1, 2, 3, etc.)
 */
function extractFundNumber(fundName: string): string {
  const match = fundName.match(FUND_NUMBER_PATTERN);
  return match ? match[1] : '';
}

/**
 * Create deduplication key for a fund
 */
export function createDedupeKey(fund: ExtractedFund | Fund): DedupeKey {
  const normalizedFirm = normalizeFirmName(fund.firm);
  const fundNumber = extractFundNumber(fund.fund_name);

  return {
    normalized_firm: normalizedFirm,
    fund_number: fundNumber,
    key: `${normalizedFirm}-${fundNumber}`,
  };
}

/**
 * Calculate Levenshtein similarity ratio
 */
function similarityRatio(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const maxLen = Math.max(a.length, b.length);
  return 1 - distance(a, b) / maxLen;
}

/**
 * Normalize fund name for comparison - strips common words
 */
function normalizeFundName(name: string): string {
  const stopwords = [
    'fund', 'funds', 'capital', 'partners', 'investments', 'investment',
    'management', 'ventures', 'equity', 'private', 'opportunities',
    'infrastructure', 'credit', 'real', 'estate', 'focused', 'european',
    'asia', 'americas', 'global', 'the', 'and', 'of', 'for', 'lp', 'llc',
  ];
  let normalized = name.toLowerCase();
  for (const word of stopwords) {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }
  return normalized.replace(/[^a-z0-9]/g, '');
}

/**
 * Check if dates are within N days of each other
 */
function datesWithinDays(dateA: string, dateB: string, days: number): boolean {
  try {
    const a = new Date(dateA);
    const b = new Date(dateB);
    const diffMs = Math.abs(a.getTime() - b.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  } catch {
    return false;
  }
}

/**
 * Check if two funds are similar using fuzzy matching
 */
export function isSimilarFund(
  a: ExtractedFund | Fund,
  b: ExtractedFund | Fund
): boolean {
  const threshold = PIPELINE_CONFIG.FUZZY_MATCH_THRESHOLD;

  // Normalize names for comparison
  const aName = a.fund_name.toLowerCase();
  const bName = b.fund_name.toLowerCase();
  const aFirm = a.firm.toLowerCase();
  const bFirm = b.firm.toLowerCase();

  // Check name similarity
  const nameSimilar = similarityRatio(aName, bName) > 1 - threshold;

  // Check firm similarity (also check if one contains the other)
  const firmSimilar = similarityRatio(aFirm, bFirm) > 1 - threshold;
  const firmContains = aFirm.includes(bFirm.slice(0, 8)) || bFirm.includes(aFirm.slice(0, 8));
  const sameFirm = firmSimilar || firmContains;

  // Check amount closeness (if both have amounts)
  const aAmount = 'amount_usd_millions' in a ? a.amount_usd_millions : null;
  const bAmount = 'amount_usd_millions' in b ? b.amount_usd_millions : null;

  let amountClose = false;
  let amountExact = false;
  if (aAmount && bAmount) {
    const variance = Math.abs(aAmount - bAmount) / Math.max(aAmount, bAmount);
    amountClose = variance < PIPELINE_CONFIG.AMOUNT_VARIANCE_THRESHOLD;
    amountExact = variance < 0.01; // Within 1%
  }

  // Check date proximity
  const dateA = 'announcement_date' in a ? a.announcement_date : '';
  const dateB = 'announcement_date' in b ? b.announcement_date : '';
  const datesClose = datesWithinDays(dateA, dateB, 3);

  // Check category match
  const sameCategory = a.category === b.category;

  // Check normalized fund names (strips common words)
  const aNorm = normalizeFundName(a.fund_name);
  const bNorm = normalizeFundName(b.fund_name);
  const normalizedSimilar = similarityRatio(aNorm, bNorm) > 0.6;

  // RULE 1: Standard fuzzy match (name AND firm similar)
  if (nameSimilar && sameFirm) return true;

  // RULE 2: Same firm + close amount
  if (sameFirm && amountClose) return true;

  // RULE 3: Same firm + same category + close dates (likely same fund with different article titles)
  if (sameFirm && sameCategory && datesClose) return true;

  // RULE 4: Same firm + exact amount + close dates (high confidence duplicate)
  if (sameFirm && amountExact && datesClose) return true;

  // RULE 5: Same firm + normalized names similar (strips common words)
  if (sameFirm && normalizedSimilar) return true;

  return false;
}

/**
 * Deduplicate extracted funds among themselves
 */
export function dedupeExtractedFunds(funds: ExtractedFund[]): DedupeResult {
  const keyMap = new Map<string, ExtractedFund>();
  const unique: ExtractedFund[] = [];
  const duplicates: DedupeResult['duplicates'] = [];

  for (const fund of funds) {
    const dedupeKey = createDedupeKey(fund);

    // Check exact key match
    const existing = keyMap.get(dedupeKey.key);
    if (existing) {
      duplicates.push({
        fund,
        matched_with: existing.fund_name,
        match_type: 'exact',
      });
      continue;
    }

    // Check fuzzy match against existing unique funds
    let fuzzyMatch: ExtractedFund | null = null;
    for (const uniqueFund of unique) {
      if (isSimilarFund(fund, uniqueFund)) {
        fuzzyMatch = uniqueFund;
        break;
      }
    }

    if (fuzzyMatch) {
      duplicates.push({
        fund,
        matched_with: fuzzyMatch.fund_name,
        match_type: 'fuzzy',
      });
      continue;
    }

    // No match found - this is unique
    keyMap.set(dedupeKey.key, fund);
    unique.push(fund);
  }

  console.log(
    `[Dedupe] ${funds.length} funds → ${unique.length} unique (${duplicates.length} duplicates)`
  );

  return { unique_funds: unique, duplicates };
}

/**
 * Check if a fund already exists in the directory
 */
export function fundExistsInDirectory(
  fund: ExtractedFund,
  existingFunds: Fund[]
): Fund | null {
  const dedupeKey = createDedupeKey(fund);

  // Check exact key match first
  for (const existing of existingFunds) {
    const existingKey = createDedupeKey(existing);
    if (dedupeKey.key === existingKey.key) {
      return existing;
    }
  }

  // Check fuzzy match
  for (const existing of existingFunds) {
    if (isSimilarFund(fund, existing)) {
      return existing;
    }
  }

  return null;
}

/**
 * Merge new fund data into existing fund (update if newer)
 */
export function mergeFundData(
  existing: Fund,
  newFund: ExtractedFund
): Fund {
  // Prefer newer data if announcement date is more recent
  const existingDate = new Date(existing.announcement_date);
  const newDate = new Date(newFund.announcement_date);

  if (newDate > existingDate) {
    // New data is more recent - update relevant fields
    return {
      ...existing,
      amount: newFund.amount || existing.amount,
      amount_usd_millions:
        newFund.amount_usd_millions ?? existing.amount_usd_millions,
      stage: newFund.stage || existing.stage,
      announcement_date: newFund.announcement_date,
      description_notes: newFund.description_notes || existing.description_notes,
      // Add new article to articles array
      articles: [
        ...existing.articles,
        {
          title: `Update: ${newFund.fund_name}`,
          url: newFund.source_url,
          source_name: newFund.source_name,
          source_domain: extractDomain(newFund.source_url),
          published_date: newFund.announcement_date,
          summary: newFund.description_notes,
          feed_name: 'update',
        },
      ],
    };
  }

  // Existing data is same or newer - don't update
  return existing;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

/**
 * Scan existing directory for potential duplicates
 * Returns pairs of funds that might be duplicates for manual review
 */
export function findPotentialDuplicates(
  funds: Fund[]
): Array<{ fund1: Fund; fund2: Fund; reason: string }> {
  const duplicates: Array<{ fund1: Fund; fund2: Fund; reason: string }> = [];

  for (let i = 0; i < funds.length; i++) {
    for (let j = i + 1; j < funds.length; j++) {
      const a = funds[i];
      const b = funds[j];

      // Skip if different firms (normalized)
      const aFirmNorm = normalizeFirmName(a.firm);
      const bFirmNorm = normalizeFirmName(b.firm);
      if (similarityRatio(aFirmNorm, bFirmNorm) < 0.7) continue;

      // Check various duplicate signals
      const reasons: string[] = [];

      // Same amount
      if (a.amount_usd_millions && b.amount_usd_millions) {
        const variance = Math.abs(a.amount_usd_millions - b.amount_usd_millions) /
          Math.max(a.amount_usd_millions, b.amount_usd_millions);
        if (variance < 0.05) reasons.push(`same amount ($${a.amount_usd_millions}M)`);
      }

      // Close dates
      if (datesWithinDays(a.announcement_date, b.announcement_date, 3)) {
        reasons.push('dates within 3 days');
      }

      // Same category
      if (a.category === b.category) {
        reasons.push(`same category (${a.category})`);
      }

      // Similar normalized names
      const aNorm = normalizeFundName(a.fund_name);
      const bNorm = normalizeFundName(b.fund_name);
      if (similarityRatio(aNorm, bNorm) > 0.5) {
        reasons.push('similar normalized names');
      }

      // If 3+ signals, flag as potential duplicate
      if (reasons.length >= 3) {
        duplicates.push({
          fund1: a,
          fund2: b,
          reason: reasons.join(', '),
        });
      }
    }
  }

  return duplicates;
}

/**
 * Check if fund is in covered-funds list
 */
export function isFundCovered(
  fund: ExtractedFund,
  coveredFunds: Array<{ fund_name: string; firm: string }>
): boolean {
  const dedupeKey = createDedupeKey(fund);

  for (const covered of coveredFunds) {
    const coveredKey = createDedupeKey({
      fund_name: covered.fund_name,
      firm: covered.firm,
    } as ExtractedFund);

    if (dedupeKey.key === coveredKey.key) {
      return true;
    }

    // Also check fuzzy match on fund name
    const nameSimilar =
      similarityRatio(
        fund.fund_name.toLowerCase(),
        covered.fund_name.toLowerCase()
      ) > 0.8;
    const firmSimilar =
      similarityRatio(fund.firm.toLowerCase(), covered.firm.toLowerCase()) >
      0.8;

    if (nameSimilar && firmSimilar) {
      return true;
    }
  }

  return false;
}
