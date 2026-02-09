#!/usr/bin/env npx tsx
/**
 * Fund Watch Automation System - Feed Discovery
 *
 * Discovers new RSS feeds from PE/VC publications.
 * Run manually: npx tsx scripts/fund-watch/feed-discovery.ts
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Parser = require('rss-parser');
import { FEEDS } from './config';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
});

// ============================================================================
// Known Publications to Check for RSS Feeds
// ============================================================================

const POTENTIAL_PUBLICATIONS = [
  // Major financial news
  { name: 'Bloomberg PE', domain: 'bloomberg.com', paths: ['/feed', '/rss'] },
  { name: 'Reuters PE', domain: 'reuters.com', paths: ['/finance/feed', '/feed'] },
  { name: 'WSJ PE', domain: 'wsj.com', paths: ['/xml/rss/3_7014.xml', '/xml/rss/3_7031.xml'] },
  { name: 'Financial Times', domain: 'ft.com', paths: ['/rss/home', '/companies?format=rss'] },

  // PE/VC specific
  { name: 'PitchBook News', domain: 'pitchbook.com', paths: ['/news/feed', '/feed'] },
  { name: 'Buyouts Insider', domain: 'buyoutsinsider.com', paths: ['/feed', '/rss'] },
  { name: 'PE International', domain: 'privateequityinternational.com', paths: ['/feed', '/rss'] },
  { name: 'VC Journal', domain: 'venturecapitaljournal.com', paths: ['/feed', '/rss'] },
  { name: 'Real Deals', domain: 'realdeals.eu.com', paths: ['/feed', '/rss'] },
  { name: 'Private Equity Wire', domain: 'privateequitywire.co.uk', paths: ['/feed', '/rss'] },
  { name: 'PE News', domain: 'penews.com', paths: ['/feed', '/rss'] },
  { name: 'Preqin', domain: 'preqin.com', paths: ['/insights/feed', '/feed'] },
  { name: 'Alternatives Watch', domain: 'alternativeswatch.com', paths: ['/feed', '/rss'] },
  { name: 'Institutional Investor', domain: 'institutionalinvestor.com', paths: ['/feed', '/rss'] },

  // Credit specific
  { name: 'Creditflux', domain: 'creditflux.com', paths: ['/feed', '/rss'] },
  { name: 'Leveraged Commentary', domain: 'lcdcomps.com', paths: ['/feed', '/rss'] },

  // Real estate specific
  { name: 'Commercial Observer', domain: 'commercialobserver.com', paths: ['/feed', '/rss'] },
  { name: 'GlobeSt', domain: 'globest.com', paths: ['/feed', '/rss'] },
  { name: 'Bisnow', domain: 'bisnow.com', paths: ['/feed', '/rss'] },

  // Infrastructure
  { name: 'IJGlobal', domain: 'ijglobal.com', paths: ['/feed', '/rss'] },
  { name: 'Project Finance Intl', domain: 'pfie.com', paths: ['/feed', '/rss'] },

  // Tech/VC news
  { name: 'The Information', domain: 'theinformation.com', paths: ['/feed', '/rss'] },
  { name: 'Fortune Term Sheet', domain: 'fortune.com', paths: ['/feed/term-sheet', '/feed'] },
  { name: 'Axios Pro Rata', domain: 'axios.com', paths: ['/pro-rata/feed', '/feed'] },
  { name: 'Crunchbase News', domain: 'news.crunchbase.com', paths: ['/feed', '/rss'] },
  { name: 'Venture Beat', domain: 'venturebeat.com', paths: ['/feed', '/category/deals/feed'] },
  { name: 'SaaStr', domain: 'saastr.com', paths: ['/feed', '/blog/feed'] },

  // Regional
  { name: 'PE Asia', domain: 'privateequityasia.com', paths: ['/feed', '/rss'] },
  { name: 'AVCJ', domain: 'avcj.com', paths: ['/feed', '/rss'] },
  { name: 'PE Latin America', domain: 'lavca.org', paths: ['/feed', '/news/feed'] },
  { name: 'Africa PE News', domain: 'africaprivateequitynews.com', paths: ['/feed', '/rss'] },
];

// ============================================================================
// Feed Discovery Functions
// ============================================================================

/**
 * Test if a URL returns a valid RSS feed
 */
