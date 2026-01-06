import { Article } from '../types'

const article: Article = {
  id: 'secondaries-fund-administration-fund-administration',
  title: 'Fund Administration for Secondaries: Acquisition Accounting, Capital Account Tracking, and Performance Reporting',
  slug: 'fund-administration',
  subtitle: 'Comprehensive guide to secondaries fund administration including purchase price allocation, dual capital account maintenance, multi-fund coordination, and since-purchase performance calculation',
  fundType: 'secondaries',
  pillar: 'fund-administration',
  content: `<p>Secondaries fund administration differs fundamentally from traditional PE administration. Rather than tracking investments from inception, administrators manage acquired LP interests purchased mid-lifecycle at premiums or discounts to NAV. This creates specialized requirements: purchase accounting allocations, dual capital account tracking (economic vs. tax basis), coordination across multiple underlying fund administrators, since-purchase performance metrics, and layered waterfall calculations. Administration must align with <a href="https://fasb.org" target="_blank" rel="noopener noreferrer">FASB</a> fair value standards and <a href="https://ilpa.org" target="_blank" rel="noopener noreferrer">ILPA</a> reporting guidelines.</p>

<p>Secondaries funds typically hold 20-50+ underlying fund positions simultaneously, each with different administrators, vintage years, accounting policies, and distribution schedules. The administrator aggregates disparate data into consolidated reporting, maintains transaction-level tracking for performance attribution, and coordinates cash flows across numerous capital calls and distributions.</p>

<h2>Purchase Accounting and Basis Allocation</h2>

<h3>Fair Value Hierarchy and Allocation</h3>

<p>Purchase price allocation requires allocating the purchase price to underlying portfolio companies at their fair values at acquisition. If the secondaries fund purchases a 5% LP interest for $40 million in a fund holding portfolio companies worth $800 million aggregate, the 5% interest represents $40 million of underlying value. When purchase price equals proportionate NAV, allocation is straightforward.</p>

<p>But secondaries transactions frequently occur at discounts or premiums. If the fund pays $36 million (10% discount to $40 million NAV), the administrator must determine whether the $4 million discount reflects lower portfolio company values than reported marks, liquidity discount, or seller urgency.</p>

<p>If the discount reflects value disagreement, purchase accounting writes down specific companies. For example, if the underlying fund marks a software company at $100 million but comparables suggest $80 million, the administrator allocates proportionately less value, creating ongoing reconciliation requirements as carrying values diverge from reported NAV.</p>

<p>If the discount reflects liquidity rather than value disagreement, the administrator records a "basis difference" that amortizes over the holding period, maintaining carrying values aligned with underlying fund reporting.</p>

<h3>Intangible Asset Recognition</h3>

<p>In GP-led continuation funds, the buyer may separately value intangible assets (GP relationships, deal sourcing, sector expertise) beyond portfolio holdings. These require separate valuation and amortization. For example, purchasing a continuation fund stake might value the GP's proprietary deal flow at $2 million, amortized over 5 years.</p>

<h3>Unfunded Commitment Accounting</h3>

<p>Acquired LP interests typically include unfunded commitments recorded as contingent liabilities. The administrator tracks total commitment, funded amount (including purchase price), and remaining obligation. When underlying funds call capital, the secondaries fund funds its share, increasing invested capital and reducing unfunded commitments.</p>

<p>Unlike primary funds where contributions equal committed capital, secondaries require separate tracking: the purchase price is one economic investment, while subsequent capital calls are additional investments requiring distinct performance measurement.</p>

<h2>Dual Capital Account Tracking</h2>

<p>The most complex aspect of secondaries administration is maintaining dual capital account perspectives: economic reality versus tax requirements.</p>

<h3>Economic Capital Accounts</h3>

<p>Economically, when the secondaries fund acquires an LP interest for $36 million, that $36 million represents invested capital. Performance metrics (IRR, MOIC) calculate from this economic basis.</p>

<p>The administrator maintains economic accounts showing each investor's contributions (their share of acquisition price plus subsequent capital calls), distributions received, and current carrying value. These drive investor reporting and fee calculations.</p>

<h3>Tax Capital Accounts</h3>

<p>For tax purposes, the secondaries fund steps into the original LP's shoes, inheriting the historical capital account regardless of purchase price.</p>

<p>Example: The original LP contributed $50 million, received $20 million distributions, and has $40 million NAV. Tax capital account: $30 million ($50M - $20M). When the secondaries fund purchases for $36 million, the tax capital account stays at $30 million, creating a $6 million basis difference between economic ($36M) and tax ($30M).</p>

<p>The administrator maintains both views: economic accounts for investor reporting and tax accounts for K-1 preparation. Each distribution requires dual allocation—economically as return of invested capital, for tax as characterized by the underlying fund.</p>

<h3>Section 754 Elections</h3>

<p>Some underlying funds make IRC Section 754 elections allowing basis step-up when interests transfer, bringing tax basis closer to economic basis. Without 754 elections, the administrator maintains basis differences throughout the holding period, tracking each underlying fund's election status and coordinating basis adjustment calculations where applicable. The <a href="https://www.irs.gov" target="_blank" rel="noopener noreferrer">IRS</a> provides detailed guidance on Section 754 elections and partnership basis adjustments.</p>

<h2>Multi-Fund Position and Data Management</h2>

<p>Secondaries funds typically acquire positions in 20-50+ underlying funds, creating significant data aggregation and tracking challenges.</p>

<h3>Administrator Relationship Management</h3>

<p>Each underlying fund has its own administrator—mainstream administrators like SS&C, Alter Domus, Apex, Citco, or smaller specialized firms. These administrators have different reporting formats, schedules, data delivery methods, and responsiveness. The secondaries fund administrator must establish relationships with each underlying fund administrator to receive timely capital call notices, distribution notifications, quarterly NAV reports, and annual audited financials.</p>

<p>Challenges include inconsistent reporting schedules (some underlying funds report within 30 days of quarter-end while others take 60-90 days), varying data formats (PDFs, Excel, proprietary systems, or limited online portals), and different levels of detail provided. A real estate fund might provide property-level detail, while a buyout fund might only report aggregated portfolio values. The secondaries administrator must normalize this diverse data into consistent formats for consolidated reporting.</p>

<h3>Position-Level Tracking Requirements</h3>

<p>For each underlying fund position, the administrator maintains comprehensive records including acquisition details (purchase date, purchase price, acquired percentage, unfunded commitments at purchase), current position status (current NAV, latest quarter-end date, current carrying value on secondaries fund books), capital activity since acquisition (capital calls funded, distributions received, both amounts and dates), performance metrics (since-purchase IRR, MOIC, DPI), and underlying fund information (GP name, strategy, vintage year, fund term, current status).</p>

<p>This granular tracking enables transaction-level performance analysis. Investors want to understand which acquisitions generated strong returns versus those that underperformed expectations. The administrator produces reports showing each acquisition's IRR, MOIC, and DPI, allowing the GP to evaluate underwriting accuracy and refine future deal selection.</p>

<h3>Data Aggregation and Normalization</h3>

<p>With positions tracked across dozens of underlying funds, the administrator implements systematic data aggregation processes. Leading administrators use automated data extraction tools that pull information from PDFs or spreadsheets received from underlying fund administrators, normalize data into standard formats, validate against prior periods to catch errors or inconsistencies, and populate central databases enabling consolidated reporting.</p>

<p>Manual review remains critical despite automation. The administrator validates that reported NAV changes match expected performance given market conditions, capital calls align with underlying funds' remaining investment periods and unfunded commitments, distributions correlate with known exit activity or portfolio company sales, and any unusual variances receive investigation and explanation.</p>

<h2>Capital Call and Distribution Coordination</h2>

<p>Managing cash flows across multiple underlying funds requires sophisticated forecasting and coordination processes.</p>

<h3>Capital Call Management</h3>

<p>Underlying funds issue capital calls on varying schedules with different notice periods. Some provide 30 days notice, others only 10-14 days. The secondaries fund administrator must track expected capital calls across the portfolio, maintain adequate liquidity to fund all obligations, ensure timely payment to avoid defaults, and issue corresponding capital calls to the secondaries fund's own investors when needed.</p>

<p>Forecasting capital call timing and amounts involves reviewing each underlying fund's unfunded commitments, considering the fund's investment period status (funds in active investment periods call more capital than those post-investment), monitoring market conditions and deal flow that might accelerate or slow capital deployment, and maintaining buffers for unexpected calls or timing variability.</p>

<p>When an underlying fund issues a capital call, the secondaries fund administrator validates the call amount against records (does it exceed remaining unfunded commitments?), ensures the secondaries fund has liquidity to fund (from cash on hand, credit line draw, or capital call to secondaries fund investors), processes payment to the underlying fund within the deadline, and updates capital account records reflecting the contribution.</p>

<h3>Distribution Processing</h3>

<p>Distributions from underlying funds flow to the secondaries fund, requiring allocation to the secondaries fund's investors according to the fund's waterfall provisions. The administrator receives distribution notices from underlying funds (sometimes with minimal advance notice), processes incoming wires into the secondaries fund's bank account, allocates distributions according to the secondaries fund's LPA waterfall (return of capital, preferred return, GP catch-up, carried interest split), issues distributions to secondaries fund investors, and updates capital accounts and performance metrics.</p>

<p>Distribution timing uncertainty complicates cash management. Unlike operating companies with predictable quarterly dividends, underlying fund distributions arrive irregularly based on exit timing. A portfolio company sale might generate distributions 30-60 days after closing, or underlying fund GPs might retain proceeds temporarily before distributing, or partial sales generate staged distributions. The administrator forecasts expected distributions based on knowledge of portfolio companies in sale processes, historical distribution patterns from underlying fund GPs, and secondaries fund GP input on expected exit timing.</p>

<h3>Waterfall Application</h3>

<p>When the secondaries fund receives distributions, applying the waterfall requires determining whether distributions represent return of capital, return on capital, or carried interest from the underlying fund's perspective, and then how to characterize them for the secondaries fund's own waterfall. This creates layered waterfall complexity.</p>

<p>For example, an underlying fund distribution might represent partial return of contributed capital to that fund plus realized gains. The secondaries fund's economic capital account shows this distribution as return of its purchase price paid (different from the underlying fund's capital) until its investment is recouped, then as profit. The secondaries fund's own waterfall then determines how to split this profit between LPs and GP based on whether preferred returns have been met and carry has been earned. The <a href="/tools/distribution-waterfall">Distribution Waterfall Visualizer</a> helps model these layered waterfall calculations and their impact on LP and GP economics.</p>

<h2>Performance Calculation and Reporting</h2>

<p>Secondaries fund performance reporting must clearly communicate returns while navigating the complexity of mid-lifecycle entry points and layered fund structures.</p>

<h3>Since-Purchase Metrics</h3>

<p>The primary performance metrics calculate returns from the secondaries fund's purchase date, not from the underlying funds' inception dates. This since-purchase perspective shows the value created by the secondaries transaction itself. The administrator calculates since-purchase IRR using cash flows from acquisition through current date (purchase price as negative cash flow, capital calls as negative, distributions as positive, current NAV as terminal value), since-purchase MOIC as (distributions + current NAV) / (purchase price + capital calls), and since-purchase DPI as distributions / (purchase price + capital calls).</p>

<p>These metrics answer the key question: did the secondaries fund create value through its acquisition pricing and subsequent realization? A position purchased at a 20% discount to NAV should generate outperformance if underlying portfolio performance merely matches expectations, since the favorable entry price provides a margin of safety. The <a href="/tools/management-fee-calculator">Management Fee Calculator</a> can help model how fee structures impact net returns at various pricing scenarios.</p>

<h3>Underlying Fund Performance Context</h3>

<p>While since-purchase metrics show secondaries fund performance, investors also want context on underlying fund performance. The administrator reports underlying fund gross IRR and MOIC from the funds' inception, enabling comparison of how the secondaries fund's performance compares to the underlying fund's overall results. If an underlying fund generated 25% gross IRR from inception, but the secondaries fund only achieved 15% IRR on its acquired position, this might indicate unfavorable acquisition pricing. Conversely, achieving 25% IRR on a position in an underlying fund with 18% overall IRR would demonstrate strong transaction selection.</p>

<h3>Attribution Analysis</h3>

<p>Sophisticated administrators provide attribution analysis decomposing returns into components: pricing impact (how much value was created or destroyed by acquisition pricing relative to exit pricing), performance impact (how underlying portfolio performed post-acquisition), and timing impact (whether exits occurred faster or slower than underwriting assumptions). This analysis helps GPs understand value drivers and refine future underwriting.</p>

<h3>Vintage Year Reporting</h3>

<p>Secondaries funds often report performance by transaction vintage (year of acquisition) in addition to fund-level metrics. This allows assessment of how acquisition pricing varies across market cycles and whether certain vintages delivered superior returns. A secondaries fund that made acquisitions in 2020-2021 during peak pricing might show different performance profiles than acquisitions in 2023-2024 during market dislocation when pricing discounts widened.</p>

<h2>GP-Led Transaction Accounting</h2>

<p>GP-led transactions including continuation funds, tender offers, and strip sales create additional administrative complexity beyond traditional LP-led secondaries.</p>

<h3>Continuation Fund Structure</h3>

<p>In continuation funds, the GP moves one or more assets from an existing fund into a new fund vehicle, offering existing LPs the option to cash out or roll into the continuation fund. The secondaries buyer provides the liquidity for LPs who exit and becomes an investor in the continuation fund. From an accounting perspective, this creates multiple entities and relationships requiring careful tracking.</p>

<p>The administrator tracks the secondaries fund's investment in the continuation fund itself (treated similar to a direct fund investment), any separate fees or carry structures unique to the continuation fund versus the original fund, the economic terms of LP rollovers versus cash-out participants (did rollovers receive discounts or preferential terms?), and governance rights and reporting obligations specific to continuation fund structures.</p>

<p>Continuation fund accounting resembles co-investment accounting more than traditional secondaries since the secondaries fund becomes a direct LP in a newly formed fund rather than acquiring an interest in an existing mature fund. The administrator applies co-investment accounting principles while maintaining the distinction that the continuation fund holds seasoned assets with historical performance rather than new investments.</p>

<h3>Preferred Equity and Structured Deals</h3>

<p>Some GP-led deals involve preferred equity providing priority returns, making them distinct from simple common equity purchases. The administrator must track preferred return accruals (if returns accrue but aren't currently paid), payment priorities and waterfalls when distributions occur, conversion or participation rights if the preferred has upside beyond fixed returns, and redemption or liquidity provisions allowing the preferred to exit at formulaic pricing.</p>

<p>Documentation of these structured deals includes detailed payment priority schedules, calculation methodologies for accruing returns, and scenario modeling showing how distributions would be allocated under different portfolio performance outcomes. Quarterly reporting to investors shows preferred return accruals, cumulative returns earned, and remaining amounts needed to satisfy preferred obligations before common equity participates.</p>

<h2>Tax Reporting and K-1 Preparation</h2>

<p>Tax reporting for secondaries funds involves complexity stemming from the dual capital account reality and diverse tax characteristics of underlying funds.</p>

<h3>K-1 Receipt and Consolidation</h3>

<p>Each underlying fund issues K-1s to the secondaries fund (as an LP in those funds) reporting allocated income, gains, losses, and other tax items. The secondaries fund administrator receives dozens of K-1s from different underlying funds, each with different tax characteristics. A buyout fund generates primarily long-term capital gains, while a credit fund might generate ordinary income from interest. A venture fund shows a mix of long-term gains (successful exits) and ordinary losses (failed investments written off).</p>

<p>The administrator consolidates these K-1s into the secondaries fund's own tax return, allocating the tax attributes to the secondaries fund's investors in their K-1s. This consolidation requires mapping underlying fund tax reporting to the secondaries fund's capital accounts, adjusting for basis differences between economic and tax capital accounts, applying the secondaries fund's own partnership allocations and waterfall to determine how tax items flow to investors, and ensuring compliance with partnership tax rules including Section 704(b) and 704(c).</p>

<h3>Built-In Gain/Loss Considerations</h3>

<p>When the secondaries fund purchases LP interests, built-in gains or losses may exist if the underlying portfolio's fair value differs from tax basis. Without a Section 754 election, these built-in gains or losses eventually allocate to the secondaries fund when realized, creating potential timing mismatches between economic and tax results. The administrator tracks built-in gain/loss amounts at acquisition, monitors realization as portfolio companies exit, and provides investors with transparency into tax efficiency implications.</p>

<h3>UBTI and International Tax</h3>

<p>Some secondaries fund investors are tax-exempt organizations subject to UBTI (unrelated business taxable income) concerns. If underlying funds generate UBTI through leveraged investments or operating businesses, this flows through to the secondaries fund and ultimately to tax-exempt investors. The administrator separately tracks UBTI-generating activities, provides tax-exempt investors with detailed UBTI disclosures, and coordinates with tax advisors on blocker structure requirements if UBTI becomes material.</p>

<p>International tax considerations arise when underlying funds invest in non-US portfolio companies or structure through offshore entities. Foreign taxes withheld on distributions, foreign tax credits available to investors, and FATCA/CRS reporting obligations all require specialized tracking and reporting by the administrator.</p>

<h2>Valuation and NAV Calculation</h2>

<p>Calculating the secondaries fund's NAV each quarter requires aggregating underlying fund valuations, adjusting for basis differences, and applying appropriate valuation methodologies where acquisition accounting created distinctions from underlying fund marks.</p>

<h3>Rolling Forward Methodology</h3>

<p>The administrator typically employs a rolling forward approach starting with prior period NAV, adding current period contributions and acquisitions, subtracting current period distributions, and adjusting for the change in fair value of underlying positions based on underlying fund reports. The fair value adjustment represents the critical step requiring judgment.</p>

<p>If the underlying fund reports its NAV increased from $800M to $850M, and the secondaries fund owns a 5% interest, the proportionate increase is $2.5M. However, if the secondaries fund's purchase accounting established values different from the underlying fund's marks, the administrator must determine how to reflect underlying fund performance. Does a 6.25% increase in underlying fund NAV translate to exactly 6.25% for the secondaries fund's position, or do purchase accounting adjustments impact the calculation?</p>

<h3>Valuation Policy Documentation</h3>

<p>The administrator works with the secondaries fund GP to establish and document clear valuation policies addressing how underlying fund marks translate to secondaries fund valuations, treatment of purchase accounting adjustments and amortization, handling of discounts or premiums established at acquisition, and procedures for challenging or adjusting underlying fund valuations if the secondaries fund disagrees with marks.</p>

<p>These policies undergo audit scrutiny annually. Auditors review whether the secondaries fund consistently applies its policies, whether adjustments to underlying fund marks are supportable and reasonable, and whether disclosures adequately explain valuation methodologies and uncertainties.</p>

<h2>Investor Reporting</h2>

<p>Secondaries fund investors require reporting that clearly explains the complex portfolio structure and performance attribution.</p>

<h3>Quarterly Report Components</h3>

<p>Comprehensive quarterly reports include fund-level summary metrics (NAV, IRR, MOIC, DPI for the overall secondaries fund), portfolio composition showing all underlying fund positions with current values and performance, transaction activity during the quarter (new acquisitions, exits, capital calls, distributions), performance attribution breaking down returns by transaction vintage and strategy, and detailed position-level schedules for each underlying fund holding.</p>

<p>The position-level detail helps investors understand portfolio construction. How concentrated is exposure across underlying fund strategies? Does the portfolio lean toward buyout, growth equity, venture, or credit? What vintage year diversification exists? Are most underlying funds in early, middle, or late stages of realization? These insights enable investors to assess risk and return drivers.</p>

<h3>Lookthrough Reporting</h3>

<p>Some sophisticated investors request lookthrough reporting showing underlying portfolio company exposure. Rather than just seeing "5% LP interest in ABC Capital Fund III," lookthrough reporting shows the secondaries fund's indirect ownership in ABC Capital's portfolio companies. This provides visibility into ultimate sector exposure, geographic diversification, and concentration risks at the portfolio company level.</p>

<p>Lookthrough reporting is intensive, requiring the administrator to aggregate portfolio company data from dozens of underlying funds, normalize company descriptions and sector classifications, and calculate the secondaries fund's indirect ownership (the secondaries fund owns 5% of ABC Capital which owns 20% of PortfolioCompany A, meaning indirect ownership is 1%). Privacy and disclosure limitations sometimes prevent full lookthrough transparency, but partial lookthrough for significant positions provides value.</p>

<h2>Technology and System Requirements</h2>

<p>Administering secondaries funds efficiently requires specialized technology capabilities beyond traditional fund accounting systems.</p>

<h3>Data Aggregation Platforms</h3>

<p>Leading secondaries administrators utilize data aggregation platforms that automatically extract information from underlying fund reports, normalize diverse data formats into standardized structures, validate data quality and flag anomalies, and populate central databases enabling consolidated reporting and analytics. These platforms significantly reduce manual data entry, minimize errors, and enable faster quarterly close processes.</p>

<h3>Performance Analytics Tools</h3>

<p>Specialized analytics tools calculate since-purchase IRRs and MOICs efficiently across hundreds of cash flows, perform attribution analysis decomposing returns into components, generate vintage year cohort analysis, and model projected distributions based on underlying portfolio composition and exit assumptions. These tools enable GPs and investors to understand performance drivers and make informed portfolio management decisions.</p>

<h3>Integration with Underlying Fund Portals</h3>

<p>Some underlying fund administrators provide online portals where LPs can access statements, capital call notices, and tax documents. The secondaries fund administrator establishes access to dozens of these portals, creating workflow complexities around monitoring for new documents, downloading and archiving materials, and integrating data into the secondaries fund's central systems. API integrations where available streamline data transfer, though many fund administrators still rely on manual portal access or email delivery.</p>

<h2>Audit and Compliance Considerations</h2>

<p>Annual financial statement audits of secondaries funds involve unique challenges given the complex underlying structures.</p>

<h3>Auditor Coordination</h3>

<p>The secondaries fund's auditor must understand and validate the fair value of numerous underlying fund positions. This involves reviewing underlying fund audited financials (which may not be available on the secondaries fund's audit timeline), assessing whether underlying fund marks are reasonable and whether the secondaries fund's use of those marks is appropriate, testing purchase accounting allocations and valuation methodologies, and validating capital account reconciliations between economic and tax perspectives.</p>

<p>Coordination challenges arise when underlying funds have different auditors, different fiscal year-ends creating timing mismatches, delayed audit completion delaying secondaries fund audit finalization, or limited information rights constraining the secondaries fund auditor's access to underlying fund detail. The administrator manages these coordination requirements, working with multiple underlying fund administrators and auditors to gather necessary information.</p>

<h3>Subsequent Events Testing</h3>

<p>Between the secondaries fund's fiscal year-end and audit report issuance, underlying fund portfolio companies may experience material developments affecting valuations. The administrator monitors for subsequent events through review of underlying fund communications and reports, industry news and developments affecting portfolio companies, and dialogue with underlying fund GPs about significant post-period activity. Material subsequent events require disclosure or adjustment in the secondaries fund's financial statements.</p>

<h2>Key Takeaways</h2>

<ul>
<li><strong>Purchase accounting requires careful basis allocation:</strong> Allocating acquisition prices to underlying portfolio companies at fair value creates the foundation for ongoing valuation and performance tracking. Discounts or premiums to NAV must be analyzed to determine whether they reflect portfolio company value adjustments, liquidity discounts, or other factors impacting accounting treatment.</li>

<li><strong>Dual capital account maintenance is essential:</strong> Administrators must maintain both economic capital accounts based on purchase prices paid and tax capital accounts inherited from prior LPs. This dual-tracking reconciles investor reporting with K-1 tax preparation requirements despite basis differences.</li>

<li><strong>Multi-fund coordination demands systematic processes:</strong> Managing positions across 20-50+ underlying funds with different administrators, reporting schedules, and formats requires automated data aggregation tools, normalized reporting templates, and robust validation procedures to ensure accuracy.</li>

<li><strong>Since-purchase metrics measure transaction value creation:</strong> Performance calculated from acquisition dates through current periods shows returns generated by the secondaries transaction itself. IRR and MOIC from purchase date demonstrate whether favorable acquisition pricing translated into outperformance.</li>

<li><strong>Cash forecasting must account for timing uncertainty:</strong> Capital calls and distributions arrive irregularly based on underlying fund deployment and realization cycles. Maintaining liquidity buffers and sophisticated forecasting models prevents defaults and enables opportunistic capital deployment.</li>

<li><strong>GP-led transactions create additional complexity:</strong> Continuation funds, preferred equity, and structured deals require specialized accounting treatment, detailed waterfall modeling, and enhanced reporting to explain economic rights and return priorities.</li>

<li><strong>Tax reporting consolidates diverse underlying characteristics:</strong> K-1s from underlying funds generate ordinary income, capital gains, losses, UBTI, and foreign tax items requiring consolidation and flow-through to secondaries fund investors with appropriate allocations and characterizations.</li>

<li><strong>Valuation policies must address purchase accounting impacts:</strong> Clear, documented methodologies for translating underlying fund NAV changes to secondaries fund valuations prevent inconsistency and support audit defense. Policies should address how discounts/premiums established at acquisition affect ongoing marks.</li>

<li><strong>Lookthrough reporting provides portfolio transparency:</strong> Aggregating underlying portfolio company exposure across all underlying funds enables investors to assess sector concentration, geographic diversification, and ultimate risk drivers beyond just fund-level allocations.</li>

<li><strong>Technology enables scalability and accuracy:</strong> Automated data aggregation, performance analytics platforms, and system integrations reduce manual processes, minimize errors, and enable efficient administration of complex secondaries portfolios with dozens of underlying fund positions.</li>
</ul>`,
  metaTitle: 'Secondaries Fund Administration: Accounting, Tracking & Performance Reporting',
  metaDescription: 'Comprehensive guide to secondaries fund administration covering purchase accounting, dual capital accounts, multi-fund coordination, cash management, performance calculation, and investor reporting.',
  publishedDate: 'November 10, 2025',
  readingTime: 20,
}

export default article
