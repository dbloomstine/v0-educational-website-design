#!/usr/bin/env npx tsx
/**
 * Fund Watch Automation System - Main Entry Point
 *
 * Orchestrates the full fund watch pipeline:
 * 1. Fetch RSS feeds and Google News
 * 2. Filter articles for fund news
 * 3. Extract structured fund data
 * 4. Deduplicate and normalize
 * 5. Merge into fund-directory.json
 * 6. Sync with covered-funds.json
 *
 * Usage:
 *   npx tsx scripts/fund-watch/index.ts [options]
 *
 * Options:
 *   --dry-run     Process but don't save changes
 *   --verbose     Enable verbose logging
 *   --skip-google Skip Google News searches
 *   --skip-api    Skip Claude API calls (use pre-filtered articles)
 */

import type { PipelineContext, PipelineResult, ExtractedFund, FeedHealth } from './types';
import { FEEDS } from './config';
import { fetchAllFeeds, filterRecentArticles, dedupeArticles } from './rss-fetcher';
import { fetchAllGoogleNews, dedupeGoogleNewsArticles, preFilterGoogleNews } from './google-news';
import { preFilterArticles, filterArticles } from './article-filter';
import { extractFunds } from './fund-extractor';
import { dedupeExtractedFunds, isFundCovered } from './deduplicator';
import { normalizeFunds } from './normalizer';
import { loadFundDirectory, mergeNewFunds } from './merger';
import { generateHealthReport } from './feed-health';
import { loadCoveredFunds, generateCoverageSummary } from './covered-sync';

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CliOptions {
  dryRun: boolean;
  verbose: boolean;
  skipGoogle: boolean;
  skipApi: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    skipGoogle: args.includes('--skip-google'),
    skipApi: args.includes('--skip-api'),
  };
}

// ============================================================================
// Pipeline Execution
// ============================================================================

