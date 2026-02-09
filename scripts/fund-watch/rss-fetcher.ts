/**
 * Fund Watch Automation System - RSS Fetcher
 *
 * Fetches and parses RSS feeds from configured sources.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Parser = require('rss-parser');
import type { FeedConfig, RawArticle, FeedHealth, RSSItem } from './types';
import { PIPELINE_CONFIG, SOURCE_DOMAIN_MAP } from './config';
import { shouldRetryDisabledFeed } from './feed-health';

const parser = new Parser({
  timeout: PIPELINE_CONFIG.FEED_FETCH_TIMEOUT_MS,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept:
      'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
  },
});

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
 * Get source name from domain
 */
function getSourceName(domain: string): string {
  // Check direct mapping
  if (SOURCE_DOMAIN_MAP[domain]) {
    return SOURCE_DOMAIN_MAP[domain];
  }

  // Try without subdomain
  const parts = domain.split('.');
  if (parts.length > 2) {
    const baseDomain = parts.slice(-2).join('.');
    if (SOURCE_DOMAIN_MAP[baseDomain]) {
      return SOURCE_DOMAIN_MAP[baseDomain];
    }
  }

  // Default to formatted domain
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

/**
 * Parse RSS item date to ISO string
 */
function parseDate(item: RSSItem): string {
  if (item.isoDate) {
    return item.isoDate.split('T')[0];
  }
  if (item.pubDate) {
    try {
      return new Date(item.pubDate).toISOString().split('T')[0];
    } catch {
      // Fall through
    }
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Convert RSS item to RawArticle
 */
function itemToArticle(item: RSSItem, feedName: string): RawArticle {
  const url = item.link || '';
  const domain = extractDomain(url);

  return {
    title: item.title || 'Untitled',
    url,
    published_date: parseDate(item),
    content_snippet: item.contentSnippet || item.content || '',
    source_name: getSourceName(domain),
    source_domain: domain,
    feed_name: feedName,
  };
}

/**
 * Fetch a single RSS feed
 */
export async function fetchFeed(
  config: FeedConfig
): Promise<{ articles: RawArticle[]; health: Partial<FeedHealth> }> {
  const now = new Date().toISOString();

  try {
    const feed = await parser.parseURL(config.url);
    const articles = feed.items.map((item: RSSItem) =>
      itemToArticle(item, config.name)
    );

    return {
      articles,
      health: {
        feed_name: config.name,
        feed_url: config.url,
        last_fetch: now,
        last_success: now,
        error_count: 0,
        article_count: articles.length,
        last_error: '',
        enabled: true,
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`[RSS] Error fetching ${config.name}: ${errorMessage}`);

    return {
      articles: [],
      health: {
        feed_name: config.name,
        feed_url: config.url,
        last_fetch: now,
        last_error: errorMessage,
        // Note: error_count will be incremented by feed-health.ts
      },
    };
  }
}

/**
 * Fetch all enabled RSS feeds
 */
export async function fetchAllFeeds(
  feeds: FeedConfig[],
  existingHealth: FeedHealth[]
): Promise<{
  articles: RawArticle[];
  healthUpdates: FeedHealth[];
}> {
  const enabledFeeds = feeds.filter((f) => f.enabled && f.type === 'rss');
  const allArticles: RawArticle[] = [];
  const healthUpdates: FeedHealth[] = [];

  // Create health map for existing data
  const healthMap = new Map<string, FeedHealth>();
  for (const h of existingHealth) {
    healthMap.set(h.feed_url, h);
  }

  // Find disabled feeds that should be retried
  const feedsToRetry: FeedConfig[] = [];
  for (const feed of feeds.filter((f) => f.type === 'rss')) {
    const health = healthMap.get(feed.url);
    if (health && !health.enabled && shouldRetryDisabledFeed(health)) {
      feedsToRetry.push(feed);
    }
  }

  if (feedsToRetry.length > 0) {
    console.log(`[RSS] Will retry ${feedsToRetry.length} previously disabled feeds...`);
  }

  const allFeedsToFetch = [...enabledFeeds, ...feedsToRetry];
  console.log(`[RSS] Fetching ${allFeedsToFetch.length} feeds (${enabledFeeds.length} enabled, ${feedsToRetry.length} retries)...`);

  for (const feed of allFeedsToFetch) {
    const isRetry = feedsToRetry.includes(feed);
    const { articles, health } = await fetchFeed(feed);
    allArticles.push(...articles);

    // Merge with existing health data
    const existing = healthMap.get(feed.url);
    const newErrorCount = health.last_error
      ? (existing?.error_count || 0) + 1
      : 0;

    // If retry succeeds, re-enable the feed
    const shouldEnable = isRetry && !health.last_error;

    const updatedHealth: FeedHealth = {
      feed_name: health.feed_name!,
      feed_url: health.feed_url!,
      last_fetch: health.last_fetch!,
      last_success: health.last_success || existing?.last_success || null,
      error_count: health.last_error ? newErrorCount : 0,
      article_count: health.article_count || existing?.article_count || 0,
      last_error: health.last_error || '',
      enabled: shouldEnable
        ? true
        : health.last_error && newErrorCount >= 5
          ? false
          : existing?.enabled ?? true,
    };

    healthUpdates.push(updatedHealth);

    const statusStr = isRetry
      ? shouldEnable
        ? '(re-enabled!)'
        : '(retry failed)'
      : health.last_error
        ? '(error)'
        : '';
    console.log(`[RSS] ${feed.name}: ${articles.length} articles ${statusStr}`);

    // Small delay between feeds to be polite
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`[RSS] Total: ${allArticles.length} articles from ${allFeedsToFetch.length} feeds`);
  return { articles: allArticles, healthUpdates };
}

/**
 * Filter articles by date (recent only)
 */
export function filterRecentArticles(
  articles: RawArticle[],
  daysBack: number = 7
): RawArticle[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  return articles.filter((a) => a.published_date >= cutoffStr);
}

/**
 * Remove duplicate articles by URL
 */
export function dedupeArticles(articles: RawArticle[]): RawArticle[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    // Normalize URL by removing trailing slashes and query params
    const normalizedUrl = a.url.split('?')[0].replace(/\/$/, '');
    if (seen.has(normalizedUrl)) {
      return false;
    }
    seen.add(normalizedUrl);
    return true;
  });
}
