import { Article } from '../types'

const article: Article = {
  id: 'venture-capital-compliance-compliance',
  title: 'Compliance for Venture Capital Funds: Navigating the VC Adviser Exemption and Regulatory Framework',
  slug: 'compliance',
  subtitle: 'Understanding VC fund adviser exemption requirements, Form ADV/PF obligations, investment restrictions, QSBS considerations, pay-to-play rules, and NVCA model documents',
  fundType: 'venture-capital',
  pillar: 'compliance',
  content: `<p>Venture capital fund managers occupy a unique position in the investment adviser regulatory landscape. While Dodd-Frank eliminated the private adviser exemption that most fund managers previously relied upon, Congress created a new exemption specifically for venture capital fund advisers. This exemption recognizes the distinctive characteristics of VC investing and the lower systemic risk profile compared to hedge funds, allowing qualifying advisers to avoid <a href="https://www.sec.gov" target="_blank" rel="noopener noreferrer">SEC</a> registration regardless of assets under management.</p>

<p>The exemption provides substantial regulatory relief, but qualifying requires careful attention to the statutory definition of a venture capital fund. Advisers must ensure funds limit investments to qualifying portfolio companies, avoid leverage beyond short-term amounts, refrain from offering redemption rights, and conduct business consistently with the VC model. Even exempt advisers face certain obligations including Form ADV Part 1A reporting, books and records maintenance, and potential SEC examination.</p>

<h2>The Venture Capital Fund Adviser Exemption</h2>

<p>Section 203(l) of the Investment Advisers Act exempts from registration any adviser that solely advises venture capital funds. This exemption applies regardless of assets under management. An adviser managing even one fund that fails to qualify loses the exemption entirely and must register if regulatory AUM exceeds $150 million. This "all or nothing" standard requires careful structuring for advisers managing multiple vehicles.</p>

<h3>Defining a Venture Capital Fund</h3>

<p>Rule 203(l)-1 establishes the regulatory definition. To qualify, a private fund must represent itself as pursuing a venture capital strategy, hold no more than 20 percent of capital in non-qualifying investments, not incur leverage exceeding 15 percent of capital for longer than 120 days, and not offer investor redemption rights except in extraordinary circumstances.</p>

<p>Qualifying investments include equity securities of qualifying portfolio companies directly acquired by the fund, and short-term holdings pending deployment. A qualifying portfolio company must be directly or indirectly controlled by the fund at investment time, must not be reporting or foreign traded, and must not borrow or issue debt in connection with the fund's equity investment.</p>

<p>The control requirement means the fund owns more than 50 percent of voting securities, or has the right to nominate at least 50 percent of the board. For minority positions, control can still be established through board control. The prohibition on portfolio company leverage distinguishes VC from leveraged buyouts. The non-reporting, non-foreign traded requirement ensures focus on private, illiquid companies.</p>

<h3>The 20 Percent Basket</h3>

<p>Rule 203(l)-1 permits up to 20 percent of committed capital in non-qualifying investments, providing flexibility for investments where the fund lacks control, holdings of public securities after IPOs, or cash management vehicles. The limitation is measured using committed capital rather than NAV, creating predictability. Funds must implement tracking systems to monitor the percentage, as breaching 20 percent causes loss of qualification.</p>

<h3>Leverage and Redemption Limitations</h3>

<p>VC funds may not incur leverage exceeding 15 percent of committed capital for more than 120 calendar days. This provides flexibility for bridge financing while preventing leverage as a permanent funding strategy. Short-term cash management borrowings receive special treatment—not subject to the 15 percent limitation if used solely for cash management and repaid within 60 days. The <a href="/tools/subscription-credit-line">Subscription Credit Line Calculator</a> helps model facility utilization against these regulatory thresholds.</p>

<p>Funds may not offer redemption rights except in extraordinary circumstances such as regulatory compliance, SEC or CFTC requests, ERISA benefit plan investor exceptions, or transfers upon death, divorce, or incapacity. Most VC fund agreements do not provide redemption rights but include provisions for permitted transfers among affiliated entities or family members.</p>

<h3>Holding Out as Pursuing VC Strategy</h3>

<p>Funds must represent themselves as pursuing a venture capital strategy through marketing materials, organizational documents, and investor communications. Funds marketing as growth equity, expansion capital, or late-stage investors may not qualify even if investments technically meet requirements. The SEC has indicated that funds pursuing growth equity strategies should analyze carefully whether they genuinely represent themselves as pursuing VC strategies.</p>

<h2>Obligations of Exempt VC Advisers</h2>

<h3>Form ADV Part 1A Limited Reporting</h3>

<p>Exempt advisers must file portions of Form ADV Part 1A electronically through IARD including basic identifying information, business information, ownership structure, and disciplinary history. Specifically, exempt advisers complete Items 1, 2A, 2B, 3, 6, 7, and 10. Schedule R specifies the exemption claimed and provides basic information about assets. Filing must be updated annually within 90 days of fiscal year end.</p>

<h3>Books and Records Requirements</h3>

<p>Exempt advisers must maintain records under Rule 204-1 including journals recording cash transactions, general ledgers, memoranda of investment decisions, discretionary account lists, powers of attorney, written communications to ten or more persons, organizational documents, and client/investor files. Records must be maintained for five years, with the first two years in an easily accessible place.</p>

<h3>SEC Examination Authority</h3>

<p>The SEC retains examination authority over exempt advisers. Examinations typically focus on verifying continued exemption eligibility, reviewing fund investments to confirm qualifying investment compliance, analyzing leverage, examining organizational documents for absence of redemption rights, and assessing whether funds hold themselves out as pursuing VC strategies. Examinations may also address anti-fraud provisions, Form ADV reporting, books and records, and representations made in offering documents.</p>

<h2>Form ADV for Registered VC Advisers</h2>

<p>Advisers that do not qualify for or choose not to rely on the exemption must register with the SEC if regulatory AUM reaches $150 million. Registration requires comprehensive Form ADV disclosures.</p>

<h3>Form ADV Part 1</h3>

<p>Part 1 collects regulatory information across multiple items. Item 5 requests client types and AUM. Item 7 requires detailed reporting about each private fund advised including identification information, fund type classification, strategy information, and beneficial ownership. Schedule D provides detailed disclosures about each fund including legal name, organizational form, advisory fees, and whether performance-based fees are charged.</p>

<h3>Form ADV Part 2</h3>

<p>Part 2 serves as the disclosure brochure. Item 4 describes the adviser's business including VC focus, typical strategies, target company stages, and sector specializations. Item 5 addresses fees and compensation—management fees commonly 1.5-2.5% of committed capital during the investment period, transitioning to invested capital after. Carried interest typically provides the GP with 20-30% of profits after returning capital and preferred returns. Fund managers can model these structures using the <a href="/tools/management-fee-calculator">Management Fee Calculator</a> and <a href="/tools/distribution-waterfall">Distribution Waterfall Visualizer</a>.</p>

<p>Items 10-12 address conflicts of interest including allocation of opportunities among funds, co-investment rights, investments by adviser personnel in portfolio companies, and service provider relationships. Item 11 addresses code of ethics and personal trading requirements.</p>

<h2>Form PF for Venture Capital Advisers</h2>

<p>Form PF applies to registered advisers with at least $150 million in private fund assets. Exempt VC advisers never file Form PF regardless of assets. When registered VC advisers exceed the threshold, they file annually within 120 days after fiscal year end, completing Section 1 with basic information about the adviser and each private fund.</p>

<p>Section 1 requests total private fund assets by fund type, fund structure, strategy classification, related person information, beneficial ownership concentration, gross and net asset value, investor flows, portfolio investment concentration, and borrowing information. Many advisers coordinate Form PF data collection with annual audit processes.</p>

<h2>Investment Advisers Act Compliance for Registered Advisers</h2>

<h3>Written Compliance Program and CCO</h3>

<p>Rule 206(4)-7 requires registered advisers to adopt written compliance policies reasonably designed to prevent Advisers Act violations and designate a chief compliance officer. For VC advisers, the compliance program should address investment allocation among funds, portfolio company valuation, performance calculations and marketing, management fee calculations, conflicts of interest, personal securities transactions, and insider trading policies.</p>

<p>Investment allocation policies assume particular importance for multi-fund managers. When an adviser manages multiple funds with overlapping mandates, the program must establish clear criteria for allocating opportunities. Valuation policies must address methodologies for private company investments, frequency, governance processes, and use of third-party specialists.</p>

<h3>Annual Compliance Review</h3>

<p>Rule 206(4)-7 requires annual reviews assessing policy adequacy and implementation effectiveness. The CCO must prepare a written report documenting the review, summarizing findings and deficiencies, describing remedial actions, and providing recommendations for improvements.</p>

<h2>Custody Rule Compliance</h2>

<p>Rule 206(4)-2 addresses safeguarding client assets. VC advisers typically have custody due to authority to direct transactions, authorize capital calls and distributions, and serve as GP. For pooled investment vehicles, the primary requirement is distribution of audited financial statements within 120 days of fiscal year end. Qualified custodian requirements also apply, with fund assets maintained with banks, registered broker-dealers, or certain foreign financial institutions.</p>

<h2>Marketing Rule and Performance Advertising</h2>

<p>The Marketing Rule establishes principles-based requirements for adviser marketing. Core prohibitions make it unlawful to disseminate advertisements containing untrue material facts or that are otherwise false or misleading. Specific prohibitions restrict testimonials and endorsements without required disclosures, performance results without meeting specified standards, and hypothetical performance without specified conditions.</p>

<h3>Performance Advertising Standards</h3>

<p>Performance advertising must include both gross and net performance with equal prominence. Net performance must reflect deduction of management fees, carried interest, and all other fees and expenses. The portfolio inclusion standard requires including all portfolios with substantially similar strategies, preventing cherry-picking of best-performing funds.</p>

<p>VC performance metrics typically include IRR, MOIC, DPI, RVPI, and TVPI. When presenting IRR, advisers must clearly disclose calculation methodology. Predecessor performance from investments at prior firms may be used if the advertisement clearly identifies and explains the predecessor nature and substantially all investment decision-makers are employed by the new adviser.</p>

<p>The Marketing Rule imposes extensive recordkeeping requirements. Advisers must maintain copies of all advertisements, records documenting dates of first and last use, and for performance results, all underlying data and supporting information for five years after last use.</p>

<h2>Political Contributions and Pay-to-Play Rules</h2>

<p>Rule 206(4)-5 prohibits advisers from providing advisory services for compensation to government entities within two years after the adviser or covered associates make political contributions to certain officials. The rule applies to VC advisers seeking investments from public pension plans.</p>

<p>Covered associates include general partners, managing members, executive officers, employees who solicit government entities, and supervised persons with authority to recommend solicitation. The two-year time-out applies to contributions to officials who can influence adviser selection including governors, state legislators with plan oversight, treasurers or comptrollers serving as trustees, and pension plan investment committee members.</p>

<p>De minimis exceptions permit contributions up to $350 per election to officials the associate is entitled to vote for, and $150 per election to officials they cannot vote for. VC firms typically implement pre-clearance requirements, contribution tracking systems, regular training, and due diligence for identifying government entity officials.</p>

<h2>Investment Restrictions and QSBS Considerations</h2>

<h3>Qualified Small Business Stock Exclusion</h3>

<p><a href="https://www.irs.gov" target="_blank" rel="noopener noreferrer">Section 1202 of the IRC</a> allows non-corporate taxpayers to exclude from gross income a portion of gain from sale of QSBS held more than five years. For stock acquired after September 27, 2010, the exclusion is 100 percent of gain up to the greater of $10 million or ten times adjusted basis.</p>

<p>To qualify, stock must be acquired at original issuance from a qualified small business in exchange for money, property, or services. The issuing corporation must be a C corporation with aggregate gross assets not exceeding $50 million, using at least 80 percent of assets in active conduct of qualified trades or businesses. Most VC funds are structured as partnerships specifically to preserve QSBS benefits for investors.</p>

<p>The $50 million gross assets test measures assets before and immediately after each issuance. If assets exceed $50 million immediately before issuance, newly issued stock does not qualify. This creates a cliff effect where crossing the threshold permanently disqualifies all stock in that and subsequent rounds.</p>

<h3>Investment Restrictions in Fund Documents</h3>

<p>LPAs typically include investment restrictions including stage limitations, geographic limitations, sector limitations, position size limits, and follow-on investment provisions. Public securities restrictions typically prohibit investing in publicly traded stocks while allowing holding of portfolio company securities after IPOs. Concentration limits prevent overconcentration in individual investments, geographies, or sectors.</p>

<h2>NVCA Model Documents</h2>

<p>The <a href="https://nvca.org" target="_blank" rel="noopener noreferrer">National Venture Capital Association (NVCA)</a> publishes model legal documents widely used in VC financings including term sheets, stock purchase agreements, certificates of incorporation, voting agreements, and investor rights agreements.</p>

<p>The model term sheet addresses economic terms (valuation, liquidation preferences), governance terms (board composition, protective provisions), and exit-related terms (drag-along provisions, registration rights). Most financings use 1x non-participating preferences. Protective provisions grant preferred stockholders consent rights over major corporate actions.</p>

<p>The model stock purchase agreement documents purchase and sale of preferred stock including representations, conditions to closing, and covenants. The model certificate of incorporation establishes rights, preferences, and privileges of preferred stock. The voting agreement addresses board composition, drag-along rights, and transfer restrictions. The investor rights agreement addresses information rights, registration rights, and management rights letters for ERISA compliance.</p>

<h2>Key Takeaways</h2>

<ul>
<li><strong>The VC fund adviser exemption provides significant regulatory relief:</strong> Advisers solely advising VC funds avoid <a href="https://www.sec.gov" target="_blank" rel="noopener noreferrer">SEC</a> registration regardless of AUM, but must ensure all funds meet the regulatory definition through qualifying investments, limited leverage, no redemption rights, and holding out as pursuing VC strategies. The <a href="/tools/fund-launch-guide">Fund Launch Guide</a> helps emerging managers navigate these requirements.</li>

<li><strong>Qualifying investment requirements demand careful structuring:</strong> At least 80 percent of capital must be invested in equity of controlled, non-public portfolio companies that don't incur leverage in connection with the investment. The 20 percent basket requires monitoring to avoid breaches.</li>

<li><strong>Exempt VC advisers face limited but important obligations:</strong> Filing portions of Form ADV Part 1A, maintaining required books and records, and submitting to SEC examination ensure regulatory visibility while avoiding full registration burdens.</li>

<li><strong>Registered VC advisers comply with comprehensive Advisers Act requirements:</strong> Form ADV Parts 1 and 2 disclosure, Form PF reporting if assets exceed thresholds, written compliance programs, CCO designation, custody rule compliance, and marketing rule adherence.</li>

<li><strong>Marketing and performance advertising require detailed attention:</strong> The Marketing Rule requires gross and net returns, portfolio inclusion standards, and extensive recordkeeping for pitch books, websites, and other marketing materials.</li>

<li><strong>Pay-to-play rules demand proactive compliance programs:</strong> Political contributions trigger two-year bans on providing services to government entities, requiring pre-clearance systems, tracking databases, and regular training.</li>

<li><strong>QSBS treatment provides powerful tax benefits when preserved:</strong> Section 1202 exclusion requires partnership fund structures, original issuance acquisitions, five-year holding periods, and portfolio companies meeting $50 million asset tests and active business requirements.</li>

<li><strong>NVCA model documents establish industry standards:</strong> <a href="https://nvca.org" target="_blank" rel="noopener noreferrer">NVCA</a> model term sheets, stock purchase agreements, charters, voting agreements, and investor rights agreements reduce transaction costs while allowing customization. <a href="https://ilpa.org" target="_blank" rel="noopener noreferrer">ILPA</a> provides complementary LP-focused guidelines for fund governance.</li>
</ul>`,
  metaTitle: 'VC Fund Compliance: Adviser Exemption, Form ADV/PF & QSBS Guide',
  metaDescription: 'Comprehensive compliance guide for venture capital funds covering VC adviser exemption requirements, Form ADV/PF obligations, investment restrictions, QSBS structuring, pay-to-play rules, and NVCA standards.',
  publishedDate: 'November 18, 2025',
  lastUpdatedDate: 'January 6, 2025',
  readingTime: 12,
}

export default article
