import { Article } from '../types'

const article: Article = {
  id: 'venture-capital-compliance-compliance',
  title: 'Compliance for Venture Capital Funds: Navigating the VC Adviser Exemption and Regulatory Framework',
  slug: 'compliance',
  subtitle: 'Understanding VC fund adviser exemption requirements, Form ADV/PF obligations, investment restrictions, QSBS considerations, pay-to-play rules, and NVCA model documents',
  fundType: 'venture-capital',
  pillar: 'compliance',
  content: `<p>Venture capital fund managers occupy a unique position in the investment adviser regulatory landscape. While the Dodd-Frank Wall Street Reform and Consumer Protection Act eliminated the private adviser exemption that most fund managers previously relied upon, Congress simultaneously created a new exemption specifically for venture capital fund advisers. This exemption recognizes the distinctive characteristics of venture capital investing and the lower systemic risk profile of VC funds compared to hedge funds and other investment vehicles, allowing qualifying VC advisers to avoid SEC registration regardless of their assets under management.</p>

<p>The venture capital fund adviser exemption provides substantial regulatory relief, but qualifying for and maintaining the exemption requires careful attention to the statutory and regulatory definition of a venture capital fund. Advisers must ensure their funds limit investments to qualifying portfolio companies, avoid leverage beyond short-term amounts, refrain from offering redemption rights, and conduct their business consistently with the venture capital model contemplated by the exemption. Even exempt advisers face certain regulatory obligations, including Form ADV Part 1A reporting, maintenance of books and records, and potential examination by the SEC under certain circumstances.</p>

<p>For venture capital advisers that exceed the exemption's parameters or choose to register with the SEC voluntarily, the full compliance framework under the Investment Advisers Act of 1940 applies. These registered VC advisers must file comprehensive Form ADV disclosures, potentially file Form PF for systemic risk monitoring, adopt written compliance programs, designate chief compliance officers, satisfy custody rule requirements, comply with marketing and advertising regulations, and navigate political contribution restrictions when seeking investments from public pension plans. Additionally, all VC fund managers must consider investment structuring issues including QSBS qualification for founders and investors, pay-to-play rules, and industry-standard documentation practices reflected in National Venture Capital Association model documents.</p>

<h2>The Venture Capital Fund Adviser Exemption</h2>

<p>Section 203(l) of the Investment Advisers Act, added by the Dodd-Frank Act in 2010, exempts from registration any investment adviser that solely advises venture capital funds. This exemption applies regardless of the adviser's assets under management, providing relief for both emerging VC fund managers and established firms with billions in capital under management. The exemption recognizes that venture capital funds, which invest in illiquid early-stage companies with long holding periods and limited leverage, pose minimal systemic risk to financial markets.</p>

<p>To qualify for the exemption, an adviser must advise solely venture capital funds, meaning every fund managed must meet the regulatory definition of a venture capital fund. An adviser that manages even one fund that fails to qualify as a venture capital fund loses the exemption entirely and must register with the SEC if its regulatory assets under management exceed $150 million. This "all or nothing" standard requires careful structuring for advisers managing multiple vehicles or considering expansion into later-stage growth equity or other investment strategies.</p>

<h3>Defining a Venture Capital Fund</h3>

<p>Rule 203(l)-1 under the Advisers Act establishes the regulatory definition of venture capital fund. To qualify, a private fund must represent itself as pursuing a venture capital strategy, hold no more than 20 percent of the fund's capital in non-qualifying investments, not incur leverage in excess of 15 percent of the fund's capital for longer than 120 days (except for certain short-term cash management borrowing), and not offer redemption rights to investors except in extraordinary circumstances.</p>

<p>The qualifying investment requirement forms the core of the VC fund definition. Qualifying investments include equity securities of qualifying portfolio companies that are directly acquired by the fund; equity securities of qualifying portfolio companies acquired in exchange for equity securities originally acquired directly by the fund; and short-term holdings pending deployment in qualifying investments. To constitute a qualifying portfolio company, the issuer must be directly or indirectly controlled by the fund at the time of the fund's investment, must not be reporting or foreign traded, and must not borrow or issue debt in connection with the fund's investment in the equity securities.</p>

<p>The control requirement merits particular attention. A fund is deemed to control a portfolio company if it owns more than 50 percent of the voting securities (or in the case of a limited partnership or LLC, more than 50 percent of the equity interests), or if the fund has the right to nominate or appoint at least 50 percent of the board of directors. For investments where the fund acquires less than a majority position, control can still be established through board control even with a minority equity stake.</p>

<p>The prohibition on portfolio company leverage distinguishes venture capital from leveraged buyouts and other control investment strategies that rely on portfolio company debt. A fund cannot treat as a qualifying investment any equity securities acquired in a transaction where the portfolio company borrows money or issues debt obligations in connection with the fund's investment. This restriction prevents VC funds from financing acquisitions with portfolio company debt or recapitalizing portfolio companies through dividend recapitalizations involving new borrowing.</p>

<p>The non-reporting, non-foreign traded requirement ensures that venture capital funds focus on private, illiquid companies rather than public market securities. Qualifying portfolio companies cannot be required to file reports under Section 13 or 15(d) of the Securities Exchange Act (making them public reporting companies) and cannot be foreign traded securities as defined in Rule 3a-1 under the Investment Company Act. This restriction prevents VC funds from investing in publicly traded stocks, though funds may continue to hold securities of portfolio companies that subsequently go public.</p>

<h3>The 20 Percent Basket for Non-Qualifying Investments</h3>

<p>Rule 203(l)-1 permits venture capital funds to hold up to 20 percent of committed capital in non-qualifying investments, providing flexibility for investments that don't meet all qualifying investment criteria. This basket accommodates investments where the fund lacks control, holdings of public securities, short-term cash management vehicles, and other assets that serve legitimate portfolio purposes but don't constitute core venture capital investments.</p>

<p>The 20 percent limitation is measured using committed capital rather than net asset value or invested capital. For funds with capital calls, the denominator remains the total committed capital regardless of how much capital has been called and invested. This measurement approach creates predictability, as the 20 percent threshold doesn't fluctuate with unrealized gains and losses in the portfolio, though advisers must monitor the basket carefully as capital is deployed to ensure non-qualifying investments don't exceed the limit.</p>

<p>Common uses of the non-qualifying investment basket include minority investments where the fund doesn't obtain control through equity ownership or board representation, investments using convertible notes or other debt instruments that later convert to equity, public securities held after portfolio companies complete initial public offerings or are acquired by public companies in stock transactions, and treasury management investments in money market funds, government securities, or other cash equivalent instruments.</p>

<p>Funds must implement tracking systems to monitor the percentage of capital invested in non-qualifying investments. Breaching the 20 percent threshold causes the fund to lose qualification as a venture capital fund, potentially subjecting the adviser to registration requirements. Many fund managers maintain a buffer below 20 percent to avoid inadvertent breaches due to market movements, currency fluctuations affecting international cash holdings, or investments that turn out to be non-qualifying due to unexpected developments in portfolio company capital structures.</p>

<h3>Leverage Limitations</h3>

<p>Venture capital funds may not incur leverage in excess of 15 percent of the fund's committed capital outstanding for more than 120 calendar days. This limitation is calculated without netting cash and cash equivalents, meaning a fund with $100 million in committed capital, $20 million in outstanding borrowing, and $15 million in cash would be measured as having 20 percent leverage for purposes of the test despite having only $5 million in net debt.</p>

<p>The 120-day period provides flexibility for bridge financing situations where funds temporarily borrow to accelerate investments pending capital calls, fund management fees or expenses during periods between capital calls, or address timing mismatches between investment opportunities and capital availability. However, funds using subscription credit facilities as permanent capital structures risk exceeding the 120-day limitation if borrowings remain outstanding for extended periods.</p>

<p>Short-term cash management borrowings receive special treatment under Rule 203(l)-1. These borrowings are not subject to the 15 percent limitation provided they are used solely for cash management purposes and are repaid within 60 calendar days. This carve-out accommodates overdrafts, short-term bridge financing, and other brief borrowings that facilitate ordinary business operations without constituting leverage as a funding strategy.</p>

<p>Many venture capital funds avoid leverage entirely, particularly early-stage funds where the investment model focuses on deploying committed capital over time rather than leveraging fund assets. For funds that do utilize subscription lines or other financing, careful monitoring systems must track borrowing amounts, duration, and purposes to ensure compliance with the leverage limitations. Breaching these limitations causes loss of VC fund status, exposing the adviser to potential registration requirements.</p>

<h3>Redemption Rights Restrictions</h3>

<p>Venture capital funds may not offer investors redemption rights except in extraordinary circumstances. This requirement reflects the illiquid, long-term nature of venture capital investing and distinguishes VC funds from hedge funds and other vehicles that provide periodic liquidity to investors. The restriction aligns with standard VC fund structures that commit capital for ten-year terms (with possible extensions) without offering redemption options.</p>

<p>The rule permits redemptions in extraordinary circumstances, such as to comply with federal or state law or regulations, upon request of the SEC, CFTC, or other regulatory authorities, to facilitate transfers to qualify for ERISA benefit plan investor exceptions, or to facilitate transfers upon death, divorce, or incapacity of limited partners. These limited exceptions accommodate unavoidable redemptions while preventing funds from operating as liquid vehicles.</p>

<p>Most venture capital fund limited partnership agreements do not provide redemption rights but do include provisions for permitted transfers among affiliated entities, to family members, or to charitable foundations, and for removal of the general partner upon material breach, fraud, or criminal conviction. These provisions serve governance purposes without constituting redemption rights that would disqualify the fund.</p>

<h3>Holding Out as Pursuing a Venture Capital Strategy</h3>

<p>Beyond meeting the technical investment, leverage, and redemption requirements, a fund must represent itself as pursuing a venture capital strategy to qualify for the exemption. This holding out requirement considers the fund's marketing materials, organizational documents, investor communications, and actual investment practices to determine whether the fund consistently represents and operates as a venture capital fund.</p>

<p>Limited partnership agreements typically include strategy descriptions indicating that the fund will invest in early-stage companies, provide growth capital to emerging businesses, or deploy capital in venture capital investments. Marketing materials describe the adviser's venture capital investment approach, target company stages, and industry focuses. Annual reports and quarterly updates characterize portfolio companies using venture capital terminology and discuss investments in the context of the VC market.</p>

<p>Funds that market themselves as growth equity funds, expansion capital funds, or late-stage investors may not qualify for the VC fund adviser exemption even if their investments technically meet the qualifying investment requirements. The SEC has indicated that funds pursuing growth equity strategies in companies that have achieved substantial revenue and operate established business models should analyze carefully whether they genuinely represent themselves as pursuing venture capital strategies.</p>

<h2>Obligations of Exempt VC Advisers</h2>

<p>Investment advisers relying on the venture capital fund adviser exemption are not required to register with the SEC but remain subject to certain regulatory obligations. These limited requirements provide the SEC with basic information about exempt advisers while avoiding the full compliance burdens applicable to registered advisers.</p>

<h3>Form ADV Part 1A Limited Reporting</h3>

<p>Exempt venture capital fund advisers must file portions of Form ADV Part 1A with the SEC electronically through the Investment Adviser Registration Depository. This limited Form ADV filing includes basic identifying information about the adviser, information about the adviser's business, ownership structure, and certain disciplinary history. The filing does not include the narrative brochure (Form ADV Part 2) that registered advisers must provide to clients.</p>

<p>Specifically, exempt VC advisers must complete Items 1, 2A, 2B, 3, 6, 7, and 10 of Form ADV Part 1A. These items capture the adviser's basic identifying information including name, address, and contact details; information about the adviser's business including client types, assets under management, and types of advisory services offered; information about control persons and owners; disciplinary history; and the specific exemption being claimed. Item 10 addresses control persons, requiring disclosure of individuals and entities with ownership or control over the adviser.</p>

<p>Schedule R requires reporting about private fund adviser exemptions and AIFMD reporting. Exempt VC advisers use this schedule to specify that they are claiming the venture capital fund adviser exemption under Section 203(l) and to provide basic information about assets under management. The filing must be updated annually within 90 days of the adviser's fiscal year end, maintaining current information about the adviser's business and exemption status.</p>

<p>Exempt advisers do not pay registration fees to the SEC and do not receive examination priorities or schedules as registered advisers do. However, the information filed on Form ADV Part 1A enables the SEC to maintain census data about the venture capital industry, identify advisers that may no longer qualify for exemptions, and select exempt advisers for examination when appropriate.</p>

<h3>Books and Records Requirements</h3>

<p>Exempt venture capital advisers must maintain books and records under Rule 204-1 of the Advisers Act, though the specific records required are more limited than those applicable to registered advisers. Required records include a journal or journals recording cash receipts and disbursements; general and auxiliary ledgers reflecting asset, liability, reserve, capital, income, and expense accounts; a memorandum of each order and investment decision showing terms and conditions, persons involved, and accounts for which entered; a list of discretionary accounts identified as such; all powers of attorney and discretionary authority documents; copies of written communications circulated to ten or more persons; organizational documents including partnership agreements, articles of incorporation, and financial statements; written agreements with clients; and a file for each client or investor containing name, address, and other information.</p>

<p>These books and records must be maintained in an easily accessible place for five years, with the first two years in an appropriate office of the adviser. Electronic storage is permitted provided the records are maintained in a non-rewritable, non-erasable format and can be accessed promptly. Many exempt advisers use cloud-based document management systems to satisfy these requirements while facilitating remote access and ensuring business continuity.</p>

<p>The scope of required records for exempt VC advisers excludes certain recordkeeping obligations applicable to registered advisers, such as records supporting performance advertising, written compliance policies and procedures, annual compliance reviews, and certain trading records. This simplified recordkeeping framework reduces compliance burdens while maintaining accountability and enabling examination if the SEC determines examination is appropriate.</p>

<h3>SEC Examination Authority</h3>

<p>The SEC retains examination authority over exempt venture capital advisers despite their exemption from registration. Section 204 of the Advisers Act authorizes the SEC to examine the books and records of any investment adviser or person having custody or use of client funds or securities. This authority extends to exempt advisers, though in practice the SEC conducts examinations of exempt VC advisers less frequently than examinations of registered advisers.</p>

<p>When the SEC examines an exempt VC adviser, the examination typically focuses on verifying continued eligibility for the exemption by reviewing fund investments to confirm compliance with qualifying investment requirements, analyzing leverage to ensure compliance with borrowing limitations, examining organizational documents and investor agreements to verify absence of redemption rights, and assessing whether funds hold themselves out as pursuing venture capital strategies.</p>

<p>Examinations may also address other federal securities law compliance including anti-fraud provisions of the Advisers Act, which apply to exempt advisers; compliance with Form ADV reporting requirements; maintenance of required books and records; and adherence to representations made to investors in offering documents and marketing materials. Exempt VC advisers should maintain examination readiness through organized records, documented compliance processes, and clear analysis supporting the adviser's exemption eligibility.</p>

<h2>Form ADV for Registered VC Advisers</h2>

<p>Venture capital advisers that do not qualify for or choose not to rely on the VC fund adviser exemption must register with the SEC if their regulatory assets under management reach $150 million. Registration requires filing comprehensive Form ADV disclosures addressing the adviser's business, services, conflicts of interest, and disciplinary history. While the Form ADV requirements apply uniformly to all registered investment advisers, certain items present VC-specific considerations.</p>

<h3>Form ADV Part 1 for VC Advisers</h3>

<p>Part 1 of Form ADV collects regulatory information across multiple items and schedules. Item 5 requests information about client types and assets under management, with VC advisers typically reporting substantial assets in pooled investment vehicles. The regulatory assets under management calculation for VC advisers uses gross asset value of the private funds advised, including the value of all portfolio investments without deducting leverage or fund expenses.</p>

<p>Item 7 addresses adviser participation in client transactions, with Section 7.B specifically requiring detailed reporting about each private fund advised. For each venture capital fund, advisers must provide identification information including fund name, legal entity identifier if applicable, and primary country of investment. Fund type classification typically selects "venture capital fund" though fund-of-funds vehicles may select alternative classifications. The reported regulatory assets under management and gross asset value for each fund contribute to determining Form PF filing obligations and SEC examination priorities.</p>

<p>Section 7.B also requests strategy information, with VC funds typically indicating strategies such as "early stage," "expansion capital," "seed stage," or "growth equity." Beneficial ownership information addresses whether any person directly or indirectly owns 25 percent or more of the fund's equity interests, which is uncommon for institutional VC funds but may apply to funds with concentrated investor bases or significant general partner capital commitments.</p>

<p>Schedule D provides detailed disclosures supporting responses in Items 7, 10, and 11 of Form ADV Part 1. Section 7.B of Schedule D captures extensive information about each private fund including legal name, organizational form, jurisdiction of organization, whether the fund is a master-feeder or parallel fund structure, advisory fees charged, and whether performance-based fees are charged. For VC funds with carried interest structures, the Schedule indicates performance-based fees with specifics about calculation and payment described in Part 2 of Form ADV.</p>

<h3>Form ADV Part 2 Considerations for VC Advisers</h3>

<p>Part 2 of Form ADV serves as the registered adviser's disclosure brochure, providing narrative information about the firm's services, fees, conflicts, and business practices. Venture capital advisers should tailor Part 2 to clearly describe their VC-focused investment approach and address conflicts common to venture capital fund management.</p>

<p>Item 4 describes the adviser's business, providing an opportunity to explain the firm's focus on venture capital investing, typical investment strategies, target company stages, and sector specializations. VC advisers should describe whether they focus on seed stage, early stage, or later-stage companies, whether they concentrate investments in particular industries or geographies, and whether they employ specific investment approaches such as corporate venture capital, impact investing, or deep technology focus.</p>

<p>Item 5 addresses fees and compensation, requiring detailed disclosure of management fees and carried interest structures. Venture capital fund management fees commonly range from 1.5 to 2.5 percent of committed capital during the investment period, transitioning to fees based on invested capital or remaining portfolio value after the investment period concludes. The brochure should clearly explain when the transition occurs, how invested capital or portfolio value is calculated, and whether certain investments are excluded from the fee basis.</p>

<p>Carried interest in venture capital funds typically provides the general partner with 20 to 30 percent of profits after returning capital and preferred returns to limited partners. Most VC funds use deal-by-deal carry calculations where each investment contributes to carried interest upon realization, with clawback provisions requiring return of excess distributions if the fund's overall performance doesn't support the distributions. The brochure should explain the carried interest percentage, preferred return threshold (typically 8 percent), waterfall calculation methodology, and clawback mechanics.</p>

<p>Items 10 through 12 address conflicts of interest, other financial industry activities, and brokerage practices. Venture capital advisers face numerous conflicts requiring disclosure, including allocation of opportunities among funds when managing multiple vehicles with overlapping investment mandates, co-investment rights for general partner principals and limited partners creating potential preferential treatment, investments by the adviser or its personnel in portfolio companies outside fund vehicles, service provider relationships where the adviser or its affiliates receive compensation from portfolio companies, and follow-on investment decisions where existing portfolio companies require additional capital but may not represent the most attractive available opportunities.</p>

<p>Item 11 addresses code of ethics requirements and personal trading. Venture capital advisers must adopt codes of ethics establishing standards of business conduct, compliance with securities laws, and procedures for reporting and reviewing personal securities transactions by access persons. For VC advisers, the personal trading rules apply most significantly to situations where access persons invest personally in companies that funds advised by the firm also invest in or might invest in, requiring pre-clearance and reporting to prevent conflicts and front-running.</p>

<h2>Form PF for Venture Capital Advisers</h2>

<p>Form PF, the confidential private fund reporting form filed with the SEC for systemic risk monitoring purposes, applies to registered investment advisers that manage private funds and have at least $150 million in private fund assets under management. Venture capital advisers below this threshold are not required to file Form PF, and exempt VC advisers relying on the Section 203(l) exemption never file Form PF regardless of assets under management.</p>

<p>When registered VC advisers exceed the $150 million threshold, they must file Form PF annually, reporting within 120 days after fiscal year end. The filing consists of Section 1, which applies to all Form PF filers and collects basic information about the adviser and each private fund managed. Unlike hedge fund advisers that may be required to complete more detailed sections with quarterly filing deadlines, VC advisers typically complete only Section 1 unless they also manage hedge funds or private equity funds causing them to meet thresholds for other sections.</p>

<h3>Section 1 Reporting Requirements</h3>

<p>Section 1 of Form PF requests basic information about the adviser and fund-level information for each private fund advised. Question 2 asks for total private fund assets under management broken down by fund type. Venture capital advisers classify their funds as "venture capital funds" unless a particular vehicle is more appropriately classified as another fund type such as a fund of funds or real estate fund.</p>

<p>Questions 3 through 15 collect information about each private fund. Question 5 addresses the fund's structure, indicating whether the fund is a master-feeder arrangement or parallel fund structure. Question 6 requests strategy classification, with VC funds selecting from strategies including "early stage," "expansion capital," "seed stage," "venture debt," or "other venture capital strategy." Multiple strategy classifications may be selected if the fund employs multiple approaches.</p>

<p>Question 7 addresses related persons, requesting information about parallel fund structures, master-feeder arrangements, and other related funds. Venture capital fund families commonly include parallel fund structures with offshore and onshore vehicles, requiring coordinated reporting of these relationships. Question 8 addresses beneficial ownership concentration, asking whether any beneficial owner holds 25 percent or more of the fund's ownership interests.</p>

<p>Questions 9 and 10 request financial information including gross and net asset value and investor flows during the reporting period. For venture capital funds, these questions capture the fund's portfolio value net of liabilities, investor contributions during the period through capital calls, and investor withdrawals through distributions. The net asset value reported reflects fair value of portfolio investments, which for private company holdings requires valuation determinations by the adviser.</p>

<p>Question 11 addresses portfolio investments, requesting the number of portfolio investments and concentration in the largest investments. Question 12 requests information about fund borrowing including total borrowing, weighted average maturity, and counterparties. Venture capital funds typically report minimal borrowing given the industry's limited use of leverage, though funds utilizing subscription credit facilities report those facilities as borrowings.</p>

<h3>Data Aggregation and Reporting Processes</h3>

<p>Form PF filing requires gathering data from multiple sources including fund administrators for financial information, portfolio company records for investment details, and custodians for borrowing information. Registered VC advisers should implement data aggregation processes well in advance of filing deadlines to identify information gaps, resolve inconsistencies, and ensure accurate reporting.</p>

<p>Many advisers coordinate Form PF data collection with annual audit processes, as both require similar underlying information about fund assets, valuations, and financial positions. Gathering information during year-end audit work allows advisers to leverage audit documentation for Form PF purposes and ensures consistency between audited financial statements and Form PF responses. This coordination becomes particularly efficient for advisers filing Form PF annually, as the deadline of 120 days after fiscal year end aligns with typical audit completion timelines.</p>

<h2>Investment Advisers Act Compliance for Registered VC Advisers</h2>

<p>Registered venture capital advisers must comply with the full regulatory framework under the Investment Advisers Act, including requirements to adopt written compliance programs, designate chief compliance officers, maintain comprehensive books and records, satisfy custody rule requirements, comply with marketing regulations, and avoid political contribution violations. While these requirements apply uniformly across registered advisers, certain aspects present VC-specific considerations.</p>

<h3>Written Compliance Program and CCO</h3>

<p>Rule 206(4)-7 requires every registered investment adviser to adopt written compliance policies and procedures reasonably designed to prevent violations of the Advisers Act and to designate a chief compliance officer responsible for administering the compliance program. For venture capital advisers, the compliance program should address investment allocation among funds, valuation of portfolio company investments, performance calculations and marketing materials, management fee calculations and expense allocations, conflicts of interest including service provider relationships and co-investments, personal securities transactions by access persons, and insider trading policies addressing MNPI about portfolio companies.</p>

<p>Investment allocation policies assume particular importance for multi-fund VC managers. When an adviser manages multiple venture capital funds with overlapping investment mandates, the compliance program must establish clear criteria for allocating opportunities among funds to ensure fair treatment. Common allocation approaches consider factors including available committed capital, fund investment stage focus, existing portfolio company ownership, and geographic or sector concentration limits in existing portfolios.</p>

<p>Valuation policies for venture capital funds must address the methodologies used to value private company investments, the frequency of valuations, governance processes for valuation approval, and use of third-party valuation specialists if applicable. Many VC funds employ valuation methodologies based on the AICPA Valuation of Portfolio Company Investments guide and International Private Equity and Venture Capital Valuation Guidelines, using approaches such as market comparables, discounted cash flows, or recent transaction prices when available.</p>

<p>The chief compliance officer should have competence and knowledge regarding the Advisers Act, full authority to develop and enforce compliance policies, adequate resources to carry out compliance responsibilities, and direct access to senior management and the board. For emerging venture capital fund managers, the CCO role may be filled by a general partner or senior professional with compliance expertise, while larger firms typically employ dedicated compliance personnel with backgrounds in investment adviser regulation.</p>

<h3>Annual Compliance Review</h3>

<p>Rule 206(4)-7 requires advisers to conduct annual reviews of their compliance programs, assessing the adequacy of policies and procedures and the effectiveness of their implementation. The annual review should evaluate whether policies remain reasonably designed to prevent violations given changes in the firm's business, determine whether employees follow established procedures through testing and sampling, identify compliance violations that occurred during the year and assess their causes, analyze regulatory developments including new rules and SEC examination priorities, and recommend program enhancements to strengthen controls.</p>

<p>The CCO must prepare a written report documenting the annual review and present it to the adviser's board of directors or equivalent governing body. For venture capital firms organized as limited liability companies without traditional boards, the annual review report is typically presented to senior management or an advisory board. The report should summarize the review methodology, document findings and deficiencies identified, describe remedial actions taken, and provide recommendations for program improvements.</p>

<h2>Custody Rule Compliance</h2>

<p>Rule 206(4)-2, the custody rule, addresses safeguarding of client assets and applies to advisers that have custody or possession of client funds or securities. Venture capital fund advisers typically have custody of fund assets due to their authority to direct portfolio company transactions, authorize capital calls and distributions, and serve as general partner or managing member of funds structured as partnerships or limited liability companies.</p>

<p>For venture capital funds, which are pooled investment vehicles, the primary custody rule requirement is distribution of audited financial statements to investors within 120 days of the fund's fiscal year end. The financial statements must be prepared by an independent public accountant registered with and subject to inspection by the Public Company Accounting Oversight Board. This audit requirement typically aligns with contractual obligations in limited partnership agreements, which commonly require annual audited financial statements within similar timeframes.</p>

<p>The audited financial statements must be prepared in accordance with generally accepted accounting principles and must include the auditor's opinion. For venture capital funds, the audit examines portfolio company valuations, capital account calculations, carried interest determinations, and compliance with the fund's valuation policies. Advisers should engage audit firms with expertise in venture capital fund audits and familiarity with the specialized accounting considerations applicable to early-stage company investments.</p>

<p>Qualified custodian requirements also apply to venture capital funds, requiring that fund assets be maintained with qualified custodians including banks, registered broker-dealers, or certain foreign financial institutions. For VC funds holding equity interests in portfolio companies, the qualified custodian typically holds stock certificates or other securities evidencing portfolio company ownership, with those securities registered in the fund's name or the custodian's name as nominee.</p>

<p>Venture capital funds structured to hold portfolio companies through nominee entities or holding companies must ensure custody rule compliance throughout the ownership chain. When funds use offshore entities to own portfolio companies for tax efficiency purposes, analysis is required to confirm that the offshore structures don't violate custody requirements or that appropriate custody arrangements are implemented for assets held through offshore vehicles.</p>

<h2>Marketing Rule and Performance Advertising</h2>

<p>The Marketing Rule, which replaced the previous advertising rule in November 2021, establishes principles-based requirements for investment adviser marketing and advertising. The rule applies broadly to communications offering advisory services or promoting advice, encompassing pitch books, websites, conference presentations, social media, and other marketing materials used by venture capital advisers to attract limited partners.</p>

<h3>General Prohibitions and Requirements</h3>

<p>The Marketing Rule's core prohibition makes it unlawful to disseminate advertisements containing untrue statements of material fact or that are otherwise false or misleading. Whether an advertisement is misleading depends on the overall context, including the sophistication of the intended audience. For venture capital fund marketing directed to institutional investors, the analysis considers these investors' substantial financial knowledge and experience with private fund structures.</p>

<p>The rule establishes specific prohibitions including restrictions on testimonials and endorsements without required disclosures, presentation of performance results without meeting specified standards, statements of fact without reasonable substantiation, and hypothetical performance unless specified conditions are satisfied. For VC advisers, the performance and testimonial provisions create the most significant compliance considerations.</p>

<p>Testimonials from limited partners, entrepreneurs, or other third parties may be used in marketing materials only if accompanied by specified disclosures. These include disclosure of any compensation provided for the testimonial, disclosure of any material conflicts of interest on the part of the person providing the testimonial, and a statement that the testimonial may not be representative of other clients' experiences. The adviser must also have a reasonable basis for believing the testimonial is not false or misleading.</p>

<h3>Performance Advertising Standards</h3>

<p>Performance advertising by venture capital advisers must comply with detailed requirements addressing calculation methodologies, time period selection, portfolio inclusion standards, and gross-versus-net presentation. All advertisements containing performance results must include both gross and net performance, with net performance reflecting deduction of management fees, carried interest, and all other fees and expenses charged to the fund. The gross and net returns must be presented with equal prominence.</p>

<p>The portfolio inclusion standard requires that performance advertisements include all portfolios falling within the particular category of the presented performance with substantially similar investment policies, objectives, and strategies. This prevents cherry-picking of only the best-performing funds when presenting track records. For example, a VC adviser presenting its early-stage fund performance must include all early-stage funds advised, not just top-performing vintage years, unless exclusion criteria are applied consistently and objectively.</p>

<p>Time period selection must avoid cherry-picking favorable measurement periods. Performance should be calculated through the most recent practicable date before the advertisement's first use, and advisers should avoid selecting measurement periods that artificially inflate returns by excluding periods of poor performance. If specific time periods are highlighted, the advertisement should provide context through longer-term performance or other relevant metrics.</p>

<p>Venture capital performance metrics typically include internal rate of return, multiple of invested capital, distributed to paid-in capital (DPI), residual value to paid-in capital (RVPI), and total value to paid-in capital (TVPI). When presenting IRR, advisers should clearly disclose the calculation methodology including whether the IRR is gross or net of fees, how capital calls and distributions are dated, treatment of unrealized investments, and the measurement date. MOIC and related metrics should indicate whether they are calculated gross or net of fees and expenses and how unrealized investments are valued.</p>

<h3>Predecessor Performance</h3>

<p>Predecessor performance presents unique considerations for venture capital advisers. When a team of investment professionals leaves an established VC firm to launch a new fund management company, the team typically wishes to present their track record from investments managed at the prior firm. The Marketing Rule permits predecessor performance advertising provided the advertisement clearly and prominently identifies and explains the predecessor nature of the performance and substantially all of the investment decision-makers responsible for the performance are employed by the new adviser.</p>

<p>To satisfy the substantially all standard, the key investment professionals who made decisions about the investments included in the predecessor performance must join the new adviser. For venture capital funds where investment decisions are made by partnership vote or investment committee, substantially all of the voting partners or committee members should move to the new firm. Supporting documentation should identify the decision-makers at the predecessor firm and demonstrate their employment at the successor adviser.</p>

<p>The predecessor performance must include all accounts with substantially similar investment policies, objectives, and strategies managed at the prior firm, not just selected successful funds. This prevents teams from showing only their best work at the prior firm while omitting underperforming funds. Advisers should maintain documentation supporting the selection of funds included in predecessor performance and the basis for determining that substantially all decision-makers are now employed by the new adviser.</p>

<h3>Books and Records for Marketing Materials</h3>

<p>The Marketing Rule imposes extensive recordkeeping requirements for advertisements. Advisers must maintain copies of all advertisements disseminated, records documenting dates of first and last use, and for advertisements containing performance results, all underlying data and supporting information. Records must be maintained for five years after last use, with the first two years in an easily accessible place.</p>

<p>For venture capital advisers, this creates significant documentation burdens. Each version of a pitch book must be retained with version control. Each update to the firm's website requires archiving the prior version. Conference presentations, email marketing communications, and social media posts must all be preserved. When performance is presented, the supporting calculations, valuation data, and fund financial statements must be retained with clear linkage to the specific marketing materials in which the performance appeared.</p>

<p>Many VC fund managers implement document management systems with automated archiving of marketing materials, version control functionality, and audit trails showing who created and approved each advertisement. These systems facilitate compliance with the books and records requirements while supporting the adviser's ability to demonstrate compliance if examined by the SEC.</p>

<h2>Political Contributions and Pay-to-Play Rules</h2>

<p>Rule 206(4)-5 under the Advisers Act, the pay-to-play rule, prohibits investment advisers from providing advisory services for compensation to government entities within two years after the adviser or covered associates make political contributions to certain officials. The rule aims to prevent quid pro quo arrangements where advisers make contributions expecting to receive advisory business from public pension plans or other government investment vehicles.</p>

<p>The rule applies with full force to venture capital advisers seeking investments from public pension plans, which represent significant institutional investors in venture capital funds. State and local pension systems allocate billions of dollars annually to VC funds, making compliance with pay-to-play restrictions essential for managers pursuing public pension capital.</p>

<h3>Covered Associates and Restricted Officials</h3>

<p>Covered associates include general partners, managing members, executive officers, and other individuals with similar status or functions at the adviser; employees who solicit government entities for the adviser; and supervised persons with authority to recommend which government entities should be solicited. For venture capital firms, this definition captures general partners who sign LPAs with public pension plans, investor relations professionals who market funds to government investors, and senior investment professionals who participate in fundraising presentations to pension plan investment committees.</p>

<p>The two-year time-out applies to contributions to officials who can influence selection of investment advisers, including elected officials with authority over the government entity and officials directly responsible for selecting advisers. For state pension plans, this typically includes the governor, state legislators with budget or oversight authority over the plan, state treasurers or comptrollers who may serve as plan trustees, and pension plan investment committee members with adviser selection authority.</p>

<h3>De Minimis Exceptions</h3>

<p>De minimis exceptions permit limited contributions without triggering the two-year time-out. Covered associates entitled to vote for an official may contribute up to $350 per election to that official without restriction. Contributions of up to $150 per election are permitted even to officials for whom the covered associate cannot vote. These thresholds remain low enough that contributions are unlikely to influence official actions while allowing basic political participation.</p>

<p>Elections include primaries, general elections, and special elections, with each constituting a separate election for de minimis contribution purposes. A covered associate could contribute $350 for the primary election and $350 for the general election to the same candidate without violating the rule, provided the associate is entitled to vote for that candidate. Contributions exceeding these amounts trigger the two-year ban on providing advisory services for compensation to government entities influenced by the official.</p>

<h3>VC Firm Compliance Programs</h3>

<p>Venture capital firms typically implement comprehensive pay-to-play compliance programs including pre-clearance requirements for all political contributions by covered associates, contribution tracking systems maintaining databases of contributions made, regular training on pay-to-play restrictions and identification of covered associates, due diligence processes for identifying government entity officials with influence over adviser selection, and procedures for responding to violations if discovered.</p>

<p>Pre-clearance processes require covered associates to submit proposed political contributions to the compliance department before making contributions. The compliance team verifies whether the intended recipient is an official of a government entity that invests or might invest in the adviser's funds, confirms whether the contribution would exceed de minimis amounts, and determines whether the contribution would trigger any time-out periods. Only after clearance may the associate make the contribution.</p>

<p>Violations of the pay-to-play rule create serious consequences beyond SEC enforcement risk. Many limited partnership agreements include representations and warranties that the adviser has not violated pay-to-play rules, making violations potential grounds for termination or fee recoupment. Public pension plans require detailed political contribution questionnaires during due diligence, and violations disqualify managers from consideration.</p>

<h2>Investment Restrictions and QSBS Considerations</h2>

<p>Venture capital fund managers must consider specific investment structuring issues that affect both fund returns and founder and investor tax treatment. Qualified small business stock provisions of the Internal Revenue Code provide significant tax benefits for venture capital investments but require careful structuring to preserve QSBS eligibility. Fund-level investment restrictions may also apply based on investor composition, fund strategy, or regulatory requirements.</p>

<h3>Qualified Small Business Stock Exclusion</h3>

<p>Section 1202 of the Internal Revenue Code allows non-corporate taxpayers to exclude from gross income a portion of gain from the sale of qualified small business stock held for more than five years. For stock acquired after September 27, 2010, the exclusion is 100 percent of gain up to the greater of $10 million or ten times the taxpayer's aggregate adjusted basis in the stock. This exclusion provides powerful tax benefits for founders, employees, and investors in successful startups.</p>

<p>To qualify as QSBS, stock must be acquired at original issuance from a qualified small business in exchange for money, property, or services. The issuing corporation must be a C corporation, must have aggregate gross assets not exceeding $50 million at all times before and immediately after the stock issuance, and must use at least 80 percent of its assets in active conduct of qualified trades or businesses. Qualified trades or businesses exclude service businesses in fields including health, law, engineering, architecture, accounting, actuarial science, performing arts, consulting, athletics, financial services, and brokerage services.</p>

<p>For venture capital funds, QSBS eligibility depends on the fund structure. C corporations investing in QSBS cannot benefit from the Section 1202 exclusion, as corporations are not eligible taxpayers. Pass-through entities including partnerships and S corporations can hold QSBS with the exclusion available to their partners or shareholders. Most venture capital funds are structured as partnerships specifically to preserve QSBS benefits for their investors.</p>

<h3>Structuring Investments to Preserve QSBS Treatment</h3>

<p>Venture capital investors must acquire stock at original issuance to qualify for QSBS treatment. Stock acquired in secondary transactions from other shareholders does not qualify, though stock acquired through conversion of qualified convertible debt or other originally-issued securities may qualify. Fund managers should structure initial investments to acquire stock directly from portfolio companies rather than acquiring founders' or other investors' shares if QSBS treatment is a priority.</p>

<p>The $50 million gross assets test measures the corporation's aggregate gross assets before and immediately after each stock issuance. If the company's assets exceed $50 million immediately before the issuance, the newly issued stock does not qualify even if prior issuances occurred when assets were below the threshold. This creates a cliff effect where a single financing round crossing the $50 million threshold permanently disqualifies all stock issued in that round and subsequent rounds.</p>

<p>The five-year holding period requirement means that QSBS benefits apply only to portfolio companies held for extended periods, aligning with typical venture capital holding periods but potentially affecting decisions about timing of exits. Partial sales or distributions before the five-year anniversary eliminate QSBS treatment for the stock sold early, though remaining shares may still qualify if held for the full five years from original issuance.</p>

<p>Active business requirements exclude portfolio companies deriving substantial revenues from passive investments, real estate rental, or other non-operating activities. For early-stage venture companies generating minimal revenue, maintaining active business status requires focusing development efforts on building products, acquiring customers, and establishing operations rather than deriving income from investing excess cash or leasing property.</p>

<h3>Investment Restrictions in Fund Documents</h3>

<p>Venture capital fund limited partnership agreements typically include investment restrictions defining the fund's mandate and protecting investors from inappropriate risk-taking. Common restrictions include limitations on portfolio company stage, such as prohibitions on seed-stage or late-stage investments for funds focused on Series A and B investing; geographic limitations restricting investments to specific regions or countries; sector limitations prohibiting or limiting investments in certain industries; position size limits capping the percentage of fund capital invested in any single portfolio company; and follow-on investment provisions addressing the fund's ability to participate in subsequent financing rounds.</p>

<p>Public securities restrictions typically prohibit or limit venture capital funds from investing in publicly traded stocks, aligning with the funds' focus on private, illiquid investments. However, funds typically retain the ability to hold securities of portfolio companies that complete initial public offerings or are acquired by public companies in stock transactions. Limited partnership agreements should clearly address whether the fund can continue holding public securities after lockup expiration and whether holding public securities affects management fee calculations.</p>

<p>Concentration limits prevent overconcentration in individual investments, geographies, or sectors. These limits typically allow the fund to invest in portfolio companies across multiple financing rounds, facilitating the fund's ability to support portfolio companies through growth stages, but prevent the fund from allocating excessive capital to any single investment regardless of the investment's perceived quality.</p>

<h2>NVCA Model Documents and Industry Standards</h2>

<p>The National Venture Capital Association publishes model legal documents widely used in venture capital financing transactions. These model documents establish industry-standard terms for term sheets, stock purchase agreements, certificates of incorporation, voting agreements, and other transaction documentation, reducing transaction costs and promoting consistency across venture capital investments.</p>

<h3>NVCA Model Term Sheet</h3>

<p>The NVCA model term sheet provides standardized format and terminology for documenting key terms of preferred stock financings. The term sheet addresses economic terms including valuation, price per share, capitalization details, and liquidation preferences; corporate governance terms including board composition, protective provisions, and information rights; and exit-related terms including drag-along provisions, conversion rights, and registration rights.</p>

<p>Liquidation preferences typically provide preferred stockholders with the right to receive their original investment plus declared dividends before common stockholders receive any proceeds upon liquidation, sale, or other exit. Preferences may be participating, allowing preferred holders to receive their preference plus participate in remaining proceeds, or non-participating, requiring preferred holders to choose between their preference and converting to common stock. Most venture capital financings use 1x non-participating preferences, balancing investor protection with founder alignment.</p>

<p>Protective provisions grant preferred stockholders consent rights over major corporate actions including increasing or decreasing authorized preferred stock, creating new classes of stock senior to or on parity with preferred stock, amending the charter or bylaws, and consummating mergers, asset sales, or other strategic transactions. These provisions protect investors from dilution and fundamental changes to their investment terms without preventing ordinary business operations.</p>

<h3>Model Stock Purchase Agreement and Charter</h3>

<p>The NVCA model stock purchase agreement documents the purchase and sale of preferred stock, including representations and warranties by the company, conditions to closing, and covenants regarding company conduct between signing and closing. The agreement allocates risk through representations about company capitalization, financial statements, intellectual property ownership, compliance with laws, and absence of undisclosed liabilities.</p>

<p>The model certificate of incorporation establishes the rights, preferences, and privileges of preferred stock including dividend rights, liquidation preferences, conversion rights, voting rights, and protective provisions. The charter also addresses common stock rights and general corporate governance matters including authorized shares, director liability limitations, and indemnification provisions.</p>

<p>Most venture capital funds customize the NVCA model documents to reflect their specific preferences on particular terms while maintaining the overall structure and approach of the models. Departures from model terms should be clearly explained to portfolio company management and analyzed for potential conflicts with existing investor rights from prior financing rounds.</p>

<h3>Voting and Rights Agreement</h3>

<p>The NVCA model voting agreement addresses board composition and election, including specific board seats designated for common stockholder and preferred stockholder representatives, drag-along rights requiring shareholders to approve qualified acquisitions if approved by specified percentages of stockholders and directors, and restrictions on transfer of shares. The agreement ensures governance rights negotiated in term sheets are contractually binding among the company, founders, and investors.</p>

<p>Co-sale agreements or rights of first refusal give investors opportunities to participate in founder share sales or prevent dilution through founder transfers. These provisions protect against situations where founders exit partially before a company exit, potentially reducing founder alignment with investor interests. Most venture capital transactions have moved away from separate co-sale agreements, instead incorporating drag-along rights in voting agreements to facilitate company sales approved by boards and majority shareholders.</p>

<h3>Investor Rights Agreement</h3>

<p>The NVCA model investor rights agreement addresses information rights entitling investors to annual financial statements, budgets, and monthly or quarterly financial updates; registration rights providing demand and piggyback registration rights if the company completes an initial public offering; and management rights letters confirming rights to attend board meetings and consult with management, which satisfy certain ERISA requirements for plan asset exemptions.</p>

<p>Information rights balance investor need for portfolio monitoring with company burden of providing information to potentially numerous investors. Typical rights provide major investors with audited annual financial statements, monthly or quarterly unaudited financial statements, annual budgets, and other information reasonably requested. Information rights typically terminate upon the company's initial public offering when public reporting provides information to all stockholders.</p>

<p>Registration rights address investor liquidity if portfolio companies complete initial public offerings. Demand rights allow major investors to require the company to register shares for public sale. Piggyback rights allow investors to include shares in registrations the company initiates for other purposes. S-3 rights permit shelf registrations using Form S-3 after the company becomes eligible. Most registration provisions include customary limitations on number of demands, underwriter cutback provisions, expense allocation, and blackout periods.</p>

<h2>Key Takeaways</h2>

<ul>
<li><strong>The VC fund adviser exemption provides significant regulatory relief:</strong> Advisers solely advising venture capital funds avoid SEC registration regardless of assets under management, but must ensure all funds meet the regulatory definition through qualifying investments, limited leverage, no redemption rights, and holding out as pursuing VC strategies.</li>

<li><strong>Qualifying investment requirements demand careful structuring:</strong> At least 80 percent of fund capital must be invested in equity securities of controlled, non-public portfolio companies that don't incur leverage in connection with the fund's investment. The 20 percent basket accommodates non-qualifying investments but requires monitoring to avoid breaches.</li>

<li><strong>Exempt VC advisers face limited but important obligations:</strong> Filing portions of Form ADV Part 1A, maintaining required books and records, and submitting to SEC examination authority when appropriate ensure regulatory visibility while avoiding full registration burdens.</li>

<li><strong>Registered VC advisers comply with comprehensive Advisers Act requirements:</strong> Form ADV Parts 1 and 2 disclosure, Form PF reporting if assets exceed thresholds, written compliance programs with annual reviews, CCO designation, custody rule compliance, and marketing rule adherence create substantial compliance obligations.</li>

<li><strong>Marketing and performance advertising require detailed attention:</strong> The Marketing Rule's performance presentation requirements including gross and net returns, portfolio inclusion standards, appropriate time periods, and extensive recordkeeping apply to pitch books, websites, and other VC marketing materials.</li>

<li><strong>Pay-to-play rules demand proactive compliance programs:</strong> Political contributions by advisers and covered associates trigger two-year bans on providing advisory services to government entities, requiring pre-clearance systems, tracking databases, and regular training for firms pursuing public pension capital.</li>

<li><strong>QSBS treatment provides powerful tax benefits when preserved:</strong> Section 1202 exclusion of gain on qualified small business stock requires partnership fund structures, original issuance acquisitions, five-year holding periods, and portfolio companies meeting $50 million asset tests and active business requirements.</li>

<li><strong>Investment restrictions in LPAs define fund mandates:</strong> Stage, geography, sector, and concentration limitations protect investors while providing flexibility for follow-on investments and evolution of successful portfolio companies through growth stages and eventual public offerings.</li>

<li><strong>NVCA model documents establish industry standards:</strong> Model term sheets, stock purchase agreements, charters, voting agreements, and investor rights agreements reduce transaction costs and promote consistency while allowing customization for specific fund and portfolio company requirements.</li>

<li><strong>Compliance infrastructure should scale with fund growth:</strong> Emerging managers with single funds and limited assets require basic compliance functions, while multi-fund managers with diverse strategies and substantial assets need sophisticated systems for allocation, valuation, performance calculation, and regulatory reporting.</li>
</ul>`,
  metaTitle: 'VC Fund Compliance: Adviser Exemption, Form ADV/PF & QSBS Guide',
  metaDescription: 'Comprehensive compliance guide for venture capital funds covering VC adviser exemption requirements, Form ADV/PF obligations, investment restrictions, QSBS structuring, pay-to-play rules, and NVCA standards.',
  publishedDate: 'November 18, 2025',
  readingTime: 20,
}

export default article
