/**
 * Fund Watch Automation System - Normalizer
 *
 * Normalizes fund data (categories, stages, locations, amounts).
 */

import type { ExtractedFund, FundCategory, FundStage, FundStrategy, TargetGeography } from './types';
import {
  CATEGORY_KEYWORDS,
  STAGE_PATTERNS,
  AMOUNT_PATTERNS,
  FX_RATES,
  STRATEGY_KEYWORDS,
  GEOGRAPHY_KEYWORDS,
} from './config';

// ============================================================================
// Category Normalization
// ============================================================================

/**
 * Infer category from fund name and description
 */
export function inferCategory(
  fundName: string,
  description: string,
  existingCategory?: string
): FundCategory {
  const text = `${fundName} ${description}`.toLowerCase();

  // Priority order for category detection
  const categoryPriority: FundCategory[] = [
    'Secondaries & GP-Stakes',
    'Hedge Funds',
    'Infrastructure',
    'Real Estate',
    'Credit Funds',
    'Venture Capital',
    'Private Equity',
  ];

  for (const category of categoryPriority) {
    const keywords = CATEGORY_KEYWORDS[category];
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      return category;
    }
  }

  // If existing category is valid, keep it
  const validCategories: FundCategory[] = [
    'Venture Capital',
    'Private Equity',
    'Credit Funds',
    'Real Estate',
    'Infrastructure',
    'Secondaries & GP-Stakes',
    'Hedge Funds',
  ];

  if (existingCategory && validCategories.includes(existingCategory as FundCategory)) {
    return existingCategory as FundCategory;
  }

  return 'Private Equity'; // Default
}

/**
 * Normalize category string to valid FundCategory
 */
export function normalizeCategory(category: string): FundCategory {
  const validCategories: FundCategory[] = [
    'Venture Capital',
    'Private Equity',
    'Credit Funds',
    'Real Estate',
    'Infrastructure',
    'Secondaries & GP-Stakes',
    'Hedge Funds',
  ];

  // Exact match
  if (validCategories.includes(category as FundCategory)) {
    return category as FundCategory;
  }

  // Common variations
  const categoryMap: Record<string, FundCategory> = {
    'vc': 'Venture Capital',
    'venture': 'Venture Capital',
    'pe': 'Private Equity',
    'buyout': 'Private Equity',
    'credit': 'Credit Funds',
    'debt': 'Credit Funds',
    'lending': 'Credit Funds',
    'realestate': 'Real Estate',
    'property': 'Real Estate',
    'infra': 'Infrastructure',
    'secondaries': 'Secondaries & GP-Stakes',
    'gpstakes': 'Secondaries & GP-Stakes',
    'gp-stakes': 'Secondaries & GP-Stakes',
    'hedge': 'Hedge Funds',
    'hedgefund': 'Hedge Funds',
    'multistrategy': 'Hedge Funds',
    'globalmacro': 'Hedge Funds',
  };

  const lowerCategory = category.toLowerCase().replace(/[^a-z]/g, '');
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(key)) {
      return value;
    }
  }

  return 'Private Equity';
}

// ============================================================================
// Stage Normalization
// ============================================================================

/**
 * Infer stage from fund name and description
 */
export function inferStage(
  fundName: string,
  description: string,
  existingStage?: string
): FundStage {
  const text = `${fundName} ${description}`;

  // Check patterns in priority order
  const stagePriority: FundStage[] = [
    'Final Close',
    'Interim Close',
    'First Close',
    'Launch',
  ];

  for (const stage of stagePriority) {
    if (stage !== 'Other' && STAGE_PATTERNS[stage].test(text)) {
      return stage;
    }
  }

  // If existing stage is valid, keep it
  const validStages: FundStage[] = [
    'Final Close',
    'First Close',
    'Interim Close',
    'Launch',
    'Other',
  ];

  if (existingStage && validStages.includes(existingStage as FundStage)) {
    return existingStage as FundStage;
  }

  return 'Other';
}

/**
 * Normalize stage string to valid FundStage
 */
export function normalizeStage(stage: string): FundStage {
  const validStages: FundStage[] = [
    'Final Close',
    'First Close',
    'Interim Close',
    'Launch',
    'Other',
  ];

  // Exact match
  if (validStages.includes(stage as FundStage)) {
    return stage as FundStage;
  }

  // Pattern-based detection
  for (const [stageName, pattern] of Object.entries(STAGE_PATTERNS)) {
    if (stageName !== 'Other' && pattern.test(stage)) {
      return stageName as FundStage;
    }
  }

  return 'Other';
}

// ============================================================================
// Strategy Normalization
// ============================================================================

