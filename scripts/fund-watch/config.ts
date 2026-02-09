/**
 * Fund Watch Automation System - Configuration
 *
 * Feed URLs, category mappings, and constants for the automation pipeline.
 */

import type { FeedConfig, FundCategory, FundStage } from './types';

// ============================================================================
// File Paths
// ============================================================================

export const PATHS = {
  FUND_DIRECTORY: 'public/data/fund-directory.json',
  COVERED_FUNDS: process.env.HOME + '/.claude/fund-watch/covered-funds.json',
} as const;

// ============================================================================
// RSS Feeds Configuration
// ============================================================================

export const FEEDS: FeedConfig[] = [
  // Primary news sources
  {
    name: 'PR Newswire - Financial Services',
    url: 'https://www.prnewswire.com/rss/financial-services-latest-news/financial-services-latest-news-list.rss',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Business Wire - Finance',
    url: 'https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGVtTWg==',
    type: 'rss',
    enabled: true,
  },

  // Industry publications
  {
    name: 'TechCrunch - Venture',
    url: 'https://techcrunch.com/category/venture/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'PE Hub',
    url: 'https://www.pehub.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Private Debt Investor',
    url: 'https://www.privatedebtinvestor.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Secondaries Investor',
    url: 'https://www.secondariesinvestor.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Infrastructure Investor',
    url: 'https://www.infrastructureinvestor.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'PERE',
    url: 'https://www.perenews.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Alternative Credit Investor',
    url: 'https://alternativecreditinvestor.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'ESG Today',
    url: 'https://www.esgtoday.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'AltAssets',
    url: 'https://www.altassets.net/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Hedgeweek',
    url: 'https://www.hedgeweek.com/feed/',
    type: 'rss',
    enabled: true,
  },

  // Discovered feeds (added via feed-discovery)
  {
    name: 'Financial Times',
    url: 'https://ft.com/rss/home',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Buyouts Insider',
    url: 'https://buyoutsinsider.com/feed',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'PE International',
    url: 'https://privateequityinternational.com/feed',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'VC Journal',
    url: 'https://venturecapitaljournal.com/feed',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Private Equity Wire',
    url: 'https://privateequitywire.co.uk/feed',
    type: 'rss',
    enabled: true,
  },
];

// ============================================================================
// Google News Search Queries (for gap-fill)
// ============================================================================

export const GOOGLE_NEWS_QUERIES = [
  'private equity fund close',
  'venture capital fund close',
  'private credit fund close',
  'infrastructure fund close',
  'real estate fund close',
  'secondaries fund close',
  'fund final close',
  'fund first close',
  'fund oversubscribed',
  'fund hard cap',
];

// ============================================================================
// Category Keywords for Classification
// ============================================================================

export const CATEGORY_KEYWORDS: Record<FundCategory, string[]> = {
  'Venture Capital': [
    'venture',
    'vc fund',
    'seed fund',
    'series a',
    'series b',
    'growth equity',
    'early stage',
    'startup fund',
    'tech fund',
    'innovation fund',
  ],
  'Private Equity': [
    'private equity',
    'pe fund',
    'buyout',
    'lbo',
    'leveraged buyout',
    'middle market',
    'lower middle market',
    'control investment',
    'acquisition fund',
  ],
  'Credit Funds': [
    'private credit',
    'direct lending',
    'mezzanine',
    'debt fund',
    'credit fund',
    'loan fund',
    'clo',
    'structured credit',
    'distressed debt',
    'special situations',
    'income fund',
  ],
  'Real Estate': [
    'real estate',
    'property fund',
    'reit',
    'multifamily',
    'commercial real estate',
    'value-add',
    'opportunistic real estate',
    'core plus',
  ],
  Infrastructure: [
    'infrastructure',
    'infra fund',
    'utility',
    'energy transition',
    'renewable',
    'transport',
    'digital infrastructure',
    'telecom',
  ],
  'Secondaries & GP-Stakes': [
    'secondary',
    'secondaries',
    'gp stake',
    'gp stakes',
    'continuation fund',
    'continuation vehicle',
    'lp secondary',
    'gp-led',
  ],
};

// ============================================================================
// Stage Detection Patterns
// ============================================================================

export const STAGE_PATTERNS: Record<FundStage, RegExp> = {
  'Final Close': /\b(final close|hard cap|fully committed|closed|completes fundrais)\b/i,
  'First Close': /\b(first close|initial close|launches? with)\b/i,
  'Interim Close': /\b(interim close|additional close|second close)\b/i,
  Launch: /\b(launch|debut|new fund|raising|targeting|announces? fund|begins? fundrais)\b/i,
  Other: /./,
};

