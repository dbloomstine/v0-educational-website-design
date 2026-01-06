import { Article } from '../types'

const article: Article = {
  id: 'secondaries-audit-financial-audits',
  title: 'Financial Audits for Secondaries Funds: LP Interest Valuation Testing, Purchase Accounting Verification, Multi-Fund Confirmation Procedures, Section 743(b) Adjustment Validation, and Coordination Across 20-100+ Underlying Fund Administrators',
  slug: 'financial-audits',
  subtitle: 'Comprehensive guide to secondaries fund audits including LP interest fair value determination relying on underlying fund NAV reports, purchase price allocation and basis tracking verification, confirmation procedures obtaining independent verification from numerous underlying fund administrators, Section 743(b) basis adjustment calculations and ongoing amortization testing, performance calculation testing from acquisition dates, and internal controls over multi-fund portfolio tracking systems',
  fundType: 'secondaries',
  pillar: 'audit',
  content: `<p>Secondaries fund audits present greater complexity than traditional PE/VC audits due to multi-layered structures where the fund owns LP interests in underlying funds holding 10-30+ portfolio companies each, creating 20-100+ positions requiring valuation testing, capital account reconciliation, and confirmation across numerous administrators with varying reporting quality and responsiveness. Auditors must rely substantially on underlying fund audited financial statements and NAV reports, requiring careful evaluation of whether that reliance is appropriate given underlying fund auditor reputation, audit scope, and any identified issues. The <a href="https://www.aicpa.org" target="_blank" rel="noopener noreferrer">AICPA</a> provides authoritative guidance on auditor reliance, while <a href="https://fasb.org" target="_blank" rel="noopener noreferrer">FASB</a> standards govern fair value measurement and disclosure requirements.</p>

<p>Purchase accounting adds complexity: secondaries acquisitions require allocating purchase prices to underlying portfolio companies at acquisition dates, calculating Section 743(b) basis adjustments creating personalized basis step-ups or step-downs, and tracking these adjustments over 5-10+ years as companies are sold. Unlike direct investments with straightforward cost basis, secondaries basis tracking involves purchase price allocated across dozens of companies, adjusted for Section 743(b), maintained separately from underlying fund book basis, and coordinated with tax advisors to reconcile financial statement basis with tax basis for K-1 reporting.</p>

<h2>Secondaries Fund Audit Framework</h2>

<h3>Reliance on Underlying Fund Financial Statements</h3>

<p>Secondaries valuations depend on underlying fund NAV reports aggregating portfolio company valuations. When a secondaries fund owns a 10% LP interest in Fund X valued at $50 million, that reflects 10% of Fund X's $500 million NAV, which reflects Fund X's valuation of its 20 portfolio companies. The auditor must assess whether Fund X's NAV is reasonable without examining underlying portfolio companies directly, instead relying on Fund X's audited financial statements.</p>

<p>AU-C Section 500 and AU-C Section 600 govern using other auditors' work. The secondaries fund's auditor evaluates reliance appropriateness by assessing underlying fund auditor reputation (Big Four or reputable regional firm versus unknown firm), audit quality indicators (unqualified opinions, clean financials, timely delivery), component materiality (whether positions are individually material), and any issues (going concern warnings, restatements, material weaknesses).</p>

<p>For institutional secondaries funds in high-quality underlying funds audited by reputable firms, auditors generally rely on underlying audits without substantive procedures on every portfolio company. For material positions (>10% of NAV) or funds with audit quality concerns, auditors perform additional procedures: reviewing underlying financials in detail, examining portfolio company valuations, speaking with underlying fund CFOs or auditors, and testing sample valuations for reasonableness.</p>

<h3>Multi-Fund Portfolio Complexity</h3>

<p>Typical secondaries funds hold 15-50 underlying positions, each with 10-30 portfolio companies, creating 150-1,500 total companies requiring audit consideration. The volume creates complexity in confirmations (15-50 administrators), capital account reconciliations, and valuation testing. Audit efficiency requires systematic processes: confirmation templates and tracking systems, capital account reconciliation schedules, and risk-based sampling concentrating detailed testing on material positions.</p>

<h3>Purchase Accounting and Basis Tracking</h3>

<p>Secondaries acquisitions require determining fair value of LP interests at acquisition date, allocating purchase price to underlying companies based on relative fair values, recording basis differentials between purchase price and underlying fund book basis, and tracking differences as companies exit. This coordinates with Section 743(b) basis adjustments, ongoing amortization, and reconciliation between GAAP and tax basis.</p>

<h2>LP Interest Valuation Testing</h2>

<p>LP interest valuations comprise substantially all secondaries fund assets and directly determine NAV and investor capital accounts, making this the most significant audit area.</p>

<h3>Valuation Methodology and Fair Value Hierarchy</h3>

<p>Under ASC 820, LP interest valuations must reflect exit prices in orderly transactions as defined by <a href="https://fasb.org" target="_blank" rel="noopener noreferrer">FASB</a> fair value measurement standards. Proportionate NAV is the most common methodology: a 10% LP interest in a fund with $500M NAV is valued at $50M absent adjustment factors. Use the <a href="/tools/distribution-waterfall">Distribution Waterfall Visualizer</a> to understand how NAV calculations flow through to LP economics.</p>

<p>Discounts or premiums may apply based on market evidence, liquidity, or position-specific factors. Illiquid positions in funds nearing end-of-life with concentrated portfolios warrant 5-15% discounts. High-performing funds with near-term liquidity events may command premiums. Recent secondary transactions provide Level 2 fair value inputs under ASC 820, while proportionate NAV alone represents Level 3 (unobservable inputs).</p>

<p>Auditors test valuations by obtaining underlying fund financials, verifying proportionate NAV calculations, assessing discount/premium reasonableness through market transaction evidence and comparison to prior valuations, and evaluating Level 3 assumptions through management's fair value memos and third-party valuation reports.</p>

<h3>Review of Underlying Fund Financial Statements</h3>

<p>Auditors review underlying fund audited annual statements and unaudited quarterly reports, examining: audit opinions (unqualified, no going concern), statement dates (6-12 months recent, not 18-24 months stale), NAV and capital accounts, and portfolio composition including concentrations.</p>

<p>For material positions, deeper analysis includes: portfolio company valuation methodologies, recent exits versus carrying values indicating accuracy or conservatism, and unrealized value concentration creating exit risk.</p>

<h3>Market Transaction Evidence</h3>

<p>Recent secondary transactions provide strong valuation evidence. If the secondaries fund purchased Fund X at 90% of NAV six months ago and NAV increased 10% with no adverse developments, valuing at 99% of current NAV is reasonable. If recent arm's-length sales occurred at 80% of NAV, the 90% valuation may be aggressive.</p>

<p>Auditors obtain market data from pricing services (Greenhill Cogent, Setter Capital), recent transactions, and broker quotes. Data is evaluated for comparability (strategy, vintage, performance), recency (12+ months may be stale), and circumstances (distressed versus orderly). Valuations above market evidence without justification raise audit issues.</p>

<h3>Changes in Valuation from Prior Periods</h3>

<p>Auditors decompose valuation changes into: underlying fund NAV changes, discount/premium changes, and capital activity. Expected changes consistent with performance require less scrutiny. Unexpected changes—positions marked up despite poor performance, or new discounts without justification—require detailed explanations.</p>

<h3>Valuation Committee Review</h3>

<p>Auditors review valuation committee materials: meeting minutes, valuation memos, independent valuation reports, and challenger analysis. Strong governance with active committee challenge enhances audit comfort and reduces substantive testing.</p>

<h2>Purchase Accounting Review</h2>

<p>When secondaries funds acquire LP interests, purchase accounting requires proper recording of acquisition costs and allocation to underlying assets, creating audit procedures unique to secondaries transactions.</p>

<h3>Purchase Price Determination and Allocation</h3>

<p>The total cost of acquiring an LP interest includes cash paid to the seller, transaction costs directly attributable to the acquisition (legal fees, diligence costs), and any contingent consideration or deferred payments. Auditors verify total purchase price by reviewing purchase agreements confirming price terms, closing statements showing actual cash paid, and transaction cost invoices and payment records. The purchase price is then allocated to the underlying fund's portfolio companies based on their relative fair values at acquisition.</p>

<p>For example, if the secondaries fund pays $90M for a 10% LP interest in a fund with $1B NAV (purchasing at 90% of NAV), and the underlying fund holds 20 portfolio companies with values ranging from $10M to $100M, the $90M purchase price is allocated pro-rata based on each company's percentage of total NAV. A company representing 10% of the underlying fund's NAV receives 10% of the purchase price allocation ($9M). Auditors test allocation methodology reviewing allocation schedules and supporting calculations, verifying that underlying portfolio company fair values used in allocation are from acquisition date (not current values), and testing mathematical accuracy of pro-rata calculations.</p>

<h3>Basis Step-Up or Step-Down Recognition</h3>

<p>The difference between purchase price and the secondaries fund's share of underlying fund book basis creates a basis step-up (if purchase price exceeds proportionate book basis) or step-down (if purchase price is less than proportionate book basis). If the underlying fund's book basis in its portfolio is $800M and the secondaries fund's 10% share equals $80M book basis, but the secondaries fund paid $90M, there's a $10M step-up that must be allocated to portfolio companies and amortized or realized as companies are sold.</p>

<p>Auditors test basis step-up/step-down calculations by obtaining underlying fund book basis information from acquisition date, calculating the secondaries fund's proportionate share, computing the difference between purchase price and proportionate basis, and verifying allocation of step-up/step-down to specific portfolio companies using fair value-based allocation consistent with purchase price allocation methodology. Ongoing tracking of basis step-up/step-down requires systems showing initial step-up amount allocated to each company, cumulative amortization or realization as companies are sold, and remaining unamortized basis requiring future realization.</p>

<h3>Subsequent Measurement and Amortization</h3>

<p>As underlying portfolio companies are exited, the secondaries fund realizes gains or losses based on proceeds received minus the secondaries fund's adjusted basis (including purchase price allocation and any step-up/step-down). Auditors test subsequent measurement by selecting sample exits during the audit period, obtaining exit proceeds and terms from underlying fund reports, verifying the secondaries fund recorded its proportionate share correctly, and testing gain/loss calculation comparing proceeds to carrying value. Detailed calculation involves purchase price allocation to the exited company, plus/minus step-up/step-down allocated to that company, adjusted for any interim value changes, compared to exit proceeds to calculate realized gain or loss.</p>

<h2>Multi-Fund Confirmation Procedures</h2>

<p>Obtaining independent confirmations from underlying fund administrators provides critical audit evidence verifying ownership, capital account balances, unfunded commitments, and recent activity reported in the secondaries fund's records.</p>

<h3>Confirmation Request Distribution and Tracking</h3>

<p>The audit confirmation process begins with the secondaries fund CFO preparing a list of all underlying fund positions as of the audit balance sheet date, including fund name, administrator name and contact information, ownership percentage, and key account information to be confirmed. Auditors then prepare confirmation requests (typically on auditor letterhead) requesting confirmation of LP ownership interest and percentage, total capital committed and capital called to date, capital account balance as of the audit date, unfunded commitment remaining, and capital calls and distributions during the audit period.</p>

<p>The CFO coordinates distributing confirmation requests to 15-50+ underlying fund administrators, tracking which confirmations have been returned and which remain outstanding, and following up with non-responsive administrators requesting timely responses. Confirmation response rates vary—institutional fund administrators (SS&C, Citco, Alter Domus) generally respond promptly and reliably, while smaller or less sophisticated administrators may be slow or non-responsive requiring persistent follow-up. Target response rates of 90%+ are typical for secondaries fund audits given the critical nature of confirmations to the audit process.</p>

<h3>Confirmation Response Review and Reconciliation</h3>

<p>As confirmations are received, the CFO and auditors review them for accuracy and completeness comparing confirmed amounts to the secondaries fund's internal records, identifying and investigating any discrepancies, and obtaining explanations for differences. Common discrepancies include timing differences where capital calls or distributions occurred near period-end and may be recorded in different periods by the secondaries fund versus underlying administrator, recording differences from varying accounting treatments or interpretation of certain transactions, and administrative errors requiring correction by either the secondaries fund or the underlying administrator.</p>

<p>Material discrepancies require investigation and resolution before the audit can be completed. If a confirmation shows $5M more unfunded commitment than the secondaries fund's records, this could indicate an unrecorded capital call obligation creating a liability. Conversely, if the confirmation shows lower capital account balance than recorded, this might indicate an overvalued position requiring write-down. The CFO works with underlying fund administrators to understand and resolve discrepancies, documents the reconciliation and any adjustments required, and provides this documentation to auditors supporting final audit conclusions.</p>

<h3>Non-Response and Alternative Procedures</h3>

<p>When underlying fund administrators don't respond to confirmation requests despite follow-up, auditors perform alternative procedures to obtain audit evidence. Alternative procedures include reviewing underlying fund financial statements and reports comparing them to amounts recorded, examining recent capital call and distribution notices verifying activity during the audit period, testing capital account roll-forwards from prior period balances plus/minus activity arriving at current period balances, and speaking with underlying fund CFOs or administrators if confirmations can't be obtained but oral confirmations or discussions provide some comfort.</p>

<p>The extent of alternative procedures required depends on materiality—for immaterial positions, basic alternative procedures may suffice, while material positions without confirmation responses require more extensive testing. Persistent inability to obtain confirmations or alternative evidence for material positions may result in audit scope limitations or qualified audit opinions, underscoring the importance of maintaining good relationships with underlying fund administrators and ensuring they respond to audit requests.</p>

<h2>Section 743(b) Adjustment Validation</h2>

<p>Section 743(b) basis adjustments, discussed in the Secondaries Tax article, create additional audit complexity requiring coordination between financial statement auditors and tax advisors to ensure proper accounting and reporting. The <a href="https://www.irs.gov" target="_blank" rel="noopener noreferrer">IRS</a> provides detailed guidance on partnership basis adjustments under Section 754 elections.</p>

<h3>Understanding Section 743(b) Mechanics for Audit Purposes</h3>

<p>Section 743(b) of the Internal Revenue Code provides for special basis adjustments when partnership interests are transferred if the partnership has a Section 754 election in effect. These adjustments are personal to the acquiring partner (the secondaries fund) and don't affect other partners or the partnership's book basis. For audit purposes, Section 743(b) adjustments affect tax basis in the LP interest but don't typically affect GAAP financial statement basis unless the secondaries fund is preparing its financial statements on a tax basis (uncommon for institutional funds that use GAAP).</p>

<p>However, auditors must understand Section 743(b) adjustments for several reasons: tax basis reconciliation to ensure tax basis used for K-1 preparation reconciles with GAAP basis reported in audited financial statements, deferred tax calculations if the secondaries fund records deferred taxes, disclosures in financial statement footnotes explaining basis differences, and validation that complex tax calculations are being performed correctly even if they don't directly affect GAAP financial statements. Auditors typically don't audit Section 743(b) calculations in detail (that's the tax preparer's responsibility), but they perform reasonability tests and ensure coordination between financial reporting and tax reporting.</p>

<h3>Coordination with Tax Advisors</h3>

<p>Auditors coordinate with the secondaries fund's tax advisors (typically a Big Four firm or specialized partnership tax practice) to understand Section 743(b) calculations and their impact on financial reporting. This coordination includes obtaining tax basis schedules showing book basis versus tax basis for each LP interest and the resulting differences, reviewing Section 743(b) adjustment calculations prepared by tax advisors for major acquisitions, confirming that tax advisors have appropriate expertise and are reputable firms, and discussing any unusual or complex tax issues that might affect financial statements. The financial statement auditor doesn't re-perform detailed tax calculations but obtains comfort that qualified tax professionals performed the work and results seem reasonable.</p>

<h3>Basis Reconciliation Testing</h3>

<p>A key audit procedure involves reconciling book basis per the financial statements to tax basis used for K-1 preparation, documenting differences. The reconciliation starts with GAAP basis in LP interests per the audited balance sheet, adds/subtracts book-tax differences such as Section 743(b) adjustments, differences in depreciation or amortization methods, and other partnership tax adjustments, arriving at tax basis that should match the basis reported on investor K-1s. Auditors test this reconciliation verifying mathematical accuracy, understanding the nature of book-tax differences and their appropriate treatment, and confirming that K-1 basis amounts reconcile to the calculated tax basis.</p>

<p>Material unexplained differences between book and tax basis raise audit concerns requiring investigation. Differences should be understandable—attributable to Section 743(b), specific tax elections or methods, or other documented factors. Random or unexplained differences suggest errors in book accounting, tax calculations, or both.</p>

<h2>Performance Calculation Testing</h2>

<p>Auditors test the secondaries fund's performance metrics including IRR and MOIC calculations to ensure investor reports accurately present fund performance.</p>

<h3>IRR Calculation Validation</h3>

<p>Internal rate of return (IRR) calculations for secondaries investments must use acquisition dates as the starting point for cash flows—not the underlying fund's inception dates. When a secondaries fund purchases an LP interest for $90M on January 1, 2020, the IRR calculation starts with -$90M outflow on that date. Subsequent capital calls paid by the secondaries fund to the underlying fund are additional outflows. Distributions received from the underlying fund are inflows. Terminal value equals current fair value of the position. Auditors test IRR calculations by verifying that acquisition date and price are used as initial cash outflow, capital calls and distributions are recorded at correct dates and amounts (tracing to underlying fund reports), current fair value is correct per valuation testing discussed above, and IRR mathematical calculation is accurate (often tested using auditor's own software calculating IRR from the cash flows). The <a href="/tools/management-fee-calculator">Management Fee Calculator</a> can help model fee impacts on net IRR calculations.</p>

<p>Errors in IRR calculations typically stem from incorrect cash flow dates, using underlying fund inception date instead of secondaries acquisition date, failing to include all capital calls as outflows, or using incorrect current valuations. Material IRR errors require correction in investor reports and could indicate internal control weaknesses in performance reporting processes.</p>

<h3>MOIC and DPI Calculations</h3>

<p>Multiple of invested capital (MOIC) and distributions to paid-in capital (DPI) calculations are simpler than IRR but also require testing. MOIC equals (cumulative distributions + current value) / cumulative invested capital. For a position where the secondaries fund invested $90M total (purchase price plus subsequent capital calls), received $30M in distributions, and holds a current position valued at $75M, MOIC equals ($30M + $75M) / $90M = 1.17x. DPI equals cumulative distributions / cumulative invested capital, or $30M / $90M = 0.33x.</p>

<p>Auditors test these calculations by verifying cumulative invested capital (purchase price plus all subsequent capital calls), cumulative distributions received (traced to cash records and underlying fund reports), current value (tested per valuation procedures), and mathematical accuracy. These tests are straightforward but essential for ensuring investor reports are accurate.</p>

<h3>Since-Purchase Performance Metrics</h3>

<p>Some secondaries funds report "since-purchase" performance showing how portfolio companies have performed since the secondaries fund acquired the LP interest, separate from the overall IRR which includes pricing at acquisition. Since-purchase IRR measures the underlying portfolio's performance as if the secondaries fund purchased at NAV rather than at a discount or premium. These calculations are more complex and require tracking portfolio company values from acquisition date forward, attributing value changes to specific company appreciation or exits, and calculating returns based on this adjusted baseline.</p>

<p>Auditors testing since-purchase metrics verify that acquisition date portfolio company values are used as the baseline, subsequent value changes are tracked at portfolio company level, and calculations properly isolate performance from acquisition pricing. These metrics are useful for demonstrating investment selection versus pricing skill but require careful calculation and clear presentation to avoid confusion with overall fund IRR.</p>

<h2>Internal Controls Testing</h2>

<p>Auditors evaluate and test internal controls over financial reporting relevant to secondaries funds, focusing on areas of significant judgment or complexity.</p>

<h3>Portfolio Valuation Controls</h3>

<p>Key controls around valuations include segregation of duties where personnel responsible for investment management and holding positions don't solely determine valuations—independent valuation or finance personnel provide review, valuation committee oversight with documented meetings, discussions, and approvals, comparison to third-party data using external valuation specialists or market data services for benchmarking, and management review and approval at appropriate seniority levels ensuring valuations receive proper oversight. Auditors test these controls by examining valuation committee minutes for evidence of active challenge and discussion, reviewing segregation of duties and approval hierarchies, testing that third-party valuation reports or market data were obtained and considered, and confirming management review and sign-off on quarterly valuations.</p>

<h3>Capital Activity Recording Controls</h3>

<p>Controls over recording capital calls and distributions from underlying funds include timely recording of activity when notices are received or cash is transferred, reconciliation of recorded activity to bank statements and underlying fund reports, review and approval of journal entries recording capital activity, and system-generated reports or dashboards enabling management to monitor activity and identify potential errors. Auditors test capital activity controls by selecting samples of capital calls and distributions, verifying timely recording with appropriate documentation and approvals, testing reconciliation procedures to bank statements, and evaluating whether exceptions or errors were identified and corrected through control procedures.</p>

<h3>Confirmation Process Controls</h3>

<p>Controls ensuring accurate and complete confirmation procedures include maintaining current contact information for all underlying fund administrators, systematic tracking of confirmation requests sent and responses received, follow-up procedures for non-responses with documented escalation timelines, and reconciliation and investigation of discrepancies between confirmations and internal records. Auditors test these controls by evaluating confirmation tracking systems and whether they captured all positions, reviewing follow-up documentation for non-responses, examining reconciliation workpapers for evidence of discrepancy investigation, and assessing whether material differences were properly resolved.</p>

<h2>Audit Coordination and Preparation Best Practices</h2>

<p>Effective audit preparation and coordination between the CFO and audit team reduce audit time, cost, and disruption while ensuring high-quality results.</p>

<h3>Preparation Before Audit Fieldwork</h3>

<p>The CFO prepares materials in advance of audit fieldwork including comprehensive rollforward schedules showing beginning balances, additions (new acquisitions), dispositions (exits), and ending balances for all positions, valuation workpapers documenting methodology, underlying fund reports, and any adjustments, confirmation tracking showing all requests sent and responses received with reconciliation of discrepancies, capital activity support including bank statements, capital call/distribution notices, and booking entries, and prior year audit issues identified and resolution of any prior findings or recommendations. Providing organized materials upfront accelerates audit fieldwork and demonstrates strong internal control and financial reporting quality. The <a href="/tools/fund-expense-allocation">Fund Expense Allocation Helper</a> can assist in organizing expense categorization for audit preparation, while the <a href="/tools/fund-launch-guide">Fund Launch Guide</a> provides frameworks for establishing proper audit-ready infrastructure from fund inception.</p>

<h3>Communication and Responsiveness</h3>

<p>Regular communication between the CFO and audit team maintains momentum and avoids delays. Established protocols include weekly status calls during fieldwork discussing progress, outstanding items, and any issues arising, prompt response to auditor requests providing requested documents or explanations within 24-48 hours, escalation procedures for significant issues or disagreements involving senior management or audit committee when needed, and documented resolutions for complex issues ensuring mutual understanding and agreement on treatment. Strong communication and responsiveness typically reduce total audit hours by 20-30% compared to audits with poor coordination.</p>

<h3>Leveraging Technology and Systems</h3>

<p>Technology systems improve audit efficiency and quality including portfolio management systems (Geneva, eFront, Dynamo) providing comprehensive reporting and audit trails, data rooms or file sharing platforms organizing documents for auditor access, confirmation management software automating confirmation distribution and tracking, and exception reports identifying potential errors or inconsistencies requiring investigation. Auditors can often download data directly from systems, reducing manual document requests and enabling more efficient substantive testing through data analytics.</p>

<h3>Building Auditor Relationship and Continuity</h3>

<p>Maintaining continuity with the same audit team year-over-year reduces re-learning and improves efficiency. The CFO invests in auditor relationships through education sessions at the beginning of each engagement discussing fund strategy, any portfolio changes, and business developments, proactive communication throughout the year on significant transactions or issues rather than surprising auditors during fieldwork, soliciting feedback on process improvements asking auditors for suggestions on how preparation or procedures could be enhanced, and expressing appreciation for quality work recognizing strong audit team performance and building positive working relationships. Long-tenured audit relationships often result in 30-40% shorter audits than new engagements where auditors are learning the fund for the first time.</p>

<h2>Key Takeaways</h2>

<ul>
<li><strong>LP interest valuations rely substantially on underlying fund NAV reports and audits of those funds:</strong> Auditors must evaluate whether reliance on other auditors' work is appropriate by assessing underlying fund auditor reputation, audit scope and quality, and materiality of specific positions—with Big Four-audited institutional funds receiving greater reliance than unknown auditors or funds with audit issues. Review <a href="https://www.aicpa.org" target="_blank" rel="noopener noreferrer">AICPA</a> guidance and <a href="https://ilpa.org" target="_blank" rel="noopener noreferrer">ILPA</a> reporting standards for best practices.</li>

<li><strong>Multi-fund confirmation procedures require coordination with 20-100+ underlying fund administrators:</strong> Obtaining confirmation responses from numerous administrators with varying responsiveness demands systematic tracking, persistent follow-up, and alternative procedures for non-responses, with target response rates of 90%+ critical for completing audits without scope limitations.</li>

<li><strong>Purchase accounting for secondaries acquisitions requires allocating purchase price across underlying portfolio companies:</strong> Verifying purchase price determination, testing allocation methodology based on relative fair values at acquisition, and tracking basis step-ups or step-downs as portfolio companies exit create audit procedures unique to secondaries transactions absent in traditional fund audits.</li>

<li><strong>Section 743(b) basis adjustments affect tax reporting requiring coordination between financial statement auditors and tax advisors:</strong> While Section 743(b) typically doesn't impact GAAP financial statements, auditors must understand these adjustments for tax basis reconciliation, deferred tax calculations, and footnote disclosures, requiring coordination with specialized partnership tax experts. Consult <a href="https://www.irs.gov" target="_blank" rel="noopener noreferrer">IRS</a> partnership taxation guidance for Section 754 election requirements.</li>

<li><strong>Performance calculation testing validates IRR accuracy from acquisition dates, not underlying fund inception:</strong> IRR calculations must use secondaries acquisition dates and pricing as initial outflows—not underlying fund inception dates—requiring auditors to verify correct starting points, cash flow dates, and current valuations to ensure performance reporting accurately reflects secondaries execution.</li>

<li><strong>Valuation testing focuses on proportionate NAV methodology and reasonableness of discounts or premiums:</strong> Auditors verify mathematical accuracy of proportionate NAV calculations, assess justification for any discounts or premiums through market transaction evidence or position-specific analysis, and evaluate changes from prior periods ensuring material value movements are explained by underlying fund performance or market conditions.</li>

<li><strong>Internal controls over portfolio valuation, capital activity recording, and confirmation processes mitigate audit risk:</strong> Segregation of duties separating investment personnel from valuation determination, valuation committee oversight providing independent review, systematic confirmation tracking, and capital activity reconciliation to bank statements establish strong control environment reducing audit scope and substantive testing requirements.</li>

<li><strong>Audit preparation including organized workpapers, comprehensive schedules, and proactive communication reduces audit time by 20-40%:</strong> Providing rollforward schedules, valuation workpapers, confirmation tracking, and capital activity support before fieldwork begins, combined with responsive communication and technology-enabled data access, accelerates audits and reduces costs substantially versus reactive approaches.</li>

<li><strong>Market transaction evidence provides strongest validation for LP interest valuations beyond proportionate NAV:</strong> Recent secondary market transactions involving the same underlying fund at 80-95% of NAV, broker quotes or indications of interest, and secondary market pricing indices provide Level 2 fair value inputs under ASC 820 strengthening audit support for valuations compared to Level 3 unobservable proportionate NAV alone.</li>

<li><strong>Long-tenured audit relationships with consistent audit teams reduce re-learning and improve efficiency:</strong> Maintaining the same lead audit partner and senior team members year-over-year through strong relationships, proactive communication, education on fund developments, and process improvement collaboration typically reduces audit hours by 30-40% versus new engagements where auditors are learning the fund from scratch.</li>
</ul>`,
  metaTitle: 'Secondaries Fund Audits: LP Valuation Testing, Multi-Fund Confirmations & Purchase Accounting',
  metaDescription: 'Comprehensive guide to secondaries audits covering LP interest fair value determination, underlying fund NAV reliance, multi-fund confirmation procedures, purchase price allocation, Section 743(b) validation, and performance calculation testing.',
  publishedDate: 'November 5, 2025',
  readingTime: 18,
}

export default article
