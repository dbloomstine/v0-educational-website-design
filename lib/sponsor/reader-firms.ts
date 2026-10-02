/**
 * Firms we name on the sponsor page as places FundOps Daily is read.
 *
 * THE RULE: a firm is shown only while at least one confirmed subscriber's
 * email is on one of its domains. This file is the list of firms we are
 * willing to name and how to spell them; the subscriber table decides, on
 * every page build, which of them are true today. A firm whose last reader
 * unsubscribes disappears on its own. Nothing here is a claim by itself.
 *
 * To add a firm: add its email domain(s). Never add a firm "because they
 * probably read it". Individuals are never named, and IQ-EQ (the editor's
 * employer) is deliberately absent.
 */
export type ReaderGroup = 'GPs & investors' | 'Banks & lenders' | 'Law firms' | 'Audit, tax & administration' | 'Fund technology & data'

export const READER_GROUP_ORDER: ReaderGroup[] = [
  'GPs & investors',
  'Law firms',
  'Banks & lenders',
  'Audit, tax & administration',
  'Fund technology & data',
]

export const READER_FIRMS: { name: string; group: ReaderGroup; domains: string[] }[] = [
  // GPs & investors
  { name: 'TPG', group: 'GPs & investors', domains: ['tpg.com'] },
  { name: 'Stone Point', group: 'GPs & investors', domains: ['stonepoint.com'] },
  { name: 'Two Sigma', group: 'GPs & investors', domains: ['twosigma.com'] },
  { name: 'Declaration Partners', group: 'GPs & investors', domains: ['declarationpartners.com'] },
  { name: 'ARK PES', group: 'GPs & investors', domains: ['arkpes.com'] },
  { name: 'S64 Capital', group: 'GPs & investors', domains: ['s64capital.com'] },
  { name: 'Alpha Wave Global', group: 'GPs & investors', domains: ['alphawaveglobal.com'] },
  { name: 'Alpaca VC', group: 'GPs & investors', domains: ['alpaca.vc'] },
  { name: 'Christofferson Robb', group: 'GPs & investors', domains: ['christoffersonrobb.com'] },
  { name: 'Taproot Capital', group: 'GPs & investors', domains: ['taprootcap.com'] },
  { name: 'Quadrangle', group: 'GPs & investors', domains: ['quadrangleco.com'] },
  { name: 'Enlightenment Capital', group: 'GPs & investors', domains: ['enlightenment-cap.com'] },
  { name: 'JPMorgan', group: 'GPs & investors', domains: ['jpmorgan.com', 'jpmchase.com'] },
  // Law
  { name: 'Kirkland & Ellis', group: 'Law firms', domains: ['kirkland.com'] },
  { name: 'Paul Hastings', group: 'Law firms', domains: ['paulhastings.com'] },
  { name: 'King & Spalding', group: 'Law firms', domains: ['kslaw.com'] },
  { name: 'DLA Piper', group: 'Law firms', domains: ['dlapiper.com'] },
  { name: 'Walkers', group: 'Law firms', domains: ['walkersglobal.com'] },
  { name: 'VLP Law Group', group: 'Law firms', domains: ['vlplawgroup.com'] },
  // Banks & lenders
  { name: 'UBS', group: 'Banks & lenders', domains: ['ubs.com'] },
  { name: 'Investec', group: 'Banks & lenders', domains: ['investec.com'] },
  { name: 'Stifel', group: 'Banks & lenders', domains: ['stifelbank.com', 'stifel.com'] },
  { name: 'Axos Bank', group: 'Banks & lenders', domains: ['axosbank.com'] },
  { name: 'Flagstar', group: 'Banks & lenders', domains: ['flagstar.com'] },
  { name: 'Bridge Fund Finance', group: 'Banks & lenders', domains: ['bridgefundfinance.com'] },
  { name: 'Monex Europe', group: 'Banks & lenders', domains: ['monexeurope.com'] },
  { name: 'Silicon Valley Bank', group: 'Banks & lenders', domains: ['svb.com'] },
  { name: 'First Citizens', group: 'Banks & lenders', domains: ['firstcitizens.com'] },
  // Audit, tax & administration
  { name: 'KPMG', group: 'Audit, tax & administration', domains: ['kpmg.com', 'kpmg.ky'] },
  { name: 'BDO', group: 'Audit, tax & administration', domains: ['bdo.com'] },
  { name: 'Withum', group: 'Audit, tax & administration', domains: ['withum.com'] },
  { name: 'Grassi', group: 'Audit, tax & administration', domains: ['grassiadvisors.com'] },
  { name: 'RSM', group: 'Audit, tax & administration', domains: ['rsmus.com'] },
  { name: 'Ultimus Fund Solutions', group: 'Audit, tax & administration', domains: ['ultimusfundsolutions.com'] },
  { name: 'Waystone', group: 'Audit, tax & administration', domains: ['waystone.com'] },
  { name: 'Centralis', group: 'Audit, tax & administration', domains: ['centralisgroup.com'] },
  { name: 'Consero Global', group: 'Audit, tax & administration', domains: ['conseroglobal.com'] },
  { name: 'Petra Funds Group', group: 'Audit, tax & administration', domains: ['petrafundsgroup.com'] },
  // Fund technology & data
  { name: 'Carta', group: 'Fund technology & data', domains: ['carta.com'] },
  { name: 'Juniper Square', group: 'Fund technology & data', domains: ['junipersquare.com'] },
  { name: 'Maybern', group: 'Fund technology & data', domains: ['maybern.com'] },
  { name: 'Allvue', group: 'Fund technology & data', domains: ['allvuesystems.com'] },
  { name: 'Standard Metrics', group: 'Fund technology & data', domains: ['standardmetrics.io'] },
  { name: 'Chronograph', group: 'Fund technology & data', domains: ['chronograph.pe'] },
  { name: 'With Intelligence', group: 'Fund technology & data', domains: ['withintelligence.com'] },
  { name: 'Kyriba', group: 'Fund technology & data', domains: ['kyriba.com'] },
  { name: 'Workiva', group: 'Fund technology & data', domains: ['workiva.com'] },
]

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com', 'hotmail.co.uk', 'outlook.com',
  'live.com', 'live.co.uk', 'msn.com', 'me.com', 'icloud.com', 'mac.com', 'aol.com', 'verizon.net',
  'comcast.net', 'proton.me', 'protonmail.com', 'pm.me', 'gmx.com',
])

