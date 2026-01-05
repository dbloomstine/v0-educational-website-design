/**
 * Help Topics Data
 * Centralized data for all help topic pages
 * Previously 9 separate static pages (~3,200 LOC) now consolidated here
 */

export interface FAQItem {
  question: string
  answer: string
}

export interface RelatedLink {
  label: string
  href: string
}

export interface HelpTopic {
  slug: string
  title: string
  pageTitle: string
  description: string
  shortDescription: string
  icon: string // Lucide icon name
  urgencyBadge: string
  breadcrumbName: string
  articleHeadline: string
  articleDescription: string
  contextParagraphs: string[]
  whatWeCanDiscuss: string[]
  faqItems: FAQItem[]
  relatedLinks: RelatedLink[]
  emailSubject: string
  ctaDescription: string
}

export const HELP_TOPICS: Record<string, HelpTopic> = {
  'launching-a-fund': {
    slug: 'launching-a-fund',
    title: 'Launching Your First Fund',
    pageTitle: 'Launching Your First Fund | FundOpsHQ',
    description: 'First-time fund manager? Spinning out from a larger firm? I can help you think through the operational setup and get organized.',
    shortDescription: 'First-time fund manager? I can help you think through the operational setup.',
    icon: 'Rocket',
    urgencyBadge: 'Getting started',
    breadcrumbName: 'Launching a Fund',
    articleHeadline: 'Operational Guide to Launching Your First Private Fund',
    articleDescription: 'Comprehensive guide for first-time fund managers on operational setup, vendor selection, budgeting, and LP due diligence preparation.',
    contextParagraphs: [
      "Most first-time managers come from investment roles where someone else handled operations. Now you need to make decisions about fund administration, compliance, banking, insurance, technology—all while trying to raise capital and source deals.",
      "The challenge is knowing what actually matters at your stage versus what can wait. You don't need enterprise-grade everything on day one, but you do need to get certain things right from the start—and LPs will be looking at your operational setup during due diligence.",
      "I've helped managers work through this process across private equity, venture capital, and credit strategies. Happy to share what tends to work and what doesn't."
    ],
    whatWeCanDiscuss: [
      'Building your operational checklist and timeline',
      'Understanding what vendors you actually need (and when)',
      'Thinking through in-house vs. outsourced for different functions',
      'Budgeting for operations and administration',
      'Setting up your compliance program from scratch',
      'What LPs will expect to see operationally during due diligence',
    ],
    faqItems: [
      {
        question: 'What do I need to launch a private equity or venture capital fund?',
        answer: 'Launching a fund requires legal formation (fund documents, management company, GP entity), operational infrastructure (fund administrator, auditor, banking, compliance program), and investor onboarding processes. You will also need D&O insurance, cybersecurity policies, and typically 6-12 months of runway for operational costs before management fees start flowing.',
      },
      {
        question: 'How much does it cost to start a private fund?',
        answer: 'Initial fund formation typically costs $75,000-$200,000+ in legal fees depending on complexity. Ongoing annual costs include fund administration ($50,000-$150,000+), audit ($30,000-$80,000+), insurance ($15,000-$50,000+), compliance ($25,000-$75,000+), and technology/office costs. First-year all-in costs often range from $300,000-$600,000+ before you reach first close.',
      },
      {
        question: 'What vendors do I need when launching a fund?',
        answer: 'Essential vendors include: fund counsel (formation and ongoing), fund administrator (NAV, investor services, reporting), auditor (annual audit, tax coordination), bank (operating accounts, custody), and insurance broker (D&O, E&O, cyber). Optional but common: compliance consultant, IT/cybersecurity provider, and investor relations platform.',
      },
      {
        question: 'What do LPs look for in operational due diligence for emerging managers?',
        answer: "LPs evaluate your operational infrastructure, including quality of service providers, compliance program robustness, cybersecurity practices, valuation policies, and internal controls. They review your fund documents, DDQ responses, background checks, and references. Having a credible fund administrator, clean compliance policies, and transparent fee structures helps emerging managers pass operational due diligence.",
      },
    ],
    relatedLinks: [
      { label: 'PE CFO Guide', href: '/funds/private-equity/cfo' },
      { label: 'Management Company Budget Calculator', href: '/tools/management-company-budget' },
      { label: 'VC Fundraising Guide', href: '/funds/venture-capital/fundraising' },
    ],
    emailSubject: 'Launching%20a%20Fund',
    ctaDescription: "Whether you're just starting to think about operations or you're deep in vendor selection, I'm happy to help you think through it. No pitch, just practical guidance.",
  },

  'k1-tax-season': {
    slug: 'k1-tax-season',
    title: 'Navigating K-1 Tax Season',
    pageTitle: 'K-1 Tax Season Guide for Fund Managers | FundOpsHQ',
    description: 'Navigating K-1 delivery deadlines? Learn about K-1 timelines, extension strategies, investor communication best practices, and common delays to avoid.',
    shortDescription: 'Navigate K-1 delivery deadlines with confidence. Timelines, extension strategies, and investor communication.',
    icon: 'FileText',
    urgencyBadge: 'Tax deadline',
    breadcrumbName: 'K-1 Tax Season',
    articleHeadline: 'K-1 Tax Season Guide for Private Fund Managers',
    articleDescription: 'Comprehensive guide to navigating K-1 delivery deadlines, investor communication strategies, and common tax season challenges for private fund managers.',
    contextParagraphs: [
      "The K-1 process has multiple dependencies that all need to line up. Your audit needs to be complete. Your tax preparer needs the final numbers. If you invest in other funds, you're waiting on their K-1s before you can finalize yours. Meanwhile, investors—especially institutional ones—are pressing for delivery dates they can plan around.",
      "The challenge isn't just delivering K-1s; it's managing expectations and communication throughout the process. A fund that delivers K-1s on April 30th with good communication is often better received than one that promises March 15th and misses it with no update.",
      "The best approach is working backwards from deadlines and building in buffer time for the things that inevitably slip. And when they do slip, communicating proactively rather than waiting for investors to ask."
    ],
    whatWeCanDiscuss: [
      'Setting realistic K-1 delivery timelines for your fund',
      'Investor communication strategies and templates',
      'When and how to provide tax estimates',
      'Coordinating with auditors and tax preparers',
      'Handling underlying investment K-1 delays',
      'State tax filing complications and multi-state issues',
    ],
    faqItems: [
      {
        question: 'When are K-1s due for private funds?',
        answer: 'Partnership K-1s (Schedule K-1 of Form 1065) are due on March 15th for calendar-year funds, or the 15th day of the third month after the tax year ends. Extensions push this to September 15th. However, many investors expect K-1s before the original deadline to file their own returns on time.',
      },
      {
        question: 'How do I communicate K-1 delays to investors?',
        answer: "Be proactive: communicate expected delivery dates in January, provide updates if delays occur, and explain the reason (audit timing, complex allocations, underlying K-1 delays). Send investor tax estimates if final K-1s will be late. Most investors appreciate transparency over silence.",
      },
      {
        question: 'What causes K-1 delivery delays for private funds?',
        answer: 'Common causes include: delayed audits, waiting for K-1s from underlying investments (fund-of-funds), complex waterfall calculations, side letter provisions requiring special allocations, late partnership agreement amendments, and state tax filing complications. Planning for these early helps avoid last-minute scrambles.',
      },
      {
        question: 'Should my fund provide tax estimates to investors?',
        answer: 'Yes, especially if K-1s will be delayed past March 15th. Provide investors with estimated taxable income, capital gains, and state-source income by early March. This allows them to file extensions with reasonable estimates and avoid penalties. Update estimates if significant changes occur.',
      },
    ],
    relatedLinks: [
      { label: 'Annual Audit Prep', href: '/help/annual-audit-prep' },
      { label: 'PE Tax Guide', href: '/funds/private-equity/tax' },
      { label: 'Investor Reporting', href: '/help/investor-reporting' },
    ],
    emailSubject: 'K-1%20Tax%20Season%20Question',
    ctaDescription: "Whether you're planning ahead or already in the thick of tax season, I'm happy to share what's worked for other funds. No pitch, just practical guidance.",
  },

  'compliance-review': {
    slug: 'compliance-review',
    title: 'Compliance Gut Check',
    pageTitle: 'Compliance Gut Check | FundOpsHQ',
    description: "Want a second opinion on your compliance approach? Need to talk through policies or procedures? I'm happy to be a sounding board.",
    shortDescription: "Want a second opinion on your compliance approach? I'm happy to be a sounding board.",
    icon: 'ClipboardCheck',
    urgencyBadge: 'Ongoing',
    breadcrumbName: 'Compliance Review',
    articleHeadline: 'Private Fund Compliance Review and Policy Guidance',
    articleDescription: 'Guide to compliance program reviews, policy development, and regulatory best practices for private fund managers.',
    contextParagraphs: [
      "Compliance isn't just about having policies on paper—it's about having policies that actually work in practice and that your team understands and follows. Many funds have compliance manuals that were created at launch and haven't been meaningfully updated since.",
      "The SEC expects your compliance program to be tailored to your business and to evolve as your business changes. That means periodic reviews, updates when you add strategies or products, and documentation that shows you're actually testing your controls.",
      "Sometimes you just need someone to bounce ideas off of—whether it's reviewing a specific policy, thinking through how to handle a situation, or preparing for your annual compliance review."
    ],
    whatWeCanDiscuss: [
      'Reviewing your compliance manual or specific policies',
      'Thinking through whether your procedures actually work in practice',
      'Annual review preparation and documentation',
      'Code of ethics questions and personal trading policies',
      'Marketing and advertising compliance considerations',
      'Form ADV updates and disclosure questions',
    ],
    faqItems: [
      {
        question: 'What should be included in a private fund compliance manual?',
        answer: 'A compliance manual should include policies on fiduciary duty, code of ethics, personal trading, insider trading prevention, conflicts of interest, marketing and advertising, books and records, custody, valuation, business continuity, cybersecurity, and anti-money laundering. It should be tailored to your specific fund type, strategy, and regulatory requirements.',
      },
      {
        question: 'How often should I review my compliance program?',
        answer: 'The SEC requires registered investment advisers to conduct an annual compliance review (Rule 206(4)-7). This review should evaluate the adequacy of existing policies, identify any compliance issues that occurred during the year, and recommend changes. Many firms also conduct interim reviews when regulations change or after significant business changes.',
      },
      {
        question: 'What are common compliance deficiencies for private fund managers?',
        answer: 'Common deficiencies include inadequate or outdated compliance policies, poor documentation of compliance reviews, code of ethics violations (late personal trading reports, unreported holdings), marketing violations, fee and expense disclosure issues, inadequate cybersecurity policies, and failure to address conflicts of interest. The SEC Division of Examinations publishes annual priorities highlighting focus areas.',
      },
      {
        question: 'Do I need a Chief Compliance Officer for my fund?',
        answer: "SEC-registered investment advisers are required to designate a Chief Compliance Officer (CCO) responsible for administering the compliance program. The CCO can be an employee or outsourced, though there are regulatory considerations with outsourced CCO arrangements. The CCO should have sufficient authority, resources, and expertise to fulfill their responsibilities effectively.",
      },
    ],
    relatedLinks: [
      { label: 'PE Compliance Guide', href: '/funds/private-equity/compliance' },
      { label: 'SEC Exam Prep', href: '/help/sec-exam-prep' },
      { label: 'Regulatory Filings', href: '/help/regulatory-filings' },
    ],
    emailSubject: 'Compliance%20Question',
    ctaDescription: "Whether you need a second opinion on a specific policy or want to talk through your overall compliance approach, I'm happy to help. No pitch, just practical guidance.",
  },

  'annual-audit-prep': {
    slug: 'annual-audit-prep',
    title: 'Annual Audit Preparation',
    pageTitle: 'Annual Audit Preparation Guide | FundOpsHQ',
    description: "Preparing for your fund's annual audit? Learn what auditors look for, how to organize your PBC list, common findings to avoid, and timeline management strategies.",
    shortDescription: "Learn what auditors look for and how to prepare for your fund's annual audit efficiently.",
    icon: 'FileCheck',
    urgencyBadge: 'Year-end',
    breadcrumbName: 'Annual Audit Preparation',
    articleHeadline: 'Annual Audit Preparation Guide for Private Fund Managers',
    articleDescription: 'Comprehensive guide to preparing for your fund audit, including PBC list organization, common findings to avoid, and timeline management.',
    contextParagraphs: [
      "Audit season can be stressful, but most of that stress comes from being unprepared. The funds that get through audits quickly and cleanly are the ones that maintain good records throughout the year and start organizing well before the auditors arrive.",
      "The PBC (Prepared By Client) list is your roadmap. Auditors will send you a list of everything they need, and how quickly and completely you can provide that information determines how long the audit takes and how many follow-up questions you get.",
      "Common findings are often avoidable with good preparation. Management fee calculations, expense allocations, and valuation support are the areas where auditors find the most issues—and they're all things you can get right with proper documentation."
    ],
    whatWeCanDiscuss: [
      'Organizing your PBC (Prepared By Client) list efficiently',
      'Understanding what auditors actually focus on',
      'Timeline management and setting realistic deadlines',
      'Common findings and how to avoid them',
      'Coordinating between your team, administrator, and auditors',
      'Valuation documentation for illiquid investments',
    ],
    faqItems: [
      {
        question: 'What should I prepare for a private fund audit?',
        answer: 'Key items include: trial balance and general ledger, bank and custody statements, investment documentation (capital calls, distributions, trade confirmations), partnership agreement and side letters, management fee calculations, expense allocations, investor statements, and valuation support for illiquid investments. Organizing these by category before the audit starts significantly reduces back-and-forth.',
      },
      {
        question: 'What are common audit findings for private funds?',
        answer: 'Common findings include: management fee calculation errors, inconsistent expense allocation methodologies, inadequate valuation documentation for Level 3 assets, missing or incomplete side letter tracking, bank reconciliation timing differences, related party transaction disclosure gaps, and investor capital account discrepancies. Most can be avoided with proper year-end preparation.',
      },
      {
        question: 'How long does a private fund audit take?',
        answer: 'A typical private fund audit takes 4-8 weeks from fieldwork start to opinion delivery. Timeline depends on fund complexity, number of investments, investor count, and how prepared you are. Well-prepared funds with clean books can complete audits in 3-4 weeks. Funds with valuation challenges or documentation gaps may take 10+ weeks.',
      },
      {
        question: 'When should I start preparing for my fund audit?',
        answer: 'Start at least 6-8 weeks before year-end for optimal results. Begin by reconciling all accounts monthly throughout the year. At year-end, focus on finalizing valuations, preparing the PBC list, and coordinating with your administrator. Early preparation prevents the scramble that leads to audit delays and K-1 extensions.',
      },
    ],
    relatedLinks: [
      { label: 'K-1 Tax Season', href: '/help/k1-tax-season' },
      { label: 'PE Audit Guide', href: '/funds/private-equity/audit' },
      { label: 'Fund Administration', href: '/help/fund-admin-selection' },
    ],
    emailSubject: 'Audit%20Preparation%20Question',
    ctaDescription: "Whether you're planning ahead or already in audit season, I'm happy to share what's worked for other funds. No pitch, just practical guidance.",
  },

  'fund-admin-selection': {
    slug: 'fund-admin-selection',
    title: 'Choosing a Fund Administrator',
    pageTitle: 'Choosing a Fund Administrator | FundOpsHQ',
    description: "Evaluating fund administrators? Running an RFP? I can help you think through what matters for your specific situation and strategy.",
    shortDescription: "Evaluating fund administrators? I can help you think through what matters for your situation.",
    icon: 'Building2',
    urgencyBadge: 'Strategic decision',
    breadcrumbName: 'Fund Administrator Selection',
    articleHeadline: 'How to Choose a Fund Administrator for Your Private Fund',
    articleDescription: 'Guide to selecting the right fund administrator, including RFP best practices, evaluation criteria, and what to look for beyond pricing.',
    contextParagraphs: [
      "Choosing a fund administrator is one of the most important operational decisions you'll make. The right administrator becomes an extension of your team, handling investor services, NAV calculations, and reporting. The wrong one creates ongoing operational friction.",
      "The challenge is that administrators all say similar things in proposals. The differences emerge in the details: how they handle complex situations, their technology capabilities, team depth, and cultural fit with your organization.",
      "I've seen what works and what doesn't across different fund types and sizes. Happy to share perspectives on how to evaluate proposals, what questions to ask, and what red flags to watch for."
    ],
    whatWeCanDiscuss: [
      'Understanding what questions to ask (and what the answers really mean)',
      'Structuring an RFP process that gets you useful responses',
      'Evaluating proposals beyond just pricing',
      'Thinking through the build vs. buy decision for specific functions',
      'Transition planning and what to expect',
      'Red flags and what to look for in references',
    ],
    faqItems: [
      {
        question: 'How do I choose a fund administrator for my private fund?',
        answer: 'Choosing a fund administrator involves evaluating factors beyond pricing: technology capabilities, investor reporting flexibility, team depth, industry specialization, and cultural fit. Consider your fund type, AUM, complexity, and growth plans. Request references from similar funds and ask detailed questions about their operational processes.',
      },
      {
        question: 'What questions should I ask when evaluating fund administrators?',
        answer: 'Key questions include: What is your client-to-staff ratio? How do you handle complex waterfall calculations? What investor portal capabilities do you offer? How do you manage regulatory reporting? What is your typical response time for ad-hoc requests? Can you provide references from funds similar to ours in size and strategy?',
      },
      {
        question: 'What is the typical cost of fund administration services?',
        answer: 'Fund administration fees typically range from 3-15 basis points of AUM, with minimums ranging from $50,000 to $150,000+ annually depending on fund complexity. Costs are driven by number of entities, investor count, reporting frequency, jurisdiction, and service scope. Additional fees may apply for investor onboarding, tax support, and regulatory filings.',
      },
      {
        question: 'Should I use a large or boutique fund administrator?',
        answer: 'The choice depends on your priorities. Large administrators offer global reach, established technology, and comprehensive services but may have less flexibility and higher minimums. Boutique administrators often provide more personalized service and flexibility but may have limitations in technology or geographic coverage. Consider your fund size, complexity, and growth trajectory.',
      },
    ],
    relatedLinks: [
      { label: 'Launching a Fund', href: '/help/launching-a-fund' },
      { label: 'PE Fund Administration Guide', href: '/funds/private-equity/fund-administration' },
      { label: 'Investor Reporting', href: '/help/investor-reporting' },
    ],
    emailSubject: 'Fund%20Administrator%20Selection',
    ctaDescription: "Whether you're running an RFP or just starting to think about administration, I'm happy to share perspectives on what matters. No pitch, just practical guidance.",
  },

  'investor-reporting': {
    slug: 'investor-reporting',
    title: 'Investor Reporting Setup',
    pageTitle: 'Investor Reporting Setup Guide | FundOpsHQ',
    description: "Setting up investor reporting? Learn about report types, delivery frequency, portal vs. email decisions, and what LPs actually want to see from their fund managers.",
    shortDescription: "Learn what LPs actually want to see and how to set up effective investor reporting.",
    icon: 'BarChart3',
    urgencyBadge: 'LP relations',
    breadcrumbName: 'Investor Reporting Setup',
    articleHeadline: 'Investor Reporting Setup Guide for Private Fund Managers',
    articleDescription: 'Comprehensive guide to setting up investor reporting, including report types, delivery methods, and what LPs actually want to see.',
    contextParagraphs: [
      "Good investor reporting is about more than just compliance with your LPA requirements. It's a key part of your relationship with LPs and can differentiate you from other managers in their portfolio.",
      "The challenge is balancing completeness with practicality. LPs want information, but they also want it in a format they can actually use. A 50-page quarterly report that no one reads isn't as valuable as a focused 10-page report that gets read cover to cover.",
      "I've helped managers think through reporting strategies across different fund types. The right approach depends on your investor base, fund complexity, and internal resources."
    ],
    whatWeCanDiscuss: [
      'Designing a reporting package that meets investor expectations',
      'Setting realistic delivery schedules you can actually maintain',
      'Portal vs. email vs. hybrid delivery approaches',
      'ILPA reporting standards and how to implement them',
      'Handling side letter reporting requirements',
      'ESG reporting and emerging LP requirements',
    ],
    faqItems: [
      {
        question: 'What reports should a private fund provide to investors?',
        answer: 'Core reports include: quarterly capital account statements, quarterly/semi-annual portfolio updates, annual audited financial statements, K-1s, and capital call/distribution notices. Additional reports may include monthly NAV estimates (for hedge funds), ESG reporting, and detailed portfolio company updates. Report content should align with your LPA requirements and investor expectations.',
      },
      {
        question: 'How often should a fund report to investors?',
        answer: 'Quarterly reporting is standard for most private funds. Hedge funds often provide monthly performance updates. Annual audited financials are universal. The key is consistency—set a schedule in your LPA and stick to it. Some institutional investors negotiate for more frequent or detailed reporting via side letters.',
      },
      {
        question: 'Should I use an investor portal or email for reporting?',
        answer: 'Investor portals offer benefits like secure document storage, investor self-service access, and audit trails. However, they require ongoing maintenance and many investors still prefer email delivery. Most funds use a hybrid approach: portal for document archive and access, with email notifications for new reports. Consider your investor count and sophistication when deciding.',
      },
      {
        question: 'What do institutional LPs look for in fund reporting?',
        answer: 'Institutional LPs prioritize: timely and consistent delivery, ILPA-compliant capital account statements, detailed fee and expense breakdowns, portfolio performance attribution, ESG metrics, and transparent valuation methodology disclosure. They also value standardized formats that facilitate comparison across their fund portfolio.',
      },
    ],
    relatedLinks: [
      { label: 'PE Investor Relations Guide', href: '/funds/private-equity/investor-relations' },
      { label: 'K-1 Tax Season', href: '/help/k1-tax-season' },
      { label: 'Fund Administration', href: '/help/fund-admin-selection' },
    ],
    emailSubject: 'Investor%20Reporting%20Question',
    ctaDescription: "Whether you're setting up reporting from scratch or looking to improve what you have, I'm happy to share what works. No pitch, just practical guidance.",
  },

  'sec-exam-prep': {
    slug: 'sec-exam-prep',
    title: 'SEC Exam Preparation',
    pageTitle: 'SEC Exam Preparation Guide | FundOpsHQ',
    description: "Got an SEC examination notice? Need help preparing? Learn what to expect, how to organize your documents, and prepare for examiner interviews.",
    shortDescription: "Got an SEC examination notice? Learn what to expect and how to prepare for your fund examination.",
    icon: 'Shield',
    urgencyBadge: 'Regulatory',
    breadcrumbName: 'SEC Exam Preparation',
    articleHeadline: 'SEC Exam Preparation Guide for Private Fund Managers',
    articleDescription: 'Comprehensive guide to preparing for SEC examinations, including document organization, interview preparation, and understanding examination priorities.',
    contextParagraphs: [
      "Getting an SEC examination notice can be stressful, but with proper preparation, examinations are manageable. The key is understanding what examiners are looking for and being organized in your response.",
      "SEC examiners have limited time and want to see that you take compliance seriously. How you respond to document requests—promptly, completely, and organized—sets the tone for the entire examination.",
      "Understanding current SEC examination priorities helps you anticipate where examiners will focus. The Division of Examinations publishes annual priorities, and recent examinations have emphasized fees and expenses, off-channel communications, and cybersecurity."
    ],
    whatWeCanDiscuss: [
      'Understanding the examination process and timeline',
      'Organizing your document production',
      'Identifying potential areas of focus based on current SEC priorities',
      'Mock interviews and what to expect from examiner conversations',
      'Common deficiencies and how to address them proactively',
      'Post-exam follow-up and remediation planning',
    ],
    faqItems: [
      {
        question: 'What should I expect during an SEC examination?',
        answer: 'SEC examinations typically involve document production requests, on-site or remote interviews with key personnel, and a review of your compliance policies and procedures. The examination process can take several weeks to months, and examiners will focus on areas like fee and expense calculations, off-channel communications, and cybersecurity practices.',
      },
      {
        question: 'How do I prepare for an SEC fund examination?',
        answer: 'Preparation involves organizing your documentation, understanding current SEC examination priorities, preparing your team for examiner interviews, reviewing your compliance policies for gaps, and identifying potential areas of focus. Working with experienced professionals can help you prepare systematically.',
      },
      {
        question: 'What are common SEC examination deficiencies for private funds?',
        answer: 'Common deficiencies include inadequate compliance policies, fee and expense allocation issues, incomplete books and records, cybersecurity gaps, marketing and advertising violations, and off-channel communications. Addressing these proactively can help avoid enforcement actions.',
      },
      {
        question: 'How long does an SEC examination take?',
        answer: 'SEC examinations vary in length but typically take 2-6 months from the initial document request to the examination closing letter. The timeline depends on the scope of the examination, firm size, and how quickly you can respond to document requests.',
      },
    ],
    relatedLinks: [
      { label: 'Compliance Review', href: '/help/compliance-review' },
      { label: 'Regulatory Filings', href: '/help/regulatory-filings' },
      { label: 'PE Compliance Guide', href: '/funds/private-equity/compliance' },
    ],
    emailSubject: 'SEC%20Exam%20Question',
    ctaDescription: "Whether you've just received an examination notice or want to prepare proactively, I'm happy to share what works. No pitch, just practical guidance.",
  },

  'waterfall-calculations': {
    slug: 'waterfall-calculations',
    title: 'Waterfall & Distribution Calculations',
    pageTitle: 'Waterfall & Distribution Calculations Guide | FundOpsHQ',
    description: "Struggling with waterfall calculations? Learn about European vs. American waterfalls, catch-up mechanics, common calculation errors, and validation approaches.",
    shortDescription: "Understand waterfall structures, catch-up mechanics, and how to avoid common calculation errors.",
    icon: 'Calculator',
    urgencyBadge: 'Fund economics',
    breadcrumbName: 'Waterfall & Distribution Calculations',
    articleHeadline: 'Waterfall & Distribution Calculations Guide for Private Fund Managers',
    articleDescription: 'Comprehensive guide to understanding waterfall structures, catch-up mechanics, common calculation errors, and validation best practices.',
    contextParagraphs: [
      "Waterfall calculations are where fund economics meet reality. Getting them right is critical—errors can lead to investor disputes, audit findings, and reputational damage. Getting them wrong can be expensive.",
      "The challenge is that LPA waterfall language can be ambiguous, and small interpretation differences can result in materially different distributions. Before your first distribution, you need to be confident in your interpretation and have it validated.",
      "I've worked through waterfall structures across different fund types and seen the common areas where calculations go wrong. Happy to help you think through your specific structure and validation approach."
    ],
    whatWeCanDiscuss: [
      'Understanding your specific waterfall structure and LPA language',
      'European vs. American waterfall mechanics and implications',
      'Catch-up calculations and common points of confusion',
      'Handling side letter modifications to standard economics',
      'Building validation frameworks and test scenarios',
      'Preparing for distribution calculations and LP communications',
    ],
    faqItems: [
      {
        question: 'What is the difference between European and American waterfall structures?',
        answer: "European (whole-fund) waterfalls calculate carried interest on the entire fund—LPs must receive back all contributed capital plus preferred return across all investments before the GP earns carry. American (deal-by-deal) waterfalls calculate carry on each investment separately, allowing GPs to earn carry earlier but requiring clawback provisions if later investments underperform. European waterfalls are more LP-friendly; American waterfalls align GP incentives with early wins.",
      },
      {
        question: 'How does the GP catch-up work in a waterfall?',
        answer: "After LPs receive their preferred return, the GP catch-up allows the GP to receive distributions until they reach their carried interest percentage of profits. A 100% catch-up means the GP receives all distributions in this tier until caught up. An 80/20 catch-up splits distributions 80% GP / 20% LP. The catch-up ensures the GP reaches their target profit share (typically 20%) on cumulative profits, not just profits above the hurdle.",
      },
      {
        question: 'What are common waterfall calculation errors?',
        answer: 'Common errors include: miscalculating the preferred return accrual method (simple vs. compound, IRR vs. fixed rate), incorrect treatment of recycled capital, failing to account for management fee offsets, ignoring side letter modifications to waterfall economics, and errors in the catch-up tier calculation. Many issues stem from ambiguous LPA language that allows multiple interpretations.',
      },
      {
        question: 'How should I validate waterfall calculations?',
        answer: "Best practices include: building independent verification models, testing with extreme scenarios (early exits, total losses), having calculations reviewed by someone who didn't build the model, reconciling to audited capital accounts, and comparing results across multiple distribution scenarios. Document your LPA interpretation and get stakeholder sign-off before distributions.",
      },
    ],
    relatedLinks: [
      { label: 'Distribution Waterfall Tool', href: '/tools/distribution-waterfall' },
      { label: 'PE CFO Guide', href: '/funds/private-equity/cfo' },
      { label: 'Investor Reporting', href: '/help/investor-reporting' },
    ],
    emailSubject: 'Waterfall%20Calculation%20Question',
    ctaDescription: "Whether you're building a new waterfall model or validating an existing one, I'm happy to help you think through it. No pitch, just practical guidance.",
  },

  'regulatory-filings': {
    slug: 'regulatory-filings',
    title: 'Regulatory Filing Deadlines',
    pageTitle: 'Regulatory Filing Deadlines Guide | FundOpsHQ',
    description: "Managing regulatory filing deadlines? Learn about Form PF, Form ADV, state filings, beneficial ownership reports, and what happens if you miss a deadline.",
    shortDescription: "Stay on top of Form PF, Form ADV, and other critical regulatory deadlines.",
    icon: 'Clock',
    urgencyBadge: 'Compliance calendar',
    breadcrumbName: 'Regulatory Filing Deadlines',
    articleHeadline: 'Regulatory Filing Deadlines Guide for Private Fund Managers',
    articleDescription: 'Comprehensive guide to managing regulatory filing deadlines, including Form PF, Form ADV, state filings, and beneficial ownership requirements.',
    contextParagraphs: [
      "Regulatory filing deadlines are non-negotiable. Missing a deadline can trigger deficiency letters, examination focus, or worse. The challenge is that different filings have different deadlines, and requirements depend on your specific situation.",
      "Form ADV and Form PF get most of the attention, but state notice filings, beneficial ownership reports, and other requirements can catch managers off guard. Building a comprehensive filing calendar is essential.",
      "I've helped managers sort through their filing obligations and build calendars that ensure nothing falls through the cracks. Happy to help you understand what applies to your situation."
    ],
    whatWeCanDiscuss: [
      'Building a comprehensive filing calendar for your firm',
      'Understanding which filings apply to your situation',
      'Form PF requirements and recent changes',
      'State notice filing requirements and blue sky compliance',
      'Beneficial ownership reporting under the Corporate Transparency Act',
      "What to do if you've missed a deadline",
    ],
    faqItems: [
      {
        question: 'When is Form ADV due?',
        answer: 'Form ADV annual amendment is due within 90 days of your fiscal year-end. For calendar-year advisers, this means March 31st. You must also update Form ADV "promptly" (generally within 30 days) when material information changes. The brochure (Part 2A) must be offered to clients annually.',
      },
      {
        question: 'When is Form PF due for private fund advisers?',
        answer: 'Form PF deadlines depend on adviser size and fund type. Large private equity advisers (>$2 billion PE AUM): annual filing within 120 days of fiscal year-end. Large hedge fund advisers (>$1.5 billion HF AUM): quarterly filing within 60 days of quarter-end. Smaller private fund advisers: annual filing within 120 days. Current event reporting for certain large hedge funds is due within 72 hours.',
      },
      {
        question: 'What happens if I miss a regulatory filing deadline?',
        answer: 'Consequences vary by filing type. SEC filings: late Form ADV or Form PF can trigger deficiency letters, examination focus, and potential enforcement actions. State filings: late fees, registration suspension, or inability to operate in that state. Beneficial ownership: significant penalties under the Corporate Transparency Act. Always file late rather than not at all, and document the reason for the delay.',
      },
      {
        question: 'What regulatory filings do private fund managers need to track?',
        answer: 'Key filings include: Form ADV (Parts 1, 2A, 2B), Form PF (if applicable), state notice filings, Form D (for new offerings), beneficial ownership reports (FinCEN), Form 13F (if >$100M in 13F securities), Schedule 13D/G (5%+ ownership), and various tax filings (K-1s, PFIC statements). Requirements depend on adviser size, fund types, and investor base.',
      },
    ],
    relatedLinks: [
      { label: 'Compliance Review', href: '/help/compliance-review' },
      { label: 'SEC Exam Prep', href: '/help/sec-exam-prep' },
      { label: 'PE Compliance Guide', href: '/funds/private-equity/compliance' },
    ],
    emailSubject: 'Regulatory%20Filing%20Question',
    ctaDescription: "Whether you're building a filing calendar or have questions about specific requirements, I'm happy to help. No pitch, just practical guidance.",
  },
}

// Helper functions
export function getHelpTopic(slug: string): HelpTopic | undefined {
  return HELP_TOPICS[slug]
}

export function getAllHelpTopics(): HelpTopic[] {
  return Object.values(HELP_TOPICS)
}

export function getAllHelpTopicSlugs(): string[] {
  return Object.keys(HELP_TOPICS)
}
