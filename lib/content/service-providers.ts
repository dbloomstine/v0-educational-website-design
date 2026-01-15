/**
 * Service Provider Data for Fund Launch Guide
 *
 * Comprehensive lists of service providers commonly used
 * in private fund formation and operations.
 */

export const LAW_FIRMS = [
  'Akin Gump',
  'Cleary Gottlieb',
  'Cooley',
  'Cravath, Swaine & Moore',
  'Davis Polk & Wardwell',
  'Debevoise & Plimpton',
  'Dechert',
  'Fried Frank',
  'Gibson, Dunn & Crutcher',
  'Goodwin Procter',
  'Jones Day',
  'K&L Gates',
  'Katten Muchin',
  'King & Spalding',
  'Kirkland & Ellis',
  'Latham & Watkins',
  'Lowenstein Sandler',
  'Milbank',
  'Morgan Lewis',
  "O'Melveny & Myers",
  'Orrick',
  'Paul Weiss',
  'Proskauer Rose',
  'Ropes & Gray',
  'Schulte Roth & Zabel',
  'Seward & Kissel',
  'Sidley Austin',
  'Simpson Thacher & Bartlett',
  'Skadden, Arps',
  'Sullivan & Cromwell',
  'Weil, Gotshal & Manges',
  'White & Case',
  'Willkie Farr & Gallagher',
  'Winston & Strawn',
] as const

export const FUND_ADMINISTRATORS = [
  'Alter Domus',
  'Apex Group',
  'BNY Mellon',
  'Centaur Fund Services',
  'Circle Partners',
  'Citco Fund Services',
  'Conifer Financial Services',
  'CSC Global',
  'Custom House',
  'Formidium',
  'Gen II Fund Services',
  'HedgeServ',
  'Intertrust Group',
  'IQ-EQ',
  'JTC Group',
  'Mainstream Group',
  'Maples Group',
  'MUFG Investor Services',
  'NAV Fund Administration',
  'Northern Trust',
  'Opus Fund Services',
  'SEI Investments',
  'SS&C Technologies',
  'Standish Management',
  'State Street',
  'TMF Group',
  'Trident Trust',
  'U.S. Bank Global Fund Services',
  'Ultimus Fund Solutions',
  'Vistra',
  'Waystone',
] as const

export const AUDITORS = [
  'Anchin',
  'Armanino',
  'Baker Tilly',
  'BDO USA',
  'Berdon LLP',
  'CBIZ',
  'Cherry Bekaert',
  'Citrin Cooperman',
  'CohnReznick',
  'Crowe',
  'Deloitte',
  'EisnerAmper',
  'Ernst & Young (EY)',
  'Forvis',
  'Grassi',
  'Grant Thornton',
  'Katz, Sapper & Miller',
  'Kaufman Rossin',
  'KPMG',
  'Marcum LLP',
  'Mazars',
  'Moss Adams',
  "PKF O'Connor Davies",
  'Plante Moran',
  'Prager Metis',
  'PwC',
  'RSM US',
  'Weaver',
  'WithumSmith+Brown',
] as const

export const TAX_ADVISORS = [
  'Alvarez & Marsal',
  'Anchin',
  'Andersen Tax',
  'Armanino',
  'Baker Tilly',
  'BDO USA',
  'Berdon LLP',
  'CBIZ',
  'Cherry Bekaert',
  'Citrin Cooperman',
  'CohnReznick',
  'Crowe',
  'Deloitte Tax',
  'EisnerAmper',
  'Ernst & Young Tax',
  'Forvis',
  'Grassi',
  'Grant Thornton',
  'IQ-EQ',
  'Kaufman Rossin',
  'KPMG Tax',
  'Marcum LLP',
  'Mazars',
  'Moss Adams',
  "PKF O'Connor Davies",
  'Plante Moran',
  'Prager Metis',
  'PwC Tax',
  'RSM US',
  'WithumSmith+Brown',
] as const

export const BANKS = [
  'Bank of America',
  'Barclays',
  'BMO Harris',
  'BNY Mellon',
  'Capital One',
  'Citibank',
  'Citizens Bank',
  'Comerica',
  'Customers Bank',
  'Deutsche Bank',
  'Fifth Third Bank',
  'First Citizens (formerly SVB)',
  'Goldman Sachs',
  'HSBC',
  'Huntington Bank',
  'JPMorgan Chase',
  'KeyBank',
  'M&T Bank',
  'Morgan Stanley',
  'Northern Trust',
  'PNC Bank',
  'Regions Bank',
  'State Street',
  'TD Bank',
  'Truist',
  'U.S. Bank',
  'UBS',
  'Wells Fargo',
] as const

export const INSURANCE_BROKERS = [
  'Alliant Insurance',
  'Aon',
  'Arthur J. Gallagher',
  'Brown & Brown',
  'Embroker',
  'Founder Shield',
  'Hub International',
  'Lockton',
  'Marsh',
  'Newfront',
  'Risk Strategies',
  'USI Insurance',
  'Vouch',
  'Willis Towers Watson',
  'Woodruff Sawyer',
] as const

