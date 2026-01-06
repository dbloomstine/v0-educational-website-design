// COMPREHENSIVE EXPENSE ALLOCATION DATA MODEL
// This file contains the core logic and data for expense classification
// To add new expense categories or update guidance, modify the sections below

export type FundType = 'pe' | 'vc' | 'private-credit' | 'real-estate' | 'fund-of-funds' | 'hybrid';
export type FundStage = 'pre-launch' | 'fundraising' | 'post-close' | 'harvesting';
export type Beneficiary = 'fund' | 'management' | 'both';
export type Classification = 'fund-expense' | 'management-expense' | 'case-by-case';
export type MarketPractice = 'common-fund' | 'common-mgmt' | 'often-negotiated' | 'lp-focus-item';

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  defaultClassification: Classification;
  marketPractice: MarketPractice;
  tooltip: string;
  detailedExplanation: string;
  lpSensitivities: string;
  examples: string[];
  sampleLanguage?: string;
  confidenceLevel: 'high' | 'moderate' | 'depends-on-lpa';
  lpSensitivityLevel: 'high' | 'standard';
  similarExpenseIds: string[];
}

export interface ClassificationInput {
  expenseCategory: string;
  customDescription?: string;
  fundType: FundType;
  fundStage: FundStage;
  primaryBeneficiary: Beneficiary;
  lpaContext?: string;
}

export interface ClassificationResult {
  classification: Classification;
  headline: string;
  rationale: string;
  detailedExplanation: string;
  lpSensitivities: string;
  marketPractice: MarketPractice;
  examples: string[];
  flags: string[];
  sampleLanguage?: string;
  logicExplanation: string[];
  confidenceLevel: 'high' | 'moderate' | 'depends-on-lpa';
  lpSensitivityLevel: 'high' | 'standard';
  similarExpenses: string[];
}

