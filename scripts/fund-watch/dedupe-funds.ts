/**
 * Remove duplicate funds from fund-directory.json
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const FUND_DIRECTORY_PATH = path.resolve(process.cwd(), 'public/data/fund-directory.json');

// Duplicates to remove (keep the first one, remove the second)
// Format: [fundNameToRemove, reason]
const DUPLICATES_TO_REMOVE = [
  // HighVista - same fund, keep the more detailed name
  ['HighVista Fund XI', 'Duplicate of HighVista Private Equity Fund XI'],

  // Hamilton Lane - same fund, keep the one with amount
  ['Hamilton Lane Infrastructure Fund', 'Duplicate of Infrastructure Opportunities Fund II ($2B)'],

  // Gore Street - same fund, keep the one with amount
  ['European-Focused Energy Storage Fund', 'Duplicate of Gore Street Capital Europe BESS Fund (€500M)'],

  // Blueprint - same fund, keep the named one
  ['Blueprint Equity Fund (unnamed/unspecified vintage)', 'Duplicate of Blueprint Equity Fund III'],

  // H.I.G. - same fund, keep the named one with amount
  ['European Lower Middle Market Private Equity Fund', 'Duplicate of H.I.G. Europe Capital Partners IV'],

  // IIT Bombay - same fund with different names
  ['Y-Point Venture Capital Fund', 'Duplicate of IIT Bombay Deep Tech Fund'],
];

async function main() {
  console.log('Reading fund directory...');
  const content = await fs.readFile(FUND_DIRECTORY_PATH, 'utf-8');
  const data = JSON.parse(content);

  const originalCount = data.funds.length;
  console.log(`Found ${originalCount} funds\n`);

  // Remove duplicates
  const namesToRemove = new Set(DUPLICATES_TO_REMOVE.map(([name]) => name));

  data.funds = data.funds.filter((fund: { fund_name: string }) => {
    if (namesToRemove.has(fund.fund_name)) {
      const reason = DUPLICATES_TO_REMOVE.find(([name]) => name === fund.fund_name)?.[1];
      console.log(`Removing: ${fund.fund_name}`);
      console.log(`  Reason: ${reason}\n`);
      return false;
    }
    return true;
  });

  const newCount = data.funds.length;
  console.log(`\nRemoved ${originalCount - newCount} duplicates`);
  console.log(`New total: ${newCount} funds`);

  // Update timestamp
  data.generated_at = new Date().toISOString();

  console.log('\nSaving fund directory...');
  await fs.writeFile(FUND_DIRECTORY_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Done!');
}

main().catch(console.error);
