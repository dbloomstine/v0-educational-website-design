/**
 * Fund Watch Data Quality Script
 *
 * Scans fund-directory.json for data gaps and attempts to fill them.
 * Run with: npx tsx scripts/fund-watch/data-quality.ts [--fix] [--report-only]
 *
 * Flags:
 *   --fix          Apply fixes automatically
 *   --report-only  Only show report, don't prompt for fixes
 *   --verbose      Show detailed output for each fund
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import { PATHS } from './config';
import {
  inferFirmWebsite,
  inferStrategy,
  inferGeography,
  inferLocationFromFirm,
  normalizeLocation,
} from './normalizer';
import type { Fund, FundCategory } from './types';

// ============================================================================
// Types
// ============================================================================

interface DataGap {
  field: string;
  count: number;
  percentage: string;
  funds: Array<{ fund_name: string; firm: string }>;
}

interface QualityReport {
  total_funds: number;
  gaps: DataGap[];
  fixable: {
    firm_website: number;
    strategy: number;
    target_geography: number;
    location: number;
  };
  generated_at: string;
}

interface FixResult {
  field: string;
  fund_name: string;
  firm: string;
  old_value: string | null;
  new_value: string;
}

// ============================================================================
// Quality Checks
// ============================================================================

function checkDataQuality(funds: Fund[]): QualityReport {
  const gaps: DataGap[] = [];

  // Check firm_website
  const missingWebsite = funds.filter((f) => !f.firm_website);
  if (missingWebsite.length > 0) {
    gaps.push({
      field: 'firm_website',
      count: missingWebsite.length,
      percentage: ((missingWebsite.length / funds.length) * 100).toFixed(1),
      funds: missingWebsite.slice(0, 10).map((f) => ({
        fund_name: f.fund_name,
        firm: f.firm,
      })),
    });
  }

  // Check strategy
  const missingStrategy = funds.filter((f) => !f.strategy);
  if (missingStrategy.length > 0) {
    gaps.push({
      field: 'strategy',
      count: missingStrategy.length,
      percentage: ((missingStrategy.length / funds.length) * 100).toFixed(1),
      funds: missingStrategy.slice(0, 10).map((f) => ({
        fund_name: f.fund_name,
        firm: f.firm,
      })),
    });
  }

  // Check target_geography
  const missingGeography = funds.filter((f) => !f.target_geography);
  if (missingGeography.length > 0) {
    gaps.push({
      field: 'target_geography',
      count: missingGeography.length,
      percentage: ((missingGeography.length / funds.length) * 100).toFixed(1),
      funds: missingGeography.slice(0, 10).map((f) => ({
        fund_name: f.fund_name,
        firm: f.firm,
      })),
    });
  }

  // Check city (not N/A)
  const missingCity = funds.filter((f) => !f.city || f.city === 'N/A');
  if (missingCity.length > 0) {
    gaps.push({
      field: 'city',
      count: missingCity.length,
      percentage: ((missingCity.length / funds.length) * 100).toFixed(1),
      funds: missingCity.slice(0, 10).map((f) => ({
        fund_name: f.fund_name,
        firm: f.firm,
      })),
    });
  }

  // Check amount (undisclosed)
  const undisclosedAmount = funds.filter(
    (f) => !f.amount_usd_millions || f.amount === 'Undisclosed'
  );
  if (undisclosedAmount.length > 0) {
    gaps.push({
      field: 'amount (undisclosed)',
      count: undisclosedAmount.length,
      percentage: ((undisclosedAmount.length / funds.length) * 100).toFixed(1),
      funds: undisclosedAmount.slice(0, 10).map((f) => ({
        fund_name: f.fund_name,
        firm: f.firm,
      })),
    });
  }

  // Count fixable items
  let fixableWebsite = 0;
  let fixableStrategy = 0;
  let fixableGeography = 0;
  let fixableLocation = 0;

  for (const fund of funds) {
    if (!fund.firm_website) {
      const inferred = inferFirmWebsite(fund.firm, null);
      if (inferred) fixableWebsite++;
    }

    if (!fund.strategy) {
      const inferred = inferStrategy(
        fund.fund_name,
        fund.category as FundCategory,
        fund.description_notes,
        null
      );
      if (inferred) fixableStrategy++;
    }

    if (!fund.target_geography) {
      const inferred = inferGeography(
        fund.fund_name,
        fund.description_notes,
        fund.country,
        null
      );
      if (inferred) fixableGeography++;
    }

    if (!fund.city || fund.city === 'N/A') {
      const inferred = inferLocationFromFirm(fund.firm);
      if (inferred) fixableLocation++;
    }
  }

  return {
    total_funds: funds.length,
    gaps,
    fixable: {
      firm_website: fixableWebsite,
      strategy: fixableStrategy,
      target_geography: fixableGeography,
      location: fixableLocation,
    },
    generated_at: new Date().toISOString(),
  };
}

// ============================================================================
// Auto-Fix Functions
// ============================================================================

function applyFixes(funds: Fund[], verbose: boolean): FixResult[] {
  const fixes: FixResult[] = [];

  for (const fund of funds) {
    // Fix firm_website
    if (!fund.firm_website) {
      const inferred = inferFirmWebsite(fund.firm, null);
      if (inferred) {
        fixes.push({
          field: 'firm_website',
          fund_name: fund.fund_name,
          firm: fund.firm,
          old_value: null,
          new_value: inferred,
        });
        fund.firm_website = inferred;
        if (verbose) {
          console.log(`  [website] ${fund.firm} → ${inferred}`);
        }
      }
    }

    // Fix strategy
    if (!fund.strategy) {
      const inferred = inferStrategy(
        fund.fund_name,
        fund.category as FundCategory,
        fund.description_notes,
        null
      );
      if (inferred) {
        fixes.push({
          field: 'strategy',
          fund_name: fund.fund_name,
          firm: fund.firm,
          old_value: null,
          new_value: inferred,
        });
        fund.strategy = inferred;
        if (verbose) {
          console.log(`  [strategy] ${fund.fund_name} → ${inferred}`);
        }
      }
    }

    // Fix target_geography
    if (!fund.target_geography) {
      const inferred = inferGeography(
        fund.fund_name,
        fund.description_notes,
        fund.country,
        null
      );
      if (inferred) {
        fixes.push({
          field: 'target_geography',
          fund_name: fund.fund_name,
          firm: fund.firm,
          old_value: null,
          new_value: inferred,
        });
        fund.target_geography = inferred;
        if (verbose) {
          console.log(`  [geography] ${fund.fund_name} → ${inferred}`);
        }
      }
    }

    // Fix location from firm HQ
    if (!fund.city || fund.city === 'N/A') {
      const inferred = inferLocationFromFirm(fund.firm);
      if (inferred) {
        fixes.push({
          field: 'location',
          fund_name: fund.fund_name,
          firm: fund.firm,
          old_value: fund.location,
          new_value: normalizeLocation(inferred.city, inferred.state, inferred.country),
        });
        fund.city = inferred.city;
        fund.state = inferred.state;
        fund.country = inferred.country;
        fund.location = normalizeLocation(inferred.city, inferred.state, inferred.country);
        if (verbose) {
          console.log(`  [location] ${fund.firm} → ${fund.location}`);
        }
      }
    }
  }

  return fixes;
}

// ============================================================================
// Report Printing
// ============================================================================

function printReport(report: QualityReport) {
  console.log('\n' + '='.repeat(60));
  console.log('FUND WATCH DATA QUALITY REPORT');
  console.log('='.repeat(60));
  console.log(`Total funds: ${report.total_funds}`);
  console.log(`Generated: ${report.generated_at}`);
  console.log('');

  if (report.gaps.length === 0) {
    console.log('No data gaps found!');
  } else {
    console.log('DATA GAPS:');
    console.log('-'.repeat(60));

    for (const gap of report.gaps) {
      console.log(`\n${gap.field}:`);
      console.log(`  Missing: ${gap.count} funds (${gap.percentage}%)`);
      console.log(`  Examples:`);
      for (const f of gap.funds.slice(0, 5)) {
        console.log(`    - ${f.fund_name} (${f.firm})`);
      }
      if (gap.funds.length > 5) {
        console.log(`    ... and ${gap.funds.length - 5} more`);
      }
    }
  }

  console.log('\n' + '-'.repeat(60));
  console.log('AUTO-FIXABLE:');
  console.log(`  firm_website:     ${report.fixable.firm_website} funds`);
  console.log(`  strategy:         ${report.fixable.strategy} funds`);
  console.log(`  target_geography: ${report.fixable.target_geography} funds`);
  console.log(`  location:         ${report.fixable.location} funds`);

  const totalFixable =
    report.fixable.firm_website +
    report.fixable.strategy +
    report.fixable.target_geography +
    report.fixable.location;
  console.log(`  TOTAL:            ${totalFixable} fixes available`);
  console.log('='.repeat(60) + '\n');
}

// ============================================================================
// User Prompt
// ============================================================================

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const autoFix = args.includes('--fix');
  const reportOnly = args.includes('--report-only');
  const verbose = args.includes('--verbose');

  console.log('Loading fund directory...');
  const filePath = path.resolve(process.cwd(), PATHS.FUND_DIRECTORY);
  const content = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(content);

  console.log(`Analyzing ${data.funds.length} funds...`);

  // Generate report
  const report = checkDataQuality(data.funds);
  printReport(report);

  // Check if there's anything to fix
  const totalFixable =
    report.fixable.firm_website +
    report.fixable.strategy +
    report.fixable.target_geography +
    report.fixable.location;

  if (totalFixable === 0) {
    console.log('No auto-fixable issues found.');
    return;
  }

  if (reportOnly) {
    console.log('Report-only mode. No changes made.');
    return;
  }

  // Apply fixes
  let shouldFix = autoFix;
  if (!autoFix) {
    const answer = await askQuestion('Apply auto-fixes? (y/n): ');
    shouldFix = answer === 'y' || answer === 'yes';
  }

  if (shouldFix) {
    console.log('\nApplying fixes...');
    const fixes = applyFixes(data.funds, verbose);

    // Group fixes by field
    const fixesByField: Record<string, number> = {};
    for (const fix of fixes) {
      fixesByField[fix.field] = (fixesByField[fix.field] || 0) + 1;
    }

    console.log('\nFixes applied:');
    for (const [field, count] of Object.entries(fixesByField)) {
      console.log(`  ${field}: ${count} funds updated`);
    }

    // Save updated data
    data.generated_at = new Date().toISOString();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\nSaved ${fixes.length} fixes to fund-directory.json`);

    // Show remaining gaps
    console.log('\nRe-analyzing for remaining gaps...');
    const postReport = checkDataQuality(data.funds);
    const remainingGaps = postReport.gaps.filter((g) => g.count > 0);

    if (remainingGaps.length > 0) {
      console.log('\nRemaining gaps (require manual data or web search):');
      for (const gap of remainingGaps) {
        console.log(`  ${gap.field}: ${gap.count} funds (${gap.percentage}%)`);
      }
    } else {
      console.log('\nAll data gaps resolved!');
    }
  } else {
    console.log('No changes made.');
  }
}

main().catch(console.error);