// EXPENSE CATEGORIES DATABASE
// Add new categories here to expand the tool's coverage
export const expenseCategories: ExpenseCategory[] = [
  {
    id: 'fund-formation-legal',
    name: 'Fund Formation Legal Fees',
    description: 'Legal fees for drafting LPA, PPM, subscription documents, and fund structure',
    defaultClassification: 'fund-expense',
    marketPractice: 'common-fund',
    tooltip: 'Legal costs directly related to creating the fund structure and governing documents',
    detailedExplanation: 'Fund formation legal fees are universally treated as organization costs and typically borne by the fund. These include costs for drafting the Limited Partnership Agreement (LPA), Private Placement Memorandum (PPM), subscription documents, and establishing the fund structure. Many LPAs cap these costs (e.g., 0.5% of commitments) and require GP consent for overages.',
    lpSensitivities: 'LPs expect transparency on these costs and often negotiate caps. Some LPs request itemized billing. Formation costs are typically amortized over 5 years per GAAP. Excessive formation costs relative to fund size raise red flags.',
    examples: [
      'Legal fees for drafting the LPA and PPM',
      'Counsel fees for fund structure setup (Delaware LP, offshore feeder)',
      'Legal review of side letters',
      'Blue sky and regulatory filing fees'
    ],
    sampleLanguage: '"Organizational expenses incurred in connection with the formation of the Fund, including legal and filing fees, shall be borne by the Fund up to [0.5%] of aggregate Capital Commitments."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'high',
    similarExpenseIds: ['organization-offering-costs', 'ongoing-fund-legal', 'regulatory-compliance-fund-specific']
  },
  {
    id: 'broken-deal-costs',
    name: 'Broken Deal Costs',
    description: 'Transaction expenses for deals that did not close (legal, diligence, consulting)',
    defaultClassification: 'fund-expense',
    marketPractice: 'lp-focus-item',
    tooltip: 'Costs incurred pursuing a specific investment that ultimately did not close',
    detailedExplanation: 'Broken deal costs are generally treated as fund expenses because they relate to specific investment opportunities pursued on behalf of the fund. However, this is a frequent point of LP scrutiny. Costs must be directly tied to a specific, bona fide transaction (not general market research). Some LPAs require GP consent or sharing above certain thresholds.',
    lpSensitivities: 'LPs scrutinize broken deal costs heavily. They want to see: (1) costs tied to specific named deals, (2) reasonable amounts relative to deal size, (3) no pattern of excessive broken deals suggesting poor process. Some LPs negotiate GP co-investment in broken deal costs or caps per transaction.',
    examples: [
      'Legal and consulting fees for a specific acquisition that fell through',
      'Environmental or technical diligence on a property not purchased',
      'Financing commitment fees for a deal that did not close',
      'Travel to visit a target company for potential investment'
    ],
    sampleLanguage: '"Costs and expenses related to potential investments that do not close (broken deal costs) shall be Fund expenses, provided such costs relate to bona fide investment opportunities and are reasonable in amount."',
    confidenceLevel: 'moderate',
    lpSensitivityLevel: 'high',
    similarExpenseIds: ['transaction-fees-acquisitions', 'travel-deal-diligence', 'portfolio-company-consulting']
  },
  {
    id: 'placement-agent-fees',
    name: 'Placement Agent & Fundraising Fees',
    description: 'Fees paid to placement agents, brokers, or consultants for fundraising assistance',
    defaultClassification: 'management-expense',
    marketPractice: 'common-mgmt',
    tooltip: 'Costs for raising capital, typically a management company responsibility',
    detailedExplanation: 'Placement agent fees and fundraising costs are almost always management company expenses. The rationale is that raising capital benefits the management company (which earns fees on AUM) more than the fund itself. This is consistent with SEC guidance and LP expectations. Passing these to the fund is a significant red flag.',
    lpSensitivities: 'This is a bright-line issue for most LPs. Charging placement agent fees to the fund is considered improper and may violate fiduciary duties. LPs view fundraising as a cost of running the management business, not an investment activity. Any attempt to charge these to the fund will draw objections.',
    examples: [
      'Placement agent fees (typically 1-2% of commitments raised)',
      'Fundraising consultant retainers',
      'Marketing materials and roadshow costs for capital raising',
      'Database subscriptions for LP targeting (e.g., Preqin, PitchBook for fundraising)'
    ],
    sampleLanguage: '"All costs associated with fundraising for the Fund, including placement agent fees, shall be borne by the General Partner and not charged to the Fund."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'high',
    similarExpenseIds: ['travel-lp-fundraising', 'marketing-pr-platform', 'organization-offering-costs']
  },
  {
    id: 'ongoing-fund-legal',
    name: 'Ongoing Fund Legal & Compliance',
    description: 'Legal fees for fund-specific matters after closing (amendments, LP disputes, regulatory)',
    defaultClassification: 'fund-expense',
    marketPractice: 'common-fund',
    tooltip: 'Legal costs for matters that benefit the fund and its limited partners',
    detailedExplanation: 'Ongoing legal costs that relate specifically to the fund (not the management company) are typically fund expenses. This includes LPA amendments, responses to LP queries, fund-specific regulatory matters, and GP removal proceedings. The key test is whether the work benefits the fund/LPs versus the manager.',
    lpSensitivities: 'LPs accept these as fund expenses but want to see reasonable amounts and clear fund-specific nexus. Legal fees for defending the GP in disputes with LPs may be challenged. Some LPAs require LPAC review of significant legal expenses.',
    examples: [
      'Counsel fees for negotiating an LPA amendment',
      'Legal work on fund-specific regulatory examinations',
      'Outside counsel review of a potential key person event',
      'Legal fees for resolving disputes among fund investors'
    ],
    sampleLanguage: '"Legal and other professional fees incurred for matters relating specifically to the Fund shall be borne by the Fund."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['fund-formation-legal', 'regulatory-compliance-fund-specific', 'ongoing-management-legal']
  },
  {
    id: 'ongoing-management-legal',
    name: 'Management Company Legal & Compliance',
    description: 'Legal fees for GP entity matters, employment, platform compliance, non-fund specific issues',
    defaultClassification: 'management-expense',
    marketPractice: 'common-mgmt',
    tooltip: 'Legal costs that benefit the management company rather than specific fund',
    detailedExplanation: 'Legal costs for management company operations are management expenses. This includes employment matters, GP entity formation and governance, platform-wide compliance programs, non-fund-specific regulatory work, and general corporate counsel. These benefit the manager across all funds or future funds.',
    lpSensitivities: 'LPs are sensitive to allocation of overhead. Legal work that benefits the platform or future funds should not be charged to existing funds. Some managers try to allocate platform compliance costs across funds, which is often resisted.',
    examples: [
      'Employment law advice and employment agreements for firm professionals',
      'General partner entity formation and operating agreements',
      'Trademark registration for the management company',
      'Legal fees for general corporate matters not specific to any fund'
    ],
    sampleLanguage: '"Legal and compliance costs relating to the operation of the General Partner entity and not specifically related to Fund matters shall not be charged to the Fund."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['ongoing-fund-legal', 'regulatory-compliance-firm', 'management-company-formation']
  },
  {
    id: 'audit-tax-admin',
    name: 'Fund Audit, Tax, and Administration',
    description: 'Annual audit, tax return preparation, and fund administration services',
    defaultClassification: 'fund-expense',
    marketPractice: 'common-fund',
    tooltip: 'Core ongoing costs required for fund operations and LP reporting',
    detailedExplanation: 'Annual audit fees, tax return preparation, and fund administration services are standard fund expenses. These are necessary for the fund to meet its reporting obligations to LPs and regulatory requirements. Virtually all LPAs explicitly permit these expenses.',
    lpSensitivities: 'LPs readily accept these as fund expenses but expect reasonable pricing. Some LPs negotiate caps or require competitive bidding for service providers. Bundling multiple funds to reduce per-fund costs is viewed favorably.',
    examples: [
      'Annual financial statement audit by Big 4 or national firm',
      'Preparation of Schedule K-1s and partnership tax returns',
      'Fund administrator fees for capital calls, distributions, and NAV calculation',
      'Regulatory filings (Form D, Form ADV updates specific to the fund)'
    ],
    sampleLanguage: '"The Fund shall bear the costs of its annual audit, tax preparation, fund administration, and regulatory compliance."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['ongoing-fund-legal', 'regulatory-compliance-fund-specific', 'financing-fees']
  },
  {
    id: 'portfolio-monitoring-tools',
    name: 'Portfolio Monitoring & Valuation Tools',
    description: 'Software and services for tracking portfolio performance, valuations, and reporting',
    defaultClassification: 'case-by-case',
    marketPractice: 'often-negotiated',
    tooltip: 'Technology costs that may benefit the fund, the platform, or both',
    detailedExplanation: 'Portfolio monitoring tools can be fund expenses if used exclusively or primarily for that fund, but become more contentious if shared across funds or used for new deal sourcing. Valuation consultants for fund-specific fair value determinations are typically fund expenses. Platform-wide portfolio management systems are often management expenses or allocated.',
    lpSensitivities: 'LPs will question: (1) Is this fund-specific or platform-wide? (2) Does it support portfolio management (fund expense) or new deal sourcing (management expense)? (3) Is the cost reasonable? Clear allocation methodology helps. Some LPs accept pro-rata allocation if multiple funds benefit.',
    examples: [
      'Third-party valuation consultant for annual fair value opinions (fund expense)',
      'Portfolio company dashboard software used across all funds (likely allocated or management)',
      'Fund-specific portfolio monitoring consultant (fund expense)',
      'Data room and document management for portfolio companies (typically fund)'
    ],
    sampleLanguage: '"Costs of third-party valuation services and portfolio monitoring directly related to Fund investments shall be Fund expenses. Platform-wide technology shall be borne by the General Partner or allocated pro-rata across benefiting funds."',
    confidenceLevel: 'depends-on-lpa',
    lpSensitivityLevel: 'high',
    similarExpenseIds: ['technology-fund-specific', 'technology-platform-wide', 'portfolio-company-consulting']
  },
  {
    id: 'travel-lp-fundraising',
    name: 'Travel to Meet Potential LPs (Fundraising)',
    description: 'Travel and related costs for fundraising roadshows and LP meetings pre-close',
    defaultClassification: 'management-expense',
    marketPractice: 'common-mgmt',
    tooltip: 'Fundraising-related costs are management company expenses',
    detailedExplanation: 'Travel for fundraising purposes is a management expense, similar to placement agent fees. This includes roadshows, meetings with potential LPs, and attendance at capital introduction events. The benefit accrues to the management company in raising AUM.',
    lpSensitivities: 'LPs view this as non-negotiable. Fundraising costs belong with the GP. Trying to charge these to the fund will trigger pushback and reputational damage.',
    examples: [
      'Flights and hotels for fundraising roadshow',
      'Attendance at LP conferences for capital raising',
      'Meals with prospective investors during fundraising',
      'Rental of presentation venues for capital introduction events'
    ],
    sampleLanguage: '"Travel and other costs related to fundraising activities shall be borne by the General Partner."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'high',
    similarExpenseIds: ['placement-agent-fees', 'marketing-pr-platform', 'travel-existing-lp-relations']
  },
  {
    id: 'travel-existing-lp-relations',
    name: 'Travel to Meet Existing LPs (Annual Meetings, Updates)',
    description: 'Travel costs for annual LP meetings, advisory committee meetings, and LP updates',
    defaultClassification: 'fund-expense',
    marketPractice: 'common-fund',
    tooltip: 'Costs for servicing existing fund investors are typically fund expenses',
    detailedExplanation: 'Travel to meet with existing LPs for annual meetings, advisory committee meetings, and fund updates is generally treated as a fund expense. These activities fulfill the GP\'s obligations to the fund and provide transparency to existing investors.',
    lpSensitivities: 'LPs generally accept this, but expect reasonable costs. First-class flights or luxury accommodations may be questioned. Some LPs prefer virtual meetings to reduce costs. LPAC members may be more accepting of travel to LPAC meetings.',
    examples: [
      'GP travel to annual LP meeting',
      'Flights for advisory committee meetings',
      'Travel to meet with LPs for quarterly updates',
      'Venue rental for in-person annual meeting'
    ],
    sampleLanguage: '"Reasonable costs of meetings with Limited Partners, including annual meetings and advisory committee meetings, shall be Fund expenses."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['travel-lp-fundraising', 'travel-deal-diligence', 'ongoing-fund-legal']
  },
  {
    id: 'travel-deal-diligence',
    name: 'Travel for Investment Diligence',
    description: 'Travel to visit target companies, properties, or portfolio investments',
    defaultClassification: 'fund-expense',
    marketPractice: 'common-fund',
    tooltip: 'Travel directly related to evaluating or monitoring specific investments',
    detailedExplanation: 'Travel for investment diligence (site visits, management meetings, property tours) is a fund expense because it directly relates to making or monitoring investments on behalf of the fund. This is distinguished from general market research or conference attendance.',
    lpSensitivities: 'LPs accept this as a legitimate fund expense when tied to specific investment opportunities or portfolio monitoring. Reasonable cost standards apply. Excessive luxury or personal travel mixed with business will be questioned.',
    examples: [
      'Flight to visit a target company headquarters during diligence',
      'Property tours for real estate investments',
      'Factory visits for industrial investments',
      'Portfolio company board meeting attendance by fund representatives'
    ],
    sampleLanguage: '"Travel costs directly related to the evaluation and monitoring of Fund investments shall be borne by the Fund."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['broken-deal-costs', 'transaction-fees-acquisitions', 'travel-existing-lp-relations']
  },
  {
    id: 'travel-conferences-general',
    name: 'Conference & Industry Event Attendance (General)',
    description: 'Attendance at industry conferences, networking events, and trade shows',
    defaultClassification: 'management-expense',
    marketPractice: 'common-mgmt',
    tooltip: 'General industry events benefit the platform and future deal flow',
    detailedExplanation: 'Attendance at general industry conferences and networking events is typically a management expense. These activities support business development, brand building, and future deal flow more than they serve existing fund investments. However, if attendance is specifically for a live transaction, it may be allocable.',
    lpSensitivities: 'LPs view most conference attendance as overhead and business development, not fund-specific activity. Attempting to charge these to funds often leads to disputes. Clear policies help avoid issues.',
    examples: [
      'Registration and travel for industry conferences (e.g., SuperReturn, PEI events)',
      'Sponsorship of industry events',
      'Attendance at trade shows for deal sourcing',
      'Networking dinners and receptions at conferences'
    ],
    sampleLanguage: '"Costs of attending industry conferences and networking events shall be borne by the General Partner unless directly related to a specific Fund investment opportunity."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['marketing-pr-platform', 'travel-deal-diligence', 'office-rent-general']
  },
  {
    id: 'insurance-do-eo',
    name: 'D&O and E&O Insurance',
    description: 'Directors and officers liability and errors and omissions insurance',
    defaultClassification: 'case-by-case',
    marketPractice: 'often-negotiated',
    tooltip: 'Insurance allocation depends on who is covered and for what activities',
    detailedExplanation: 'D&O and E&O insurance allocation is heavily negotiated. Fund-specific D&O coverage for portfolio company board seats is usually a fund expense. Coverage for GP principals and management company activities is typically a management expense. Many LPAs split coverage costs or allocate based on percentage of coverage benefiting the fund.',
    lpSensitivities: 'LPs scrutinize insurance allocation closely. They accept fund payment for coverage that protects the fund and its activities (e.g., board seats taken on behalf of the fund). Coverage primarily for GP protection in managing other funds or firm operations should not be charged to the fund.',
    examples: [
      'D&O coverage for fund representatives serving on portfolio company boards (fund expense)',
      'E&O coverage for investment advisory activities across all client funds (allocated or management)',
      'Fiduciary liability coverage for the GP entity (management expense)',
      'Fund-specific side coverage (fund expense)'
    ],
    sampleLanguage: '"The Fund shall bear its pro-rata share of D&O and E&O insurance premiums based on the portion of coverage attributable to Fund activities, as reasonably determined by the General Partner."',
    confidenceLevel: 'depends-on-lpa',
    lpSensitivityLevel: 'high',
    similarExpenseIds: ['insurance-key-person', 'ongoing-fund-legal', 'audit-tax-admin']
  },
  {
    id: 'insurance-key-person',
    name: 'Key Person Insurance',
    description: 'Life insurance on key investment professionals',
    defaultClassification: 'case-by-case',
    marketPractice: 'often-negotiated',
    tooltip: 'Depends on who benefits and whether proceeds go to the fund or management company',
    detailedExplanation: 'Key person insurance is negotiated case-by-case. If the fund is the beneficiary and the insurance exists solely to protect the fund from loss of key talent, it may be a fund expense. However, if the management company benefits or the insurance covers individuals across multiple funds, it is typically a management expense or allocated.',
    lpSensitivities: 'LPs want to understand: (1) Who is covered? (2) Who is the beneficiary? (3) What happens to proceeds? If proceeds go to the management company or key person\'s family, LPs will resist charging premiums to the fund.',
    examples: [
      'Key person life insurance with fund as beneficiary (potentially fund expense)',
      'Buy-sell insurance for GP partners (management expense)',
      'Disability insurance for investment team (management expense)',
      'Key person coverage across multiple funds (allocated or management expense)'
    ],
    sampleLanguage: '"Key person life insurance shall be a Fund expense only if the Fund is the sole beneficiary and the coverage is solely for the benefit of Fund investors."',
    confidenceLevel: 'depends-on-lpa',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['insurance-do-eo', 'ongoing-management-legal', 'management-company-formation']
  },
  {
    id: 'technology-fund-specific',
    name: 'Fund-Specific Technology & Data',
    description: 'Software, databases, and tools used exclusively for this fund',
    defaultClassification: 'fund-expense',
    marketPractice: 'common-fund',
    tooltip: 'Technology costs solely for this fund\'s benefit',
    detailedExplanation: 'Technology and data subscriptions used exclusively for a specific fund are typically fund expenses. This includes fund-specific data rooms, investor portals, specialized sector databases, and tools that don\'t benefit other funds or the platform generally.',
    lpSensitivities: 'LPs accept this when the technology is genuinely fund-specific. The test is: Would this cost go away if only this fund existed? If the tool is useful across funds or for future fundraising, it becomes contentious.',
    examples: [
      'Investor portal subscription for this fund only',
      'Data room for fund due diligence documents',
      'Sector-specific database for a specialized fund (e.g., biotech data for a healthcare fund)',
      'Fund-specific accounting or portfolio management module'
    ],
    sampleLanguage: '"Technology and data costs incurred solely for the benefit of the Fund shall be Fund expenses."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['portfolio-monitoring-tools', 'audit-tax-admin', 'technology-platform-wide']
  },
  {
    id: 'technology-platform-wide',
    name: 'Platform-Wide Technology & Infrastructure',
    description: 'Firm-wide software, CRM, email, general productivity tools',
    defaultClassification: 'management-expense',
    marketPractice: 'common-mgmt',
    tooltip: 'General firm infrastructure is an overhead cost',
    detailedExplanation: 'Platform-wide technology including CRM systems, email, collaboration tools, and general business software is a management expense. These are overhead costs that benefit the entire organization and often multiple funds or client relationships.',
    lpSensitivities: 'LPs view this as firm overhead. Even if a manager argues "we use this to service your fund," LPs will push back that these are costs of running a business and should not be passed through to funds.',
    examples: [
      'Microsoft 365 or Google Workspace subscriptions',
      'CRM systems (Salesforce, etc.) for firm-wide use',
      'Slack, Zoom, or collaboration platforms',
      'Accounting software for the management company'
    ],
    sampleLanguage: '"Platform-wide technology infrastructure costs shall be borne by the General Partner as overhead."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['technology-fund-specific', 'office-rent-general', 'regulatory-compliance-firm']
  },
  {
    id: 'office-rent-dedicated',
    name: 'Dedicated Fund Office or Space',
    description: 'Office space used exclusively for fund operations or portfolio company work',
    defaultClassification: 'fund-expense',
    marketPractice: 'often-negotiated',
    tooltip: 'Rarely applies, but some funds have dedicated deal team offices',
    detailedExplanation: 'In rare cases where a fund leases separate office space exclusively for its operations (e.g., a deal team office near portfolio companies, a separate real estate asset management office), these costs may be fund expenses. This is uncommon and heavily negotiated.',
    lpSensitivities: 'LPs will carefully scrutinize whether the space is truly fund-specific. Shared space with other funds or used for general business development will be challenged. Most office rent is considered overhead.',
    examples: [
      'Satellite office near a portfolio company cluster for a dedicated fund team',
      'Real estate fund asset management office',
      'Temporary project office for a specific investment',
      'Data center or specialized facility for fund operations'
    ],
    sampleLanguage: '"Costs of dedicated office space used exclusively for Fund operations may be charged to the Fund with LPAC approval."',
    confidenceLevel: 'depends-on-lpa',
    lpSensitivityLevel: 'high',
    similarExpenseIds: ['office-rent-general', 'portfolio-company-consulting', 'technology-fund-specific']
  },
  {
    id: 'office-rent-general',
    name: 'General Office Rent & Overhead',
    description: 'Firm headquarters rent, utilities, furniture, and general office overhead',
    defaultClassification: 'management-expense',
    marketPractice: 'common-mgmt',
    tooltip: 'General office overhead is a cost of doing business, not a fund expense',
    detailedExplanation: 'General office rent and overhead are management company expenses. This is a fundamental principle: the management fee is meant to cover the costs of providing investment advisory services, including office space, staff, and infrastructure.',
    lpSensitivities: 'This is a bright-line issue for LPs. Overhead belongs with the manager. Any attempt to charge rent or overhead to funds (outside of dedicated scenarios above) will be strongly resisted and may violate fiduciary duties.',
    examples: [
      'Firm headquarters lease payments',
      'Utilities, internet, and telecom for firm offices',
      'Office furniture and equipment',
      'Reception, security, and general office services'
    ],
    sampleLanguage: '"Office rent, utilities, and general overhead shall be borne by the General Partner and not charged to the Fund."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['office-rent-dedicated', 'technology-platform-wide', 'management-company-formation']
  },
  {
    id: 'marketing-pr-platform',
    name: 'Marketing, PR, and Platform Branding',
    description: 'Firm marketing materials, PR firms, website, and brand development',
    defaultClassification: 'management-expense',
    marketPractice: 'common-mgmt',
    tooltip: 'Marketing and branding benefit the platform and future fundraising',
    detailedExplanation: 'Marketing, public relations, and brand development are management expenses. These activities support business development, future fundraising, and platform reputation. Even if framed as "educating investors about our strategy," these costs benefit the manager, not the fund.',
    lpSensitivities: 'LPs are highly sensitive to marketing costs being charged to funds. This is seen as subsidizing the GP\'s business development efforts. Fund documents typically explicitly prohibit charging these costs.',
    examples: [
      'Firm website development and maintenance',
      'PR and media relations firms',
      'Marketing collateral and pitch decks',
      'Sponsorships and advertising'
    ],
    sampleLanguage: '"Marketing, public relations, and branding costs shall be borne by the General Partner."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'high',
    similarExpenseIds: ['placement-agent-fees', 'travel-lp-fundraising', 'travel-conferences-general']
  },
  {
    id: 'transaction-fees-acquisitions',
    name: 'Transaction Fees - Acquisitions (Legal, Consulting)',
    description: 'Legal, financial, and consulting fees for closing fund investments',
    defaultClassification: 'fund-expense',
    marketPractice: 'lp-focus-item',
    tooltip: 'Deal costs for closed transactions are typically fund expenses, but watch for offsetting transaction fees',
    detailedExplanation: 'Legal, consulting, and diligence fees for completed acquisitions are generally fund expenses. However, this is an area of LP focus due to: (1) potential double-dipping if GP/affiliates also receive transaction fees from portfolio companies, and (2) questions about whether costs should be borne at the fund or portfolio company level. Many LPAs require 50-100% offsets of transaction fee income.',
    lpSensitivities: 'LPs scrutinize: (1) Are transaction fees being offset against management fees? (2) Is there double-dipping (fund pays external counsel AND GP affiliate gets paid by portfolio company for the same work)? (3) Are costs reasonable? (4) Should some costs be borne by the portfolio company rather than the fund?',
    examples: [
      'Legal fees for acquisition documentation and closing',
      'Financial and accounting diligence on target companies',
      'Technical or IT diligence consultants',
      'Environmental consultants for real estate or industrial acquisitions'
    ],
    sampleLanguage: '"Legal, consulting, and other transaction costs for completed investments shall be Fund expenses, subject to offsets as described in Section X [Transaction Fees and Offsets]."',
    confidenceLevel: 'moderate',
    lpSensitivityLevel: 'high',
    similarExpenseIds: ['broken-deal-costs', 'travel-deal-diligence', 'portfolio-company-consulting']
  },
  {
    id: 'financing-fees',
    name: 'Fund-Level Financing Fees',
    description: 'Costs related to credit facilities, subscription lines, or fund-level leverage',
    defaultClassification: 'fund-expense',
    marketPractice: 'common-fund',
    tooltip: 'Costs of fund-level borrowing are fund expenses',
    detailedExplanation: 'Fees and expenses related to fund-level credit facilities, subscription lines, and other fund-level financing are fund expenses. This includes arrangement fees, commitment fees, legal fees, and interest expense. These tools benefit the fund by providing liquidity and flexibility.',
    lpSensitivities: 'LPs generally accept these costs but have concerns about overuse of subscription lines to artificially inflate IRRs. Transparency about line usage and costs is important. Some LPs prefer advance notice of significant borrowing.',
    examples: [
      'Subscription line of credit arrangement fees and commitment fees',
      'Interest expense on fund-level borrowing',
      'Legal fees for credit facility documentation',
      'Amendment fees for modifying credit facilities'
    ],
    sampleLanguage: '"Costs and expenses related to Fund-level financing facilities, including arrangement fees, commitment fees, interest, and related legal expenses, shall be borne by the Fund."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['audit-tax-admin', 'ongoing-fund-legal', 'organization-offering-costs']
  },
  {
    id: 'organization-offering-costs',
    name: 'Organization & Offering Costs',
    description: 'Comprehensive costs of forming and launching the fund',
    defaultClassification: 'fund-expense',
    marketPractice: 'common-fund',
    tooltip: 'Formation costs are fund expenses, typically subject to caps',
    detailedExplanation: 'Organization and offering costs include all expenses to form and initially offer the fund: legal fees, filing fees, marketing materials for the private placement, travel for fundraising roadshows, and other formation costs. These are treated as fund expenses but virtually always subject to caps (commonly 0.3-0.5% of commitments) with GP responsible for overages.',
    lpSensitivities: 'LPs negotiate caps and require transparency. Costs should be reasonable relative to fund size. First-time managers may face more scrutiny. Some LPs request detailed breakdowns. Note: ongoing fundraising costs are different and typically GP expenses.',
    examples: [
      'All legal fees for fund formation',
      'PPM drafting and printing',
      'Blue sky filings and regulatory costs',
      'Initial subscription document and data room setup'
    ],
    sampleLanguage: '"Organization and offering expenses shall be borne by the Fund, capped at 0.5% of aggregate Capital Commitments, with any excess borne by the General Partner."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'high',
    similarExpenseIds: ['fund-formation-legal', 'placement-agent-fees', 'financing-fees']
  },
  {
    id: 'portfolio-company-consulting',
    name: 'Portfolio Company Consulting & Add-On Services',
    description: 'Consultants engaged to help portfolio companies (operations, strategy, IT, etc.)',
    defaultClassification: 'case-by-case',
    marketPractice: 'often-negotiated',
    tooltip: 'Depends on who benefits and whether the portfolio company can pay',
    detailedExplanation: 'This is highly fact-specific. If consultants are engaged to benefit a portfolio company and it can afford to pay, costs should be borne by the portfolio company. If pre-closing or the company cannot afford it, and it directly enhances investment value, it may be a fund expense. If consultants benefit multiple portfolio companies or the platform (e.g., Operating Partners), allocation or management expense may be appropriate.',
    lpSensitivities: 'LPs want to see: (1) Portfolio companies paying their own operating costs when possible, (2) No double-dipping if GP affiliates provide services, (3) Clear rationale for why the fund should pay vs. the company, (4) Monitoring fee offsets if applicable.',
    examples: [
      'Interim CFO for a portfolio company (portfolio company expense if it can pay)',
      'Pre-closing consulting to ready a company for acquisition (potentially fund expense)',
      'Operating partner shared across multiple portfolio companies (allocated or management)',
      'One-off strategic consultant for a single portfolio issue (negotiate case-by-case)'
    ],
    sampleLanguage: '"Consulting and advisory services for portfolio companies shall generally be borne by the portfolio companies. The Fund may bear such costs if the portfolio company is unable to do so and the services are necessary to protect or enhance the Fund\'s investment, subject to LPAC approval for amounts exceeding $[X]."',
    confidenceLevel: 'depends-on-lpa',
    lpSensitivityLevel: 'high',
    similarExpenseIds: ['broken-deal-costs', 'portfolio-monitoring-tools', 'transaction-fees-acquisitions']
  },
  {
    id: 'management-company-formation',
    name: 'Management Company Formation & Operations',
    description: 'Costs of setting up and operating the GP entity itself',
    defaultClassification: 'management-expense',
    marketPractice: 'common-mgmt',
    tooltip: 'Entity costs for the management company are not fund expenses',
    detailedExplanation: 'Costs of forming, maintaining, and operating the management company entity (the GP, investment adviser, or management company) are management expenses. This includes entity formation legal fees, operating agreements, state filings, entity-level compliance, and governance. These are costs of establishing the business that will manage funds.',
    lpSensitivities: 'LPs view this as non-negotiable. The management company is the business entity that earns fee income; its costs are not fund expenses. Attempting to charge these to funds suggests the manager lacks sufficient capital to operate.',
    examples: [
      'Legal fees to form the management company LLC or LP',
      'State registration and filing fees for the manager entity',
      'Operating agreement for the GP entity',
      'Entity-level franchise taxes and fees'
    ],
    sampleLanguage: '"Costs of forming and operating the General Partner entity shall be borne by the General Partner and not charged to the Fund."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['ongoing-management-legal', 'regulatory-compliance-firm', 'office-rent-general']
  },
  {
    id: 'regulatory-compliance-firm',
    name: 'Firm-Wide Regulatory Compliance Program',
    description: 'SEC/FCA registration, CCO costs, firm-wide compliance program',
    defaultClassification: 'management-expense',
    marketPractice: 'common-mgmt',
    tooltip: 'Platform compliance is an overhead cost for the advisory business',
    detailedExplanation: 'Firm-wide regulatory compliance, including SEC or FCA registration, chief compliance officer (CCO) compensation, compliance software, and policies/procedures for the entire platform, are management expenses. These are costs of operating an investment advisory business and benefit all clients/funds.',
    lpSensitivities: 'LPs expect managers to maintain robust compliance programs but view this as overhead. Attempting to allocate CCO costs or compliance program expenses to funds will be resisted. Fund-specific compliance work (e.g., addressing a fund-specific SEC inquiry) may be different.',
    examples: [
      'SEC Form ADV filing and updates for the firm',
      'Chief Compliance Officer salary and benefits',
      'Compliance software and monitoring systems',
      'Annual compliance consultant or audit for the firm'
    ],
    sampleLanguage: '"Costs of firm-wide regulatory compliance, including registration, chief compliance officer, and platform compliance programs, shall be borne by the General Partner."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['regulatory-compliance-fund-specific', 'ongoing-management-legal', 'management-company-formation']
  },
  {
    id: 'regulatory-compliance-fund-specific',
    name: 'Fund-Specific Regulatory Matters',
    description: 'SEC exam or regulatory inquiries focused on this specific fund',
    defaultClassification: 'fund-expense',
    marketPractice: 'common-fund',
    tooltip: 'Regulatory work specific to this fund can be charged to it',
    detailedExplanation: 'If regulators conduct an examination or inquiry focused specifically on a fund (rather than the adviser generally), legal and consulting costs to respond may be fund expenses. The key is whether the matter relates to fund operations and benefits the fund, versus general adviser conduct.',
    lpSensitivities: 'LPs generally accept this as long as it is truly fund-specific. If the regulatory matter stems from GP misconduct, LPs may argue the fund should not bear costs. Transparency and LPAC consultation are important.',
    examples: [
      'Legal fees to respond to an SEC exam focused on a specific fund\'s valuation practices',
      'Consultants engaged to address fund-specific regulatory concerns',
      'Costs of responding to investor protection inquiries about the fund',
      'Legal defense of fund-specific regulatory action'
    ],
    sampleLanguage: '"Legal and consulting costs related to regulatory examinations or inquiries focused specifically on the Fund shall be Fund expenses, unless arising from General Partner misconduct."',
    confidenceLevel: 'high',
    lpSensitivityLevel: 'standard',
    similarExpenseIds: ['ongoing-fund-legal', 'audit-tax-admin', 'regulatory-compliance-firm']
  }
];

