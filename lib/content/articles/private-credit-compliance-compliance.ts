import { Article } from '../types'

const article: Article = {
  id: 'private-credit-compliance-compliance',
  title: 'Compliance for Private Credit Funds: Regulatory Framework and Best Practices',
  slug: 'compliance',
  subtitle: 'Navigating SEC registration, Form ADV/PF, credit-specific regulations, lending laws, and ERISA considerations',
  fundType: 'private-credit',
  pillar: 'compliance',
  content: `<p>Private credit funds operate within a complex regulatory framework demanding rigorous compliance protocols. With assets under management exceeding $1.5 trillion globally, regulatory scrutiny from the <a href="https://www.sec.gov" target="_blank" rel="noopener noreferrer">SEC</a> has intensified. Unlike bank lenders subject to OCC and Federal Reserve oversight, private credit managers navigate a hybrid environment combining investment adviser regulations, securities laws, and credit-specific lending requirements across federal and state jurisdictions.</p>

<p>Credit fund managers face compliance layers beyond traditional private equity: consumer lending laws (TILA, ECOA) for consumer-focused strategies, commercial lending regulations including state usury limitations and licensing, fair lending requirements, and debt collection laws. Understanding the Bankruptcy Code and creditor rights is essential for loan structuring and workout management.</p>

<h2>SEC Registration and the Investment Advisers Act</h2>

<h3>Registration Thresholds</h3>

<p>Investment advisers with at least $110 million in AUM generally register with the <a href="https://www.sec.gov" target="_blank" rel="noopener noreferrer">SEC</a>, while smaller advisers register with states. Private fund advisers managing less than $150 million in private fund assets in the United States may qualify as exempt reporting advisers under the private fund adviser exemption, though they still file abbreviated Form ADV. The venture capital exemption does not apply to lending strategies. The <a href="/tools/fund-launch-guide">Fund Launch Guide</a> outlines key registration milestones for new fund managers.</p>

<p>Registration triggers comprehensive obligations: written compliance policies and procedures, designation of a chief compliance officer, specified books and records per Rule 204-2, Form ADV disclosure, and SEC examination authority.</p>

<h3>Form ADV Disclosure</h3>

<p>Form ADV Part 1 collects operational information through IARD. Part 2 is the adviser's brochure delivered to clients. Key items for credit managers:</p>

<ul>
<li><strong>Item 4:</strong> Describe lending strategies—direct origination, whole loan purchases, secondary acquisitions—and target borrower profiles</li>
<li><strong>Item 5:</strong> Detail fee structures (typically 1.0-2.0% management fee, 15-20% carried interest). Use the <a href="/tools/management-fee-calculator">Management Fee Calculator</a> to model these structures.</li>
<li><strong>Item 8:</strong> Explain underwriting methodologies, credit analysis, and material risks including default, illiquidity, concentration, and bankruptcy risks</li>
<li><strong>Item 10:</strong> Disclose affiliations with originators, servicers, or placement agents</li>
</ul>

<p>Section 7.B collects fund-level information: name, AUM, strategy description, and beneficial ownership concentration. Annual amendments are due within 90 days of fiscal year end; material changes require interim updates.</p>

<h3>Chief Compliance Officer</h3>

<p>The CCO must understand SEC registration processes, Advisers Act fiduciary duties, marketing restrictions, Form PF requirements, and custody rules. Credit fund CCOs also need expertise in consumer protection statutes, state usury laws, bankruptcy, ERISA, and anti-money laundering.</p>

<p>The CCO should report to the CEO or board—not the CIO—for independence from investment activities. Regular board access enables compliance reports and support for resource investments.</p>

<h2>Form PF: Systemic Risk Reporting</h2>

<h3>Filing Requirements</h3>

<p>All private fund advisers with $150 million+ in private fund AUM file Form PF Section 1 annually (within 120 days of fiscal year end). Advisers with $1.5 billion+ in "hedge fund" AUM file Section 2 quarterly (within 15 calendar days of quarter end).</p>

<p>Form PF defines hedge funds broadly to include funds that charge performance fees on unrealized gains, may borrow more than de minimis amounts, sell short, or use derivatives beyond currency hedging. Most credit funds trigger this definition through leverage. However, closed-end funds structured like private equity may classify as PE funds rather than hedge funds, affecting reporting obligations.</p>

<h3>Section 1: Basic Information</h3>

<p>Section 1 requests fund-level information: identification, strategy classification (credit arbitrage, distressed, multi-strategy), gross/net asset values, investor contributions/withdrawals, borrowings, and investment exposures by asset class. The beneficial ownership question shows concentration of the five largest investors—typically high for institutional credit fund investor bases.</p>

<h3>Section 2: Large Credit Fund Advisers</h3>

<p>Section 2 applies to large hedge fund advisers ($1.5B+) and collects granular data for "qualifying hedge funds" with $500M+ NAV:</p>

<ul>
<li>Fund characteristics: NAV, investor concentration, liquidity terms, gates, side pockets</li>
<li>Portfolio composition: long/short exposures by asset class</li>
<li>Borrowing and financing: total borrowings, collateral pledged, counterparty exposures</li>
<li>Risk metrics: VaR calculations (though many credit funds don't calculate VaR given illiquid portfolios)</li>
</ul>

<p>Quarterly filing creates operational burden requiring systems to compile data from portfolio management, loan administration, and accounting systems.</p>

<h2>Credit-Specific Lending Regulations</h2>

<h3>Consumer Lending</h3>

<p>Funds focused on consumer lending face extensive federal requirements:</p>

<ul>
<li><strong>Truth in Lending Act (TILA):</strong> Standardized disclosure of APR, payment schedules, and total finance charges</li>
<li><strong>Equal Credit Opportunity Act (ECOA):</strong> Prohibits discrimination based on race, religion, sex, age, or public assistance status; requires adverse action notices</li>
<li><strong>Fair Credit Reporting Act (FCRA):</strong> Permissible purpose requirements for obtaining credit reports; adverse action and risk-based pricing notices</li>
<li><strong>Fair Debt Collection Practices Act (FDCPA):</strong> Applies to funds acquiring consumer loans (debt collectors)—prohibits harassment, false representations, and unfair practices</li>
</ul>

<p>Violations create private rights of action for statutory and actual damages, generating class action risk.</p>

<h3>Commercial Lending</h3>

<p>Commercial lending faces different terrain with fewer federal requirements but significant state considerations:</p>

<p><strong>Usury laws</strong> limit maximum interest rates, varying substantially by state and borrower type. Consequences of violation include forfeiture of interest or principal, rendering loans unenforceable. Multi-state lending requires jurisdiction-by-jurisdiction analysis.</p>

<p><strong>Licensing requirements</strong> vary by state. Consumer lending requires licensure in nearly all states. Commercial lending exemptions vary—some states exempt loans above threshold amounts or to business borrowers. Banks benefit from federal preemption; private credit funds do not.</p>

<p>Many funds address licensing through structural approaches: purchasing whole loans from licensed originators, partnering with licensed lenders who sell participation interests, or originating through licensed subsidiaries.</p>

<h2>Bankruptcy and Creditor Rights</h2>

<h3>The Automatic Stay</h3>

<p>Section 362 imposes an automatic stay upon bankruptcy filing, prohibiting all collection activities without court approval. The stay halts lawsuits, prevents new filings, stops foreclosures, and bars even informal collection contacts. Violations—even inadvertent—can result in damages, punitive awards, and attorneys' fees.</p>

<p>Credit fund managers must implement procedures to identify portfolio company filings promptly through monitoring services, then immediately cease collection activities.</p>

<p>Secured creditors may seek relief from stay under Section 362(d) for "cause" including lack of adequate protection, or when the debtor lacks equity in collateral not necessary for reorganization.</p>

<h3>Chapter 7 vs. Chapter 11</h3>

<p><strong>Chapter 7:</strong> Trustee liquidates assets and distributes proceeds by priority—secured creditors first (to collateral value), then administrative expenses, priority claims, general unsecured claims. Proceedings move relatively quickly over several months.</p>

<p><strong>Chapter 11:</strong> Debtor continues operating as "debtor-in-possession" while proposing a reorganization plan. Creditors vote by class; acceptance requires two-thirds in amount and majority in number of each impaired class. Courts may "cramdown" plans over dissenting classes if fair and equitable.</p>

<h3>Secured Creditor Protections</h3>

<p>Section 506 bifurcates claims based on collateral value. Claims are secured to collateral value; deficiencies become unsecured. Adequate protection requires debtors to protect secured creditors from collateral diminution during bankruptcy through cash payments, additional liens, or other means.</p>

<p>Secured creditors negotiate from positions of leverage, particularly when oversecured or when collateral is essential to operations. Plans must provide deferred payments totaling at least collateral value, lien retention, or the "indubitable equivalent."</p>

<h3>Avoidance Powers</h3>

<p><strong>Preferences (Section 547):</strong> Trustees may recover transfers within 90 days before filing (one year for insiders) that enabled creditors to receive more than in a Chapter 7 liquidation. Defenses include contemporaneous exchange, ordinary course payments, and subsequent new value.</p>

<p><strong>Fraudulent transfers (Section 548):</strong> Transfers within two years for less than reasonably equivalent value while insolvent may be avoided. State fraudulent transfer laws may extend lookback periods to six years.</p>

<p>Mitigation strategies: structure ordinary course payments, document contemporaneous exchanges, perfect liens at origination rather than later.</p>

<h2>ERISA Considerations</h2>

<h3>Plan Asset Issues</h3>

<p>ERISA Section 406 prohibits transactions between benefit plans and parties in interest, including loans and extensions of credit. The plan assets regulation determines when fund assets are deemed to include plan assets of investing benefit plans. <a href="https://ilpa.org" target="_blank" rel="noopener noreferrer">ILPA</a> provides guidance on structuring funds to accommodate institutional LP requirements.</p>

<p>If plan assets status applies: the manager becomes an ERISA fiduciary with duties of prudence and loyalty, fund investments become plan assets subject to prohibited transaction rules, and transactions with parties in interest may violate ERISA. Violations create personal liability, excise taxes, and unwinding of transactions.</p>

<h3>Avoiding Plan Asset Status</h3>

<p><strong>VCOC Exception:</strong> At least 50% of assets in venture capital investments (equity with management rights) in operating companies, with actual management participation. Some credit structures qualify through equity co-investments with governance rights, but passive lending typically cannot.</p>

<p><strong>REOC Exception:</strong> At least 50% in real estate with direct engagement in management or development. Real estate credit funds with active development involvement may qualify; passive mortgage lenders typically cannot.</p>

<p><strong>25% Threshold:</strong> Most common approach—limit benefit plan investors to less than 25% of each equity class. Partnership agreements should include provisions capping plan participation and granting authority to reject subscriptions exceeding the threshold.</p>

<h3>Prohibited Transaction Exemptions</h3>

<p>For funds subject to ERISA, exemptions provide relief: PTE 2006-16 permits certain loan transactions at arm's-length terms; the QPAM exemption covers transactions managed by qualified professional asset managers meeting specified thresholds. Work closely with ERISA counsel to ensure compliance with exemption conditions.</p>

<h2>Anti-Money Laundering Compliance</h2>

<p>FinCEN rules require <a href="https://www.sec.gov" target="_blank" rel="noopener noreferrer">SEC</a>-registered advisers to establish AML programs reasonably designed to prevent money laundering and terrorist financing. Programs must include policies and controls, a designated compliance officer, employee training, and independent testing.</p>

<p>Customer due diligence focuses on identifying fund investors and borrowers: collect beneficial ownership information (25%+ owners and control persons), screen against OFAC's SDN list, assess risk profiles, and conduct enhanced due diligence for higher-risk customers including politically exposed persons.</p>

<p>OFAC compliance extends to all U.S. persons. Screen investors, borrowers, counterparties, and service providers before establishing relationships and periodically thereafter. True matches require blocking assets and reporting to OFAC.</p>

<h2>Marketing and Advertising</h2>

<h3>The Marketing Rule</h3>

<p>The 2020 Marketing Rule defines "advertisement" broadly: any communication to more than one person offering advisory services. This encompasses websites, social media, presentations, pitch books, and distributed materials.</p>

<p>Core prohibitions: no untrue statements of material fact, no materially misleading presentations, no unsubstantiated claims, no burying material information in footnotes. Evaluate whether reasonable investors would be misled.</p>

<h3>Performance Advertising</h3>

<p>Key requirements:</p>
<ul>
<li>Present both gross and net performance (after fees and expenses). The <a href="/tools/distribution-waterfall">Distribution Waterfall Visualizer</a> can help model gross vs. net outcomes.</li>
<li>Disclose calculation methodology (time-weighted vs. IRR)</li>
<li>Show multiple periods (1-year, 3-year, 5-year, since inception)</li>
<li>Include all portfolios with substantially similar strategies—no cherry-picking</li>
<li>Disclose material assumptions: leverage impact, reinvestment assumptions, layered fees</li>
</ul>

<p>Extracted performance highlighting subsets of a portfolio faces heightened requirements and is often avoided. Predecessor and related performance require disclosure of material differences.</p>

<h3>Testimonials and Endorsements</h3>

<p>Permitted with disclosures: whether from a current client, whether compensated, and material conflicts. Advisers need reasonable basis to believe testimonials aren't misleading considering representativeness of typical experiences.</p>

<p>Third-party ratings may be included only if the adviser reasonably believes the methodology treats all advisers equally without paid placement.</p>

<h2>Books and Records</h2>

<h3>Core Requirements</h3>

<p>Rule 204-2 requires:</p>
<ul>
<li><strong>Client/fund records:</strong> LPA, offering docs, subscription documents, investor lists, capital information, investor correspondence</li>
<li><strong>Transaction records:</strong> All loan originations, purchases, sales, restructurings with dates, counterparties, amounts, terms, pricing</li>
<li><strong>Financial records:</strong> Bank statements, invoices, wire confirmations, fee calculations, expense allocations</li>
<li><strong>Communications:</strong> All business emails, messages, texts—requires capture systems across channels</li>
</ul>

<h3>Credit-Specific Documentation</h3>

<p>Loan files must include: credit agreements, notes, security documents, guarantees, intercreditor agreements, amendments, waivers. Underwriting documentation: financial analysis, credit memos, committee presentations, due diligence materials. Monitoring records: financial statement deliveries, covenant testing, portfolio analyses.</p>

<p>Default and workout files: notices, borrower communications, forbearance agreements, restructuring documentation. Well-organized files support SEC examinations, valuations, and defense of credit decisions.</p>

<h3>Retention and Storage</h3>

<p>Most records require five-year retention from fiscal year end; first two years must be "easily accessible." Communications require five years from date sent/received. Entity documents require retention for entity life plus specified periods.</p>

<p>Electronic storage is permitted under Rule 204-2(g) with conditions: appropriate security, non-rewriteable format, quality verification, audit trails, and tested backup/recovery capabilities.</p>

<h2>Compliance Program Requirements</h2>

<h3>Core Elements</h3>

<p>Rule 206(4)-7 requires written policies reasonably designed to prevent Advisers Act violations. Credit-specific policies should address:</p>

<ul>
<li><strong>Portfolio management:</strong> Credit underwriting standards—minimum financial metrics, maximum leverage, collateral coverage, concentration limits, committee approval thresholds</li>
<li><strong>Conflict of interest:</strong> Opportunity allocation among funds, co-investment, financing with affiliated portfolio companies, service provider relationships</li>
<li><strong>Valuation:</strong> Methodologies by credit type, hierarchy preferring market quotations, third-party specialist oversight, valuation committee governance</li>
<li><strong>Marketing:</strong> Performance calculation, gross/net presentation, substantially similar portfolio inclusion, approval procedures</li>
<li><strong>Other areas:</strong> Books and records, privacy, business continuity, personal trading, gifts and entertainment, custody</li>
</ul>

<h3>Annual Review</h3>

<p>The CCO must conduct annual reviews assessing program adequacy and effectiveness, with written reports to senior management. Reviews should:</p>

<ul>
<li>Evaluate whether policies remain appropriate for current activities</li>
<li>Test controls through sampling (credit approvals, loan files, fee calculations, marketing materials)</li>
<li>Interview personnel about understanding and application</li>
<li>Identify issues or violations with root cause analysis</li>
<li>Recommend policy updates addressing weaknesses or regulatory developments</li>
<li>Assess resource adequacy</li>
</ul>

<p>Present reports to advisory boards or directors; document board consideration of recommendations.</p>

<h3>Program Evolution</h3>

<p>Monitor SEC examination priorities, risk alerts, and enforcement actions. Update policies for new strategies, geographic expansion, or service provider changes. Industry developments and peer practices inform improvements, but tailor policies to specific business characteristics rather than adopting generic templates.</p>

<h2>Key Takeaways</h2>

<ul>
<li><strong><a href="https://www.sec.gov" target="_blank" rel="noopener noreferrer">SEC</a> registration triggers credit-specific obligations:</strong> Beyond traditional adviser requirements, credit managers must address lending law compliance, bankruptcy considerations, and loan documentation standards. The <a href="/tools/fund-launch-guide">Fund Launch Guide</a> covers registration milestones.</li>

<li><strong>Form ADV must describe credit strategies and risks:</strong> Clearly explain lending approaches, underwriting standards, borrower profiles, and material risks distinguishing credit from equity strategies.</li>

<li><strong>Form PF requires robust data infrastructure:</strong> Large advisers ($1.5B+) file quarterly with granular position-level data requiring dedicated reporting systems.</li>

<li><strong>Lending laws create multi-jurisdictional complexity:</strong> Federal consumer protection, state usury laws, and licensing requirements often drive structural solutions like originator partnerships.</li>

<li><strong>Bankruptcy knowledge is essential:</strong> Understanding the automatic stay, reorganization dynamics, secured creditor protections, and avoidance powers enables protective loan structuring and effective workout management.</li>

<li><strong>ERISA considerations affect fundraising:</strong> Most funds limit plan investors below 25% or structure for VCOC qualification to avoid plan asset status and prohibited transaction restrictions. Consult <a href="https://ilpa.org" target="_blank" rel="noopener noreferrer">ILPA</a> resources for LP structuring best practices.</li>

<li><strong>Marketing Rule requires balanced performance:</strong> Present gross and net, include all substantially similar portfolios, disclose methodologies, and obtain compliance review before dissemination.</li>

<li><strong>Meticulous loan file documentation is essential:</strong> Comprehensive files support SEC examinations, valuations, and defense of credit decisions.</li>

<li><strong>Compliance programs need credit-specific policies:</strong> Underwriting standards, loan approvals, conflict management, valuation methodologies, and default procedures require tailoring beyond generic templates.</li>

<li><strong>CCOs need dual expertise:</strong> Both Advisers Act requirements and lending-specific considerations including consumer protection, bankruptcy, and ERISA.</li>

<li><strong>Annual reviews must test actual practices:</strong> Sample transactions, examine files, test calculations, interview personnel—document findings in written reports.</li>

<li><strong>Continuous adaptation is required:</strong> Monitor SEC priorities and enforcement, update policies proactively as strategies and regulations evolve.</li>
</ul>`,
  metaTitle: 'Compliance for Private Credit Funds: SEC Registration & Regulations',
  metaDescription: 'Guide to private credit fund compliance including SEC registration, Form ADV/PF, credit-specific lending regulations, ERISA considerations, and compliance program best practices.',
  publishedDate: 'November 7, 2025',
  lastUpdatedDate: 'January 6, 2025',
  readingTime: 12,
}

export default article
