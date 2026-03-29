/**
 * Curated domain map for well-known firms in the fund industry.
 *
 * Keys are lowercase firm names (and common variations).
 * Values are the correct website domain used to fetch favicons.
 *
 * The FirmLogo component checks this map first, then falls back to
 * the domain from the classification pipeline, then to a letter initial.
 */
export const FIRM_DOMAIN_MAP: Record<string, string> = {
  // ── Mega / Large-cap PE ─────────────────────────────────────────────
  'apollo': 'apollo.com',
  'apollo global management': 'apollo.com',
  'apollo global management, inc.': 'apollo.com',
  'blackstone': 'blackstone.com',
  'blackstone group': 'blackstone.com',
  'kkr': 'kkr.com',
  'kkr & co': 'kkr.com',
  'carlyle': 'carlylegroup.com',
  'carlyle group': 'carlylegroup.com',
  'the carlyle group': 'carlylegroup.com',
  'tpg': 'tpg.com',
  'tpg capital': 'tpg.com',
  'warburg pincus': 'warburgpincus.com',
  'bain capital': 'baincapital.com',
  'eqt': 'eqtgroup.com',
  'eqt partners': 'eqtgroup.com',
  'thoma bravo': 'thomabravo.com',
  'vista equity partners': 'vistaequitypartners.com',
  'vista equity': 'vistaequitypartners.com',
  'advent international': 'adventinternational.com',
  'advent': 'adventinternational.com',
  'hellman & friedman': 'hfriedman.com',
  'silver lake': 'silverlake.com',
  'silver lake partners': 'silverlake.com',
  'permira': 'permira.com',
  'cvc capital partners': 'cvc.com',
  'cvc': 'cvc.com',
  'cinven': 'cinven.com',
  'apax partners': 'apax.com',
  'apax': 'apax.com',
  'general atlantic': 'generalatlantic.com',
  'leonard green & partners': 'leonardgreen.com',
  'leonard green': 'leonardgreen.com',
  'gtcr': 'gtcr.com',
  'madison dearborn partners': 'mdcp.com',
  'madison dearborn': 'mdcp.com',
  'welsh carson': 'welshcarson.com',
  'welsh, carson, anderson & stowe': 'welshcarson.com',

  // ── Mid-market PE ───────────────────────────────────────────────────
  'charlesbank': 'charlesbank.com',
  'charlesbank capital partners': 'charlesbank.com',
  'oakley capital': 'oakleycapital.com',
  'triton partners': 'triton-partners.com',
  'triton': 'triton-partners.com',
  'norvestor': 'norvestor.com',
  'audax': 'audaxprivateequity.com',
  'audax private equity': 'audaxprivateequity.com',
  'kinderhook industries': 'kinderhook.com',
  'accel-kkr': 'accel-kkr.com',
  'genstar capital': 'genstarcapital.com',
  'genstar': 'genstarcapital.com',
  'hig capital': 'higcapital.com',
  'h.i.g. capital': 'higcapital.com',
  'platinum equity': 'platinumequity.com',
  'clearlake capital': 'clearlake.com',
  'clearlake capital group': 'clearlake.com',
  'clearlake': 'clearlake.com',
  'insight partners': 'insightpartners.com',
  'insight': 'insightpartners.com',
  'veritas capital': 'veritascapital.com',
  'veritas': 'veritascapital.com',
  'roark capital': 'roarkcapital.com',
  'roark': 'roarkcapital.com',
  'new mountain capital': 'newmountaincapital.com',
  'new mountain': 'newmountaincapital.com',
  'berkshire partners': 'berkshirepartners.com',
  'berkshire': 'berkshirepartners.com',

  // ── Credit / Alternatives ───────────────────────────────────────────
  'ares': 'aresmgmt.com',
  'ares management': 'aresmgmt.com',
  'ares capital': 'aresmgmt.com',
  'oaktree': 'oaktreecapital.com',
  'oaktree capital': 'oaktreecapital.com',
  'oaktree capital management': 'oaktreecapital.com',
  'blue owl': 'blueowlcapital.com',
  'blue owl capital': 'blueowlcapital.com',
  'fortress': 'fortress.com',
  'fortress investment group': 'fortress.com',
  'benefit street partners': 'benefitstreetpartners.com',
  'golub capital': 'golubcapital.com',
  'golub': 'golubcapital.com',
  'owl rock': 'blueowlcapital.com',
  'owl rock capital': 'blueowlcapital.com',
  'sixth street': 'sixthstreet.com',
  'sixth street partners': 'sixthstreet.com',

  // ── Hedge Funds ─────────────────────────────────────────────────────
  'saba capital': 'sabacapital.com',
  'saba capital management': 'sabacapital.com',
  'elliott': 'elliottinv.com',
  'elliott investment management': 'elliottinv.com',
  'elliott management': 'elliottinv.com',
  'trian fund management': 'trianpartners.com',
  'trian': 'trianpartners.com',
  'davidson kempner': 'davidsonkempner.com',
  'davidson kempner capital management': 'davidsonkempner.com',
  'bridgewater': 'bridgewater.com',
  'bridgewater associates': 'bridgewater.com',
  'citadel': 'citadel.com',
  'two sigma': 'twosigma.com',
  'de shaw': 'deshaw.com',
  'd.e. shaw': 'deshaw.com',
  'millennium': 'mlp.com',
  'millennium management': 'mlp.com',
  'man group': 'man.com',
  'point72': 'point72.com',
  'point72 asset management': 'point72.com',

  // ── Real Estate ─────────────────────────────────────────────────────
  'prologis': 'prologis.com',
  'brookfield': 'brookfield.com',
  'brookfield asset management': 'brookfield.com',
  'starwood capital': 'starwoodcapital.com',
  'starwood capital group': 'starwoodcapital.com',
  'starwood': 'starwoodcapital.com',
  'gaw capital': 'gawcapital.com',

  // ── VC ──────────────────────────────────────────────────────────────
  'partech': 'partechpartners.com',
  'partech partners': 'partechpartners.com',
  'sequoia': 'sequoiacap.com',
  'sequoia capital': 'sequoiacap.com',
  'a16z': 'a16z.com',
  'andreessen horowitz': 'a16z.com',
  'accel': 'accel.com',
  'accel partners': 'accel.com',
  'benchmark': 'benchmark.com',
  'benchmark capital': 'benchmark.com',
  'greylock': 'greylock.com',
  'greylock partners': 'greylock.com',
  'lightspeed': 'lsvp.com',
  'lightspeed venture partners': 'lsvp.com',
  'general catalyst': 'generalcatalyst.com',
  'index ventures': 'indexventures.com',
  'founders fund': 'foundersfund.com',
  'bessemer': 'bvp.com',
  'bessemer venture partners': 'bvp.com',
  'breakout ventures': 'breakout.vc',

  // ── Asset Managers / Multi-strategy ─────────────────────────────────
  'blackrock': 'blackrock.com',
  'goldman sachs': 'goldmansachs.com',
  'goldman sachs asset management': 'goldmansachs.com',
  'morgan stanley': 'morganstanley.com',
  'jp morgan': 'jpmorgan.com',
  'jpmorgan': 'jpmorgan.com',
  'jpmorgan chase': 'jpmorgan.com',
  't. rowe price': 'troweprice.com',
  'nuveen': 'nuveen.com',
  'nuveen real estate': 'nuveen.com',
  'fidelity': 'fidelity.com',
  'fidelity investments': 'fidelity.com',
  'vanguard': 'vanguard.com',
  'state street': 'statestreet.com',
  'state street global advisors': 'statestreet.com',
  'invesco': 'invesco.com',
  'franklin templeton': 'franklintempleton.com',
  'pgim': 'pgim.com',
  'houlihan lokey': 'hl.com',
  'lazard': 'lazard.com',
  'partners group': 'partnersgroup.com',
  'hamilton lane': 'hamiltonlane.com',
  'sands capital': 'sandscapital.com',
  'dimensional': 'dimensional.com',

  // ── Secondaries / GP Stakes ─────────────────────────────────────────
  'revelation partners': 'revelation-partners.com',
  'lexington partners': 'lexingtonpartners.com',
  'lexington': 'lexingtonpartners.com',
  'ardian': 'ardian.com',
  'coller capital': 'collercapital.com',
  'coller': 'collercapital.com',
  'neuberger berman': 'nb.com',

  // ── Pensions / Endowments / Sovereigns ──────────────────────────────
  'calpers': 'calpers.ca.gov',
  'calstrs': 'calstrs.com',
  'cppib': 'cppinvestments.com',
  'cpp investments': 'cppinvestments.com',
  'gic': 'gic.com.sg',
  'temasek': 'temasek.com.sg',
  'adia': 'adia.ae',
  'abu dhabi investment authority': 'adia.ae',
  'ontario teachers': 'otpp.com',
  'ontario teachers\' pension plan': 'otpp.com',
  'border to coast': 'bordertocoast.org.uk',

  // ── Other notable firms ─────────────────────────────────────────────
  'icg': 'icgam.com',
  'intermediate capital group': 'icgam.com',
  'palladium equity': 'palladiumequity.com',
  'palladium equity partners': 'palladiumequity.com',
  'gryphon investors': 'gryphon-inv.com',
  'gryphon': 'gryphon-inv.com',
  'ik partners': 'ikpartners.com',
  'ik investment partners': 'ikpartners.com',
  'e2p': 'e2pcapital.com',
  'truelink': 'truelinkcapital.com',
  'qhp capital': 'qhpcapital.com',
  'caz investments': 'cazinvestments.com',
  'caz': 'cazinvestments.com',
  'eig': 'eigpartners.com',
  'eig partners': 'eigpartners.com',
  'riverside': 'riversidecompany.com',
  'the riverside company': 'riversidecompany.com',
  'savills': 'savills.com',
  'standard life': 'standardlife.co.uk',
  'infini capital management': 'infinicapital.com',
  'audeo ventures': 'audeoventures.com',
  'swi group': 'swigroup.eu',
  'infravia': 'infraviacapital.com',
  'star mountain capital': 'starmountaincapital.com',
  'galaxy digital': 'galaxydigital.io',
  'carne group': 'carnegroup.com',
  'quilter': 'quilter.com',
  'persistent systems': 'persistent.com',
  'adenia partners': 'adeniapartners.com',

  // ── Credit / Lending / CLO ─────────────────────────────────────────
  'tikehau capital': 'tikehaucapital.com',
  'tikehau': 'tikehaucapital.com',
  'goldentree': 'goldentreeim.com',
  'goldentree asset management': 'goldentreeim.com',
  'muzinich': 'muzinich.com',
  'muzinich & co': 'muzinich.com',
  'monroe capital': 'monroecap.com',
  'burford capital': 'burfordcapital.com',
  'burford': 'burfordcapital.com',
  'bonaccord': 'bonaccordcapital.com',
  'bonaccord capital': 'bonaccordcapital.com',
  'pccp': 'pfreim.com',
  'pccp llc': 'pfreim.com',

  // ── European PE / VC ───────────────────────────────────────────────
  'pictet': 'am.pictet',
  'pictet alternative advisors': 'am.pictet',
  'pictet asset management': 'am.pictet',
  'astorg': 'astorg.com',
  'astorg partners': 'astorg.com',
  'alantra': 'alantra.com',
  'ldc': 'ldc.co.uk',
  'credo ventures': 'credoventures.com',
  'ysios capital': 'ysioscapital.com',
  'ysios': 'ysioscapital.com',
  'invenio partners': 'inveniopartners.com',
  'invenio': 'inveniopartners.com',

  // ── Infra / Real Estate / Climate ──────────────────────────────────
  'climate investment': 'climateinvestment.com',
  'lasalle investment management': 'lasalle.com',
  'lasalle im': 'lasalle.com',
  'lasalle': 'lasalle.com',
  'gladstone management': 'gladstonefunds.com',
  'gladstone': 'gladstonefunds.com',
  'london stock exchange': 'lseg.com',
  'lseg': 'lseg.com',

  // ── Investment Banks / Advisors ────────────────────────────────────
  'evercore': 'evercore.com',
  'bnp paribas': 'bnpparibas.com',
  'bnp': 'bnpparibas.com',
  'jp morgan chase': 'jpmorgan.com',

  // ── Crypto / Digital Assets ────────────────────────────────────────
  'parafi capital': 'parafi.com',
  'parafi': 'parafi.com',

  // ── Pension Funds / Public Allocators ──────────────────────────────
  'south carolina retirement': 'rsic.sc.gov',
  'south carolina retirement system': 'rsic.sc.gov',
  'illinois municipal retirement': 'imrf.org',
  'illinois municipal retirement fund': 'imrf.org',
  'marin county employees\' retirement': 'mcera.org',
  'marin county employees': 'mcera.org',
  'boston retirement': 'boston.gov',
  'boston retirement system': 'boston.gov',
  'national pension service': 'nps.or.kr',

  // ── Mid-market / Specialty ─────────────────────────────────────────
  'bankinter': 'bankinter.com',
  'elm capital': 'elmcapital.com',
  'forward consumer': 'forwardconsumer.com',
  'midpoint capital partners': 'midpointcp.com',
  'midpoint capital': 'midpointcp.com',
  'first in': 'firstin.vc',
  'broad street development': 'broadstreet.com',
}