// FUND TYPES WITH CONTEXT
export const fundTypes = {
  pe: { name: 'Private Equity', description: 'Buyout, growth equity, and control investments' },
  vc: { name: 'Venture Capital', description: 'Early-stage and growth-stage technology investments' },
  'private-credit': { name: 'Private Credit', description: 'Direct lending, mezzanine, distressed debt' },
  'real-estate': { name: 'Real Estate', description: 'Property acquisitions, development, and real estate debt' },
  'fund-of-funds': { name: 'Fund of Funds', description: 'Investments in other private equity or venture funds' },
  hybrid: { name: 'Hybrid / Multi-Strategy', description: 'Combination of strategies or flexible mandate' }
};

export const fundStages = {
  'pre-launch': { name: 'Pre-Launch', description: 'Fund not yet in market or fundraising' },
  fundraising: { name: 'Fundraising', description: 'Actively raising capital from LPs' },
  'post-close': { name: 'Post-Close / Investing', description: 'Closed to new investors, making investments' },
  harvesting: { name: 'Harvesting', description: 'Investment period over, focused on exits and distributions' }
};

export const beneficiaries = {
  fund: { name: 'Fund and its LPs', description: 'Primary benefit is to this fund and its limited partners' },
  management: { name: 'Management Company', description: 'Primary benefit is to the GP/management company' },
  both: { name: 'Both Fund and Management', description: 'Benefits both the fund and the management company' }
};