/**
 * Infer strategy from fund name, category, and description
 */
export function inferStrategy(
  fundName: string,
  category: FundCategory,
  description: string,
  existingStrategy?: string | null
): FundStrategy | null {
  // If already has a valid strategy, keep it
  if (existingStrategy) {
    const validStrategies = Object.keys(STRATEGY_KEYWORDS) as FundStrategy[];
    if (validStrategies.includes(existingStrategy as FundStrategy)) {
      return existingStrategy as FundStrategy;
    }
  }

  const text = `${fundName} ${description}`.toLowerCase();

  // Check each strategy's keywords
  for (const [strategy, keywords] of Object.entries(STRATEGY_KEYWORDS)) {
    if (strategy === 'Other') continue;
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      return strategy as FundStrategy;
    }
  }

  return null;
}

/**
 * Normalize strategy string to valid FundStrategy
 */
export function normalizeStrategy(strategy: string | null | undefined): FundStrategy | null {
  if (!strategy) return null;

  const validStrategies = Object.keys(STRATEGY_KEYWORDS) as FundStrategy[];

  // Exact match
  if (validStrategies.includes(strategy as FundStrategy)) {
    return strategy as FundStrategy;
  }

  // Keyword-based match
  const lowerStrategy = strategy.toLowerCase();
  for (const [strat, keywords] of Object.entries(STRATEGY_KEYWORDS)) {
    if (strat === 'Other') continue;
    if (keywords.some((kw) => lowerStrategy.includes(kw))) {
      return strat as FundStrategy;
    }
  }

  return null;
}

// ============================================================================
// Geography Normalization
// ============================================================================

/**
 * Infer target geography from fund name, location, and description
 */
export function inferGeography(
  fundName: string,
  description: string,
  country: string,
  existingGeography?: string | null
): TargetGeography | null {
  // If already has a valid geography, keep it
  if (existingGeography) {
    const validGeographies = Object.keys(GEOGRAPHY_KEYWORDS) as TargetGeography[];
    if (validGeographies.includes(existingGeography as TargetGeography)) {
      return existingGeography as TargetGeography;
    }
  }

  const text = `${fundName} ${description}`.toLowerCase();

  // Check each geography's keywords
  for (const [geo, keywords] of Object.entries(GEOGRAPHY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      return geo as TargetGeography;
    }
  }

  // Fallback: infer from country if available
  if (country) {
    const lowerCountry = country.toLowerCase();
    if (['us', 'usa', 'united states', 'canada', 'mexico'].includes(lowerCountry)) {
      return 'North America';
    }
    if (['uk', 'gb', 'germany', 'france', 'spain', 'italy', 'netherlands', 'sweden', 'norway', 'denmark', 'finland', 'switzerland'].includes(lowerCountry)) {
      return 'Europe';
    }
    if (['china', 'japan', 'korea', 'india', 'singapore', 'australia', 'hong kong', 'taiwan', 'indonesia', 'vietnam', 'thailand', 'malaysia', 'philippines'].includes(lowerCountry)) {
      return 'Asia-Pacific';
    }
    if (['brazil', 'argentina', 'chile', 'colombia', 'peru'].includes(lowerCountry)) {
      return 'Latin America';
    }
    if (['saudi arabia', 'uae', 'qatar', 'kuwait', 'south africa', 'nigeria', 'egypt', 'kenya'].includes(lowerCountry)) {
      return 'Middle East & Africa';
    }
  }

  return null;
}

/**
 * Normalize geography string to valid TargetGeography
 */
export function normalizeGeography(geography: string | null | undefined): TargetGeography | null {
  if (!geography) return null;

  const validGeographies = Object.keys(GEOGRAPHY_KEYWORDS) as TargetGeography[];

  // Exact match
  if (validGeographies.includes(geography as TargetGeography)) {
    return geography as TargetGeography;
  }

  // Keyword-based match
  const lowerGeo = geography.toLowerCase();
  for (const [geo, keywords] of Object.entries(GEOGRAPHY_KEYWORDS)) {
    if (keywords.some((kw) => lowerGeo.includes(kw))) {
      return geo as TargetGeography;
    }
  }

  return null;
}

// ============================================================================
// Amount Normalization
// ============================================================================

/**
 * Get USD conversion rate for a currency
 */
function getUsdRate(currency: string): number {
  switch (currency) {
    case 'EUR':
      return FX_RATES.EUR_USD;
    case 'GBP':
      return FX_RATES.GBP_USD;
    case 'CAD':
      return FX_RATES.CAD_USD;
    case 'INR':
      return FX_RATES.INR_USD;
    case 'USD':
    default:
      return 1;
  }
}

