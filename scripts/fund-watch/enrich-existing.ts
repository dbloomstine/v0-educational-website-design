/**
 * Fund Watch - Enrich Existing Funds
 *
 * Populates strategy and target_geography fields for existing funds
 * using inference logic from normalizer.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { FundDirectory, FundStrategy, TargetGeography } from './types';
import { PATHS } from './config';
import { inferStrategy, inferGeography } from './normalizer';

async function main() {
  const filePath = path.resolve(process.cwd(), PATHS.FUND_DIRECTORY);

  console.log('[Enrich] Loading fund directory...');
  const content = await fs.readFile(filePath, 'utf-8');
  const directory: FundDirectory = JSON.parse(content);

  console.log(`[Enrich] Found ${directory.funds.length} funds`);

  let strategyCount = 0;
  let geographyCount = 0;
  let alreadyHadStrategy = 0;
  let alreadyHadGeography = 0;

  for (const fund of directory.funds) {
    // Strategy
    if (fund.strategy) {
      alreadyHadStrategy++;
    } else {
      const inferred = inferStrategy(
        fund.fund_name,
        fund.category,
        fund.description_notes,
        null
      );
      if (inferred) {
        fund.strategy = inferred;
        strategyCount++;
      }
    }

    // Geography
    if (fund.target_geography) {
      alreadyHadGeography++;
    } else {
      const inferred = inferGeography(
        fund.fund_name,
        fund.description_notes,
        fund.country,
        null
      );
      if (inferred) {
        fund.target_geography = inferred;
        geographyCount++;
      }
    }
  }

  // Compute unique strategies and geographies
  const strategies = new Set<FundStrategy>();
  const geographies = new Set<TargetGeography>();

  for (const fund of directory.funds) {
    if (fund.strategy) strategies.add(fund.strategy);
    if (fund.target_geography) geographies.add(fund.target_geography);
  }

  directory.strategies = [...strategies].sort();
  directory.geographies = [...geographies].sort();

  // Update stats
  const byStrategy: Record<string, number> = {};
  const byGeography: Record<string, number> = {};

  for (const fund of directory.funds) {
    if (fund.strategy) {
      byStrategy[fund.strategy] = (byStrategy[fund.strategy] || 0) + 1;
    }
    if (fund.target_geography) {
      byGeography[fund.target_geography] = (byGeography[fund.target_geography] || 0) + 1;
    }
  }

  directory.stats.by_strategy = byStrategy;
  directory.stats.by_geography = byGeography;
  directory.generated_at = new Date().toISOString();

  // Save
  await fs.writeFile(filePath, JSON.stringify(directory, null, 2), 'utf-8');

  console.log('\n[Enrich] Results:');
  console.log(`  Strategies inferred: ${strategyCount} (${alreadyHadStrategy} already had one)`);
  console.log(`  Geographies inferred: ${geographyCount} (${alreadyHadGeography} already had one)`);
  console.log(`\n[Enrich] Unique strategies: ${directory.strategies.length}`);
  console.log(`  ${directory.strategies.join(', ')}`);
  console.log(`\n[Enrich] Unique geographies: ${directory.geographies.length}`);
  console.log(`  ${directory.geographies.join(', ')}`);
  console.log(`\n[Enrich] Saved updated fund directory`);
}

main().catch(console.error);