// TOOLTIPS FOR KEY TERMS
export const glossary: Record<string, string> = {
  'fund-expense': 'An expense properly borne by the limited partnership fund, typically deducted from fund assets or called from LP capital commitments.',
  'management-expense': 'An expense that should be paid by the general partner or management company, not charged to limited partners.',
  'lpa': 'Limited Partnership Agreement - the governing document that defines rights, obligations, and economic terms between GPs and LPs.',
  'ppm': 'Private Placement Memorandum - disclosure document describing the fund, its strategy, risks, and terms for prospective investors.',
  'organization-costs': 'Costs incurred to form and initially offer the fund, typically capped and amortized over time.',
  'broken-deal-costs': 'Expenses for pursuing investments that did not close, typically fund expenses but subject to scrutiny.',
  'overhead': 'General operating costs of running the management business (office, staff, technology) - typically management expenses.',
  'side-letter': 'Bilateral agreement between GP and a specific LP granting special rights or terms not in the main LPA.',
  'lpac': 'Limited Partner Advisory Committee - a committee of select LPs that advises on conflicts and certain fund matters.',
  'offset': 'Reduction of management fees by amounts earned from transaction fees, monitoring fees, or other fund-related income.',
  'key-person-event': 'Triggering condition (usually death, disability, or departure of key investment professionals) that may suspend investing.',
  'placement-agent': 'Third-party firm hired by GPs to assist in fundraising, typically compensated as a percentage of capital raised.',
  'transaction-fee': 'Fees paid by portfolio companies to the GP or affiliates for transaction services, typically subject to offset requirements.',
  'monitoring-fee': 'Ongoing fees paid by portfolio companies to the GP, typically subject to offset against management fees.',
  'management-fee': 'Periodic fee (typically annual) paid to the GP, usually calculated as a percentage of commitments or invested capital.',
};