/**
 * Parse amount string to USD millions
 */
export function parseAmountToMillions(amount: string): number | null {
  if (!amount) return null;

  const lowerAmount = amount.toLowerCase();
  if (lowerAmount.includes('undisclosed') || lowerAmount === 'n/a') {
    return null;
  }

  for (const { regex, multiplier, currency } of AMOUNT_PATTERNS) {
    const match = amount.match(regex);
    if (match) {
      const value = parseFloat(match[1]);
      const fxRate = getUsdRate(currency);
      const usdMillions = value * multiplier * fxRate;
      return Math.round(usdMillions * 10) / 10; // Round to 1 decimal
    }
  }

  return null;
}

/**
 * Format amount in millions to display string
 */
export function formatAmount(amountMillions: number | null): string {
  if (amountMillions === null) return 'Undisclosed';

  if (amountMillions >= 1000) {
    const billions = amountMillions / 1000;
    return `$${billions.toFixed(1)}B`.replace('.0B', 'B');
  }

  return `$${amountMillions}M`;
}

// ============================================================================
// Firm Website Mapping
// ============================================================================

/**
 * Known firm websites for fallback when not extracted from article
 */
export const FIRM_WEBSITE_MAP: Record<string, string> = {
  // Major PE firms
  'blackstone': 'blackstone.com',
  'kkr': 'kkr.com',
  'apollo': 'apollo.com',
  'carlyle': 'carlyle.com',
  'tpg': 'tpg.com',
  'warburg': 'warburgpincus.com',
  'advent': 'adventinternational.com',
  'bain capital': 'baincapital.com',
  'permira': 'permira.com',
  'thoma bravo': 'thomabravo.com',
  'vista equity': 'vistaequitypartners.com',
  'silver lake': 'silverlake.com',
  'cvc': 'cvc.com',
  'eqt': 'eqtgroup.com',
  'bridgepoint': 'bridgepoint.eu',
  'clearlake': 'clearlake.com',
  'h.i.g.': 'higcapital.com',
  'hig capital': 'higcapital.com',
  'lindsay goldberg': 'lindsaygoldberg.com',
  'new mountain': 'newmountaincapital.com',
  'arlington capital': 'arlingtoncap.com',
  'shore capital': 'shorecp.com',

  // VC firms
  'sequoia': 'sequoiacap.com',
  'andreessen': 'a16z.com',
  'a16z': 'a16z.com',
  'lightspeed': 'lsvp.com',
  'accel': 'accel.com',
  'benchmark': 'benchmark.com',
  'greylock': 'greylock.com',
  'general catalyst': 'generalcatalyst.com',
  'lux capital': 'luxcapital.com',
  'point72': 'point72.com',

  // Credit/debt funds
  'ares': 'aresmgmt.com',
  'oaktree': 'oaktreecapital.com',
  'blue owl': 'blueowl.com',
  'hps': 'hpspartners.com',
  'owl rock': 'blueowl.com',
  'golub': 'golubcapital.com',
  'monroe capital': 'monroecap.com',
  'antares': 'antares.com',
  'arcmont': 'arcmont.com',
  'benefit street': 'benefitstreetpartners.com',
  'crescent capital': 'crescentcap.com',
  'tree line': 'treelinecapital.com',
  'sixth street': 'sixthstreet.com',
  'viola credit': 'viola-group.com',

  // Real estate
  'brookfield': 'brookfield.com',
  'hines': 'hines.com',
  'heitman': 'heitman.com',
  'bridge investment': 'bridgeig.com',
  'cbre investment': 'cbreim.com',
  'patrizia': 'patrizia.ag',
  'stonepeak': 'stonepeakpartners.com',

  // Infrastructure
  'infranity': 'infranity.com',
  'ardian': 'ardian.com',

  // Secondaries / GP stakes
  'coller': 'collercapital.com',
  'hamilton lane': 'hamiltonlane.com',
  'stepstone': 'stepstoneglobal.com',
  'stafford': 'staffordcp.com',
  'banner ridge': 'bannerridgepartners.com',

  // Banks/asset managers
  'goldman': 'goldmansachs.com',
  'morgan stanley': 'morganstanley.com',
  'j.p. morgan': 'jpmorgan.com',
  'jp morgan': 'jpmorgan.com',
  'jpmorgan': 'jpmorgan.com',
  'blackrock': 'blackrock.com',
  'invesco': 'invesco.com',
  'alliancebernstein': 'alliancebernstein.com',
  'allianz': 'allianz.com',
  'janus henderson': 'janushenderson.com',
  'hsbc': 'hsbc.com',
  'cibc': 'cibc.com',
  'investec': 'investec.com',
  'swiss life': 'swisslife-am.com',

  // Sovereign wealth / pensions
  'adia': 'adia.ae',
  'mubadala': 'mubadala.com',
  'gic': 'gic.com.sg',
  'temasek': 'temasek.com.sg',
  'cppib': 'cppinvestments.com',
  'cdpq': 'cdpq.com',
  'psp': 'investpsp.com',
  'otpp': 'otpp.com',
  'calpers': 'calpers.ca.gov',
  'calstrs': 'calstrs.com',
  'qia': 'qia.qa',
  'jadwa': 'jadwa.com',

  // European firms
  'eurazeo': 'eurazeo.com',
  'apheon': 'apheon.com',
  'amethis': 'amethis.com',
  'daphni': 'daphni.com',
  'b2venture': 'b2venture.vc',

  // Asia-Pacific
  'capitaland': 'capitaland.com',
  'seatown': 'seatownholdings.com',
  'rrj capital': 'rrjcapital.com',

  // Mid-market / specialty
  'capman': 'capman.com',
  'foresight': 'foresightgroup.eu',
  'pantheon': 'pantheon.com',
  'davidson kempner': 'davidsonkempner.com',
  'galaxy digital': 'galaxydigital.io',
  'hashkey': 'hashkey.com',
  'obra capital': 'obracapital.com',
  'santé ventures': 'santeventures.com',
  'mcrock': 'mcrockcapital.com',
  'guidepost': 'guidepostgrowth.com',
  'appworks': 'appworks.tw',
  'encore consumer': 'encoreconsumercapital.com',
  'highland rim': 'highlandrimcapital.com',
  'highvista': 'highvista.com',
  'pinegrove': 'pinegrovepartners.com',
  'bv investment': 'bvlp.com',
  'nassau': 'nfrg.com',

  // Development banks
  'asian development bank': 'adb.org',
  'british business bank': 'british-business-bank.co.uk',

  // Others from fund directory
  'tortoise': 'tortoiseadvisors.com',
  'realty income': 'realtyincome.com',
  'first trust': 'ftportfolios.com',
  'westwood': 'westwoodgroup.com',
  'lendable': 'lendable.com',
  'lighthouse canton': 'lighthousecanton.com',
  'creator fund': 'creatorfund.vc',
  'sundaram': 'sundaramalternates.com',
  'hdfc': 'hdfcfund.com',
  'sanlam': 'sanlaminvestments.com',
  'centum': 'centum.co.ke',
  'sahel capital': 'sahelcp.com',
  'samara': 'samaracapital.in',
  'ariel investments': 'arielinvestments.com',

  // Additional firms from fund directory
  'fearless fund': 'fearless.fund',
  'covenant': 'covenantcapgroup.com',
  'mundi ventures': 'mundiventures.com',
  'kembara': 'mundiventures.com',
  'unicorn india': 'unicornivc.com',
  'timber bay': 'timberbaypartners.com',
  'carousel capital': 'carouselcapital.com',
  'newcore': 'newcorecapital.com',
  'shorooq': 'shorooq.com',
  'ananda': 'ananda.vc',
  'bridges': 'bridgesfundmanagement.com',
  'gore street': 'gorestreetcap.com',
  'blue earth': 'blueearth.capital',
  'desjardins': 'desjardins.com',
  'power sustainable': 'powersustainable.com',
  'creation investments': 'creationinvestments.com',
  'arcano': 'arcanopartners.com',
  'hongkong land': 'hkland.com',
  'epidarex': 'epidarex.com',
  'seraya': 'serayapartners.com',
  'catalio': 'cataliocapital.com',
  'xsml': 'xsmlcapital.com',
  'enko': 'enkocapital.com',
  'lbp am': 'lbpam.com',

  // More firms
  'abacus finance': 'abacusfinance.com',
  'aip management': 'aipam.com',
  '55 north': '55north.com',
  'cedarbridge': 'cedarbridge.com',
  'comstock': 'comstockcompanies.com',
  'develop north': 'develop-north.com',
  'firgun': 'firgunventures.com',
  'interstate equities': 'interstateequities.com',
  'pacific am': 'pac-am.com',
  'rosberg': 'rosbergventures.com',
  'stoneshield': 'stoneshield.es',
  'uobam': 'uobam.com.my',
  'voyager ventures': 'voyagerventures.co',
  'zollhof': 'zollhof.de',

  // Final batch
  'cais': 'caisgroup.com',
  'caz investments': 'cazinvestments.com',
  'invest international': 'investinternational.nl',
  'rmb capitalworks': 'rmbcapitalworks.com',
  'capitalworks': 'capitalworksip.com',
  'barjeel': 'barjeelgeojit.com',
  'mpc capital': 'mpc-capital.com',
  'patrimonium': 'patrimonium.ch',
  'threestones': 'threestonescapital.com',
  'artha india': 'arthaindiaventures.com',
  'slatevc': 'slate.vc',
  'transition vc': 'transitionvc.com',
  'vest ventures': 'vestventures.com',
  'modulus': 'modulus.com',
  'nine mile': 'ninemilecapital.com',
  'sandbrook': 'sandbrookcapital.com',
  'axiom equity': 'axiomequity.com',
  'breakwall': 'breakwallcapital.com',
  'eir partners': 'eirpartners.com',
  'harvey capital': 'harveycapital.com',
  'springcoast': 'springcoastpartners.com',
  'wolff': 'wolff.com',
  'sidbi': 'sidbi.in',

  // New firms from web search - February 2026
  // Major PE/Growth Equity
  'alpine investors': 'alpineinvestors.com',
  'apax': 'apax.com',
  'battery ventures': 'battery.com',
  'berkshire partners': 'berkshirepartners.com',
  'cinven': 'cinven.com',
  'genstar': 'gencap.com',
  'hellman': 'hf.com',
  'hellman & friedman': 'hf.com',
  'hg capital': 'hgcapital.com',
  'hg ': 'hgcapital.com',
  'icg': 'icgam.com',
  'intermediate capital': 'icgam.com',
  'ik partners': 'ikpartners.com',
  'insight partners': 'insightpartners.com',
  'jordan company': 'tjclp.com',
  'kohlberg': 'kohlberg.com',
  'nordic capital': 'nordiccapital.com',
  'pai partners': 'paipartners.com',
  'partners group': 'partnersgroup.com',
  'summit partners': 'summitpartners.com',
  'triton partners': 'triton-partners.com',
  'trivest': 'trivest.com',

  // VC firms
  'battery': 'battery.com',
  'coatue': 'coatue.com',
  'dst global': 'dst-global.com',
  'foresite': 'foresitecapital.com',
  'five elms': 'fiveelms.com',
  'frazier healthcare': 'frazierhealthcare.com',
  'iconiq': 'iconiqcapital.com',
  'index ventures': 'indexventures.com',
  'speedinvest': 'speedinvest.com',
  'thrive capital': 'thrivecap.com',
  'tiger global': 'tigerglobal.com',
  'softbank': 'visionfund.com',
  'vision fund': 'visionfund.com',

  // Infrastructure
  'antin': 'antin-ip.com',
  'antin infrastructure': 'antin-ip.com',
  'ancala': 'ancala.com',
  'copenhagen infrastructure': 'cip.com',
  'fengate': 'fengate.com',
  'global infrastructure partners': 'global-infra.com',
  'gip': 'global-infra.com',
  'icon infrastructure': 'iconinfrastructure.com',
  'meridiam': 'meridiam.com',

  // Real Estate
  'cbre global': 'cbreim.com',
  'greystar': 'greystar.com',
  'harrison street': 'harrisonst.com',
  'ksl capital': 'kslcapital.com',
  'lone star': 'lonestarfunds.com',
  'stockbridge': 'stockbridge.com',
  'waterton': 'waterton.com',

  // Credit/Debt
  'acore': 'acorecapital.com',
  'blue torch': 'bluetorchcapital.com',
  'canyon partners': 'canyonpartners.com',

  // Secondaries/GP-Stakes
  'arctos': 'arctospartners.com',
  'harbourvest': 'harbourvest.com',
  'hunter point': 'hunterpointcapital.com',
  'lexington partners': 'lexingtonpartners.com',

  // Asset Managers
  'd.e. shaw': 'deshaw.com',
  'de shaw': 'deshaw.com',
  'capstone investment': 'capstoneco.com',
  'franklin templeton': 'franklintempleton.com',
  'gramercy': 'gramercy.com',
  'macquarie': 'macquarie.com',
  'magnetar': 'magnetar.com',
  'manulife': 'manulifeim.com',
  'neuberger': 'nb.com',
  'pag': 'pag.com',
  'state street': 'ssga.com',

  // Climate/Impact
  'breakthrough energy': 'breakthroughenergy.org',
  'clean energy ventures': 'cleanenergyventures.com',
  'engine': 'engine.xyz',
  'leapfrog': 'leapfroginvest.com',
  'world fund': 'worldfund.vc',

  // Regional/Specialty
  'astorg': 'astorg.com',
  'bregal sagemount': 'sagemount.com',
  'eci partners': 'ecipartners.com',
  'kedaara': 'kedaara.com',
  'newspring': 'newspringcapital.com',
  'norvestor': 'norvestor.com',

  // Additional firms - batch 2
  'altos ventures': 'altos.vc',
  'ccmp': 'ccmpgrowth.com',
  'cortec': 'cortecgroup.com',
  'centeroak': 'centeroakpartners.com',
  'monomoy': 'mcpfunds.com',
  'mill point': 'millpoint.com',
  'pennybacker': 'pennybackercap.com',
  'renovus': 'renovuscapital.com',
  'exoduspoint': 'exoduspoint.com',
  'jain global': 'jainglobal.com',
  'quadria': 'quadriacapital.com',
  'ac ventures': 'acv.vc',
  'team8': 'team8.vc',
  'fly ventures': 'fly.vc',
  'isai': 'isai.vc',
  'brandon capital': 'brandoncapital.vc',

  // Additional firms - batch 3
  'blackfin': 'blackfin.com',
  'commonfund': 'commonfund.org',
  'cf private equity': 'cfprivateequity.com',
  'vestar': 'vestarcapital.com',
  'gtcr': 'gtcr.com',
  'veritas capital': 'veritascapital.com',
  'roark': 'roarkcapital.com',
  'leonard green': 'leonardgreen.com',
  'welsh carson': 'wcas.com',
  'wcas': 'wcas.com',
  'francisco partners': 'franciscopartners.com',
  'great hill': 'greathillpartners.com',
  'oak hill': 'oakhill.com',
  'onex': 'onex.com',
  'lovell minnick': 'lmpartners.com',
  'madison industries': 'madison.net',
  'odyssey investment': 'odysseyinvestment.com',

  // Additional firms - batch 4
  'cavu consumer': 'cavuconsumer.com',
  'cavu': 'cavuconsumer.com',
  'blueprint equity': 'onblueprint.com',
  'kensington capital': 'kcpl.ca',
  'd. e. shaw': 'deshaw.com',
  'hg': 'hgcapital.com',

  // Additional firms - batch 5
  'kian capital': 'kiancapital.com',
  'launchbay': 'launchbaycapital.com',
  'klar partners': 'klarpartners.com',
  'klar': 'klarpartners.com',
};