/**
 * Map source publication names to their domains for favicon lookup.
 * Used as a final fallback when no firm is identified for an article.
 */
export const SOURCE_DOMAIN_MAP: Record<string, string> = {
  'bloomberg': 'bloomberg.com',
  'bloomberg.com': 'bloomberg.com',
  'bloomberg tax': 'bloomberg.com',
  'bloomberg law': 'bloomberg.com',
  'reuters': 'reuters.com',
  'wsj': 'wsj.com',
  'the wall street journal': 'wsj.com',
  'financial times': 'ft.com',
  'cnbc': 'cnbc.com',
  'business insider': 'businessinsider.com',
  'fortune': 'fortune.com',
  'axios': 'axios.com',
  'techcrunch': 'techcrunch.com',
  'techcrunch vc': 'techcrunch.com',
  'msn': 'msn.com',
  'msn.com': 'msn.com',
  'yahoo finance': 'finance.yahoo.com',

  // Industry publications
  'pensions & investments': 'pionline.com',
  'pitchbook': 'pitchbook.com',
  'pe hub': 'pehub.com',
  'private equity wire': 'privateequitywire.co.uk',
  'private equity international': 'privateequityinternational.com',
  'private equity international | pei': 'privateequityinternational.com',
  'private debt investor': 'privatedebtinvestor.com',
  'alternative credit investor': 'alternativecreditinvestor.com',
  'infrastructure investor': 'infrastructureinvestor.com',
  'secondaries investor': 'secondariesinvestor.com',
  'pere': 'perenews.com',
  'hedge week': 'hedgeweek.com',
  'hedgeweek': 'hedgeweek.com',
  'institutional investor': 'institutionalinvestor.com',
  'investment week': 'investmentweek.co.uk',
  'investmentnews': 'investmentnews.com',
  'altassets': 'altassets.net',
  'altassets private equity news': 'altassets.net',
  'esg today': 'esgtoday.com',
  'agri investor': 'agriinvestor.com',
  'buyouts': 'buyoutsinsider.com',
  'buyouts insider': 'buyoutsinsider.com',
  'venture capital journal': 'venturecapitaljournal.com',
  'alternatives watch': 'alternativeswatch.com',
  'commercial observer': 'commercialobserver.com',

  // News wires
  'pr newswire': 'prnewswire.com',
  'pr newswire financial': 'prnewswire.com',
  'pr newswire - financial services': 'prnewswire.com',
  'business wire': 'businesswire.com',
  'globenewswire': 'globenewswire.com',
  'globenewswire financial services': 'globenewswire.com',

  // Other sources
  'benzinga': 'benzinga.com',
  'thestreet.com': 'thestreet.com',
  'the street': 'thestreet.com',
  'tradingview': 'tradingview.com',
  'hedgeco.net': 'hedgeco.net',
  'pulse 2.0': 'pulse2.com',
  'the recursive': 'therecursive.com',
  'eu-startups.com': 'eu-startups.com',
  'launch base africa': 'launchbaseafrica.com',
  'partnerships bulletin': 'partnershipsbulletin.com',
  'eurasia review': 'eurasiareview.com',
  'everycrsreport.com': 'everycrsreport.com',
  'theglobeandmail.com': 'theglobeandmail.com',
  'the globe and mail': 'theglobeandmail.com',

  // Broadcast / general
  'usa today': 'usatoday.com',
  '24/7 wall street': '247wallst.com',
  '24/7 wall st.': '247wallst.com',
}

/**
 * Look up the domain for a source publication name.
 */
export function getSourceDomain(sourceName: string | null): string | null {
  if (!sourceName) return null
  const key = sourceName.toLowerCase().trim()
  return SOURCE_DOMAIN_MAP[key] ?? null
}

/**
 * Look up the correct domain for a firm name.
 * Tries exact match first, then strips common suffixes (Group, Capital, Partners, etc.).
 * Returns the curated domain if found, otherwise null.
 */
export function getFirmDomain(firmName: string | null): string | null {
  if (!firmName) return null
  const key = firmName.toLowerCase().trim()
  if (FIRM_DOMAIN_MAP[key]) return FIRM_DOMAIN_MAP[key]

  // Try stripping trailing suffixes
  const stripped = key
    .replace(/,?\s*(inc\.?|llc|ltd\.?|l\.?p\.?|plc|corp\.?|co\.?|s\.?a\.?|ag|gmbh|n\.?v\.?|group|partners|management|advisors?)$/i, '')
    .trim()
  if (stripped !== key && FIRM_DOMAIN_MAP[stripped]) return FIRM_DOMAIN_MAP[stripped]

  return null
}