// CLASSIFICATION ENGINE
export function classifyExpense(input: ClassificationInput): ClassificationResult {
  // Find the expense category
  const category = expenseCategories.find(cat => cat.id === input.expenseCategory);

  if (!category) {
    return generateCustomExpenseResult(input);
  }

  // Start with default classification
  let classification = category.defaultClassification;
  const flags: string[] = [];
  const logicFactors: string[] = [];

  // Add base logic factors that always apply
  logicFactors.push(`Expense category: ${category.name} - default treatment is ${category.defaultClassification.replace('-', ' ')}`);
  logicFactors.push(`Market practice: ${category.marketPractice.replace(/-/g, ' ')}`);
  logicFactors.push(`Fund context: ${fundTypes[input.fundType].name}, ${fundStages[input.fundStage].name} stage`);

  // Apply contextual rules based on fund type, stage, and beneficiary

  // Rule 1: Fundraising stage affects certain expense treatment
  if (input.fundStage === 'fundraising') {
    if (category.id.includes('fundraising') || category.id.includes('placement')) {
      logicFactors.push('During fundraising: fundraising costs remain management expenses');
    }
    if (category.id === 'organization-offering-costs') {
      flags.push('Organization costs during fundraising - ensure cap is specified in LPA');
      logicFactors.push('Fundraising stage: Organization costs are being incurred, ensure proper capping');
    }
  }

  // Rule 2: Primary beneficiary strongly influences classification
  if (input.primaryBeneficiary === 'management') {
    if (classification === 'case-by-case') {
      classification = 'management-expense';
      logicFactors.push('Primary beneficiary is management company → likely management expense');
    } else if (classification === 'fund-expense') {
      flags.push('Expense category typically treated as fund expense, but you indicated primary beneficiary is management company - review carefully');
      logicFactors.push('Tension: Category default is fund expense but beneficiary is management');
    }
  }

  if (input.primaryBeneficiary === 'fund') {
    if (classification === 'case-by-case') {
      classification = 'fund-expense';
      logicFactors.push('Primary beneficiary is the fund → likely fund expense');
    }
  }

  if (input.primaryBeneficiary === 'both') {
    if (classification !== 'case-by-case') {
      flags.push('You indicated both fund and management benefit - consider whether allocation or negotiated treatment is appropriate');
      logicFactors.push('Both fund and management benefit → may warrant allocation discussion');
    }
  }

  // Rule 3: Fund type specific adjustments
  if (input.fundType === 'fund-of-funds' && category.id.includes('broken-deal')) {
    flags.push('Fund-of-funds context: "broken deal costs" may refer to funds that didn\'t close - typically management expense for FoF');
    logicFactors.push('Fund-of-funds: Broken deal costs (failed fund commitments) often treated differently');
  }

  if (input.fundType === 'real-estate' && category.id.includes('valuation')) {
    flags.push('Real estate funds often have frequent third-party appraisals - typically fund expenses');
    logicFactors.push('Real estate: Regular property appraisals are standard fund expenses');
  }

  // Rule 4: Travel expenses need careful treatment
  if (category.id.includes('travel')) {
    flags.push('For travel expenses: ensure costs are reasonable and well-documented; luxury travel may be questioned by LPs');
    logicFactors.push('Travel expenses: Reasonableness standard applies');
  }

  // Rule 5: Technology and overhead
  if (category.id.includes('technology') || category.id.includes('office')) {
    if (classification === 'case-by-case') {
      flags.push('For shared technology/space: consider pro-rata allocation based on usage or benefit');
      logicFactors.push('Shared resources: Allocation methodology should be transparent and reasonable');
    }
  }

  // Rule 6: LPA context provided
  if (input.lpaContext) {
    flags.push('You noted LPA context - always defer to governing documents for final determination');
    logicFactors.push('Custom LPA language provided - governing documents control');
  }

  // Rule 7: Specific LP sensitivities based on classification
  if (category.marketPractice === 'lp-focus-item') {
    flags.push('This is an area of heightened LP scrutiny - ensure documentation and reasonableness');
  }

  if (category.marketPractice === 'often-negotiated') {
    flags.push('This expense type is often negotiated in LPAs - check fund documents carefully');
  }

  // Generate headline
  const headline = generateHeadline(classification, category.marketPractice);

  // Generate rationale
  const rationale = generateRationale(classification, category, input, logicFactors);

  // Generate similar expenses list
  const similarExpenses = category.similarExpenseIds
    .map(id => expenseCategories.find(cat => cat.id === id))
    .filter((cat): cat is ExpenseCategory => cat !== undefined)
    .map(cat => cat.name);

  return {
    classification,
    headline,
    rationale,
    detailedExplanation: category.detailedExplanation,
    lpSensitivities: category.lpSensitivities,
    marketPractice: category.marketPractice,
    examples: category.examples,
    flags,
    sampleLanguage: category.sampleLanguage,
    logicExplanation: logicFactors,
    confidenceLevel: category.confidenceLevel,
    lpSensitivityLevel: category.lpSensitivityLevel,
    similarExpenses
  };
}

