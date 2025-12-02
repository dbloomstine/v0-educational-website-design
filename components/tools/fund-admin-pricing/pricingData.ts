// FUND ADMINISTRATION PRICING DATA MODEL AND CALCULATION ENGINE

export type FundType = 'pe-buyout' | 'pe-growth' | 'vc' | 'private-credit' | 'real-estate' | 'fund-of-funds' | 'hedge-fund';
export type Currency = 'USD' | 'EUR' | 'GBP';
export type Complexity = 'simple' | 'moderate' | 'complex';
export type Region = 'us' | 'europe' | 'asia' | 'offshore' | 'multi-region';
export type ReportingFrequency = 'annual' | 'quarterly' | 'monthly';

export interface FundAdminInput {
  // Fund Profile
  fundType: FundType;
  aumAmount: number;
  aumCurrency: Currency;
  region: Region;
  strategyComplexity: Complexity;

  // Structure
  mainEntities: number;
  hasMasterFeeder: boolean;
  hasParallelFunds: boolean;
  spvCount: number;
  managementCompanyEntities: number;

  // Investors and Reporting
  investorCount: number;
  reportingFrequency: ReportingFrequency;
  investorLevelReporting: boolean;
  capitalCallDistribution: boolean;
  customReporting: boolean;

  // Services
  coreAdminIncluded: boolean;
  financialStatements: boolean;
  auditSupport: boolean;
  taxSupport: 'none' | 'basic' | 'full';
  regulatoryFilings: boolean;
  kycAmlSupport: boolean;
  bankReconciliation: boolean;
  waterfallCalculations: boolean;
  cfoConsulting: 'none' | 'light' | 'heavy';
}

export interface PricingOutput {
  annualFees: {
    low: number;
    medium: number;
    high: number;
  };
  onboardingFee: {
    low: number;
    medium: number;
    high: number;
  };
  breakdown: PricingBreakdown[];
  drivers: PricingDriver[];
  scopeOfServices: ScopeItem[];
  outOfScope: string[];
  currency: Currency;
}

export interface PricingBreakdown {
  category: string;
  description: string;
  low: number;
  medium: number;
  high: number;
}

