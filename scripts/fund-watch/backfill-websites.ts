/**
 * Backfill firm_website field for existing funds
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { inferFirmWebsite } from './normalizer';

const FUND_DIRECTORY_PATH = path.resolve(process.cwd(), 'public/data/fund-directory.json');

async function main() {
  console.log('Reading fund directory...');
  const content = await fs.readFile(FUND_DIRECTORY_PATH, 'utf-8');
  const data = JSON.parse(content);

  console.log(`Processing ${data.funds.length} funds...`);

  let updated = 0;
  let alreadyHad = 0;
  let noMatch = 0;

  for (const fund of data.funds) {
    if (fund.firm_website) {
      alreadyHad++;
      continue;
    }

    const website = inferFirmWebsite(fund.firm, null);
    if (website) {
      fund.firm_website = website;
      updated++;
      console.log(`  ✓ ${fund.firm} → ${website}`);
    } else {
      fund.firm_website = null;
      noMatch++;
    }
  }

  console.log('\nSummary:');
  console.log(`  Already had website: ${alreadyHad}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  No match (set to null): ${noMatch}`);

  // Update timestamp
  data.generated_at = new Date().toISOString();

  console.log('\nSaving fund directory...');
  await fs.writeFile(FUND_DIRECTORY_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Done!');
}

main().catch(console.error);