/**
 * Infer firm website from firm name or use extracted value
 */
export function inferFirmWebsite(firm: string, extracted?: string | null): string | null {
  // If a valid website was extracted, use it
  if (extracted && extracted.trim()) {
    // Remove protocol prefix if present and validate it looks like a domain
    const cleaned = extracted.replace(/^https?:\/\//, '').replace(/^www\./, '');
    if (cleaned.includes('.')) {
      return cleaned;
    }
  }

  // Try to find a match in our known firms map
  const lowerFirm = firm.toLowerCase();
  for (const [key, website] of Object.entries(FIRM_WEBSITE_MAP)) {
    if (lowerFirm.includes(key)) {
      return website;
    }
  }

  return null;
}

// ============================================================================
// Location Normalization
// ============================================================================

/**
 * Known firm headquarters for fallback location
 */
const FIRM_HQ_MAP: Record<string, { city: string; state: string; country: string }> = {
  'blackstone': { city: 'New York', state: 'NY', country: 'US' },
  'kkr': { city: 'New York', state: 'NY', country: 'US' },
  'apollo': { city: 'New York', state: 'NY', country: 'US' },
  'carlyle': { city: 'Washington', state: 'DC', country: 'US' },
  'tpg': { city: 'Fort Worth', state: 'TX', country: 'US' },
  'warburg': { city: 'New York', state: 'NY', country: 'US' },
  'advent': { city: 'Boston', state: 'MA', country: 'US' },
  'bain capital': { city: 'Boston', state: 'MA', country: 'US' },
  'sequoia': { city: 'Menlo Park', state: 'CA', country: 'US' },
  'andreessen': { city: 'Menlo Park', state: 'CA', country: 'US' },
  'a16z': { city: 'Menlo Park', state: 'CA', country: 'US' },
  'lightspeed': { city: 'Menlo Park', state: 'CA', country: 'US' },
  'accel': { city: 'Palo Alto', state: 'CA', country: 'US' },
  'benchmark': { city: 'San Francisco', state: 'CA', country: 'US' },
  'greylock': { city: 'Menlo Park', state: 'CA', country: 'US' },
  'general catalyst': { city: 'Cambridge', state: 'MA', country: 'US' },
  'goldman': { city: 'New York', state: 'NY', country: 'US' },
  'morgan stanley': { city: 'New York', state: 'NY', country: 'US' },
  'coller': { city: 'London', state: '', country: 'UK' },
  'cvc': { city: 'London', state: '', country: 'UK' },
  'eqt': { city: 'Stockholm', state: '', country: 'Sweden' },
  'permira': { city: 'London', state: '', country: 'UK' },

  // Added February 2026 - batch 1
  'mundi ventures': { city: 'Madrid', state: '', country: 'Spain' },
  'mundi': { city: 'Madrid', state: '', country: 'Spain' },
  'santé ventures': { city: 'Austin', state: 'TX', country: 'US' },
  'sante ventures': { city: 'Austin', state: 'TX', country: 'US' },
  'santé': { city: 'Austin', state: 'TX', country: 'US' },
  'gore street': { city: 'London', state: '', country: 'UK' },
  'blueprint equity': { city: 'La Jolla', state: 'CA', country: 'US' },
  'daphni': { city: 'Paris', state: '', country: 'France' },
  'stafford': { city: 'London', state: '', country: 'UK' },
  'stafford capital': { city: 'London', state: '', country: 'UK' },
  'janus henderson': { city: 'London', state: '', country: 'UK' },
  'janus': { city: 'London', state: '', country: 'UK' },
  'creator fund': { city: 'London', state: '', country: 'UK' },
  'xsml': { city: 'Amsterdam', state: '', country: 'Netherlands' },
  'timber bay': { city: 'Cincinnati', state: 'OH', country: 'US' },
  'cedarbridge': { city: 'Dubai', state: '', country: 'UAE' },
  'enko': { city: 'London', state: '', country: 'UK' },
  'enko capital': { city: 'London', state: '', country: 'UK' },

  // Added February 2026 - batch 2
  'constructor capital': { city: 'Schaffhausen', state: '', country: 'Switzerland' },
  'ev3': { city: 'New York', state: 'NY', country: 'US' },
  'ev3 ventures': { city: 'New York', state: 'NY', country: 'US' },
  'escape velocity': { city: 'New York', state: 'NY', country: 'US' },
  'abacus finance': { city: 'New York', state: 'NY', country: 'US' },
  'abacus': { city: 'New York', state: 'NY', country: 'US' },
  'firgun': { city: 'London', state: '', country: 'UK' },
  'firgun ventures': { city: 'London', state: '', country: 'UK' },
  'navam': { city: 'Kolkata', state: '', country: 'India' },
  'navam capital': { city: 'Kolkata', state: '', country: 'India' },
  '55 north': { city: 'Copenhagen', state: '', country: 'Denmark' },
};

/**
 * Normalize location from city, state, country
 */
export function normalizeLocation(
  city: string,
  state: string,
  country: string
): string {
  if (!city || city === 'N/A') {
    if (country && country !== 'N/A') {
      return country;
    }
    return 'N/A';
  }

  if (state && country === 'US') {
    return `${city}, ${state}`;
  }

  if (country && country !== 'N/A' && country !== 'US') {
    return `${city}, ${country}`;
  }

  return city;
}

/**
 * Try to infer location from firm name
 */
export function inferLocationFromFirm(
  firm: string
): { city: string; state: string; country: string } | null {
  const lowerFirm = firm.toLowerCase();

  for (const [key, hq] of Object.entries(FIRM_HQ_MAP)) {
    if (lowerFirm.includes(key)) {
      return hq;
    }
  }

  return null;
}

// ============================================================================
// Full Fund Normalization
// ============================================================================

// ============================================================================
// Fund Name Validation
// ============================================================================

/**
 * Headline indicator words - if fund name contains these, it's likely a headline
 */
const HEADLINE_INDICATORS = [
  /\b(commits?|committed)\b/i,
  /\b(targets?|targeting)\b/i,
  /\b(eyes?|eyeing)\b/i,
  /\b(mulls?|mulling)\b/i,
  /\b(launches?|launching)\b/i,
  /\b(makes?|making)\b/i,
  /\b(announces?|announcing)\b/i,
  /\b(slates?|slating)\b/i,  // "slates $50 million for..."
  /\b(allocates?|allocating)\s+\$/i,  // "allocates $X to..."
  /\b(closes?|closing)\s+(on|its|the|at)/i,  // "closes on" but not "Fund III closes"
  /\b(raises?|raising)\s+\$/i,  // "raises $X" is headline-like
  /\b(shake-?up|shakeup)\b/i,
  /\bIn brief:/i,
  /\bavailable in\b/i,
  /\bto close\b/i,
  /\bto launch\b/i,
  /\bfirst closes? for\b/i,
  /\bdebut\s+(fund|vehicle)?\s*$/i,  // ends with "debut" or "debut fund"
];

/**
 * Check if a fund name looks like an article headline
 */
export function isHeadlineLikeName(fundName: string): boolean {
  return HEADLINE_INDICATORS.some(pattern => pattern.test(fundName));
}

/**
 * Attempt to construct a proper fund name from a headline-like name
 */
export function fixHeadlineFundName(
  fundName: string,
  firm: string,
  category: string,
  description: string
): string {
  // If it's not headline-like, return as-is
  if (!isHeadlineLikeName(fundName)) {
    return fundName;
  }

  console.log(`[Normalize] WARNING: Headline-like fund name detected: "${fundName}"`);

  // Try to extract a fund type from the description or name
  const typePatterns: Array<{ pattern: RegExp; type: string }> = [
    { pattern: /real estate/i, type: 'Real Estate Fund' },
    { pattern: /private credit/i, type: 'Private Credit Fund' },
    { pattern: /credit fund/i, type: 'Credit Fund' },
    { pattern: /infrastructure/i, type: 'Infrastructure Fund' },
    { pattern: /secondar/i, type: 'Secondary Fund' },
    { pattern: /continuation/i, type: 'Continuation Fund' },
    { pattern: /gp-?led/i, type: 'GP-Led Secondary Fund' },
    { pattern: /buyout/i, type: 'Buyout Fund' },
    { pattern: /venture/i, type: 'Venture Fund' },
    { pattern: /growth/i, type: 'Growth Fund' },
    { pattern: /industrial/i, type: 'Industrial Fund' },
  ];

  const context = `${fundName} ${description}`.toLowerCase();
  let fundType = 'Fund';

  for (const { pattern, type } of typePatterns) {
    if (pattern.test(context)) {
      fundType = type;
      break;
    }
  }

  // Also try category-based fallback
  if (fundType === 'Fund') {
    const categoryTypes: Record<string, string> = {
      'Real Estate': 'Real Estate Fund',
      'Credit Funds': 'Credit Fund',
      'Infrastructure': 'Infrastructure Fund',
      'Private Equity': 'Private Equity Fund',
      'Venture Capital': 'Venture Fund',
      'Secondaries & GP-Stakes': 'Secondary Fund',
      'Hedge Funds': 'Hedge Fund',
    };
    fundType = categoryTypes[category] || 'Fund';
  }

  // Construct the new name: [Firm] [Fund Type]
  const newName = `${firm} ${fundType}`;
  console.log(`[Normalize] Auto-fixed to: "${newName}"`);

  return newName;
}

/**
 * Normalize all fields of an extracted fund
 */
export function normalizeFund(fund: ExtractedFund): ExtractedFund {
  // Infer category if not set or invalid
  const category = inferCategory(
    fund.fund_name,
    fund.description_notes,
    fund.category
  );

  // Fix headline-like fund names BEFORE other processing
  const fund_name = fixHeadlineFundName(
    fund.fund_name,
    fund.firm,
    category,
    fund.description_notes
  );

  // Infer stage if not set or invalid
  const stage = inferStage(
    fund_name,
    fund.description_notes,
    fund.stage
  );

  // Parse amount if not set
  const amountMillions =
    fund.amount_usd_millions ?? parseAmountToMillions(fund.amount);

  // Try to infer location from firm if not set
  let { city, state, country } = fund;
  if ((!city || city === 'N/A') && fund.firm) {
    const inferred = inferLocationFromFirm(fund.firm);
    if (inferred) {
      city = inferred.city;
      state = inferred.state;
      country = inferred.country;
    }
  }

  // Build normalized location string
  const location = normalizeLocation(city, state, country);

  // Infer strategy if not set
  const strategy = inferStrategy(
    fund_name,
    category,
    fund.description_notes,
    fund.strategy
  );

  // Infer target geography if not set
  const target_geography = inferGeography(
    fund_name,
    fund.description_notes,
    country,
    fund.target_geography
  );

  return {
    ...fund,
    fund_name,  // Use the fixed fund name
    category,
    stage,
    strategy,
    target_geography,
    amount_usd_millions: amountMillions,
    location,
    city: city || 'N/A',
    state: state || '',
    country: country || 'N/A',
  };
}

/**
 * Normalize multiple funds
 */
export function normalizeFunds(funds: ExtractedFund[]): ExtractedFund[] {
  console.log(`[Normalize] Processing ${funds.length} funds...`);
  const normalized = funds.map(normalizeFund);
  console.log(`[Normalize] Done normalizing ${normalized.length} funds`);
  return normalized;
}
