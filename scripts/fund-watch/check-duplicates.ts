/**
 * Check fund directory for potential duplicates
 *
 * Run with: npx tsx scripts/fund-watch/check-duplicates.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { findPotentialDuplicates } from './deduplicator';
import type { Fund } from './types';

const FUND_DIRECTORY_PATH = path.resolve(process.cwd(), 'public/data/fund-directory.json');

async function main() {
  console.log('Loading fund directory...\n');
  const content = await fs.readFile(FUND_DIRECTORY_PATH, 'utf-8');
  const data = JSON.parse(content);
  const funds: Fund[] = data.funds;

  console.log(`Scanning ${funds.length} funds for potential duplicates...\n`);

  const duplicates = findPotentialDuplicates(funds);

  if (duplicates.length === 0) {
    console.log('✓ No potential duplicates found!\n');
    return;
  }

  console.log(`⚠ Found ${duplicates.length} potential duplicate pair(s):\n`);
  console.log('='.repeat(80));

  for (const { fund1, fund2, reason } of duplicates) {
    console.log(`\nPOTENTIAL DUPLICATE:`);
    console.log(`  1. ${fund1.fund_name}`);
    console.log(`     Firm: ${fund1.firm} | Amount: ${fund1.amount} | Date: ${fund1.announcement_date}`);
    console.log(`  2. ${fund2.fund_name}`);
    console.log(`     Firm: ${fund2.firm} | Amount: ${fund2.amount} | Date: ${fund2.announcement_date}`);
    console.log(`  Reason: ${reason}`);
    console.log('-'.repeat(80));
  }

  console.log(`\nTo remove duplicates, update scripts/fund-watch/dedupe-funds.ts`);
  console.log('and run: npx tsx scripts/fund-watch/dedupe-funds.ts\n');
}

main().catch(console.error);