function generateHeadline(classification: Classification, marketPractice: MarketPractice): string {
  if (classification === 'fund-expense') {
    if (marketPractice === 'lp-focus-item') {
      return 'Typically treated as a fund expense, but subject to LP scrutiny';
    }
    return 'Typically treated as a fund expense';
  } else if (classification === 'management-expense') {
    return 'Typically treated as a management company expense';
  } else {
    if (marketPractice === 'often-negotiated') {
      return 'Often negotiated case-by-case - check governing documents';
    }
    return 'Treatment varies case-by-case - review fund documents carefully';
  }
}

function generateRationale(
  classification: Classification,
  category: ExpenseCategory,
  input: ClassificationInput,
  _logicFactors: string[]
): string {
  let rationale = '';

  if (classification === 'fund-expense') {
    rationale = `This expense is generally treated as a fund expense because it directly relates to ${category.name.toLowerCase()} which benefits the fund and its limited partners. `;
  } else if (classification === 'management-expense') {
    rationale = `This expense is typically a management company responsibility because ${category.name.toLowerCase()} primarily benefits the GP entity or platform rather than this specific fund. `;
  } else {
    rationale = `This expense requires case-by-case analysis because ${category.name.toLowerCase()} may benefit both the fund and management company, or treatment varies based on specific circumstances. `;
  }

  // Add context about beneficiary if it influenced the decision
  if (input.primaryBeneficiary === 'both') {
    rationale += 'Since both the fund and management company benefit, consider whether allocation or shared treatment is appropriate. ';
  }

  // Add fund-specific context
  const fundTypeInfo = fundTypes[input.fundType];
  if (category.id.includes('monitoring') || category.id.includes('valuation')) {
    rationale += `For ${fundTypeInfo.name} funds, `;
    if (input.fundType === 'real-estate') {
      rationale += 'regular property valuations and monitoring are standard practice and typically funded at the fund level. ';
    } else {
      rationale += 'portfolio monitoring practices should be clearly defined in the LPA. ';
    }
  }

  rationale += 'Always consult your fund\'s governing documents and counsel for final determination.';

  return rationale;
}