async function runPipeline(options: CliOptions): Promise<PipelineResult> {
  const context: PipelineContext = {
    dry_run: options.dryRun,
    verbose: options.verbose,
    start_time: new Date(),
    feeds_processed: 0,
    articles_fetched: 0,
    articles_filtered: 0,
    funds_extracted: 0,
    funds_deduplicated: 0,
    funds_added: 0,
    errors: [],
  };

  const allHealthUpdates: FeedHealth[] = [];
  const allExtractedFunds: ExtractedFund[] = [];

  console.log('');
  console.log('========================================');
  console.log(' FUND WATCH AUTOMATION');
  console.log('========================================');
  console.log(`Started: ${context.start_time.toISOString()}`);
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  try {
    // Step 1: Load existing data
    console.log('[1/7] Loading existing data...');
    const directory = await loadFundDirectory();
    const coveredData = await loadCoveredFunds();
    console.log(`  - Fund directory: ${directory.funds.length} funds`);
    console.log(`  - Covered funds: ${coveredData.covered_funds.length} funds`);

    // Step 2: Fetch RSS feeds
    console.log('\n[2/7] Fetching RSS feeds...');
    const { articles: rssArticles, healthUpdates: rssHealth } = await fetchAllFeeds(
      FEEDS,
      directory.feed_health
    );
    context.feeds_processed = FEEDS.filter(f => f.enabled).length;
    allHealthUpdates.push(...rssHealth);
    console.log(`  - Fetched ${rssArticles.length} articles from ${context.feeds_processed} feeds`);

    // Step 3: Fetch Google News (optional)
    let googleArticles: typeof rssArticles = [];
    if (!options.skipGoogle) {
      console.log('\n[3/7] Fetching Google News...');
      const rawGoogleArticles = await fetchAllGoogleNews();
      googleArticles = dedupeGoogleNewsArticles(rawGoogleArticles);
      googleArticles = preFilterGoogleNews(googleArticles);
      console.log(`  - Fetched ${googleArticles.length} articles from Google News`);
    } else {
      console.log('\n[3/7] Skipping Google News (--skip-google)');
    }

    // Step 4: Combine and dedupe articles
    console.log('\n[4/7] Processing articles...');
    const allArticles = [...rssArticles, ...googleArticles];
    const recentArticles = filterRecentArticles(allArticles, 7);
    const uniqueArticles = dedupeArticles(recentArticles);
    const preFiltered = preFilterArticles(uniqueArticles);
    context.articles_fetched = allArticles.length;
    console.log(`  - Combined: ${allArticles.length} articles`);
    console.log(`  - Recent (7 days): ${recentArticles.length} articles`);
    console.log(`  - Unique: ${uniqueArticles.length} articles`);
    console.log(`  - Pre-filtered: ${preFiltered.length} articles`);

    // Step 5: Filter with Claude (or skip)
    let filteredArticles;
    if (!options.skipApi) {
      console.log('\n[5/7] Filtering articles with Claude...');
      filteredArticles = await filterArticles(preFiltered, { verbose: options.verbose });
      context.articles_filtered = filteredArticles.filter(a => a.is_fund_news).length;
      console.log(`  - Fund news articles: ${context.articles_filtered}`);
    } else {
      console.log('\n[5/7] Skipping Claude filtering (--skip-api)');
      // Mark all as fund news for testing
      filteredArticles = preFiltered.map(a => ({ ...a, is_fund_news: true, confidence: 0.5 }));
      context.articles_filtered = filteredArticles.length;
    }

    // Step 6: Extract fund data
    if (!options.skipApi && context.articles_filtered > 0) {
      console.log('\n[6/7] Extracting fund data with Claude...');
      const extractedFunds = await extractFunds(filteredArticles, { verbose: options.verbose });

      // Normalize
      const normalizedFunds = normalizeFunds(extractedFunds);

      // Dedupe among themselves
      const { unique_funds } = dedupeExtractedFunds(normalizedFunds);

      // Filter out already covered funds
      const newFunds = unique_funds.filter(
        f => !isFundCovered(f, coveredData.covered_funds)
      );

      context.funds_extracted = extractedFunds.length;
      context.funds_deduplicated = unique_funds.length;
      allExtractedFunds.push(...newFunds);

      console.log(`  - Extracted: ${extractedFunds.length} funds`);
      console.log(`  - After dedup: ${unique_funds.length} funds`);
      console.log(`  - New (not covered): ${newFunds.length} funds`);
    } else {
      console.log('\n[6/7] Skipping fund extraction');
    }

    // Step 7: Merge and save
    console.log('\n[7/7] Merging and saving...');
    if (!options.dryRun) {
      if (allExtractedFunds.length > 0 || allHealthUpdates.length > 0) {
        const { added, updated } = await mergeNewFunds(
          allExtractedFunds,
          allHealthUpdates
        );
        context.funds_added = added.length;
        console.log(`  - Added: ${added.length} new funds`);
        console.log(`  - Updated: ${updated.length} existing funds`);
      } else {
        console.log('  - No changes to save');
      }
    } else {
      console.log('  - DRY RUN: Changes not saved');
      if (allExtractedFunds.length > 0) {
        console.log(`  - Would add: ${allExtractedFunds.length} funds`);
        for (const fund of allExtractedFunds.slice(0, 5)) {
          console.log(`    - ${fund.fund_name} (${fund.amount})`);
        }
        if (allExtractedFunds.length > 5) {
          console.log(`    ... and ${allExtractedFunds.length - 5} more`);
        }
      }
    }

    // Final summary
    const duration = (Date.now() - context.start_time.getTime()) / 1000;
    console.log('\n========================================');
    console.log(' PIPELINE COMPLETE');
    console.log('========================================');
    console.log(`Duration: ${duration.toFixed(1)}s`);
    console.log(`Feeds processed: ${context.feeds_processed}`);
    console.log(`Articles fetched: ${context.articles_fetched}`);
    console.log(`Articles filtered: ${context.articles_filtered}`);
    console.log(`Funds extracted: ${context.funds_extracted}`);
    console.log(`Funds added: ${context.funds_added}`);
    console.log(`Errors: ${context.errors.length}`);

    // Health report
    if (allHealthUpdates.length > 0) {
      console.log('\n' + generateHealthReport(allHealthUpdates));
    }

    // Coverage summary
    const updatedDirectory = await loadFundDirectory();
    console.log('\n' + generateCoverageSummary(
      updatedDirectory.funds,
      coveredData.covered_funds
    ));

    return {
      success: true,
      context,
      new_funds: [], // Would be populated with actual Fund objects
      updated_feeds: allHealthUpdates,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n[ERROR] Pipeline failed:', errorMessage);
    context.errors.push({
      stage: 'pipeline',
      message: errorMessage,
      details: error,
    });

    return {
      success: false,
      context,
      new_funds: [],
      updated_feeds: allHealthUpdates,
    };
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  if (!process.env.ANTHROPIC_API_KEY && !options.skipApi) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('Set it or use --skip-api to skip Claude API calls');
    process.exit(1);
  }

  const result = await runPipeline(options);

  if (!result.success) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