async function testFeedUrl(url: string): Promise<{
  valid: boolean;
  articleCount: number;
  error?: string;
}> {
  try {
    const feed = await parser.parseURL(url);
    return {
      valid: true,
      articleCount: feed.items?.length || 0,
    };
  } catch (error) {
    return {
      valid: false,
      articleCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check common RSS URL patterns for a domain
 */
async function discoverFeedsForDomain(
  name: string,
  domain: string,
  paths: string[]
): Promise<Array<{ name: string; url: string; articleCount: number }>> {
  const discovered: Array<{ name: string; url: string; articleCount: number }> = [];

  for (const path of paths) {
    const url = `https://${domain}${path}`;
    const result = await testFeedUrl(url);

    if (result.valid && result.articleCount > 0) {
      discovered.push({
        name,
        url,
        articleCount: result.articleCount,
      });
      break; // Found a working feed, no need to try other paths
    }

    // Also try www subdomain
    const wwwUrl = `https://www.${domain}${path}`;
    const wwwResult = await testFeedUrl(wwwUrl);

    if (wwwResult.valid && wwwResult.articleCount > 0) {
      discovered.push({
        name,
        url: wwwUrl,
        articleCount: wwwResult.articleCount,
      });
      break;
    }
  }

  return discovered;
}

/**
 * Get currently configured feed URLs
 */
function getExistingFeedUrls(): Set<string> {
  const urls = new Set<string>();
  for (const feed of FEEDS) {
    urls.add(feed.url.toLowerCase());
    // Also add variations
    const domain = new URL(feed.url).hostname;
    urls.add(domain.toLowerCase());
  }
  return urls;
}

/**
 * Run full feed discovery
 */
async function discoverNewFeeds(): Promise<void> {
  console.log('');
  console.log('========================================');
  console.log(' FEED DISCOVERY');
  console.log('========================================');
  console.log('');

  const existingUrls = getExistingFeedUrls();
  const newFeeds: Array<{ name: string; url: string; articleCount: number }> = [];
  const failedChecks: Array<{ name: string; domain: string }> = [];

  console.log(`Checking ${POTENTIAL_PUBLICATIONS.length} potential publications...`);
  console.log(`Already have ${FEEDS.length} configured feeds.`);
  console.log('');

  for (const pub of POTENTIAL_PUBLICATIONS) {
    // Skip if we already have this domain
    if (existingUrls.has(pub.domain.toLowerCase())) {
      continue;
    }

    process.stdout.write(`Checking ${pub.name}... `);

    const discovered = await discoverFeedsForDomain(pub.name, pub.domain, pub.paths);

    if (discovered.length > 0) {
      const feed = discovered[0];
      // Double-check it's not already configured
      if (!existingUrls.has(feed.url.toLowerCase())) {
        newFeeds.push(feed);
        console.log(`✓ Found (${feed.articleCount} articles)`);
      } else {
        console.log('(already configured)');
      }
    } else {
      failedChecks.push({ name: pub.name, domain: pub.domain });
      console.log('✗ No feed found');
    }

    // Small delay to be polite
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  console.log('');
  console.log('========================================');
  console.log(' DISCOVERY RESULTS');
  console.log('========================================');
  console.log('');

  if (newFeeds.length > 0) {
    console.log(`Found ${newFeeds.length} new feeds to add:`);
    console.log('');

    for (const feed of newFeeds) {
      console.log(`  {`);
      console.log(`    name: '${feed.name}',`);
      console.log(`    url: '${feed.url}',`);
      console.log(`    type: 'rss',`);
      console.log(`    enabled: true,`);
      console.log(`  },`);
      console.log('');
    }

    console.log('Add these to scripts/fund-watch/config.ts in the FEEDS array.');
  } else {
    console.log('No new feeds discovered.');
  }

  console.log('');
  console.log(`Checked: ${POTENTIAL_PUBLICATIONS.length} publications`);
  console.log(`New feeds found: ${newFeeds.length}`);
  console.log(`Failed checks: ${failedChecks.length}`);
}

// ============================================================================
// Main
// ============================================================================

discoverNewFeeds().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