function _generateLogicExplanation(
  input: ClassificationInput,
  logicFactors: string[],
  category: ExpenseCategory
): string {
  let explanation = '**How we reached this classification:**\n\n';

  explanation += `1. **Expense Category**: ${category.name}\n`;
  explanation += `   - Default treatment: ${category.defaultClassification.replace('-', ' ')}\n`;
  explanation += `   - Market practice: ${category.marketPractice.replace(/-/g, ' ')}\n\n`;

  explanation += `2. **Your Context**:\n`;
  explanation += `   - Fund type: ${fundTypes[input.fundType].name}\n`;
  explanation += `   - Fund stage: ${fundStages[input.fundStage].name}\n`;
  explanation += `   - Primary beneficiary: ${beneficiaries[input.primaryBeneficiary].name}\n\n`;

  if (logicFactors.length > 0) {
    explanation += `3. **Key Factors Considered**:\n`;
    logicFactors.forEach((factor) => {
      explanation += `   - ${factor}\n`;
    });
    explanation += '\n';
  }

  explanation += `4. **Bottom Line**: Based on the expense category, your fund context, and market practice, this expense is classified as indicated above. However, your fund's specific governing documents (LPA, side letters) always control.`;

  return explanation;
}

function generateCustomExpenseResult(input: ClassificationInput): ClassificationResult {
  // Analyze custom description for keywords
  const description = (input.customDescription || '').toLowerCase();
  let classification: Classification = 'case-by-case';
  const headline = 'Custom expense - requires specific analysis';
  let rationale = 'For this custom expense, ';
  const flags: string[] = ['Custom expense description - this guidance is preliminary. Consult fund documents and counsel.'];
  const logicFactors: string[] = [];

  // Simple keyword-based classification for custom descriptions
  if (description.includes('fundrais') || description.includes('placement') || description.includes('capital rais')) {
    classification = 'management-expense';
    rationale += 'expenses related to fundraising and capital raising are typically management company responsibilities. ';
    logicFactors.push('Keywords suggest fundraising activity → management expense');
  } else if (description.includes('portfolio') && (description.includes('monitor') || description.includes('board'))) {
    classification = 'fund-expense';
    rationale += 'costs for monitoring portfolio investments and board participation are typically fund expenses. ';
    logicFactors.push('Portfolio monitoring activity → likely fund expense');
  } else if (description.includes('legal') && description.includes('lpa')) {
    classification = 'fund-expense';
    rationale += 'legal work related to the fund\'s governing documents is typically a fund expense. ';
    logicFactors.push('LPA-related legal work → fund expense');
  } else if (description.includes('office') || description.includes('rent') || description.includes('overhead')) {
    classification = 'management-expense';
    rationale += 'general office and overhead costs are typically management company expenses. ';
    logicFactors.push('Office/overhead keywords → management expense');
  } else if (description.includes('audit') || description.includes('tax return') || description.includes('admin')) {
    classification = 'fund-expense';
    rationale += 'audit, tax, and administration services for the fund are typically fund expenses. ';
    logicFactors.push('Audit/tax/admin → fund expense');
  } else {
    // Use beneficiary as tiebreaker
    if (input.primaryBeneficiary === 'fund') {
      classification = 'fund-expense';
      rationale += 'since you indicated the primary beneficiary is the fund, it is likely a fund expense. ';
      logicFactors.push('Primary beneficiary is fund → likely fund expense');
    } else if (input.primaryBeneficiary === 'management') {
      classification = 'management-expense';
      rationale += 'since you indicated the primary beneficiary is the management company, it is likely a management expense. ';
      logicFactors.push('Primary beneficiary is management → likely management expense');
    } else {
      rationale += 'this requires careful analysis of who benefits and what your LPA says. ';
      logicFactors.push('Insufficient information for definitive classification');
    }
  }

  rationale += 'This is a preliminary assessment based on limited information. Please consult your fund documents and legal counsel for definitive guidance.';

  // Add base context to logicFactors for custom expenses
  if (input.customDescription) {
    logicFactors.unshift(`Custom expense: "${input.customDescription}"`);
  }
  logicFactors.unshift(`Fund context: ${fundTypes[input.fundType].name}, ${fundStages[input.fundStage].name} stage`);
  logicFactors.unshift(`Primary beneficiary: ${beneficiaries[input.primaryBeneficiary].name}`);

  return {
    classification,
    headline,
    rationale,
    detailedExplanation: 'This is a custom expense not in our predefined categories. The classification above is based on keyword analysis and the context you provided. For custom or unusual expenses, it is especially important to review your fund documents and consult with counsel.',
    lpSensitivities: 'For non-standard expenses, LPs will want to see: (1) clear rationale for the allocation, (2) consistency with LPA principles, (3) transparency and disclosure, (4) reasonableness of amount. Consider discussing novel or material expenses with your LPAC.',
    marketPractice: 'often-negotiated',
    examples: [],
    flags,
    logicExplanation: logicFactors,
    confidenceLevel: 'depends-on-lpa',
    lpSensitivityLevel: 'high',
    similarExpenses: []
  };
}

// SAMPLE SCENARIOS
export const sampleScenarios: ClassificationInput[] = [
  {
    expenseCategory: 'broken-deal-costs',
    fundType: 'pe',
    fundStage: 'post-close',
    primaryBeneficiary: 'fund',
    lpaContext: ''
  },
  {
    expenseCategory: 'placement-agent-fees',
    fundType: 'vc',
    fundStage: 'fundraising',
    primaryBeneficiary: 'management',
    lpaContext: ''
  },
  {
    expenseCategory: 'travel-deal-diligence',
    fundType: 'real-estate',
    fundStage: 'post-close',
    primaryBeneficiary: 'fund',
    lpaContext: ''
  },
  {
    expenseCategory: 'portfolio-monitoring-tools',
    fundType: 'pe',
    fundStage: 'post-close',
    primaryBeneficiary: 'both',
    lpaContext: ''
  },
  {
    expenseCategory: 'audit-tax-admin',
    fundType: 'private-credit',
    fundStage: 'post-close',
    primaryBeneficiary: 'fund',
    lpaContext: ''
  }
];