export const PRIME_BROKERS = [
  'Apex Clearing',
  'Bank of America',
  'Barclays',
  'Clear Street',
  'Goldman Sachs',
  'Interactive Brokers',
  'Jefferies',
  'JPMorgan',
  'Marex',
  'Morgan Stanley',
  'Pershing (BNY Mellon)',
  'StoneX',
  'TD Cowen',
  'UBS',
  'Wedbush Securities',
] as const

export const COMPLIANCE_CONSULTANTS = [
  'ACA Group',
  'Alaric Compliance',
  'Cipperman Compliance',
  'Compliance Science',
  'Compliance Solutions Strategies (CSS)',
  'Constellation Advisers',
  'Core Compliance',
  'Fairview Investment Services',
  'Foreside',
  'Greyline Solutions',
  'IQ-EQ',
  'NRS',
  'RIA in a Box',
  'Ultimus Fund Solutions',
  'Vigilant Compliance',
] as const

// Type exports for service provider categories
export type LawFirm = (typeof LAW_FIRMS)[number]
export type FundAdministrator = (typeof FUND_ADMINISTRATORS)[number]
export type Auditor = (typeof AUDITORS)[number]
export type TaxAdvisor = (typeof TAX_ADVISORS)[number]
export type Bank = (typeof BANKS)[number]
export type InsuranceBroker = (typeof INSURANCE_BROKERS)[number]
export type PrimeBroker = (typeof PRIME_BROKERS)[number]
export type ComplianceConsultant = (typeof COMPLIANCE_CONSULTANTS)[number]

// Provider category type
export type ServiceProviderCategory =
  | 'law-firm'
  | 'fund-administrator'
  | 'auditor'
  | 'tax-advisor'
  | 'bank'
  | 'insurance-broker'
  | 'prime-broker'
  | 'compliance-consultant'

// Get providers by category
export function getProvidersByCategory(category: ServiceProviderCategory): readonly string[] {
  switch (category) {
    case 'law-firm':
      return LAW_FIRMS
    case 'fund-administrator':
      return FUND_ADMINISTRATORS
    case 'auditor':
      return AUDITORS
    case 'tax-advisor':
      return TAX_ADVISORS
    case 'bank':
      return BANKS
    case 'insurance-broker':
      return INSURANCE_BROKERS
    case 'prime-broker':
      return PRIME_BROKERS
    case 'compliance-consultant':
      return COMPLIANCE_CONSULTANTS
    default:
      return []
  }
}

// Provider category metadata
export const PROVIDER_CATEGORIES: Record<
  ServiceProviderCategory,
  { label: string; pluralLabel: string; description: string }
> = {
  'law-firm': {
    label: 'Law Firm',
    pluralLabel: 'Law Firms',
    description: 'Legal counsel for fund formation, regulatory compliance, and transactions',
  },
  'fund-administrator': {
    label: 'Fund Administrator',
    pluralLabel: 'Fund Administrators',
    description: 'NAV calculation, investor services, and back-office support',
  },
  auditor: {
    label: 'Auditor',
    pluralLabel: 'Auditors',
    description: 'Annual financial statement audits and compliance attestations',
  },
  'tax-advisor': {
    label: 'Tax Advisor',
    pluralLabel: 'Tax Advisors',
    description: 'Tax planning, K-1 preparation, and regulatory tax filings',
  },
  bank: {
    label: 'Bank',
    pluralLabel: 'Banks',
    description: 'Fund banking, custody, and credit facilities',
  },
  'insurance-broker': {
    label: 'Insurance Broker',
    pluralLabel: 'Insurance Brokers',
    description: 'D&O, E&O, and fund-level insurance coverage',
  },
  'prime-broker': {
    label: 'Prime Broker',
    pluralLabel: 'Prime Brokers',
    description: 'Trade execution, clearing, and securities lending',
  },
  'compliance-consultant': {
    label: 'Compliance Consultant',
    pluralLabel: 'Compliance Consultants',
    description: 'SEC registration, compliance programs, and mock audits',
  },
}

// All providers combined for search functionality
export function getAllProviders(): { name: string; category: ServiceProviderCategory }[] {
  const all: { name: string; category: ServiceProviderCategory }[] = []

  LAW_FIRMS.forEach(name => all.push({ name, category: 'law-firm' }))
  FUND_ADMINISTRATORS.forEach(name => all.push({ name, category: 'fund-administrator' }))
  AUDITORS.forEach(name => all.push({ name, category: 'auditor' }))
  TAX_ADVISORS.forEach(name => all.push({ name, category: 'tax-advisor' }))
  BANKS.forEach(name => all.push({ name, category: 'bank' }))
  INSURANCE_BROKERS.forEach(name => all.push({ name, category: 'insurance-broker' }))
  PRIME_BROKERS.forEach(name => all.push({ name, category: 'prime-broker' }))
  COMPLIANCE_CONSULTANTS.forEach(name => all.push({ name, category: 'compliance-consultant' }))

  return all
}

// Search providers across all categories
export function searchProviders(
  query: string,
  category?: ServiceProviderCategory
): { name: string; category: ServiceProviderCategory }[] {
  const all = getAllProviders()
  const lowerQuery = query.toLowerCase()

  return all.filter(provider => {
    const matchesQuery = provider.name.toLowerCase().includes(lowerQuery)
    const matchesCategory = !category || provider.category === category
    return matchesQuery && matchesCategory
  })
}
