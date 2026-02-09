/**
 * Fund Watch Automation System - Google News RSS
 *
 * Fetches fund news from Google News RSS for gap-fill searches.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Parser = require('rss-parser');
import type { RawArticle, RSSItem } from './types';
import { GOOGLE_NEWS_QUERIES, PIPELINE_CONFIG, SOURCE_DOMAIN_MAP } from './config';

const parser = new Parser({
  timeout: PIPELINE_CONFIG.FEED_FETCH_TIMEOUT_MS,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    Accept: 'application/rss+xml, application/xml, text/xml',
  },
});

/**
 * Build Google News RSS URL for a query
 */
function buildGoogleNewsUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query);
  // Use recent news (past 7 days) with English language
  return `https://news.google.com/rss/search?q=${encodedQuery}+when:7d&hl=en-US&gl=US&ceid=US:en`;
}

/**
 * Extract actual source from Google News title
 * Google News format: "Article Title - Source Name"
 */
function extractSourceFromTitle(title: string): {
  cleanTitle: string;
  sourceName: string;
} {
  const parts = title.split(' - ');
  if (parts.length >= 2) {
    const sourceName = parts.pop()!.trim();
    const cleanTitle = parts.join(' - ').trim();
    return { cleanTitle, sourceName };
  }
  return { cleanTitle: title, sourceName: 'Unknown' };
}

/**
 * Parse Google News RSS item date
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
 * Get canonical source name from extracted name
 */
function getSourceName(extractedName: string): string {
  // Try to match known sources
  const lowerName = extractedName.toLowerCase();
  for (const [domain, name] of Object.entries(SOURCE_DOMAIN_MAP)) {
    if (lowerName.includes(domain.split('.')[0])) {
      return name;
    }
  }
  return extractedName;
}

/**
 * Convert Google News RSS item to RawArticle
 */
function itemToArticle(item: RSSItem, query: string): RawArticle {
  const { cleanTitle, sourceName } = extractSourceFromTitle(item.title || '');

  return {
    title: cleanTitle,
    url: item.link || '',
    published_date: parseDate(item),
    content_snippet: item.contentSnippet || item.content || '',
    source_name: getSourceName(sourceName),
    source_domain: 'news.google.com', // Will be resolved later if needed
    feed_name: `search:${query}`,
  };
}

/**
 * Fetch Google News results for a single query
 */
export async function fetchGoogleNewsQuery(
  query: string
): Promise<RawArticle[]> {
  try {
    const url = buildGoogleNewsUrl(query);
    const feed = await parser.parseURL(url);

    const articles = feed.items.map((item) =>
      itemToArticle(item as RSSItem, query)
    );

    console.log(`[GoogleNews] "${query}": ${articles.length} articles`);
    return articles;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`[GoogleNews] Error for "${query}": ${errorMessage}`);
    return [];
  }
}

/**
 * Fetch all configured Google News queries
 */
export async function fetchAllGoogleNews(): Promise<RawArticle[]> {
  const allArticles: RawArticle[] = [];

  console.log(`[GoogleNews] Fetching ${GOOGLE_NEWS_QUERIES.length} queries...`);

  for (const query of GOOGLE_NEWS_QUERIES) {
    const articles = await fetchGoogleNewsQuery(query);
    allArticles.push(...articles);

    // Delay between queries to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`[GoogleNews] Total: ${allArticles.length} articles`);
  return allArticles;
}

/**
 * Remove duplicate articles (Google News often returns duplicates across queries)
 */
export function dedupeGoogleNewsArticles(articles: RawArticle[]): RawArticle[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    // Use title as key since Google News URLs are encoded
    const key = a.title.toLowerCase().trim();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Filter out articles that are likely not fund news based on title
 */
export function preFilterGoogleNews(articles: RawArticle[]): RawArticle[] {
  const excludePatterns = [
    /\bipo\b/i,
    /\bstock\b/i,
    /\bshares\b/i,
    /\bmarket\b/i,
    /\bearnings\b/i,
    /\bquarterly\b/i,
    /\banalyst\b/i,
    /\bhedge fund\b.*\bperformance\b/i,
    /\bindex fund\b/i,
    /\betf\b/i,
    /\bmutual fund\b/i,
  ];

  const includePatterns = [
    /\bfund\b.*\bclose\b/i,
    /\bfund\b.*\braise\b/i,
    /\bfund\b.*\blaunch\b/i,
    /\bcapital\b.*\bcommit\b/i,
    /\bfinal close\b/i,
    /\bfirst close\b/i,
    /\boversubscribed\b/i,
    /\bhard cap\b/i,
  ];

  return articles.filter((a) => {
    const title = a.title.toLowerCase();

    // Exclude obvious non-fund news
    if (excludePatterns.some((p) => p.test(title))) {
      return false;
    }

    // Keep if matches include patterns
    if (includePatterns.some((p) => p.test(title))) {
      return true;
    }

    // Default: keep for Claude filtering
    return true;
  });
}
