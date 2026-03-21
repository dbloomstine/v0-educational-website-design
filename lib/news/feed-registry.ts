/**
 * Feed Registry — canonical source of truth for all news feed sources.
 *
 * DO NOT hardcode feeds anywhere else. All feed URLs, tiers, categories,
 * and scheduling live here. The sync-feeds-to-db utility writes these
 * to the feed_sources table in Supabase.
 *
 * Tiers:
 *  1 — Trade publications (highest value, most frequent fetch)
 *  2 — News wires & financial press
 *  3 — Law firm blogs & client alerts (high-signal for fund launches)
 *  4 — Regulatory & government (SEC, FINRA, CFTC)
 *  5 — Fund service provider press rooms
 *  6 — Dynamic Google News RSS queries
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type FundCategory =
  | 'PE'
  | 'VC'
  | 'credit'
  | 'hedge'
  | 'real_estate'
  | 'infrastructure'
  | 'secondaries'
  | 'gp_stakes';

export type SourceType =
  | 'rss'
  | 'atom'
  | 'google_news'
  | 'web_scrape';

export type ArticleSourceType =
  | 'press_release'
  | 'trade_press'
  | 'news_wire'
  | 'law_firm'
  | 'regulatory'
  | 'blog';

export interface FeedSource {
  name: string;
  url: string;
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  categories: FundCategory[];
  fetchIntervalMinutes: number;
  sourceType: ArticleSourceType;
  feedType?: SourceType;
  notes?: string;
}

// ─── Helper for Google News queries ─────────────────────────────────────────

function googleNewsUrl(query: string): string {
  const encoded = encodeURIComponent(query).replace(/%20/g, '+');
  return `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
}

// ─── Feed Registry ──────────────────────────────────────────────────────────

export const FEED_REGISTRY: FeedSource[] = [
  // ════════════════════════════════════════════════════════════════════════
  // TIER 1 — Trade Publications
  // ════════════════════════════════════════════════════════════════════════
  {
    name: 'Private Equity International',
    url: 'https://www.privateequityinternational.com/feed/',
    tier: 1,
    categories: ['PE'],
    fetchIntervalMinutes: 30,
    sourceType: 'trade_press',
  },
  {
    name: 'Buyouts Insider',
    url: 'https://www.buyoutsinsider.com/feed/',
    tier: 1,
    categories: ['PE'],
    fetchIntervalMinutes: 30,
    sourceType: 'trade_press',
  },
  {
    name: 'PE Hub',
    url: 'https://www.pehub.com/feed/',
    tier: 1,
    categories: ['PE'],
    fetchIntervalMinutes: 30,
    sourceType: 'trade_press',
  },
  {
    name: 'TechCrunch VC',
    url: 'https://techcrunch.com/category/venture/feed/',
    tier: 1,
    categories: ['VC'],
    fetchIntervalMinutes: 30,
    sourceType: 'trade_press',
  },
  {
    name: 'VentureBeat',
    url: 'https://venturebeat.com/category/venture/feed/',
    tier: 1,
    categories: ['VC'],
    fetchIntervalMinutes: 30,
    sourceType: 'trade_press',
  },
  {
    name: 'Crunchbase News',
    url: 'https://news.crunchbase.com/feed/',
    tier: 2,
    categories: ['VC', 'PE'],
    fetchIntervalMinutes: 240,
    sourceType: 'trade_press',
    notes: 'Low signal rate (10% good) — demoted from tier 1, reduced frequency',
  },
  {
    name: 'Institutional Investor',
    url: 'https://www.institutionalinvestor.com/rss/articles.aspx',
    tier: 1,
    categories: ['PE', 'hedge', 'credit'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'Pensions & Investments',
    url: 'https://www.pionline.com/arc/outboundfeeds/rss/?outputType=xml',
    tier: 1,
    categories: ['PE', 'credit', 'infrastructure', 'real_estate'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'PERE',
    url: 'https://www.perenews.com/feed/',
    tier: 1,
    categories: ['real_estate'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'Infrastructure Investor',
    url: 'https://www.infrastructureinvestor.com/feed/',
    tier: 1,
    categories: ['infrastructure'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'Private Debt Investor',
    url: 'https://www.privatedebtinvestor.com/feed/',
    tier: 1,
    categories: ['credit'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'Secondaries Investor',
    url: 'https://www.secondariesinvestor.com/feed/',
    tier: 1,
    categories: ['secondaries'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'Hedge Week',
    url: 'https://www.hedgeweek.com/feed/',
    tier: 1,
    categories: ['hedge'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'AltFi',
    url: 'https://www.altfi.com/rss',
    tier: 1,
    categories: ['PE', 'VC', 'credit'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'Venture Capital Journal',
    url: 'https://www.venturecapitaljournal.com/feed/',
    tier: 1,
    categories: ['VC'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'AltAssets',
    url: 'https://www.altassets.net/feed',
    tier: 1,
    categories: ['PE', 'VC'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'Private Equity Wire',
    url: 'https://www.privateequitywire.co.uk/rss.xml',
    tier: 1,
    categories: ['PE'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'Private Funds CFO',
    url: 'https://www.privatefundscfo.com/feed/',
    tier: 1,
    categories: ['PE', 'credit', 'hedge'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'New Private Markets',
    url: 'https://www.newprivatemarkets.com/feed/',
    tier: 1,
    categories: ['PE', 'credit'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'Middle Market Growth',
    url: 'https://middlemarketgrowth.org/feed/',
    tier: 1,
    categories: ['PE'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'Real Assets Adviser',
    url: 'https://www.realassetsadviser.com/feed/',
    tier: 1,
    categories: ['real_estate', 'infrastructure'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'IPE Real Assets',
    url: 'https://realassets.ipe.com/rss',
    tier: 1,
    categories: ['real_estate', 'infrastructure'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
    notes: 'Institutional real estate investment — European focus',
  },
  {
    name: 'GlobeSt',
    url: 'https://www.globest.com/feed/',
    tier: 1,
    categories: ['real_estate'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
    notes: 'Major CRE news — covers fund activity, deals, capital markets',
  },
  {
    name: 'The Real Deal',
    url: 'https://therealdeal.com/feed/',
    tier: 2,
    categories: ['real_estate'],
    fetchIntervalMinutes: 60,
    sourceType: 'news_wire',
    notes: 'NYC/national real estate news — covers fund launches and deals',
  },
  {
    name: 'Bisnow National',
    url: 'https://www.bisnow.com/feed',
    tier: 2,
    categories: ['real_estate'],
    fetchIntervalMinutes: 60,
    sourceType: 'news_wire',
    notes: 'URL may need verification',
  },
  {
    name: 'National Real Estate Investor',
    url: 'https://www.nreionline.com/rss.xml',
    tier: 2,
    categories: ['real_estate'],
    fetchIntervalMinutes: 120,
    sourceType: 'trade_press',
    notes: 'URL may need verification — part of Informa',
  },
  {
    name: 'ConnectCRE',
    url: 'https://www.connectcre.com/feed/',
    tier: 2,
    categories: ['real_estate'],
    fetchIntervalMinutes: 120,
    sourceType: 'news_wire',
    notes: 'URL may need verification',
  },
  {
    name: 'Agri Investor',
    url: 'https://www.agriinvestor.com/feed/',
    tier: 1,
    categories: ['infrastructure'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'PitchBook News',
    url: 'https://pitchbook.com/news/feed',
    tier: 1,
    categories: ['PE', 'VC', 'credit'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
    notes: 'Major PE/VC data provider — high quality articles',
  },
  {
    name: 'Preqin Insights',
    url: 'https://www.preqin.com/insights/rss',
    tier: 1,
    categories: ['PE', 'VC', 'credit', 'hedge', 'real_estate', 'infrastructure'],
    fetchIntervalMinutes: 120,
    sourceType: 'trade_press',
    notes: 'URL may need verification',
  },
  {
    name: 'Alternatives Watch',
    url: 'https://alternativeswatch.com/feed/',
    tier: 1,
    categories: ['PE', 'hedge', 'credit'],
    fetchIntervalMinutes: 60,
    sourceType: 'trade_press',
  },
  {
    name: 'Funds Society',
    url: 'https://www.fundssociety.com/en/feed/',
    tier: 1,
    categories: ['PE', 'VC', 'credit', 'hedge'],
    fetchIntervalMinutes: 120,
    sourceType: 'trade_press',
    notes: 'Global coverage including Europe and LatAm',
  },
  {
    name: 'Fund Operator',
    url: 'https://www.fundoperator.com/feed/',
    tier: 1,
    categories: ['PE', 'hedge', 'credit'],
    fetchIntervalMinutes: 120,
    sourceType: 'trade_press',
    notes: 'Fund operations focused — COO/CFO audience',
  },
  {
    name: 'With Intelligence',
    url: 'https://www.withintelligence.com/feed/',
    tier: 1,
    categories: ['PE', 'hedge', 'credit'],
    fetchIntervalMinutes: 120,
    sourceType: 'trade_press',
    notes: 'Formerly Pageant Media — PE/hedge/credit intelligence',
  },
  {
    name: 'Allocator Intel',
    url: 'https://allocatorintel.com/feed/',
    tier: 1,
    categories: ['PE', 'hedge', 'credit'],
    fetchIntervalMinutes: 120,
    sourceType: 'trade_press',
    notes: 'LP allocation decisions and manager searches',
  },
  {
    name: 'Responsible Investor',
    url: 'https://www.responsible-investor.com/feed/',
    tier: 1,
    categories: ['PE', 'infrastructure', 'credit'],
    fetchIntervalMinutes: 120,
    sourceType: 'trade_press',
    notes: 'ESG and responsible investment in alternatives',
  },
  {
    name: 'Private Capital Journal',
    url: 'https://www.privatecapitaljournal.com/feed/',
    tier: 1,
    categories: ['PE', 'credit'],
    fetchIntervalMinutes: 120,
    sourceType: 'trade_press',
  },

  // ════════════════════════════════════════════════════════════════════════
  // TIER 2 — News Wires & Financial Press
  // ════════════════════════════════════════════════════════════════════════
  {
    name: 'BusinessWire PE/Buyout',
    url: 'https://www.businesswire.com/rss/home/?rss=G22',
    tier: 2,
    categories: ['PE'],
    fetchIntervalMinutes: 30,
    sourceType: 'news_wire',
  },
  {
    name: 'BusinessWire Financial Services',
    url: 'https://www.businesswire.com/rss/home/?rss=G7',
    tier: 2,
    categories: ['PE', 'VC', 'credit', 'hedge'],
    fetchIntervalMinutes: 30,
    sourceType: 'news_wire',
  },
  {
    name: 'PR Newswire Financial',
    url: 'https://www.prnewswire.com/rss/financial-services-latest-news.rss',
    tier: 2,
    categories: ['PE', 'VC', 'credit', 'hedge'],
    fetchIntervalMinutes: 30,
    sourceType: 'news_wire',
  },
  {
    name: 'GlobeNewsWire Financial Services',
    url: 'https://www.globenewswire.com/RssFeed/subjectcode/25-Private+Equity/feedTitle/GlobeNewswire+-+Private+Equity',
    tier: 2,
    categories: ['PE'],
    fetchIntervalMinutes: 30,
    sourceType: 'news_wire',
  },
  {
    name: 'Reuters Business',
    url: 'https://feeds.reuters.com/reuters/businessNews',
    tier: 2,
    categories: ['PE', 'VC', 'credit', 'hedge'],
    fetchIntervalMinutes: 60,
    sourceType: 'news_wire',
  },
  {
    name: 'Reuters Companies',
    url: 'https://feeds.reuters.com/reuters/companyNews',
    tier: 2,
    categories: ['PE', 'VC'],
    fetchIntervalMinutes: 60,
    sourceType: 'news_wire',
  },
  {
    name: 'Funds Europe',
    url: 'https://www.funds-europe.com/rss',
    tier: 2,
    categories: ['PE', 'credit', 'hedge'],
    fetchIntervalMinutes: 60,
    sourceType: 'news_wire',
  },
  {
    name: 'Wealth Management',
    url: 'https://www.wealthmanagement.com/rss.xml',
    tier: 2,
    categories: ['PE', 'hedge', 'credit'],
    fetchIntervalMinutes: 360,
    sourceType: 'news_wire',
    notes: 'Low signal rate (4% good) — reduced frequency',
  },
  {
    name: 'Investment Week',
    url: 'https://www.investmentweek.co.uk/feeds/rss',
    tier: 2,
    categories: ['PE', 'hedge', 'credit'],
    fetchIntervalMinutes: 60,
    sourceType: 'news_wire',
  },
  {
    name: 'ESG Today',
    url: 'https://www.esgtoday.com/feed/',
    tier: 2,
    categories: ['PE', 'infrastructure'],
    fetchIntervalMinutes: 360,
    sourceType: 'news_wire',
    notes: 'Low signal rate (6% good) — reduced frequency',
  },
  {
    name: 'Commercial Observer',
    url: 'https://commercialobserver.com/feed/',
    tier: 2,
    categories: ['real_estate'],
    fetchIntervalMinutes: 60,
    sourceType: 'news_wire',
  },
  {
    name: 'Alternative Credit Investor',
    url: 'https://www.alternativecreditinvestor.com/feed/',
    tier: 2,
    categories: ['credit'],
    fetchIntervalMinutes: 60,
    sourceType: 'news_wire',
  },
  // TechCrunch Fundraising REMOVED — 0% signal rate (avg relevance 0.05).
  // All articles are startup fundraising rounds (Series A/B/C), not fund launches.
  // TechCrunch VC (tier 1) already covers real VC fund news.

  // ════════════════════════════════════════════════════════════════════════
  // TIER 3 — Law Firm Client Alerts
  // ════════════════════════════════════════════════════════════════════════
  {
    name: 'Kirkland & Ellis',
    url: 'https://www.kirkland.com/siteassets/rss/publications.xml',
    tier: 3,
    categories: ['PE', 'credit', 'hedge'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Ropes & Gray',
    url: 'https://www.ropesgray.com/en/newsroom/rss',
    tier: 3,
    categories: ['PE', 'hedge'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Dechert',
    url: 'https://www.dechert.com/knowledge/rss/',
    tier: 3,
    categories: ['PE', 'hedge', 'credit'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Proskauer Rose',
    url: 'https://www.proskauer.com/rss/publications',
    tier: 3,
    categories: ['PE', 'hedge'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Goodwin Procter',
    url: 'https://www.goodwinlaw.com/en/news-and-insights/rss',
    tier: 3,
    categories: ['PE', 'VC'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Latham & Watkins',
    url: 'https://www.lw.com/rss/newspublications.aspx',
    tier: 3,
    categories: ['PE', 'credit', 'infrastructure'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Willkie Farr',
    url: 'https://www.willkie.com/rss',
    tier: 3,
    categories: ['PE', 'hedge'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Debevoise & Plimpton',
    url: 'https://www.debevoise.com/rss',
    tier: 3,
    categories: ['PE', 'hedge'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Paul Weiss',
    url: 'https://www.paulweiss.com/rss',
    tier: 3,
    categories: ['PE'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Akin',
    url: 'https://www.akingump.com/en/rss',
    tier: 3,
    categories: ['PE', 'infrastructure'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Schulte Roth & Zabel',
    url: 'https://www.srz.com/en/insights/rss.xml',
    tier: 3,
    categories: ['hedge', 'PE'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Morgan Lewis',
    url: 'https://www.morganlewis.com/rss',
    tier: 3,
    categories: ['PE', 'VC', 'hedge'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'WilmerHale',
    url: 'https://www.wilmerhale.com/en/rss',
    tier: 3,
    categories: ['VC', 'PE'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Gibson Dunn',
    url: 'https://www.gibsondunn.com/rss',
    tier: 3,
    categories: ['PE', 'credit'],
    fetchIntervalMinutes: 360,
    sourceType: 'law_firm',
    notes: 'Low signal rate (5% good) — reduced frequency',
  },
  {
    name: 'Cleary Gottlieb',
    url: 'https://www.clearygottlieb.com/rss',
    tier: 3,
    categories: ['PE', 'credit'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Skadden',
    url: 'https://www.skadden.com/rss',
    tier: 3,
    categories: ['PE', 'credit'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'DLA Piper',
    url: 'https://www.dlapiper.com/rss',
    tier: 3,
    categories: ['PE', 'real_estate'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Greenberg Traurig',
    url: 'https://www.gtlaw.com/rss',
    tier: 3,
    categories: ['PE', 'real_estate'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Paul Hastings',
    url: 'https://www.paulhastings.com/rss',
    tier: 3,
    categories: ['PE', 'credit'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Sidley Austin',
    url: 'https://www.sidley.com/rss',
    tier: 3,
    categories: ['PE', 'hedge', 'credit'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Weil Gotshal',
    url: 'https://www.weil.com/rss',
    tier: 3,
    categories: ['PE', 'credit'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Davis Polk',
    url: 'https://www.davispolk.com/rss',
    tier: 3,
    categories: ['PE', 'hedge'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Fried Frank',
    url: 'https://www.friedfrank.com/rss',
    tier: 3,
    categories: ['PE', 'real_estate'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },
  {
    name: 'Simpson Thacher',
    url: 'https://www.simpsonthacher.com/content/rss/',
    tier: 3,
    categories: ['PE', 'credit'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
    notes: 'URL pattern unverified — may need adjustment',
  },
  {
    name: 'Vinson & Elkins',
    url: 'https://www.velaw.com/rss',
    tier: 3,
    categories: ['PE', 'infrastructure'],
    fetchIntervalMinutes: 120,
    sourceType: 'law_firm',
  },

  // ════════════════════════════════════════════════════════════════════════
  // TIER 4 — Regulatory & Government
  // ════════════════════════════════════════════════════════════════════════
  {
    name: 'SEC Press Releases',
    url: 'https://www.sec.gov/rss/news/press-releases.xml',
    tier: 4,
    categories: ['PE', 'VC', 'hedge', 'credit'],
    fetchIntervalMinutes: 60,
    sourceType: 'regulatory',
  },
  {
    name: 'SEC Litigation Releases',
    url: 'https://www.sec.gov/litigation/litreleases.rss',
    tier: 4,
    categories: ['PE', 'hedge'],
    fetchIntervalMinutes: 120,
    sourceType: 'regulatory',
  },
  {
    name: 'CFTC Press Releases',
    url: 'https://www.cftc.gov/rss/pressroom.xml',
    tier: 4,
    categories: ['hedge', 'credit'],
    fetchIntervalMinutes: 120,
    sourceType: 'regulatory',
  },
  {
    name: 'Federal Register SEC Rules',
    url: 'https://www.federalregister.gov/documents/search.rss?conditions[agencies][]=securities-and-exchange-commission',
    tier: 4,
    categories: ['PE', 'VC', 'hedge', 'credit'],
    fetchIntervalMinutes: 240,
    sourceType: 'regulatory',
  },

  // ════════════════════════════════════════════════════════════════════════
  // TIER 5 — Fund Service Provider Press Rooms
  // ════════════════════════════════════════════════════════════════════════
  {
    name: 'IQ-EQ News',
    url: 'https://iqeq.com/news/feed/',
    tier: 5,
    categories: ['PE', 'credit', 'real_estate'],
    fetchIntervalMinutes: 240,
    sourceType: 'press_release',
    notes: 'Danny employer — high priority',
  },
  {
    name: 'Citco Group News',
    url: 'https://www.citco.com/feed/',
    tier: 5,
    categories: ['hedge', 'PE', 'credit'],
    fetchIntervalMinutes: 240,
    sourceType: 'press_release',
    notes: 'URL may need verification',
  },
  {
    name: 'SS&C Technologies',
    url: 'https://www.ssctech.com/rss',
    tier: 5,
    categories: ['PE', 'hedge', 'credit'],
    fetchIntervalMinutes: 240,
    sourceType: 'press_release',
    notes: 'URL may need verification',
  },
  {
    name: 'Alter Domus',
    url: 'https://www.alterdomus.com/feed/',
    tier: 5,
    categories: ['PE', 'credit', 'real_estate'],
    fetchIntervalMinutes: 240,
    sourceType: 'press_release',
    notes: 'URL may need verification',
  },
  {
    name: 'Apex Group',
    url: 'https://www.apexgroup.com/feed/',
    tier: 5,
    categories: ['PE', 'credit', 'hedge'],
    fetchIntervalMinutes: 240,
    sourceType: 'press_release',
    notes: 'URL may need verification',
  },
  {
    name: 'JTC Group',
    url: 'https://www.jtcgroup.com/feed/',
    tier: 5,
    categories: ['PE', 'real_estate'],
    fetchIntervalMinutes: 240,
    sourceType: 'press_release',
    notes: 'URL may need verification',
  },
  {
    name: 'CSC Global',
    url: 'https://www.cscgfm.com/feed/',
    tier: 5,
    categories: ['PE', 'credit', 'hedge'],
    fetchIntervalMinutes: 240,
    sourceType: 'press_release',
    notes: 'Major fund admin — URL may need verification',
  },
  {
    name: 'Maples Group',
    url: 'https://maples.com/feed/',
    tier: 5,
    categories: ['PE', 'credit', 'hedge'],
    fetchIntervalMinutes: 240,
    sourceType: 'press_release',
    notes: 'Fund services and legal — URL may need verification',
  },
  {
    name: 'Ocorian',
    url: 'https://www.ocorian.com/feed/',
    tier: 5,
    categories: ['PE', 'credit', 'real_estate'],
    fetchIntervalMinutes: 240,
    sourceType: 'press_release',
    notes: 'Fund admin and corporate services — URL may need verification',
  },
  {
    name: 'Aztec Group',
    url: 'https://www.aztecgroup.co.uk/feed/',
    tier: 5,
    categories: ['PE', 'credit', 'real_estate'],
    fetchIntervalMinutes: 240,
    sourceType: 'press_release',
    notes: 'Fund admin — URL may need verification',
  },
  {
    name: 'Waystone',
    url: 'https://www.waystone.com/feed/',
    tier: 5,
    categories: ['PE', 'hedge', 'credit'],
    fetchIntervalMinutes: 240,
    sourceType: 'press_release',
    notes: 'Fund governance and management company services — URL may need verification',
  },

  // ════════════════════════════════════════════════════════════════════════
  // TIER 6 — Dynamic Google News RSS Queries
  // ════════════════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════════════════
  // TIER 6 — Dynamic Google News RSS Queries
  // Broadened queries (less exact-match) for better coverage.
  // ════════════════════════════════════════════════════════════════════════
  {
    name: 'GNews: PE Fund',
    url: googleNewsUrl('private equity fund launch OR close OR raise'),
    tier: 6,
    categories: ['PE'],
    fetchIntervalMinutes: 360,
    sourceType: 'blog',
    feedType: 'google_news',
  },
  {
    name: 'GNews: VC Fund',
    url: googleNewsUrl('venture capital fund close OR raise OR launch'),
    tier: 6,
    categories: ['VC'],
    fetchIntervalMinutes: 360,
    sourceType: 'blog',
    feedType: 'google_news',
  },
  {
    name: 'GNews: Hedge Fund',
    url: googleNewsUrl('hedge fund launch OR close OR billion'),
    tier: 6,
    categories: ['hedge'],
    fetchIntervalMinutes: 360,
    sourceType: 'blog',
    feedType: 'google_news',
  },
  {
    name: 'GNews: Private Credit',
    url: googleNewsUrl('private credit fund OR direct lending fund'),
    tier: 6,
    categories: ['credit'],
    fetchIntervalMinutes: 360,
    sourceType: 'blog',
    feedType: 'google_news',
  },
  {
    name: 'GNews: Infrastructure Fund',
    url: googleNewsUrl('infrastructure fund raise OR close OR launch'),
    tier: 6,
    categories: ['infrastructure'],
    fetchIntervalMinutes: 360,
    sourceType: 'blog',
    feedType: 'google_news',
  },
  {
    name: 'GNews: Real Estate Fund',
    url: googleNewsUrl('real estate fund raise OR launch OR close'),
    tier: 6,
    categories: ['real_estate'],
    fetchIntervalMinutes: 360,
    sourceType: 'blog',
    feedType: 'google_news',
  },
  {
    name: 'GNews: Secondaries',
    url: googleNewsUrl('secondaries fund OR continuation vehicle OR GP-led secondary'),
    tier: 6,
    categories: ['secondaries'],
    fetchIntervalMinutes: 360,
    sourceType: 'blog',
    feedType: 'google_news',
  },
  {
    name: 'GNews: Fund Administration',
    url: googleNewsUrl('fund administrator OR fund administration acquisition OR hire'),
    tier: 6,
    categories: ['PE', 'credit'],
    fetchIntervalMinutes: 360,
    sourceType: 'blog',
    feedType: 'google_news',
  },
  {
    name: 'GNews: LP Allocations',
    url: googleNewsUrl('pension fund allocation OR endowment alternatives OR LP commitment private equity'),
    tier: 6,
    categories: ['PE'],
    fetchIntervalMinutes: 360,
    sourceType: 'blog',
    feedType: 'google_news',
  },
  {
    name: 'GNews: NAV Lending',
    url: googleNewsUrl('NAV lending OR NAV loan fund'),
    tier: 6,
    categories: ['credit', 'PE'],
    fetchIntervalMinutes: 360,
    sourceType: 'blog',
    feedType: 'google_news',
  },
  {
    name: 'GNews: Fundraising',
    url: googleNewsUrl('fundraising private equity OR venture capital billion'),
    tier: 6,
    categories: ['PE', 'VC'],
    fetchIntervalMinutes: 360,
    sourceType: 'blog',
    feedType: 'google_news',
  },
];

// ─── Utility functions ──────────────────────────────────────────────────────

/** Get feeds by tier */
export function getFeedsByTier(tiers: number[]): FeedSource[] {
  return FEED_REGISTRY.filter((f) => tiers.includes(f.tier));
}

/** Get all active feed count by tier */
export function getFeedCountByTier(): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const feed of FEED_REGISTRY) {
    counts[feed.tier] = (counts[feed.tier] ?? 0) + 1;
  }
  return counts;
}

/** Total feed count */
export const TOTAL_FEED_COUNT = FEED_REGISTRY.length;
