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

  // Check firm similarity
  const firmSimilar = similarityRatio(aFirm, bFirm) > 1 - threshold;

  // Check amount closeness (if both have amounts)
  const aAmount = 'amount_usd_millions' in a ? a.amount_usd_millions : null;
  const bAmount = 'amount_usd_millions' in b ? b.amount_usd_millions : null;

  let amountClose = true;
  if (aAmount && bAmount) {
    const variance =
      Math.abs(aAmount - bAmount) / Math.max(aAmount, bAmount);
    amountClose = variance < PIPELINE_CONFIG.AMOUNT_VARIANCE_THRESHOLD;
  }

  // Match if: (name AND firm similar) OR (firm similar AND amount close)
  return (nameSimilar && firmSimilar) || (firmSimilar && amountClose);
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
