import { Article } from '../types'

const article: Article = {
  id: 'private-equity-compliance-compliance',
  title: 'Compliance for Private Equity Funds: Regulatory Framework and Oversight Requirements',
  slug: 'compliance',
  subtitle: 'Navigating SEC registration, Form ADV/PF, custody rules, marketing regulations, political contributions, and CCO responsibilities',
  fundType: 'private-equity',
  pillar: 'compliance',
  content: `<p>The 2010 <a href="https://www.sec.gov/spotlight/dodd-frank.shtml" target="_blank" rel="noopener noreferrer">Dodd-Frank Act</a> eliminated the private adviser exemption and required most PE advisers to register with the <a href="https://www.sec.gov" target="_blank" rel="noopener noreferrer">SEC</a>. The <a href="https://www.sec.gov/investment/investment-advisers-act-1940" target="_blank" rel="noopener noreferrer">Investment Advisers Act of 1940</a> establishes the foundational framework: compliance programs, books and records, <a href="https://www.sec.gov/about/forms/formadv.pdf" target="_blank" rel="noopener noreferrer">Form ADV</a> disclosure, and SEC examination authority. PE managers must also navigate custody rules, marketing regulations, political contribution restrictions, and ERISA considerations when pension plans invest.</p>

<h2>SEC Registration Under the Investment Advisers Act</h2>

<p>Advisers with $150 million or more in assets under management must register with the SEC. Regulatory AUM is calculated based on gross asset value without deduction for leverage, liabilities, or fund expenses. A PE fund with $100 million in equity capital and $50 million in fund-level debt contributes $150 million to regulatory AUM.</p>

<p>Registration requires filing Form ADV through the <a href="https://www.iard.com" target="_blank" rel="noopener noreferrer">IARD</a>, FINRA's electronic system. Submit Form ADV Parts 1 and 2, pay applicable fees, and satisfy state notice filing requirements. The SEC typically processes registrations within 45 days.</p>

<p>Form ADV must be updated annually within 90 days of fiscal year end. Other-than-annual amendments are required whenever information becomes materially inaccurate (key employee changes, regulatory actions, new offices).</p>

<h3>Exemptions from SEC Registration</h3>

<p>The venture capital fund adviser exemption exempts advisers that advise solely VC funds, regardless of AUM. Under <a href="https://www.ecfr.gov/current/title-17/chapter-II/part-275/section-275.203l-1" target="_blank" rel="noopener noreferrer">Rule 203(l)-1</a>, qualifying funds must hold no more than 20 percent in non-qualifying investments, use minimal leverage, and offer no redemption rights. Funds making control investments, using significant leverage, or holding substantial public securities typically cannot rely on this exemption.</p>

<p>The private fund adviser exemption under Section 203(m) exempts advisers with less than $150 million in U.S. private fund AUM. These advisers may still require state registration, with requirements varying significantly by state.</p>

<h2>Form ADV: Disclosure Obligations</h2>

<p>Form ADV serves as both the registration application and primary disclosure document. Part 1 collects regulatory information; Part 2 provides narrative disclosure to clients about services, fees, and conflicts of interest.</p>

<h3>Form ADV Part 1: Regulatory Reporting</h3>

<p>Items 1-4 collect identifying information (names, addresses, SEC file number). Items 5-7 address business operations: client types, AUM, services offered, and participation in client transactions. Most PE advisers report substantial assets in "pooled investment vehicles." The AUM reported in Item 5 determines SEC registration and Form PF filing thresholds.</p>

<p>Item 7.A addresses whether the adviser has material financial interests in recommended securities. PE managers investing alongside funds through co-investment vehicles or GP commitments must disclose this. Section 7.B requires detailed reporting about each private fund: identification, fund type classification, AUM, gross asset value, strategy, and beneficial ownership.</p>

<p>Schedule A discloses direct and indirect owners (25 percent or more ownership). Schedule D collects detailed information about private funds advised, separately managed accounts, and disciplinary history.</p>

<h3>Form ADV Part 2: The Firm Brochure</h3>

<p>Part 2 is the adviser's disclosure document, written in plain English and delivered to clients. Item 4 describes the business: firm history, principal owners, services, AUM, and investment decision authority.</p>

<p>Item 5 addresses fees and compensation. PE funds typically charge management fees on committed capital during the investment period, then invested capital or NAV thereafter (use the <a href="/tools/management-fee-calculator">Management Fee Calculator</a> to model these structures). The brochure must explain fee calculations, timing, and how the basis changes over the fund lifecycle. Carried interest (commonly 20 percent of profits after returning capital and the preferred return, often 8 percent) requires disclosure of <a href="/tools/distribution-waterfall">waterfall structure</a> (American vs. European-style) and clawback provisions.</p>

<p>Items 10-12 cover conflicts of interest: allocation of opportunities among funds, co-investment arrangements, portfolio company transactions with affiliated entities, and use of affiliated service providers. Comprehensive disclosure is the primary method of addressing conflicts under the Advisers Act.</p>

<h2>Form PF: Private Fund Reporting Requirements</h2>

<p><a href="https://www.sec.gov/about/forms/formpf.pdf" target="_blank" rel="noopener noreferrer">Form PF</a> requires registered advisers to report confidential information for the <a href="https://home.treasury.gov/policy-issues/financial-markets-financial-institutions-and-fiscal-service/fsoc" target="_blank" rel="noopener noreferrer">Financial Stability Oversight Council</a> to monitor systemic risk. All private fund advisers with $150 million or more in AUM must file; specific sections and frequency depend on total assets and fund types.</p>

<h3>Section 1: All Filers</h3>

<p>Section 1 collects basic information about the adviser and each private fund. Question 2 requests AUM by fund type. Questions 3-15 collect fund-level data: strategy classification (buyout, growth capital, venture capital, secondary), parallel fund structures, beneficial ownership concentration, gross and net asset values, investor flows, borrowing, and derivatives. Funds using subscription lines must report borrowing in Question 14.</p>

<h3>Section 4: Large PE Advisers</h3>

<p>Advisers with at least $2 billion in PE fund AUM must complete Section 4. Question 52 collects aggregate data: total commitments, capital called, portfolio company debt, geographic and sector concentration. Question 53 requests IRR by vintage year and strategy. Question 54 covers portfolio company characteristics: revenue, earnings, leverage multiples, industry classifications.</p>

<p>Questions 55-61 require detailed reporting for each fund with at least $2 billion in gross assets, including portfolio company information, concentration data, leverage statistics, and debt multiples. PE advisers file annually within 120 days of fiscal year end, aligning with audit deadlines.</p>

<h2>Custody Rule Compliance</h2>

<p><a href="https://www.ecfr.gov/current/title-17/chapter-II/part-275/section-275.206%284%29-2" target="_blank" rel="noopener noreferrer">Rule 206(4)-2</a> (the custody rule) addresses safeguarding client assets through qualified custodians, surprise examinations, and audited financial statements. PE managers typically have custody through authority to withdraw or transfer fund assets, authorize portfolio company transactions, or serve as GP or managing member.</p>

<p>For pooled investment vehicles like PE funds, the primary requirement is the annual audit provision: distribute audited financial statements prepared by a <a href="https://pcaobus.org" target="_blank" rel="noopener noreferrer">PCAOB</a>-registered auditor within 120 days of fiscal year end. This aligns with typical LPA requirements. Failure to deliver within 120 days constitutes a custody rule violation.</p>

<p>Financial statements must be GAAP-compliant with an auditor's opinion. Audits should examine capital account structure, portfolio investment valuations, carried interest calculations, and compliance with valuation policies.</p>

<p>Fund assets must be maintained with a qualified custodian (banks, registered broker-dealers, FCMs, certain foreign institutions). For direct operating company equity, interests must be held by a qualified custodian unless uncertificated and registered in the fund's name on the portfolio company's books. Ownership through holding companies requires careful analysis throughout the ownership chain.</p>

<h2>Marketing Rule and Advertising Restrictions</h2>

<p>The Marketing Rule (effective November 2021) replaced categorical prohibitions with a principles-based approach focused on preventing materially misleading advertisements. "Advertisement" includes any communication to more than one person offering advisory services: websites, social media, email campaigns, conference presentations, and pitch books.</p>

<p>The core prohibition: no advertisement may include untrue statements of material fact or be otherwise false or misleading. Whether an advertisement misleads depends on overall context, audience sophistication, and whether appropriate disclosures address potentially misleading implications.</p>

<h3>General Prohibitions</h3>

<p>Testimonials from LPs, service providers, or third parties require disclosures about compensation provided, material conflicts of interest, and that the testimonial may not represent other clients' experiences. The adviser must have a reasonable basis for believing the testimonial is not misleading.</p>

<p>Performance advertisements must include both gross and net performance with equal prominence. Net performance must reflect deduction of advisory fees and all other fund fees and expenses.</p>

<h3>Performance Advertising Standards</h3>

<p>Private equity performance advertising raises unique considerations given the long-duration nature of PE funds and the multiple ways performance can be calculated and presented. The Marketing Rule requires that performance advertisements include all portfolios that fall within the particular category of the presented performance with substantially similar investment policies, objectives, and strategies, subject to limited exceptions. This "all or none" standard prevents cherry-picking of only the best-performing funds when presenting track records.</p>

<p>For example, if a PE manager presents the performance of its buyout funds in marketing materials, the advertisement must include all buyout funds the manager has advised with substantially similar strategies, not just the top-performing vintage years. The manager cannot exclude funds that underperformed unless an exclusion would be immaterial or the manager has adopted criteria for excluding funds that are applied consistently and objectively.</p>

<p>Time period selection in performance advertising must avoid cherry-picking favorable measurement periods. Performance should generally be calculated through the most recent practicable date before the advertisement's first use, and advisers should avoid selecting measurement periods that artificially inflate returns by excluding periods of poor performance or capturing only strong performance cycles. If specific time periods are highlighted, the advertisement should provide context through longer-term performance or other relevant metrics.</p>

<p>Internal rate of return and multiple of invested capital represent the most common performance metrics for private equity funds. When presenting IRR, advisers should clearly disclose the calculation methodology, including whether the IRR is gross or net of fees, how capital calls and distributions are dated for purposes of the calculation, and the measurement date. MOIC presentations should similarly indicate whether the multiple is calculated on a gross or net basis and how unrealized investments are valued for purposes of the calculation.</p>

<p>Predecessor performance presents particular challenges under the Marketing Rule. When a private equity team leaves one firm to establish a new management company, the team may wish to present the performance results achieved at the prior firm as part of the new firm's track record. The Marketing Rule permits predecessor performance advertising only if the advertisement clearly and prominently identifies and explains the predecessor nature of the performance and all accounts with substantially similar investment policies, objectives, and strategies at the prior firm are included in the performance presentation.</p>

<h3>Books and Records for Marketing Materials</h3>

<p>The Marketing Rule imposes extensive books and records requirements for advertisements. Advisers must maintain copies of all advertisements disseminated, along with records of the dates of first and last use. For advertisements containing performance results, the adviser must maintain the underlying data supporting the performance calculations and all other information supporting statements of fact made in the advertisement. These records must be maintained for five years after the last date of use, with the first two years in an easily accessible place.</p>

<p>For private equity fund managers, this creates significant compliance burdens. Each iteration of a pitch book, each version of the firm's website, each conference presentation, and each marketing email must be retained with appropriate documentation. When performance is presented, the supporting calculations, valuation data, and fund financial statements must be preserved. Many PE managers implement document management systems with version control and audit trails to satisfy these recordkeeping obligations.</p>

<h2>Political Contribution Rules and Pay-to-Play Restrictions</h2>

<p>Rule 206(4)-5 under the Investment Advisers Act, commonly known as the pay-to-play rule, restricts political contributions by investment advisers and their covered associates to prevent quid pro quo arrangements where advisers make political contributions with the expectation of receiving advisory business from government entities. The rule is particularly important for private equity managers seeking investments from public pension plans, which constitute a significant source of institutional capital for PE funds.</p>

<p>The pay-to-play rule prohibits an investment adviser from providing advisory services for compensation to a government entity within two years after the adviser or any covered associate makes a contribution to certain officials of that government entity. This two-year time-out applies to contributions to officials who can influence the selection of investment advisers by the government entity, including elected officials with authority over the government entity and officials with direct responsibility for selecting advisers.</p>

<p>Covered associates include the adviser's general partners, managing members, executive officers, and other individuals with a similar status or function; employees who solicit government entities for the adviser; and supervised persons with authority to recommend or determine which government entities should be solicited. This broad definition captures senior investment professionals, fundraising personnel, and other key employees whose political contributions could potentially influence government investment decisions.</p>

<p>De minimis exemptions provide limited relief for small contributions. Covered associates who are entitled to vote for the official receiving the contribution may make contributions of up to $350 per election without triggering the two-year time-out. Contributions of up to $150 per election are permitted even if the covered associate cannot vote for the official. These de minimis amounts remain small enough that they are unlikely to influence official actions while permitting basic political participation.</p>

<p>Private equity firms typically implement comprehensive compliance programs to prevent political contribution violations. These programs include pre-clearance requirements for all political contributions by covered associates, prohibitions on contributions exceeding de minimis amounts to relevant officials, tracking systems to monitor contributions and identify potential violations, and training programs to ensure covered associates understand the restrictions and their obligations.</p>

<p>Violations of the pay-to-play rule create significant consequences. Beyond SEC enforcement risk, many limited partnership agreements include representations and warranties that the adviser has not violated the rule, and violations could constitute grounds for termination or fee recoupment. Public pension plans often require detailed questionnaires about political contributions as part of their due diligence processes, and violations can disqualify managers from consideration for investments.</p>

<p>The pay-to-play rule also restricts third-party placement agents and solicitors. Investment advisers are prohibited from providing compensation to third parties for soliciting government entities unless the third party is a registered investment adviser or registered broker-dealer subject to pay-to-play restrictions. This provision aims to prevent advisers from circumventing the rule by using unregulated intermediaries to make contributions or provide benefits to government officials on their behalf.</p>

<h2>ERISA Considerations for Private Equity Funds</h2>

<p>The Employee Retirement Income Security Act of 1974 imposes fiduciary obligations, prohibited transaction restrictions, and reporting requirements on retirement plans and those who manage plan assets. When pension funds, 401(k) plans, individual retirement accounts, or other employee benefit plans invest in private equity funds, ERISA's requirements potentially apply to both the investing plans and the PE fund managers, creating compliance obligations and liability exposure that must be carefully managed.</p>

<p>The central ERISA question for private equity funds is whether the fund's assets constitute plan assets of investing benefit plans. When a fund's assets are deemed to include plan assets, the fund manager becomes an ERISA fiduciary subject to ERISA's duty of loyalty and duty of prudence, prohibited transaction rules under Section 406 apply to fund activities, and additional reporting and disclosure obligations may arise.</p>

<h3>Plan Assets Determination</h3>

<p>The Department of Labor's plan assets regulation under ERISA Section 3(42) establishes the framework for determining when a fund's assets include plan assets. Under the regulation, when a benefit plan acquires an equity interest in an entity, the plan's assets include both the equity interest and an undivided interest in each underlying asset of the entity, unless an exception applies. This look-through treatment would make portfolio company investments plan assets subject to ERISA restrictions.</p>

<p>The venture capital operating company exception provides the most commonly used plan asset exemption for private equity funds. An entity qualifies as a VCOC if at least 50 percent of its assets (valued at cost) are invested in venture capital investments or operating companies in which the entity has management rights. Management rights mean contractual rights directly or indirectly to substantially participate in or influence the conduct of the management of the portfolio company.</p>

<p>Most traditional private equity funds that take control positions in portfolio companies, appoint board members, and actively participate in portfolio company management can qualify as VCOCs. The control-oriented nature of PE investing naturally provides the management rights necessary for VCOC qualification. However, funds must monitor the 50 percent threshold continuously, as falling below it causes loss of VCOC status and immediate plan asset treatment of fund assets.</p>

<p>The 25 percent limitation provides an alternative method for avoiding plan asset status. Under the plan assets regulation, an entity's assets do not include plan assets if less than 25 percent of the value of each class of equity interests is held by benefit plan investors. The 25 percent calculation excludes equity held by the general partner and other persons with discretionary authority or control over the fund's assets, meaning that only limited partner interests are counted toward the threshold.</p>

<p>Many private equity funds that qualify as VCOCs also implement 25 percent limitations as a belt-and-suspenders approach or to provide protection if VCOC status is inadvertently lost. Fund offering documents include provisions authorizing the general partner to reject subscriptions from benefit plan investors if accepting the subscription would cause benefit plan investor ownership to exceed 25 percent, to require redemptions if the threshold is breached, or to segregate plan investors into separate parallel funds to maintain compliance.</p>

<h3>ERISA Fiduciary Obligations</h3>

<p>If a private equity fund's assets include plan assets because the fund cannot qualify for the VCOC exception or 25 percent limitation, the fund manager becomes an ERISA fiduciary subject to the duty of loyalty and duty of prudence. The duty of loyalty requires fiduciaries to discharge their duties solely in the interest of plan participants and beneficiaries, for the exclusive purpose of providing benefits and defraying reasonable expenses of administering the plan.</p>

<p>The duty of prudence requires fiduciaries to act with the care, skill, prudence, and diligence that a prudent person acting in a like capacity and familiar with such matters would use in conducting an enterprise of a like character with like aims. This prudence standard requires documented investment processes, thorough due diligence, reasonable fee structures, and diversification of investments to minimize the risk of large losses.</p>

<p>ERISA's prohibited transaction rules under Section 406 prohibit specific categories of transactions between plans and parties in interest, including sales or exchanges of property, loans or extensions of credit, and furnishing of goods or services. For private equity funds subject to plan asset treatment, portfolio company transactions with parties in interest to investing plans could violate these prohibitions unless an exemption applies.</p>

<p>Prohibited Transaction Exemption 2006-16 provides important relief for private equity funds subject to plan asset treatment. The exemption permits certain transactions between operating companies and parties in interest to benefit plan investors, provided specified conditions are satisfied including that the transaction is on terms at least as favorable to the fund as an arm's length transaction with an unrelated party and the fund manager adheres to its documented investment policies and procedures.</p>

<h2>Annual Compliance Review and CCO Responsibilities</h2>

<p>Rule 206(4)-7 under the Advisers Act requires every registered investment adviser to adopt and implement written compliance policies and procedures reasonably designed to prevent violations of the Advisers Act and the rules thereunder. The rule also requires advisers to designate a chief compliance officer responsible for administering the compliance program and to conduct an annual review of the adequacy and effectiveness of the policies and procedures.</p>

<h3>Written Compliance Policies and Procedures</h3>

<p>The compliance program must be tailored to the specific business model, services offered, conflicts of interest, and risk profile of the investment adviser. For private equity fund managers, the program should address portfolio management processes, valuation methodologies, allocation of investment opportunities among funds, performance calculations, marketing and advertising, custody, books and records, personal securities transactions, insider trading, conflicts of interest, code of ethics, privacy and data security, business continuity, and supervision of employees.</p>

<p>Investment allocation policies assume particular importance for multi-fund PE managers. When a manager advises multiple private equity funds with overlapping investment mandates, the compliance program must establish clear criteria for allocating opportunities among the funds to ensure fair treatment and avoid favoring one fund over another. Typical allocation approaches consider factors such as available capital, fund vintage, strategy fit, portfolio company stage, and existing portfolio composition.</p>

<p>Valuation policies for private equity funds must describe the methodologies used to value portfolio companies, the frequency of valuations, the approval process for valuation determinations, and the use of third-party valuation specialists if applicable. Fair value measurements should comply with <a href="https://fasb.org" target="_blank" rel="noopener noreferrer">FASB</a> ASC 820 standards. Given the illiquid nature of private equity investments and the judgment required in valuation, robust policies with appropriate governance help ensure consistency and defensibility of fair value determinations.</p>

<p>Conflicts of interest policies should identify the specific conflicts facing the adviser and establish procedures for addressing each category of conflict. Common conflicts for PE managers include allocation of opportunities among funds, co-investment arrangements where key employees invest alongside funds on favorable terms, transactions between portfolio companies and adviser-affiliated entities, use of affiliated service providers, and general partner clawback obligations (modeled with the <a href="/tools/distribution-waterfall">Distribution Waterfall Visualizer</a>) that may create incentives to delay distributions or realize investments in particular sequences.</p>

<h3>Chief Compliance Officer Role and Qualifications</h3>

<p>The chief compliance officer must be competent and knowledgeable regarding the Advisers Act and must be empowered with full responsibility and authority to develop and enforce appropriate policies and procedures. The CCO should have direct access to the adviser's board of directors or equivalent governing body and sufficient resources to carry out compliance responsibilities effectively.</p>

<p>For private equity fund managers, the CCO role requires understanding both traditional investment adviser compliance and PE-specific considerations including fund structuring, limited partnership agreements, capital calls and distributions, <a href="/tools/distribution-waterfall">carried interest calculations</a>, and investor relations practices. Many PE firms hire CCOs with backgrounds at law firms specializing in investment management, compliance roles at other private fund managers, or examination experience at the SEC.</p>

<p>The CCO's responsibilities include developing and updating the compliance program, implementing compliance training for employees, monitoring adherence to policies and procedures, investigating potential violations, managing the firm's regulatory examination process, coordinating with outside counsel on regulatory matters, and conducting the annual compliance review. The CCO typically reports to the firm's senior management and presents compliance matters to the board or advisory committee regularly.</p>

<h3>Annual Compliance Review</h3>

<p>The annual review required by Rule 206(4)-7 must assess the adequacy of the compliance policies and procedures and the effectiveness of their implementation. This review should evaluate whether the policies remain reasonably designed to prevent violations given changes in the firm's business, assess whether employees are following established procedures, identify any compliance violations that occurred during the year, and recommend updates or enhancements to strengthen the program.</p>

<p>The annual review methodology typically includes interviewing key personnel to assess their understanding of policies and compliance obligations, testing specific controls through sampling of investment decisions, marketing materials, expense allocations, or other activities, reviewing exception reports and compliance incidents that occurred during the year, analyzing regulatory developments including new rules, examination priorities, and enforcement actions, and evaluating adequacy of resources devoted to the compliance function.</p>

<p>The CCO must prepare a written report of the annual review and present it to the adviser's board of directors or equivalent governing body. The report should summarize the review process, document findings and identified deficiencies, describe remedial actions taken or recommended, and include recommendations for program improvements. Many advisers memorialize the board's consideration of the annual review report in board minutes, documenting the board's oversight of the compliance program.</p>

<h2>Examination Preparedness and Regulatory Engagement</h2>

<p>Registered investment advisers are subject to examination by the SEC's Division of Examinations, which conducts risk-based examinations to assess compliance with the Advisers Act and other securities laws. Private equity fund managers should expect to be examined periodically and should maintain examination readiness through organized books and records, current compliance policies, and documented compliance processes.</p>

<p>SEC examinations of private equity advisers typically focus on several core areas. Conflicts of interest receive significant attention, with examiners evaluating whether the adviser has adequately disclosed conflicts and implemented controls to address them. Common conflicts examined include allocation of expenses between the adviser and funds, allocation of broken deal expenses, use of portfolio company transaction fees and monitoring fees, acceleration of monitoring fees in connection with portfolio company sales, co-investment allocation practices, and preferential treatment of certain investors through side letters.</p>

<p>Valuation practices represent another frequent examination focus area for PE managers. Examiners review the adviser's valuation policies, assess whether valuations are determined consistently with stated policies per <a href="https://fasb.org" target="_blank" rel="noopener noreferrer">FASB</a> ASC 820 fair value standards, evaluate the independence and expertise of persons making valuation determinations, and compare valuations to subsequent events such as sales or markdowns. Significant discrepancies between quarter-end valuations and near-term sale prices often prompt examiner scrutiny.</p>

<p>Marketing and performance advertising has intensified as an examination priority following adoption of the Marketing Rule. Examiners review pitch books, website content, conference presentations, and other marketing materials for compliance with performance advertising requirements, testimonial disclosures, and prohibitions on false or misleading statements. Advisers should maintain robust documentation supporting performance calculations and retain all versions of marketing materials as required by Rule 204-2.</p>

<p>When the SEC initiates an examination, the adviser receives a document request list seeking extensive records across the areas under examination. Response to this initial request typically requires coordination across multiple functions including compliance, finance, investor relations, and legal. Advisers should organize responsive documents systematically, review materials for accuracy and completeness before production, and maintain privilege logs for any privileged materials withheld.</p>

<p>Following completion of the examination, the SEC staff typically provides a deficiency letter identifying compliance issues discovered during the examination and requesting corrective actions. Advisers should respond comprehensively, describing remedial measures implemented and demonstrating that identified deficiencies have been addressed. In some cases, examinations may result in enforcement referrals for more serious violations, leading to settlement negotiations or enforcement proceedings.</p>

<h2>Key Takeaways</h2>

<ul>
<li><strong>SEC registration creates comprehensive compliance obligations:</strong> Private equity fund managers with $150 million or more in regulatory assets under management must register with the SEC, adopt written compliance programs, maintain extensive books and records, file Form ADV and Form PF, and submit to SEC examination authority.</li>

<li><strong>Form ADV disclosure should be complete and current:</strong> Part 1 provides regulatory information about the adviser's business while Part 2 serves as the primary disclosure document to clients. Both must be updated annually and whenever information becomes materially inaccurate, with particular attention to conflicts of interest disclosure in Part 2.</li>

<li><strong>Form PF reporting requirements vary by fund size:</strong> All private fund advisers with $150 million or more in AUM must file Form PF annually, while large PE advisers with $2 billion or more must file annually with more detailed fund-level information. Data collection systems must support aggregation of required information from multiple sources.</li>

<li><strong>Custody rule compliance centers on annual audits:</strong> Private equity fund managers typically satisfy custody rule requirements by distributing audited financial statements prepared by PCAOB-registered auditors within 120 days of fiscal year end, aligning with common LPA requirements and investor expectations.</li>

<li><strong>Marketing practices must comply with the Marketing Rule:</strong> Performance advertising requires presentation of gross and net returns with equal prominence, inclusion of all substantially similar portfolios, appropriate time period selection, and extensive documentation. Testimonials require specific disclosures about compensation and conflicts.</li>

<li><strong>Political contributions demand careful monitoring:</strong> The pay-to-play rule prohibits advisory services to government entities for two years following contributions by the adviser or covered associates to certain officials, with only de minimis contributions permitted. Violations can disqualify managers from public pension plan investments.</li>

<li><strong>ERISA plan asset status requires proactive management:</strong> Most PE funds qualify as VCOCs through control positions with management rights or implement 25 percent limitations on benefit plan investor participation. Failure to avoid plan asset status subjects managers to ERISA fiduciary duties and prohibited transaction restrictions.</li>

<li><strong>Annual compliance reviews assess program effectiveness:</strong> The chief compliance officer must conduct annual reviews evaluating whether policies remain reasonably designed to prevent violations and whether employees follow established procedures. Written reports to the board document findings and recommendations.</li>

<li><strong>CCO competence and empowerment are essential:</strong> The chief compliance officer should have expertise in investment adviser regulation, authority to develop and enforce policies, adequate resources to fulfill responsibilities, and direct access to senior management and the board.</li>

<li><strong>Examination preparedness requires ongoing attention:</strong> Organized books and records, current compliance policies, documented processes, and robust controls position advisers to respond effectively to SEC examinations. Focus areas typically include conflicts of interest, valuation practices, fee calculations, and marketing materials.</li>
</ul>`,
  metaTitle: 'Compliance for Private Equity Funds: SEC Registration & Requirements',
  metaDescription: 'Comprehensive guide to PE fund compliance covering SEC registration, Form ADV/PF requirements, custody rules, marketing regulations, political contributions, ERISA considerations, and CCO responsibilities.',
  publishedDate: 'November 18, 2025',
  lastUpdatedDate: 'January 6, 2025',
  readingTime: 23,
}

export default article
