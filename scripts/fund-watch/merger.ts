/**
 * Fund Watch Automation System - Merger
 *
 * Merges new funds into the existing fund-directory.json.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  Fund,
  FundDirectory,
  FeedHealth,
  ExtractedFund,
  FundDirectoryStats,
  FundCategory,
  FundStage,
} from './types';
import { PATHS } from './config';
import { fundExistsInDirectory, mergeFundData, createDedupeKey } from './deduplicator';
import { enrichFund } from './fund-extractor';
import { inferFirmWebsite } from './normalizer';

/**
 * Load fund directory from JSON file
 */
export async function loadFundDirectory(): Promise<FundDirectory> {
  const filePath = path.resolve(process.cwd(), PATHS.FUND_DIRECTORY);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as FundDirectory;
  } catch (error) {
    console.error('[Merger] Could not load fund-directory.json:', error);
    throw error;
  }
}

/**
 * Save fund directory to JSON file
 */
export async function saveFundDirectory(data: FundDirectory): Promise<void> {
  const filePath = path.resolve(process.cwd(), PATHS.FUND_DIRECTORY);

  // Update generated_at timestamp
  data.generated_at = new Date().toISOString();

  // Recalculate stats
  data.stats = calculateStats(data.funds, data.feed_health);

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[Merger] Saved fund directory with ${data.funds.length} funds`);
}

/**
 * Calculate directory statistics
 */
function calculateStats(
  funds: Fund[],
  feedHealth: FeedHealth[]
): FundDirectoryStats {
  const byCategory: Record<FundCategory, number> = {
    'Venture Capital': 0,
    'Private Equity': 0,
    'Credit Funds': 0,
    'Real Estate': 0,
    'Infrastructure': 0,
    'Secondaries & GP-Stakes': 0,
  };

  const byStage: Record<FundStage, number> = {
    'Final Close': 0,
    'First Close': 0,
    'Interim Close': 0,
    'Launch': 0,
    'Other': 0,
  };

  let totalAum = 0;
  let covered = 0;
  let articleCount = 0;
  let earliest = '';
  let latest = '';

  for (const fund of funds) {
    // Category count
    if (byCategory[fund.category] !== undefined) {
      byCategory[fund.category]++;
    }

    // Stage count
    if (byStage[fund.stage] !== undefined) {
      byStage[fund.stage]++;
    }

    // AUM
    if (fund.amount_usd_millions) {
      totalAum += fund.amount_usd_millions;
    }

    // Covered count
    if (fund.is_covered) {
      covered++;
    }

    // Article count
    articleCount += fund.articles?.length || 0;

    // Date range
    if (!earliest || fund.announcement_date < earliest) {
      earliest = fund.announcement_date;
    }
    if (!latest || fund.announcement_date > latest) {
      latest = fund.announcement_date;
    }
  }

  return {
    total_funds: funds.length,
    total_covered: covered,
    total_uncovered: funds.length - covered,
    total_aum_millions: Math.round(totalAum * 10) / 10,
    by_category: byCategory,
    by_stage: byStage,
    article_count: articleCount,
    feed_count: feedHealth.length,
    date_range: {
      earliest: earliest || new Date().toISOString().split('T')[0],
      latest: latest || new Date().toISOString().split('T')[0],
    },
  };
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
 * Convert ExtractedFund to full Fund object
 */
function extractedToFund(extracted: ExtractedFund): Fund {
  const enriched = enrichFund(extracted);

  return {
    fund_name: enriched.fund_name,
    firm: enriched.firm,
    firm_slug: enriched.firm_slug,
    firm_website: inferFirmWebsite(enriched.firm, enriched.firm_website),
    amount: enriched.amount,
    amount_usd_millions: enriched.amount_usd_millions,
    category: enriched.category,
    location: enriched.location,
    city: enriched.city,
    state: enriched.state,
    country: enriched.country,
    stage: enriched.stage,
    announcement_date: enriched.announcement_date,
    source_url: enriched.source_url,
    source_name: enriched.source_name,
    description_notes: enriched.description_notes,
    is_covered: false,
    covered_date: null,
    date_added: new Date().toISOString(),
    articles: [
      {
        title: enriched.fund_name,
        url: enriched.source_url,
        source_name: enriched.source_name,
        source_domain: extractDomain(enriched.source_url),
        published_date: enriched.announcement_date,
        summary: enriched.description_notes,
        feed_name: 'initial',
      },
    ],
  };
}

/**
 * Merge new funds into existing directory
 */
export function mergeFunds(
  existingFunds: Fund[],
  newFunds: ExtractedFund[]
): { funds: Fund[]; added: Fund[]; updated: Fund[] } {
  const added: Fund[] = [];
  const updated: Fund[] = [];
  const fundsCopy = [...existingFunds];

  for (const newFund of newFunds) {
    const existingMatch = fundExistsInDirectory(newFund, fundsCopy);

    if (existingMatch) {
      // Update existing fund with new data if applicable
      const merged = mergeFundData(existingMatch, newFund);
      if (merged !== existingMatch) {
        // Find and replace in copy
        const idx = fundsCopy.findIndex(
          (f) => createDedupeKey(f).key === createDedupeKey(existingMatch).key
        );
        if (idx >= 0) {
          fundsCopy[idx] = merged;
          updated.push(merged);
        }
      }
    } else {
      // Add new fund
      const fullFund = extractedToFund(newFund);
      fundsCopy.push(fullFund);
      added.push(fullFund);
    }
  }

  console.log(
    `[Merger] Added ${added.length} new funds, updated ${updated.length} existing funds`
  );

  // Sort by announcement date (newest first), then by amount (largest first)
  fundsCopy.sort((a, b) => {
    // Date descending
    const dateCompare = b.announcement_date.localeCompare(a.announcement_date);
    if (dateCompare !== 0) return dateCompare;

    // Amount descending (nulls last)
    if (a.amount_usd_millions !== b.amount_usd_millions) {
      if (a.amount_usd_millions === null) return 1;
      if (b.amount_usd_millions === null) return -1;
      return b.amount_usd_millions - a.amount_usd_millions;
    }

    return 0;
  });

  return { funds: fundsCopy, added, updated };
}

/**
 * Full merge operation: load, merge, save
 */
export async function mergeNewFunds(
  newFunds: ExtractedFund[],
  healthUpdates: FeedHealth[]
): Promise<{ added: Fund[]; updated: Fund[] }> {
  // Load existing
  const directory = await loadFundDirectory();

  // Merge funds
  const { funds, added, updated } = mergeFunds(directory.funds, newFunds);

  // Update feed health
  const healthMap = new Map<string, FeedHealth>();
  for (const h of directory.feed_health) {
    healthMap.set(h.feed_url, h);
  }
  for (const h of healthUpdates) {
    healthMap.set(h.feed_url, h);
  }

  // Save updated directory
  const updatedDirectory: FundDirectory = {
    ...directory,
    funds,
    feed_health: Array.from(healthMap.values()),
  };

  await saveFundDirectory(updatedDirectory);

  return { added, updated };
}

/**
 * Get directory summary
 */
export function getDirectorySummary(directory: FundDirectory): string {
  const { stats } = directory;

  const lines = [
    `Fund Directory Summary`,
    `======================`,
    `Total Funds: ${stats.total_funds}`,
    `Total AUM: $${(stats.total_aum_millions / 1000).toFixed(1)}B`,
    `Covered: ${stats.total_covered}`,
    `Uncovered: ${stats.total_uncovered}`,
    ``,
    `By Category:`,
  ];

  for (const [category, count] of Object.entries(stats.by_category)) {
    lines.push(`  ${category}: ${count}`);
  }

  lines.push('');
  lines.push(`By Stage:`);
  for (const [stage, count] of Object.entries(stats.by_stage)) {
    lines.push(`  ${stage}: ${count}`);
  }

  lines.push('');
  lines.push(`Date Range: ${stats.date_range.earliest} to ${stats.date_range.latest}`);
  lines.push(`Active Feeds: ${stats.feed_count}`);

  return lines.join('\n');
}
