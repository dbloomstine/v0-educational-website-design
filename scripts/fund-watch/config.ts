/**
 * Fund Watch Automation System - Configuration
 *
 * Feed URLs, category mappings, and constants for the automation pipeline.
 */

import type { FeedConfig, FundCategory, FundStage, FundStrategy, TargetGeography } from './types';

// ============================================================================
// File Paths
// ============================================================================

export const PATHS = {
  FUND_DIRECTORY: 'public/data/fund-directory.json',
  COVERED_FUNDS: 'public/data/covered-funds.json',
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

  // Additional press releases
  {
    name: 'GlobeNewswire PE',
    url: 'https://www.globenewswire.com/RssFeed/subjectcode/25-Private%20Equity/feedTitle/GlobeNewswire%20-%20Private%20Equity',
    type: 'rss',
    enabled: true,
  },

  // VC/Tech sources
  {
    name: 'Crunchbase News',
    url: 'https://news.crunchbase.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'VentureBeat',
    url: 'https://venturebeat.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Fortune',
    url: 'https://fortune.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Axios',
    url: 'https://www.axios.com/feeds/feed.rss',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'StrictlyVC',
    url: 'https://www.strictlyvc.com/feed/',
    type: 'rss',
    enabled: true,
  },

  // Credit
  {
    name: 'Creditflux',
    url: 'https://www.creditflux.com/rss/',
    type: 'rss',
    enabled: true,
  },

  // Real Estate
  {
    name: 'Commercial Observer',
    url: 'https://commercialobserver.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Bisnow',
    url: 'https://www.bisnow.com/rss/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Mingtiandi',
    url: 'https://www.mingtiandi.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Connect CRE',
    url: 'https://www.connectcre.com/feed/',
    type: 'rss',
    enabled: true,
  },

  // Infrastructure/Energy
  {
    name: 'Energy Investor',
    url: 'https://www.energyinvestor.net/feed/',
    type: 'rss',
    enabled: true,
  },

  // Regional - Asia
  {
    name: 'China Money Network',
    url: 'https://www.chinamoneynetwork.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Tech in Asia',
    url: 'https://www.techinasia.com/feed/',
    type: 'rss',
    enabled: true,
  },

  // Regional - Europe
  {
    name: 'Growth Business',
    url: 'https://www.growthbusiness.co.uk/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'EU-Startups',
    url: 'https://www.eu-startups.com/feed/',
    type: 'rss',
    enabled: true,
  },

  // Regional - Latin America
  {
    name: 'LAVCA',
    url: 'https://lavca.org/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Latin Finance',
    url: 'https://www.latinfinance.com/feed/',
    type: 'rss',
    enabled: true,
  },

  // Regional - Africa/MENA
  {
    name: 'Africa PE News',
    url: 'https://www.africaprivateequitynews.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Wamda',
    url: 'https://www.wamda.com/feed/',
    type: 'rss',
    enabled: true,
  },

  // Alternatives/Institutional
  {
    name: 'Chief Investment Officer',
    url: 'https://www.ai-cio.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Family Capital',
    url: 'https://www.famcap.com/feed/',
    type: 'rss',
    enabled: true,
  },

  // Fund Ops
  {
    name: 'Private Funds CFO',
    url: 'https://www.privatefundscfo.com/feed/',
    type: 'rss',
    enabled: true,
  },

  // PE/M&A
  {
    name: 'Middle Market Growth',
    url: 'https://middlemarketgrowth.org/feed/',
    type: 'rss',
    enabled: true,
  },

  // Sector-specific
  {
    name: 'AgFunder',
    url: 'https://agfundernews.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'CleanTechnica',
    url: 'https://cleantechnica.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    name: 'Impact Alpha',
    url: 'https://impactalpha.com/feed/',
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
// Strategy Detection Keywords
// ============================================================================

export const STRATEGY_KEYWORDS: Record<FundStrategy, string[]> = {
  // Venture Capital strategies
  'Seed/Pre-Seed': ['seed', 'pre-seed', 'preseed', 'angel'],
  'Early Stage': ['early stage', 'series a', 'series b', 'early-stage'],
  'Growth Stage': ['growth stage', 'growth equity', 'series c', 'series d', 'expansion'],
  'Late Stage': ['late stage', 'late-stage', 'pre-ipo', 'series e', 'series f'],
  'Sector-Specific': ['sector-specific', 'fintech fund', 'healthcare fund', 'climate fund', 'ai fund'],
  // Private Equity strategies
  'Buyout': ['buyout', 'lbo', 'leveraged buyout', 'control investment', 'acquisition'],
  'Growth Equity': ['growth equity', 'minority growth', 'growth capital'],
  'Lower Middle Market': ['lower middle market', 'lower-middle', 'small-cap buyout'],
  'Middle Market': ['middle market', 'mid-market', 'mid market'],
  'Large Cap': ['large cap', 'large-cap', 'mega fund', 'mega-cap'],
  // Credit strategies
  'Direct Lending': ['direct lending', 'direct loan', 'senior debt', 'unitranche'],
  'Mezzanine': ['mezzanine', 'mezz', 'junior debt', 'subordinated'],
  'Distressed': ['distressed', 'special situations', 'turnaround', 'restructuring'],
  'Specialty Finance': ['specialty finance', 'asset-backed', 'consumer credit', 'equipment finance'],
  'Asset-Based': ['asset-based lending', 'abl', 'receivables'],
  // Real Estate strategies
  'Core': ['core real estate', 'stabilized properties', 'income-focused'],
  'Core-Plus': ['core-plus', 'core plus', 'enhanced core'],
  'Value-Add': ['value-add', 'value add', 'repositioning'],
  'Opportunistic': ['opportunistic', 'development', 'ground-up'],
  'Development': ['development', 'construction', 'ground-up'],
  // Infrastructure strategies
  'Core Infrastructure': ['core infrastructure', 'essential infrastructure', 'regulated assets'],
  'Infrastructure Equity': ['infrastructure equity', 'infra equity'],
  'Energy Transition': ['energy transition', 'renewable', 'clean energy', 'decarbonization', 'solar', 'wind'],
  'Digital Infrastructure': ['digital infrastructure', 'data center', 'fiber', 'telecom tower', '5g'],
  // Secondaries strategies
  'LP Secondaries': ['lp secondary', 'lp secondaries', 'lp-led', 'limited partner secondary'],
  'GP-Led': ['gp-led', 'gp led', 'sponsor-led', 'general partner led'],
  'Direct Secondaries': ['direct secondary', 'direct secondaries', 'co-investment secondary'],
  'Continuation Fund': ['continuation fund', 'continuation vehicle', 'single-asset continuation'],
  'Other': [],
};

// ============================================================================
// Geography Detection Keywords
// ============================================================================

export const GEOGRAPHY_KEYWORDS: Record<TargetGeography, string[]> = {
  'North America': [
    'north america', 'united states', 'u.s.', 'us-focused', 'american',
    'canada', 'canadian', 'mexico', 'north american',
  ],
  'Europe': [
    'europe', 'european', 'eu', 'uk', 'united kingdom', 'germany', 'france',
    'nordic', 'benelux', 'southern europe', 'central europe', 'eastern europe',
  ],
  'Asia-Pacific': [
    'asia', 'asia-pacific', 'apac', 'china', 'india', 'japan', 'korea',
    'southeast asia', 'asean', 'australia', 'pacific', 'asian',
  ],
  'Latin America': [
    'latin america', 'latam', 'south america', 'brazil', 'mexico', 'chile',
    'colombia', 'argentina', 'peru', 'central america',
  ],
  'Middle East & Africa': [
    'middle east', 'mena', 'africa', 'african', 'gcc', 'gulf',
    'saudi', 'uae', 'emirates', 'sub-saharan', 'south africa', 'nigeria',
  ],
  'Global': [
    'global', 'worldwide', 'multi-region', 'international', 'cross-border',
    'pan-regional',
  ],
};

// ============================================================================
// Source Domain to Name Mapping
// ============================================================================

export const SOURCE_DOMAIN_MAP: Record<string, string> = {
  // Press releases / Newswires
  'businesswire.com': 'Business Wire',
  'prnewswire.com': 'PR Newswire',
  'globenewswire.com': 'GlobeNewswire',
  'newswire.ca': 'Newswire.ca',
  'news.google.com': 'Google News',

  // Major financial news
  'bloomberg.com': 'Bloomberg',
  'wsj.com': 'WSJ',
  'ft.com': 'Financial Times',
  'reuters.com': 'Reuters',
  'finance.yahoo.com': 'Yahoo Finance',
  'sg.finance.yahoo.com': 'Yahoo Finance',

  // VC/Tech
  'techcrunch.com': 'TechCrunch',
  'axios.com': 'Axios',
  'fortune.com': 'Fortune',
  'venturebeat.com': 'VentureBeat',
  'news.crunchbase.com': 'Crunchbase News',
  'strictlyvc.com': 'StrictlyVC',

  // PE/VC Industry publications
  'pitchbook.com': 'PitchBook',
  'pehub.com': 'PE Hub',
  'buyoutsinsider.com': 'Buyouts Insider',
  'privateequityinternational.com': 'PEI',
  'venturecapitaljournal.com': 'Venture Capital Journal',
  'privateequitywire.co.uk': 'Private Equity Wire',
  'middlemarketgrowth.org': 'Middle Market Growth',
  'famcap.com': 'Family Capital',

  // Credit
  'privatedebtinvestor.com': 'Private Debt Investor',
  'alternativecreditinvestor.com': 'Alternative Credit Investor',
  'creditflux.com': 'Creditflux',

  // Real Estate
  'perenews.com': 'PERE',
  'commercialobserver.com': 'Commercial Observer',
  'bisnow.com': 'Bisnow',
  'mingtiandi.com': 'Mingtiandi',
  'connectcre.com': 'Connect CRE',

  // Infrastructure
  'infrastructureinvestor.com': 'Infrastructure Investor',
  'energyinvestor.net': 'Energy Investor',

  // Secondaries
  'secondariesinvestor.com': 'Secondaries Investor',

  // Alternatives general
  'altassets.net': 'AltAssets',
  'hedgeweek.com': 'Hedgeweek',
  'ai-cio.com': 'Chief Investment Officer',
  'esgtoday.com': 'ESG Today',
  'privatefundscfo.com': 'Private Funds CFO',

  // Regional - Asia
  'chinamoneynetwork.com': 'China Money Network',
  'techinasia.com': 'Tech in Asia',

  // Regional - Europe
  'growthbusiness.co.uk': 'Growth Business',
  'eu-startups.com': 'EU-Startups',

  // Regional - Latin America
  'lavca.org': 'LAVCA',
  'latinfinance.com': 'Latin Finance',

  // Regional - Africa/MENA
  'africaprivateequitynews.com': 'Africa PE News',
  'wamda.com': 'Wamda',
  'zawya.com': 'Zawya',

  // Sector-specific
  'agfundernews.com': 'AgFunder',
  'cleantechnica.com': 'CleanTechnica',
  'impactalpha.com': 'Impact Alpha',
};

// ============================================================================
// FX Rates (for converting non-USD amounts)
// ============================================================================

export const FX_RATES = {
  EUR_USD: 1.08,
  GBP_USD: 1.27,
  CAD_USD: 0.74,
  INR_USD: 0.012,
  LAST_UPDATED: '2026-02-09',
} as const;

// ============================================================================
// Amount Parsing Patterns
// ============================================================================

export const AMOUNT_PATTERNS = [
  // $X.XB, $XB (USD)
  { regex: /\$(\d+(?:\.\d+)?)\s*(?:billion|bn|b)\b/i, multiplier: 1000, currency: 'USD' },
  // $X.XM, $XM (USD)
  { regex: /\$(\d+(?:\.\d+)?)\s*(?:million|mn|m)\b/i, multiplier: 1, currency: 'USD' },
  // €X.XB, €XB (EUR)
  { regex: /€(\d+(?:\.\d+)?)\s*(?:billion|bn|b)\b/i, multiplier: 1000, currency: 'EUR' },
  // €X.XM, €XM (EUR)
  { regex: /€(\d+(?:\.\d+)?)\s*(?:million|mn|m)\b/i, multiplier: 1, currency: 'EUR' },
  // £X.XB (GBP)
  { regex: /£(\d+(?:\.\d+)?)\s*(?:billion|bn|b)\b/i, multiplier: 1000, currency: 'GBP' },
  // £X.XM (GBP)
  { regex: /£(\d+(?:\.\d+)?)\s*(?:million|mn|m)\b/i, multiplier: 1, currency: 'GBP' },
  // C$X.XB (CAD)
  { regex: /C\$(\d+(?:\.\d+)?)\s*(?:billion|bn|b)\b/i, multiplier: 1000, currency: 'CAD' },
  // C$X.XM (CAD)
  { regex: /C\$(\d+(?:\.\d+)?)\s*(?:million|mn|m)\b/i, multiplier: 1, currency: 'CAD' },
  // ₹XCr (Indian Crore = 10M INR)
  { regex: /₹(\d+(?:\.\d+)?)\s*(?:crore|cr)\b/i, multiplier: 10, currency: 'INR' },
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