// ============================================================================
// Source Domain to Name Mapping
// ============================================================================

export const SOURCE_DOMAIN_MAP: Record<string, string> = {
  'businesswire.com': 'Business Wire',
  'prnewswire.com': 'PR Newswire',
  'finance.yahoo.com': 'Yahoo Finance',
  'sg.finance.yahoo.com': 'Yahoo Finance',
  'techcrunch.com': 'TechCrunch',
  'bloomberg.com': 'Bloomberg',
  'wsj.com': 'WSJ',
  'ft.com': 'Financial Times',
  'pitchbook.com': 'PitchBook',
  'reuters.com': 'Reuters',
  'perenews.com': 'PERE',
  'pehub.com': 'PE Hub',
  'buyoutsinsider.com': 'Buyouts Insider',
  'privateequityinternational.com': 'PEI',
  'secondariesinvestor.com': 'Secondaries Investor',
  'hedgeweek.com': 'Hedgeweek',
  'infrastructureinvestor.com': 'Infrastructure Investor',
  'privatedebtinvestor.com': 'Private Debt Investor',
  'venturecapitaljournal.com': 'Venture Capital Journal',
  'alternativecreditinvestor.com': 'Alternative Credit Investor',
  'altassets.net': 'AltAssets',
  'axios.com': 'Axios',
  'fortune.com': 'Fortune',
  'esgtoday.com': 'ESG Today',
  'globenewswire.com': 'GlobeNewswire',
  'newswire.ca': 'Newswire.ca',
  'zawya.com': 'Zawya',
  'news.google.com': 'Google News',
};

// ============================================================================
// Amount Parsing Patterns
// ============================================================================

export const AMOUNT_PATTERNS = [
  // $X.XB, $XB
  { regex: /\$(\d+(?:\.\d+)?)\s*(?:billion|bn|b)\b/i, multiplier: 1000 },
  // $X.XM, $XM
  { regex: /\$(\d+(?:\.\d+)?)\s*(?:million|mn|m)\b/i, multiplier: 1 },
  // €X.XB, €XB
  { regex: /[€£](\d+(?:\.\d+)?)\s*(?:billion|bn|b)\b/i, multiplier: 1000 },
  // €X.XM, €XM
  { regex: /[€£](\d+(?:\.\d+)?)\s*(?:million|mn|m)\b/i, multiplier: 1 },
  // C$X.XM
  { regex: /C\$(\d+(?:\.\d+)?)\s*(?:million|mn|m)\b/i, multiplier: 1 },
  // ₹XCr (Indian Crore = 10M)
  { regex: /₹(\d+(?:\.\d+)?)\s*(?:crore|cr)\b/i, multiplier: 10 },
];

// ============================================================================
// Feed Health Configuration
// ============================================================================

export const FEED_HEALTH_CONFIG = {
  MAX_ERROR_COUNT: 5, // Auto-disable after this many consecutive failures
  STALE_THRESHOLD_HOURS: 48, // Warn if no successful fetch in this time
};

// ============================================================================
// Pipeline Configuration
// ============================================================================

export const PIPELINE_CONFIG = {
  // Claude API settings
  FILTER_MODEL: 'claude-3-5-haiku-latest',
  EXTRACT_MODEL: 'claude-sonnet-4-20250514',

  // Rate limiting
  API_DELAY_MS: 200, // Delay between Claude API calls
  FEED_FETCH_TIMEOUT_MS: 30000, // 30 seconds per feed

  // Deduplication thresholds
  FUZZY_MATCH_THRESHOLD: 0.3, // Levenshtein ratio threshold
  AMOUNT_VARIANCE_THRESHOLD: 0.15, // 15% variance allowed

  // Batch sizes
  FILTER_BATCH_SIZE: 10,
  EXTRACT_BATCH_SIZE: 5,
};

// ============================================================================
// Firm Name Normalization - Words to Remove
// ============================================================================

export const FIRM_STOPWORDS = [
  'capital',
  'partners',
  'management',
  'fund',
  'funds',
  'ventures',
  'venture',
  'investments',
  'investment',
  'advisors',
  'advisers',
  'group',
  'holdings',
  'llc',
  'lp',
  'inc',
  'corp',
  'the',
  'and',
  '&',
];

// ============================================================================
// Fund Number Patterns (for deduplication keys)
// ============================================================================

export const FUND_NUMBER_PATTERN = /\b(I{1,3}|IV|V|VI{1,3}|IX|X|XI{1,3}|\d+)\b/;