export interface PricingDriver {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface ScopeItem {
  service: string;
  included: boolean;
  notes?: string;
}

// Pricing calculation engine
export function calculateAdminPricing(input: FundAdminInput): PricingOutput {
  let baseLow = 0;
  let baseMid = 0;
  let baseHigh = 0;

  // 1. Base pricing by AUM
  const aum = input.aumAmount;
  if (aum < 50) {
    baseLow = 40000;
    baseMid = 60000;
    baseHigh = 80000;
  } else if (aum < 150) {
    baseLow = 60000;
    baseMid = 90000;
    baseHigh = 120000;
  } else if (aum < 300) {
    baseLow = 90000;
    baseMid = 120000;
    baseHigh = 150000;
  } else if (aum < 500) {
    baseLow = 120000;
    baseMid = 160000;
    baseHigh = 200000;
  } else if (aum < 1000) {
    baseLow = 150000;
    baseMid = 200000;
    baseHigh = 250000;
  } else {
    // $1B+
    baseLow = 200000;
    baseMid = 300000;
    baseHigh = 400000;
  }

  const breakdown: PricingBreakdown[] = [{
    category: 'Core Fund Administration',
    description: 'Base NAV calculations, investor accounting, reporting',
    low: baseLow,
    medium: baseMid,
    high: baseHigh
  }];

  const drivers: PricingDriver[] = [];

  // 2. Fund type complexity adjustment
  const fundTypeMultipliers: Record<FundType, number> = {
    'vc': 1.0,
    'pe-growth': 1.1,
    'pe-buyout': 1.15,
    'private-credit': 1.15,
    'real-estate': 1.2,
    'fund-of-funds': 1.1,
    'hedge-fund': 1.25
  };

  const fundTypeMultiplier = fundTypeMultipliers[input.fundType];
  if (fundTypeMultiplier > 1.0) {
    baseLow *= fundTypeMultiplier;
    baseMid *= fundTypeMultiplier;
    baseHigh *= fundTypeMultiplier;
    breakdown[0].low = baseLow;
    breakdown[0].medium = baseMid;
    breakdown[0].high = baseHigh;

    drivers.push({
      factor: 'Fund Type',
      impact: 'medium',
      explanation: `${getFundTypeName(input.fundType)} funds typically have ${fundTypeMultiplier > 1.15 ? 'higher' : 'moderate'} complexity in accounting and reporting requirements.`
    });
  }

  // 3. Strategy complexity
  if (input.strategyComplexity === 'complex') {
    const complexityAdder = baseMid * 0.15;
    baseLow += complexityAdder * 0.8;
    baseMid += complexityAdder;
    baseHigh += complexityAdder * 1.2;

    drivers.push({
      factor: 'Strategy Complexity',
      impact: 'medium',
      explanation: 'Complex investment strategies require additional valuation oversight and specialized reporting.'
    });
  }

  // 4. Additional entities
  const totalExtraEntities = input.mainEntities - 1 +
    (input.hasMasterFeeder ? 1 : 0) +
    (input.hasParallelFunds ? 1 : 0) +
    input.managementCompanyEntities;

  if (totalExtraEntities > 0) {
    const entityCostLow = 8000 * totalExtraEntities;
    const entityCostMid = 12000 * totalExtraEntities;
    const entityCostHigh = 20000 * totalExtraEntities;

    baseLow += entityCostLow;
    baseMid += entityCostMid;
    baseHigh += entityCostHigh;

    breakdown.push({
      category: 'Additional Fund Entities',
      description: `${totalExtraEntities} additional ${totalExtraEntities === 1 ? 'entity' : 'entities'} (master-feeder, parallels, GP entities)`,
      low: entityCostLow,
      medium: entityCostMid,
      high: entityCostHigh
    });

    drivers.push({
      factor: 'Entity Structure',
      impact: 'high',
      explanation: `Multiple entities significantly increase accounting and reporting workload. Each entity requires separate books, statements, and consolidation.`
    });
  }

  // 5. SPVs
  if (input.spvCount > 0) {
    const spvCostLow = 5000 * input.spvCount;
    const spvCostMid = 10000 * input.spvCount;
    const spvCostHigh = 15000 * input.spvCount;

    baseLow += spvCostLow;
    baseMid += spvCostMid;
    baseHigh += spvCostHigh;

    breakdown.push({
      category: 'SPV Administration',
      description: `${input.spvCount} special purpose ${input.spvCount === 1 ? 'vehicle' : 'vehicles'}`,
      low: spvCostLow,
      medium: spvCostMid,
      high: spvCostHigh
    });

    if (input.spvCount > 3) {
      drivers.push({
        factor: 'SPV Volume',
        impact: 'high',
        explanation: `${input.spvCount} SPVs create substantial administrative overhead for deal-by-deal tracking and reporting.`
      });
    }
  }

  // 6. Investor count and reporting frequency
  const investorImpact = input.investorCount > 50 ? 'high' : input.investorCount > 20 ? 'medium' : 'low';
  const frequencyMultiplier = input.reportingFrequency === 'monthly' ? 1.3 : input.reportingFrequency === 'quarterly' ? 1.15 : 1.0;

  if (input.investorCount > 20 || input.reportingFrequency !== 'annual') {
    baseLow *= frequencyMultiplier;
    baseMid *= frequencyMultiplier;
    baseHigh *= frequencyMultiplier;

    drivers.push({
      factor: 'Investor Count & Reporting Frequency',
      impact: investorImpact,
      explanation: `${input.investorCount} investors with ${input.reportingFrequency} reporting requires ${input.reportingFrequency === 'monthly' ? 'significant' : 'elevated'} administrative attention.`
    });
  }

  // 7. Custom/investor-level reporting
  if (input.customReporting || input.investorLevelReporting) {
    const customReportingCost = baseMid * 0.10;
    baseLow += customReportingCost * 0.7;
    baseMid += customReportingCost;
    baseHigh += customReportingCost * 1.3;

    drivers.push({
      factor: 'Custom Reporting Requirements',
      impact: 'medium',
      explanation: 'Customized or investor-specific reporting adds manual work and quality control requirements.'
    });
  }

  // 8. Region/jurisdiction
  if (input.region === 'offshore' || input.region === 'multi-region') {
    const regionMultiplier = input.region === 'offshore' ? 1.10 : 1.15;
    baseLow *= regionMultiplier;
    baseMid *= regionMultiplier;
    baseHigh *= regionMultiplier;

    drivers.push({
      factor: 'Jurisdiction Complexity',
      impact: 'medium',
      explanation: `${input.region === 'offshore' ? 'Offshore' : 'Multi-region'} structures require specialized expertise and coordination across regulatory regimes.`
    });
  }

  // 9. Tax support
  if (input.taxSupport !== 'none') {
    const taxLow = input.taxSupport === 'basic' ? 15000 : 30000;
    const taxMid = input.taxSupport === 'basic' ? 25000 : 50000;
    const taxHigh = input.taxSupport === 'basic' ? 35000 : 70000;

    baseLow += taxLow;
    baseMid += taxMid;
    baseHigh += taxHigh;

    breakdown.push({
      category: 'Tax Preparation & Support',
      description: `${input.taxSupport === 'basic' ? 'Basic' : 'Comprehensive'} tax services including returns and schedules`,
      low: taxLow,
      medium: taxMid,
      high: taxHigh
    });
  }

  // 10. Regulatory filings
  if (input.regulatoryFilings) {
    const regLow = 8000;
    const regMid = 15000;
    const regHigh = 25000;

    baseLow += regLow;
    baseMid += regMid;
    baseHigh += regHigh;

    breakdown.push({
      category: 'Regulatory Filings',
      description: 'Form PF, Annex IV, FATCA/CRS, and other required filings',
      low: regLow,
      medium: regMid,
      high: regHigh
    });
  }

  // 11. KYC/AML support
  if (input.kycAmlSupport) {
    const kycLow = input.investorCount <= 25 ? 15000 : 25000;
    const kycMid = input.investorCount <= 25 ? 25000 : 40000;
    const kycHigh = input.investorCount <= 25 ? 35000 : 60000;

    baseLow += kycLow;
    baseMid += kycMid;
    baseHigh += kycHigh;

    breakdown.push({
      category: 'KYC/AML Onboarding & Monitoring',
      description: 'Investor due diligence, screening, and ongoing monitoring',
      low: kycLow,
      medium: kycMid,
      high: kycHigh
    });
  }

  // 12. Waterfall calculations
  if (input.waterfallCalculations && !['vc', 'fund-of-funds'].includes(input.fundType)) {
    const waterfallLow = 5000;
    const waterfallMid = 10000;
    const waterfallHigh = 15000;

    baseLow += waterfallLow;
    baseMid += waterfallMid;
    baseHigh += waterfallHigh;

    breakdown.push({
      category: 'Waterfall & Carry Calculations',
      description: 'Distribution waterfall modeling and GP carry calculations',
      low: waterfallLow,
      medium: waterfallMid,
      high: waterfallHigh
    });
  }

  // 13. CFO consulting
  if (input.cfoConsulting !== 'none') {
    const cfoLow = input.cfoConsulting === 'light' ? 20000 : 50000;
    const cfoMid = input.cfoConsulting === 'light' ? 35000 : 75000;
    const cfoHigh = input.cfoConsulting === 'light' ? 50000 : 100000;

    baseLow += cfoLow;
    baseMid += cfoMid;
    baseHigh += cfoHigh;

    breakdown.push({
      category: 'CFO Advisory Services',
      description: `${input.cfoConsulting === 'light' ? 'Ad-hoc' : 'Ongoing'} CFO-level support and strategic guidance`,
      low: cfoLow,
      medium: cfoMid,
      high: cfoHigh
    });
  }

  // Calculate onboarding fees
  const onboardingMultiplier = totalExtraEntities > 3 ? 1.5 : totalExtraEntities > 1 ? 1.3 : 1.0;
  const onboardingBaseLow = 15000;
  const onboardingBaseMid = 25000;
  const onboardingBaseHigh = 40000;

  const onboardingFee = {
    low: Math.round(onboardingBaseLow * onboardingMultiplier),
    medium: Math.round(onboardingBaseMid * onboardingMultiplier),
    high: Math.round(onboardingBaseHigh * onboardingMultiplier)
  };

  // Build scope of services
  const scopeOfServices: ScopeItem[] = [
    { service: 'Core fund accounting and NAV calculations', included: input.coreAdminIncluded },
    { service: 'Investor capital account tracking', included: input.coreAdminIncluded },
    { service: 'Quarterly/periodic investor reporting', included: true },
    { service: 'Financial statement preparation', included: input.financialStatements },
    { service: 'Audit coordination and support', included: input.auditSupport },
    { service: 'Capital call and distribution processing', included: input.capitalCallDistribution },
    { service: 'Bank and custody reconciliations', included: input.bankReconciliation },
    { service: 'Tax return preparation', included: input.taxSupport !== 'none', notes: input.taxSupport === 'basic' ? 'Basic support' : undefined },
    { service: 'Regulatory filings (Form PF, FATCA, CRS)', included: input.regulatoryFilings },
    { service: 'KYC/AML investor onboarding', included: input.kycAmlSupport },
    { service: 'Waterfall and carry calculations', included: input.waterfallCalculations },
    { service: 'CFO-level consulting', included: input.cfoConsulting !== 'none', notes: input.cfoConsulting !== 'none' ? `${input.cfoConsulting} engagement` : undefined }
  ];

  const outOfScope = [
    'Portfolio company-level accounting',
    'Legal counsel services',
    'Fundraising support',
    'Investor relations platform',
    'Deal sourcing or investment advisory'
  ];

  return {
    annualFees: {
      low: Math.round(baseLow),
      medium: Math.round(baseMid),
      high: Math.round(baseHigh)
    },
    onboardingFee,
    breakdown,
    drivers,
    scopeOfServices,
    outOfScope,
    currency: input.aumCurrency
  };
}

export function getFundTypeName(type: FundType): string {
  const names: Record<FundType, string> = {
    'pe-buyout': 'Private Equity Buyout',
    'pe-growth': 'Private Equity Growth',
    'vc': 'Venture Capital',
    'private-credit': 'Private Credit',
    'real-estate': 'Real Estate',
    'fund-of-funds': 'Fund of Funds',
    'hedge-fund': 'Hedge Fund'
  };
  return names[type];
}

export function getRegionName(region: Region): string {
  const names: Record<Region, string> = {
    'us': 'United States',
    'europe': 'Europe',
    'asia': 'Asia',
    'offshore': 'Offshore (Cayman, Luxembourg, etc.)',
    'multi-region': 'Multiple Regions'
  };
  return names[region];
}

export function formatCurrency(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£'
  };
  return `${symbols[currency]}${amount.toLocaleString()}`;
}

// Sample/default input for pre-population
export const defaultInput: FundAdminInput = {
  fundType: 'pe-buyout',
  aumAmount: 250,
  aumCurrency: 'USD',
  region: 'us',
  strategyComplexity: 'moderate',
  mainEntities: 1,
  hasMasterFeeder: false,
  hasParallelFunds: false,
  spvCount: 3,
  managementCompanyEntities: 1,
  investorCount: 35,
  reportingFrequency: 'quarterly',
  investorLevelReporting: true,
  capitalCallDistribution: true,
  customReporting: false,
  coreAdminIncluded: true,
  financialStatements: true,
  auditSupport: true,
  taxSupport: 'basic',
  regulatoryFilings: true,
  kycAmlSupport: true,
  bankReconciliation: true,
  waterfallCalculations: true,
  cfoConsulting: 'none'
};