export function isPersonalDomain(domain: string): boolean {
  return PERSONAL_DOMAINS.has(domain)
}

/** The work domains among a list of subscriber addresses — one per firm the list is read at. Ours is not a reader firm. */
export function readerFirmDomains(emails: string[]): Set<string> {
  const domains = emails.map((e) => String(e).toLowerCase().split('@')[1] ?? '').filter(Boolean)
  return new Set(domains.filter((d) => !isPersonalDomain(d) && d !== 'fundopshq.com'))
}

/** True when `domain` is the firm's domain or a subdomain of it ("us.dlapiper.com"). */
export function domainBelongsTo(domain: string, firmDomains: string[]): boolean {
  return firmDomains.some((d) => domain === d || domain.endsWith(`.${d}`))
}

/** The firms we may name, filtered to those with a confirmed reader right now. */
export function currentReaderFirms(subscriberDomains: Iterable<string>): { group: ReaderGroup; firms: string[] }[] {
  const domains = Array.from(new Set(subscriberDomains))
  return READER_GROUP_ORDER.map((group) => ({
    group,
    firms: READER_FIRMS.filter((f) => f.group === group && domains.some((d) => domainBelongsTo(d, f.domains))).map((f) => f.name),
  })).filter((g) => g.firms.length > 0)
}
