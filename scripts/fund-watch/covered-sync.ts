/**
 * Fund Watch Automation System - Covered Funds Sync
 *
 * Syncs covered-funds.json with fund-directory.json to track
 * which funds have been included in newsletters.
 */

import * as fs from 'fs/promises';
import type { Fund, CoveredFund, CoveredFundsFile } from './types';
import { PATHS } from './config';
import { createDedupeKey } from './deduplicator';

/**
 * Load covered funds from JSON file
 */
export async function loadCoveredFunds(): Promise<CoveredFundsFile> {
  try {
    const content = await fs.readFile(PATHS.COVERED_FUNDS, 'utf-8');
    return JSON.parse(content) as CoveredFundsFile;
  } catch (error) {
    console.warn('[CoveredSync] Could not load covered-funds.json, using empty list');
    return {
      last_updated: new Date().toISOString().split('T')[0],
      schema_version: '2.0',
      covered_funds: [],
    };
  }
}

/**
 * Save covered funds to JSON file
 */
export async function saveCoveredFunds(data: CoveredFundsFile): Promise<void> {
  // Ensure directory exists
  const dir = PATHS.COVERED_FUNDS.substring(0, PATHS.COVERED_FUNDS.lastIndexOf('/'));
  await fs.mkdir(dir, { recursive: true });

  // Update timestamp
  data.last_updated = new Date().toISOString().split('T')[0];

  await fs.writeFile(
    PATHS.COVERED_FUNDS,
    JSON.stringify(data, null, 2),
    'utf-8'
  );
}

/**
 * Check if a fund is already covered
 */
export function isFundCovered(
  fund: Fund,
  coveredFunds: CoveredFund[]
): boolean {
  const fundKey = createDedupeKey(fund);

  for (const covered of coveredFunds) {
    const coveredKey = createDedupeKey({
      fund_name: covered.fund_name,
      firm: covered.firm,
    } as Fund);

    if (fundKey.key === coveredKey.key) {
      return true;
    }
  }

  return false;
}

/**
 * Normalize fund name for matching
 */
function normalizeFundName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Sync covered status from covered-funds.json into fund-directory.json funds
 */
export function syncCoveredStatus(
  funds: Fund[],
  coveredFunds: CoveredFund[]
): Fund[] {
  // Build lookup map from covered funds
  const coveredMap = new Map<string, CoveredFund>();
  for (const covered of coveredFunds) {
    const key = normalizeFundName(covered.fund_name);
    coveredMap.set(key, covered);
  }

  // Also index by dedupe key
  const coveredKeyMap = new Map<string, CoveredFund>();
  for (const covered of coveredFunds) {
    const key = createDedupeKey({
      fund_name: covered.fund_name,
      firm: covered.firm,
    } as Fund);
    coveredKeyMap.set(key.key, covered);
  }

  // Update funds with covered status
  return funds.map((fund) => {
    // Check by normalized name
    const nameKey = normalizeFundName(fund.fund_name);
    const byName = coveredMap.get(nameKey);

    // Check by dedupe key
    const dedupeKey = createDedupeKey(fund);
    const byKey = coveredKeyMap.get(dedupeKey.key);

    const match = byName || byKey;

    if (match) {
      return {
        ...fund,
        is_covered: true,
        covered_date: match.date_covered,
      };
    }

    return fund;
  });
}

/**
 * Get uncovered funds from directory
 */
export function getUncoveredFunds(
  funds: Fund[],
  coveredFunds: CoveredFund[]
): Fund[] {
  const synced = syncCoveredStatus(funds, coveredFunds);
  return synced.filter((f) => !f.is_covered);
}

/**
 * Get funds ready for the next newsletter (uncovered, recent)
 */
export function getNewsletterCandidates(
  funds: Fund[],
  coveredFunds: CoveredFund[],
  maxAgeDays: number = 14
): Fund[] {
  const uncovered = getUncoveredFunds(funds, coveredFunds);

  // Filter by date
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const recent = uncovered.filter((f) => f.announcement_date >= cutoffStr);

  // Sort by amount (largest first), then by date (newest first)
  return recent.sort((a, b) => {
    // Amount descending (nulls last)
    if (a.amount_usd_millions !== b.amount_usd_millions) {
      if (a.amount_usd_millions === null) return 1;
      if (b.amount_usd_millions === null) return -1;
      return b.amount_usd_millions - a.amount_usd_millions;
    }
    // Date descending
    return b.announcement_date.localeCompare(a.announcement_date);
  });
}

/**
 * Mark funds as covered (add to covered-funds.json)
 */
export async function markFundsAsCovered(
  funds: Fund[]
): Promise<CoveredFundsFile> {
  const existing = await loadCoveredFunds();
  const today = new Date().toISOString().split('T')[0];

  // Convert funds to covered fund format
  const newCovered: CoveredFund[] = funds.map((f) => ({
    fund_name: f.fund_name,
    firm: f.firm,
    amount: f.amount,
    category: f.category,
    location: f.location,
    stage: f.stage,
    date_covered: today,
    announcement_date: f.announcement_date,
    source_url: f.source_url,
  }));

  // Dedupe against existing
  const existingKeys = new Set(
    existing.covered_funds.map((c) =>
      createDedupeKey({ fund_name: c.fund_name, firm: c.firm } as Fund).key
    )
  );

  const trulyNew = newCovered.filter((c) => {
    const key = createDedupeKey({
      fund_name: c.fund_name,
      firm: c.firm,
    } as Fund);
    return !existingKeys.has(key.key);
  });

  // Add new funds to existing list
  const updated: CoveredFundsFile = {
    ...existing,
    covered_funds: [...existing.covered_funds, ...trulyNew],
  };

  // Save
  await saveCoveredFunds(updated);

  console.log(
    `[CoveredSync] Added ${trulyNew.length} new funds to covered-funds.json`
  );

  return updated;
}

/**
 * Generate summary of covered vs uncovered funds
 */
export function generateCoverageSummary(
  funds: Fund[],
  coveredFunds: CoveredFund[]
): string {
  const synced = syncCoveredStatus(funds, coveredFunds);
  const covered = synced.filter((f) => f.is_covered);
  const uncovered = synced.filter((f) => !f.is_covered);

  // Group uncovered by category
  const uncoveredByCategory: Record<string, Fund[]> = {};
  for (const f of uncovered) {
    if (!uncoveredByCategory[f.category]) {
      uncoveredByCategory[f.category] = [];
    }
    uncoveredByCategory[f.category].push(f);
  }

  const lines = [
    `Coverage Summary`,
    `================`,
    `Total funds: ${synced.length}`,
    `Covered: ${covered.length}`,
    `Uncovered: ${uncovered.length}`,
    ``,
    `Uncovered by Category:`,
  ];

  for (const [category, funds] of Object.entries(uncoveredByCategory)) {
    lines.push(`  ${category}: ${funds.length}`);
  }

  return lines.join('\n');
}
