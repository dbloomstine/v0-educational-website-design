/**
 * RSS feed client for the news monitoring pipeline.
 *
 * Fetches and parses RSS 2.0 and Atom feeds using fast-xml-parser.
 * Applies keyword filtering to surface fund-related articles.
 */

import { XMLParser } from 'fast-xml-parser';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FeedConfig {
  name: string;
  url: string;
  category: string;
  fundTypes?: string[];
}

export interface RssArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  sourceName: string;
}

export interface FeedResult {
  feedName: string;
  articles: RssArticle[];
  error: string | null;
  durationMs: number;
}

// ─── RSS parsing ────────────────────────────────────────────────────────────

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
});

/**
 * Fetch and parse a single RSS/Atom feed.
 */
export async function fetchFeed(url: string, name: string): Promise<FeedResult> {
  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FundOpsHQ-NewsBot/1.0 (intel.fundopshq.com)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return { feedName: name, articles: [], error: `HTTP ${response.status}`, durationMs: Date.now() - startTime };
    }

    const xml = await response.text();
    const parsed = parser.parse(xml);

    const articles = extractArticles(parsed, name);
    return { feedName: name, articles, error: null, durationMs: Date.now() - startTime };
  } catch (error) {
    return {
      feedName: name,
      articles: [],
      error: error instanceof Error ? error.message : 'Unknown fetch error',
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Extract articles from parsed XML, handling both RSS 2.0 and Atom formats.
 */
function extractArticles(
  parsed: Record<string, unknown>,
  sourceName: string
): RssArticle[] {
  // RSS 2.0: rss > channel > item
  const rss = parsed.rss as Record<string, unknown> | undefined;
  if (rss) {
    const channel = rss.channel as Record<string, unknown> | undefined;
    if (channel) {
      const items = normalizeArray(channel.item);
      return items.map((item) => rssItemToArticle(item, sourceName));
    }
  }

  // Atom: feed > entry
  const feed = parsed.feed as Record<string, unknown> | undefined;
  if (feed) {
    const entries = normalizeArray(feed.entry);
    return entries.map((entry) => atomEntryToArticle(entry, sourceName));
  }

  return [];
}

function rssItemToArticle(
  item: Record<string, unknown>,
  sourceName: string
): RssArticle {
  // Google News RSS includes a <source> element with the actual publisher name.
  // Use it instead of the feed name (e.g., "Bloomberg.com" instead of "GNews: Private Credit").
  let resolvedSource = sourceName;
  const sourceEl = item.source;
  if (sourceEl) {
    if (typeof sourceEl === 'string') {
      resolvedSource = sourceEl;
    } else if (typeof sourceEl === 'object' && sourceEl !== null) {
      const src = sourceEl as Record<string, unknown>;
      resolvedSource = String(src['#text'] ?? src['@_url'] ?? sourceName);
    }
  }

  let title = stripHtml(String(item.title ?? ''));
  // Google News titles often end with " - Publisher". Strip it when we know the source.
  if (sourceEl && resolvedSource !== sourceName) {
    title = title.replace(/\s*[-–—]\s*[^-–—]+$/, '').trim() || title;
  }

  return {
    title,
    link: String(item.link ?? ''),
    description: stripHtml(String(item.description ?? '')),
    pubDate: parseDate(item.pubDate),
    sourceName: resolvedSource,
  };
}

function atomEntryToArticle(
  entry: Record<string, unknown>,
  sourceName: string
): RssArticle {
  // Atom link can be an object with @_href or an array
  let link = '';
  const linkField = entry.link;
  if (typeof linkField === 'string') {
    link = linkField;
  } else if (Array.isArray(linkField)) {
    const alternate = linkField.find(
      (l: Record<string, unknown>) => l['@_rel'] === 'alternate' || !l['@_rel']
    ) as Record<string, unknown> | undefined;
    link = String(alternate?.['@_href'] ?? linkField[0]?.['@_href'] ?? '');
  } else if (linkField && typeof linkField === 'object') {
    link = String((linkField as Record<string, unknown>)['@_href'] ?? '');
  }

  // Atom content/summary
  const content = entry.content ?? entry.summary ?? '';
  const description = typeof content === 'object'
    ? String((content as Record<string, unknown>)['#text'] ?? '')
    : String(content);

  return {
    title: stripHtml(String(entry.title ?? '')),
    link,
    description: stripHtml(description),
    pubDate: parseDate(entry.published ?? entry.updated),
    sourceName,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeArray(val: unknown): Record<string, unknown>[] {
  if (Array.isArray(val)) return val as Record<string, unknown>[];
  if (val && typeof val === 'object') return [val as Record<string, unknown>];
  return [];
}

function stripHtml(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(val: unknown): string | null {
  if (!val) return null;
  const str = String(val);
  const date = new Date(str);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}
