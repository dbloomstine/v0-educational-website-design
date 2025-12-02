import { Article } from '../types'

const article: Article = {
  id: 'secondaries-compliance-compliance',
  title: 'Compliance for Secondaries Funds: Transfer Restrictions, Regulatory Approvals, Multi-Fund Oversight, and ERISA Considerations',
  slug: 'compliance',
  subtitle: 'Comprehensive guide to managing secondaries compliance including LP transfer approvals, GP consent requirements, regulatory frameworks, Form ADV/PF reporting, ERISA plan asset considerations, and multi-GP coordination across diverse compliance obligations',
  fundType: 'secondaries',
  pillar: 'compliance',
  content: `<p>The Chief Compliance Officer of a secondaries fund navigates a fundamentally distinct compliance landscape compared to primary fund CCOs. Rather than focusing predominantly on direct portfolio company oversight and investment decision-making processes, secondaries fund compliance centers on managing transfer restrictions embedded in dozens or hundreds of underlying fund agreements, coordinating GP consent processes across diverse fund managers with varying approval requirements and timelines, satisfying regulatory transfer requirements including antitrust clearances and foreign investment reviews, and maintaining ongoing compliance obligations to multiple underlying GPs each operating under their own compliance frameworks and reporting schedules.</p>

<p>The secondaries market's rapid growth—exceeding $130 billion in annual transaction volume as of 2024—has intensified regulatory scrutiny and compliance complexity. The SEC's increased focus on private fund advisers through expanded Form ADV and Form PF reporting requirements, combined with heightened attention to conflicts of interest particularly in GP-led transactions, has elevated compliance from a primarily operational function to a strategic risk management discipline requiring sophisticated understanding of regulatory frameworks, transfer mechanics, and multi-party coordination. Additionally, the prevalence of continuation funds and GP-led deals, which now represent 50-60% of secondaries volume, introduces unique conflicts and disclosure obligations that require careful management to maintain regulatory compliance and investor confidence.</p>

<p>This article examines the comprehensive compliance responsibilities unique to secondaries funds, explores operational considerations for managing transfer approvals and regulatory requirements, provides practical guidance for multi-fund oversight and coordination, and addresses emerging compliance challenges including ERISA plan asset considerations, AML/KYC for secondaries transactions, side letter compliance, and regulatory expectations for GP-led transaction governance.</p>

<h2>Understanding Secondaries Compliance Framework</h2>

<p>Before examining specific compliance areas, understanding the layered regulatory framework governing secondaries funds provides essential context for the operational challenges that follow.</p>

<h3>Multi-Layered Compliance Obligations</h3>

<p>Secondaries funds face compliance obligations at multiple levels creating complexity absent in most primary investment strategies. At the secondaries fund level, the fund manager registers as an investment adviser subject to Advisers Act requirements including Form ADV filings, compliance program maintenance, custody rule compliance, and marketing rule adherence. This layer mirrors obligations facing all registered investment advisers but includes secondaries-specific considerations around how transactions are described, performance is calculated, and conflicts are disclosed.</p>

<p>The second layer involves compliance with underlying fund agreements whose terms the secondaries fund must honor as a successor LP. Each acquired LP interest subjects the secondaries fund to the compliance obligations originally accepted by the selling LP, including transfer restrictions, information rights, consent requirements, and various covenants embedded in Limited Partnership Agreements and side letters. Unlike primary funds where the manager controls fund terms, secondaries funds inherit terms negotiated by others, creating a patchwork of obligations that must be tracked and satisfied across potentially hundreds of underlying positions.</p>

<p>The third layer encompasses regulatory requirements triggered by specific transactions, including antitrust clearances for large acquisitions, foreign investment reviews when non-US buyers acquire interests in funds with sensitive portfolio companies, financial services regulatory approvals when funds hold banking or insurance assets, and securities law compliance for interests that may constitute securities requiring specific handling. These transaction-specific requirements add complexity to deal execution and require advance planning to avoid closing delays.</p>

<p>The fourth layer addresses ongoing obligations to underlying GPs, including annual compliance questionnaires, beneficial ownership reporting, subscription document updates, KYC/AML verification, and various information requests that underlying fund compliance departments issue to all LPs. Managing these ongoing requirements across a large portfolio of underlying funds demands systematic tracking, timely response capabilities, and clear internal accountability for ensuring nothing falls through the cracks.</p>

<h3>Regulatory Framework Evolution</h3>

<p>The regulatory landscape for secondaries funds continues evolving as regulators respond to market growth and emerging transaction structures. The SEC's private fund adviser rules proposed and partially implemented in 2023-2024 address quarterly fee and expense reporting, fairness opinions for adviser-led transactions, preferential treatment restrictions, and enhanced compliance documentation. While some provisions faced legal challenges, the regulatory direction clearly emphasizes transparency, conflicts management, and investor protection in private fund operations including secondaries transactions.</p>

<p>Form PF reporting has expanded to capture secondaries fund-specific information including transaction volumes, pricing trends, and portfolio concentrations. Regulators use this data to monitor systemic risks and market dynamics, making accurate and timely Form PF filing a compliance priority requiring robust data aggregation from underlying positions. Form ADV has similarly evolved to require more detailed disclosure about investment strategies, conflicts of interest, disciplinary history, and outside business activities, demanding regular review and updating as secondaries fund operations and strategies evolve.</p>

<p>International regulatory frameworks add another dimension for secondaries funds with non-US operations or investors. European AIFMD regulations, UK FCA requirements, Asian financial services regulations, and various tax treaty considerations create cross-border compliance obligations that must be coordinated with US regulatory requirements. The CCO managing global secondaries operations maintains expertise across multiple regulatory regimes or coordinates with local counsel and compliance professionals in relevant jurisdictions.</p>

<h2>Transfer Restrictions and GP Consent Requirements</h2>

<p>Navigating transfer restrictions represents perhaps the most operationally intensive compliance responsibility unique to secondaries funds, requiring systematic processes for identifying requirements, obtaining consents, and managing approval timelines across numerous simultaneous transactions.</p>

<h3>Common Transfer Restriction Provisions</h3>

<p>Limited Partnership Agreements typically include transfer restrictions serving multiple purposes: maintaining GP control over LP base composition, preventing assignments to competitors or problematic parties, limiting administrative burden from frequent LP turnover, and complying with securities laws. The most common restriction requires GP consent for any LP interest transfer, giving GPs discretion to approve or deny proposed sales. While most established GPs reasonably cooperate with LP-led secondary sales, some GPs impose burdensome information requirements, delay approvals to maintain control, or deny transfers without clear rationale.</p>

<p>Right of first refusal (ROFR) provisions give existing LPs and/or the GP the right to purchase interests on the same terms offered by third-party buyers before the transfer can proceed to the external buyer. ROFR mechanics typically require the seller to provide notice of the proposed sale terms to parties holding ROFR rights, allow 30-60 days for the ROFR holders to elect whether to exercise their purchase rights, and permit the external sale to proceed only if ROFR rights are not exercised. This process adds 30-60+ days to transaction timelines and creates risk that deals are blocked by ROFR exercises, forcing secondaries buyers to negotiate ROFR waivers or structure transactions to minimize ROFR impact.</p>

<p>Lock-up periods prevent transfers during specified timeframes, typically the first 1-3 years after an LP's initial commitment to protect GPs from early investor exits before the fund demonstrates performance. Secondaries funds acquiring interests must verify that lock-up periods have expired or negotiate waivers. Some LPAs include ongoing lock-ups preventing transfers within specific periods before or after capital calls or distributions to simplify administration, requiring careful timing of transfer closings to avoid locked periods.</p>

<p>Minimum transfer size requirements prevent fragmentation of LP interests that would increase administrative burden. Many LPAs prohibit partial transfers below specified minimums (e.g., $5 million or 10% of the LP's total commitment), forcing sellers to transfer larger positions than they might prefer or preventing transfers entirely if the seller's position falls below the minimum. Secondaries buyers acquiring smaller positions must verify transfer size requirements are satisfied or negotiate waivers with GPs.</p>

<h3>GP Consent Process Management</h3>

<p>The CCO establishes systematic processes for managing GP consent across multiple simultaneous transactions. This begins with initial diligence on proposed acquisitions, reviewing LPA transfer restriction provisions to identify required consents, ROFR rights, lock-up periods, and other restrictions. This information informs transaction structuring and timeline planning, flagging deals that may face consent challenges requiring early GP engagement or alternatives like acquiring different interests from the same seller that face fewer transfer restrictions.</p>

<p>Once a transaction proceeds to formal documentation, the CCO coordinates preparation of GP consent packages typically including transfer application forms specified in the LPA, buyer qualification information demonstrating the secondaries fund meets investor eligibility requirements, confirmation that the buyer is not a GP competitor or otherwise objectionable party, subscription documents for the buyer to complete, and various representations and warranties the buyer must provide. Thorough package preparation addressing anticipated GP questions accelerates approval timelines and reduces back-and-forth that can delay closings.</p>

<p>GP consent follow-up requires persistent but professional communication. Some GPs approve consents within days while others take weeks or months to respond to initial requests. The CCO maintains consent tracking systems showing the status of each pending consent, escalation procedures when consents lag despite follow-up, and relationships with underlying fund administrators and GP compliance professionals who process consent requests. Building reputation as a reliable, professional secondaries buyer facilitates faster consent approvals over time as GPs gain comfort with repeat transactions.</p>

<p>When GPs deny consent or impose unreasonable conditions, the CCO coordinates with legal counsel on response strategies. Options include negotiating with the GP to address stated concerns, escalating to senior GP decision-makers if denial appears inconsistent with LPA provisions or market practice, evaluating legal remedies if denial appears inconsistent with contractual obligations, or abandoning the transaction if consent proves unobtainable. Most consent disputes resolve through dialogue, but occasional situations require formal legal challenge or transaction termination.</p>

<h3>ROFR Management and Waivers</h3>

<p>Right of first refusal provisions create execution risk that must be managed through strategic planning and negotiation. The CCO coordinates ROFR notice processes ensuring notices include all required information about transaction terms, are delivered to all parties holding ROFR rights within specified timeframes, and properly document delivery to avoid disputes about whether notice was properly provided. Many LPAs specify notice delivery methods (email to specific addresses, physical delivery, etc.) requiring careful compliance to ensure validity.</p>

<p>During ROFR periods, the CCO monitors for responses from ROFR holders and coordinates with sellers on timing. If ROFR rights are exercised, the transaction terminates or substantially restructures depending on which parties exercise. If ROFR rights expire unexercised, the external sale proceeds. The extended timeline created by ROFR periods creates risk that market conditions change, financing becomes unavailable, or buyers lose interest, making ROFR management a key priority for protecting transaction execution.</p>

<p>Many secondaries buyers negotiate ROFR waivers directly from GPs and existing LPs before finalizing transaction terms, eliminating execution risk from potential ROFR exercises. The CCO coordinates waiver negotiations providing information that encourages waivers such as evidence that the secondaries buyer brings advantages over ROFR holders purchasing the interest (e.g., certainty of funding, speed of execution), confirmation that pricing is market-reflective rather than discounted in ways that might incentivize ROFR exercise, and relationship building with GPs who often appreciate having established secondaries funds as LPs rather than requiring internal purchases that lock up capital. Waiver negotiation requires balancing transparency about transaction terms with protecting competitive information the buyer may not want widely shared.</p>

<h2>Compliance with Underlying Fund LPA Provisions</h2>

<p>Beyond transfer restrictions, secondaries funds must comply with the full range of obligations embedded in underlying fund LPAs governing LP conduct, information rights, consent requirements, and various covenants.</p>

<h3>Investor Qualification and Eligibility</h3>

<p>LPAs typically restrict LP interests to qualified purchasers under the Investment Company Act, accredited investors under securities laws, and sometimes additional eligibility criteria such as minimum net worth thresholds, institutional investor requirements, or restrictions on certain investor types. The CCO ensures the secondaries fund satisfies these requirements for each acquired position, maintaining documentation demonstrating compliance including qualification certificates, financial statements evidencing net worth, and legal opinions when necessary.</p>

<p>Some LPAs include investor category requirements such as limits on benefit plan investors to avoid ERISA plan asset issues, restrictions on non-US investors for tax or regulatory reasons, or exclusions of certain investor types like sovereign wealth funds or investors from specific countries. The CCO reviews these provisions during diligence and confirms compliance before proceeding with acquisitions. When the secondaries fund structure doesn't naturally satisfy requirements, alternative structures such as special purpose vehicles holding specific positions may be necessary to achieve compliance.</p>

<h3>Consent Rights and Voting Obligations</h3>

<p>LPAs grant LPs consent rights over major decisions including fund term extensions beyond the initial term, removal of key persons or the GP in specified circumstances, amendments to management fee or carried interest terms, changes to investment strategy or restrictions, and various other significant matters. The CCO establishes processes for tracking consent requests from underlying GPs, evaluating requests against the secondaries fund's interests and any obligations to its own investors, casting votes in a timely manner reflecting the fund's position, and documenting decisions for compliance records.</p>

<p>Advisory committee appointments present additional considerations. Some LPAs require or permit LPs holding certain minimum interests to designate representatives to serve on LP advisory committees that provide guidance to GPs, review conflicts of interest, approve valuations or transactions requiring committee consent, and communicate LP perspectives to GPs. When the secondaries fund acquires interests carrying advisory committee rights, the CCO coordinates with investment team members or senior executives on whether to seek committee participation, manages appointment processes, and ensures representatives receive appropriate training on fiduciary duties and conflicts management.</p>

<h3>Information Rights and Confidentiality Obligations</h3>

<p>LPAs grant LPs information rights including quarterly and annual reports, audited financial statements, portfolio company information within confidentiality constraints, and access to fund personnel for questions or concerns. The CCO ensures these materials are received, reviewed for any items requiring action or response, and stored securely. Conversely, LPAs impose confidentiality obligations on LPs prohibiting disclosure of fund information except to advisors or as required by law. The CCO establishes information security protocols ensuring confidential fund information receives appropriate protection, implements access controls limiting information to personnel with legitimate need, and coordinates legal compliance when subpoenas or regulatory requests require disclosure of otherwise confidential information.</p>

<h3>Concentration Limits and Portfolio Restrictions</h3>

<p>Some LPAs include concentration limits restricting the fund from holding more than specified percentages in single investments, sectors, or geographies. While these restrictions primarily constrain GP investment decisions, they can affect LPs if the fund breaches limits and GPs seek LP consent for limit amendments or waivers. The CCO monitors portfolio concentrations disclosed in quarterly reports, flags potential limit issues, and coordinates responses when GPs request consents related to concentration matters.</p>

<h2>ERISA and Plan Asset Considerations in Secondaries</h2>

<p>Secondaries funds acquiring LP interests in funds holding "plan assets" under ERISA face additional compliance obligations requiring specialized expertise and ongoing monitoring.</p>

<h3>Plan Asset Status Determination</h3>

<p>A fund holds plan assets under ERISA if 25% or more of any class of equity interests is held by "benefit plan investors"—ERISA plans, IRAs, and certain other retirement accounts. When plan asset status applies, the fund's assets are treated as plan assets subjecting the GP to ERISA fiduciary duties, prohibited transaction restrictions, and potential excise taxes for violations. Secondaries funds must determine whether each underlying fund holds plan assets by reviewing investor composition disclosed in offering materials, annual reports, or through direct inquiry to GPs.</p>

<p>If an underlying fund holds plan assets, the secondaries fund's acquisition of an LP interest in that fund can cause the secondaries fund itself to hold plan assets if the investment represents plan assets in the hands of secondaries fund investors who are themselves benefit plan investors. This creates cascading plan asset exposure where secondaries funds with significant benefit plan investor participation must treat many of their underlying fund investments as plan assets. The compliance burden includes prohibited transaction analysis for all fund activities, ensuring compensation arrangements don't violate prohibited transaction rules, maintaining documentation demonstrating ERISA compliance, and potential excise tax exposure for violations.</p>

<h3>Prohibited Transaction Compliance</h3>

<p>ERISA's prohibited transaction rules restrict transactions between plans and parties in interest including plan fiduciaries, service providers, and related parties. When a secondaries fund holds plan assets, the fund's transactions must be analyzed for prohibited transaction issues. Common concerns include compensation arrangements between the secondaries fund and service providers who may also be parties in interest, investments in portfolio companies affiliated with parties in interest, and certain transactions with underlying fund GPs who become parties in interest due to the secondaries fund's LP interest.</p>

<p>The CCO coordinates with ERISA counsel to evaluate potential prohibited transactions and structure activities to fall within exemptions. Common exemptions include the service provider exemption allowing reasonable compensation for services, the adequate consideration exemption for certain asset purchases at fair market value, and various statutory and administrative exemptions covering specific transaction types. Documenting exemption compliance provides protection if transactions are later scrutinized by the Department of Labor or in litigation.</p>

<h3>Plan Asset Mitigation Strategies</h3>

<p>Many secondaries funds mitigate plan asset concerns by limiting benefit plan investor participation in the fund itself to below 25%, avoiding plan asset status at the secondaries fund level. This is accomplished through offering materials that restrict benefit plan investor commitments, monitoring investor composition during fundraising to ensure benefit plan investors remain below the 25% threshold, and structuring funds with separate share classes where benefit plan investors invest in a class representing less than 25% of total equity. By avoiding plan asset status at the fund level, the secondaries fund simplifies compliance even when underlying funds hold plan assets.</p>

<p>For secondaries funds that do hold plan assets, segregating plan asset investments in separate vehicles provides another mitigation approach. Plan asset positions are held in dedicated vehicles subject to enhanced ERISA compliance while non-plan asset positions are held in standard vehicles with less compliance burden. This segregation increases operational complexity but reduces the compliance burden across the overall portfolio.</p>

<h2>Form ADV and Form PF Reporting for Secondaries</h2>

<p>Registered investment advisers managing secondaries funds file Form ADV and Form PF providing regulators with information about operations, strategies, risks, and conflicts.</p>

<h3>Form ADV Disclosure Requirements</h3>

<p>Form ADV Part 1A requires basic information about the adviser including assets under management, client types, employees, offices, affiliations, and disciplinary history. For secondaries fund managers, specific attention focuses on accurately describing investment strategies to distinguish secondaries from primary investing, disclosing conflicts of interest unique to secondaries including GP-led transaction conflicts, reporting all private fund clients including secondaries funds, parallel funds, and alternative investment vehicles, and updating filings promptly when material changes occur to ensure disclosures remain current.</p>

<p>Form ADV Part 2A (the "brochure") provides narrative disclosure about advisory services, fees, conflicts, disciplinary history, and other matters relevant to clients. The CCO ensures secondaries-specific disclosures address several key areas. First, investment strategy descriptions must clearly explain that the fund purchases existing LP interests and participates in GP-led transactions rather than making primary investments, helping investors understand the distinct risk-return profile and operational model. Second, fee disclosures must explain how management fees are calculated on secondaries positions including whether fees are charged on committed capital, invested capital, or NAV, and how underlying fund fees impact overall investor costs. Third, conflicts of interest sections must address GP-led transaction conflicts where the secondaries fund may transact with GPs who are also service providers or have other relationships, situations where the adviser or its affiliates may have interests in underlying funds creating conflicts around pricing or transaction approval, and allocation of secondaries opportunities among multiple funds or accounts managed by the adviser.</p>

<h3>Form PF Reporting for Secondaries Funds</h3>

<p>Form PF collects information about private fund strategy, leverage, liquidity, counterparty exposure, and other risk factors. Large private equity fund advisers (those with $2 billion+ in private equity fund assets under management) file more extensive reporting including Section 4 covering private equity fund operations. Secondaries fund advisers complete Form PF sections relevant to their fund structures, typically Section 2 for all private funds and Section 4 if they meet large private equity adviser thresholds.</p>

<p>Section 2 requires information about each private fund including assets under management, borrowings and leverage, investor concentration, redemption provisions, and side letter transparency. For secondaries funds, specific reporting challenges include determining how to report exposure to underlying funds—whether as a single position at the LP interest level or on a look-through basis to underlying portfolio companies, calculating and reporting leverage given that underlying funds may employ leverage even if the secondaries fund doesn't borrow at its level, and reporting investor concentration considering both direct investors in the secondaries fund and the potentially large number of underlying fund exposures.</p>

<p>Section 4 (for large private equity advisers) requires detailed fund-level information including investment and asset value breakdowns, geographic concentrations, bridge loan usage, and other operational metrics. Secondaries fund advisers report positions based on the LP interests held rather than looking through to underlying portfolio companies unless the secondaries fund has control rights that effectively make it the GP of the underlying assets. Accurate Section 4 reporting requires robust data aggregation systems pulling information from numerous underlying fund reports and normalizing it into Form PF reporting categories.</p>

<h3>Maintaining Current and Accurate Disclosures</h3>

<p>The CCO establishes annual review processes for Form ADV ensuring all disclosures remain accurate and complete, identifying items requiring updating based on operational changes over the past year, coordinating with legal counsel on disclosure language for new conflicts or risk factors, and filing annual amendments within required timeframes (90 days after fiscal year-end for Part 2 amendments). More frequent amendments are filed when material changes occur mid-year such as changes to fee structures, new conflicts requiring disclosure, or disciplinary matters that must be reported promptly.</p>

<p>Form PF filing deadlines depend on adviser size: large private equity advisers file within 120 days after fiscal year-end. The CCO coordinates data collection from portfolio management systems, fund administrators, and underlying fund reports several months before deadlines to ensure adequate time for data aggregation, validation, and review. Many advisers perform quarterly data gathering even if filings are annual to avoid year-end data collection crunches and ensure ongoing accuracy of internal records that support Form PF reporting.</p>

<h2>Side Letter Compliance and MFN Obligations</h2>

<p>Side letters granting preferential terms to certain LPs create compliance obligations that secondaries funds must honor when acquiring interests subject to side letters.</p>

<h3>Identifying Existing Side Letters</h3>

<p>During diligence, the CCO requests copies of all side letters between the selling LP and underlying fund GPs. Side letters commonly address information rights providing enhanced reporting or access to GP personnel, reduced management fees or carried interest for large investors, enhanced liquidity rights such as transfer consent commitments or reduced lock-up periods, and most favored nations (MFN) provisions entitling the LP to benefit from more favorable terms granted to other LPs. The secondaries fund acquiring the LP interest generally assumes these side letter rights and obligations unless the side letter explicitly states it doesn't transfer with the LP interest.</p>

<p>Some side letters include non-transferability provisions stating that rights don't transfer to buyers in secondary sales, reverting the acquired interest to standard LPA terms. The CCO identifies these provisions during diligence as they affect the position's value—losing enhanced information rights or fee reductions reduces economic returns. When valuable side letter rights are non-transferable, the secondaries fund may negotiate new side letters with the GP to recreate similar economics, request transfer consent from the GP allowing side letter assumption, or adjust pricing to reflect loss of side letter benefits.</p>

<h3>Most Favored Nations (MFN) Provisions</h3>

<p>MFN provisions entitle LPs to receive the benefit of more favorable economic terms granted to other LPs, automatically extending fee discounts, enhanced carry terms, or other benefits to MFN holders whenever the GP grants such terms to any LP. For secondaries funds, MFN compliance operates in two directions. First, when the secondaries fund acquires interests with MFN rights, it becomes entitled to MFN benefits requiring monitoring of whether the underlying GP grants favorable terms to other LPs that trigger MFN obligations. Second, when the secondaries fund negotiates its own side letters with underlying GPs for newly acquired interests, those terms may trigger MFN obligations owed to other LPs holding MFN rights, potentially constraining the terms available to the secondaries fund.</p>

<p>The CCO establishes processes for monitoring MFN compliance on acquired positions. This includes requesting from underlying GPs annual confirmations of any new terms granted to LPs that might trigger MFN obligations, reviewing fund amendments and new fund terms to identify potential MFN triggers, and calculating economic benefits owed under MFN provisions when triggers occur. When substantial MFN benefits accumulate, the CCO coordinates with GPs on implementation through fee credits, catch-up payments, or amended terms formalizing the MFN benefits going forward.</p>

<h3>Side Letter Negotiation for New Positions</h3>

<p>When acquiring LP interests, secondaries funds often negotiate their own side letters with underlying GPs addressing transfer consent commitments for future sales reducing execution risk if the secondaries fund later sells the position, information rights appropriate for professional investors who may want enhanced access compared to passive LPs, and sometimes economic terms such as reduced fees acknowledging the large position size being acquired. The CCO coordinates side letter negotiations balancing the desire for favorable terms against the risk that aggressive terms cause GPs to deny transfer consent or trigger MFN obligations to other LPs that make the GP reluctant to grant concessions.</p>

<h2>Subscription Document Collection for Acquired Interests</h2>

<p>Purchasing LP interests requires completing subscription documents that underlying fund GPs and administrators require as a condition to approving transfers and updating LP records.</p>

<h3>Subscription Document Components</h3>

<p>Standard subscription packages for secondaries buyers include the subscription agreement itself establishing the buyer's commitment to assume the acquired LP interest and all associated obligations, investor questionnaires collecting information about the buyer's identity, authorized signatories, ownership structure, and regulatory status, investor qualification representations where the buyer represents it meets accredited investor, qualified purchaser, and other eligibility requirements, and tax forms including W-9 for US buyers or W-8 for non-US buyers establishing tax status for withholding purposes. The CCO maintains template responses for commonly requested information, accelerating completion while ensuring accuracy and consistency across multiple subscription packages being completed simultaneously for different underlying funds.</p>

<p>Some underlying funds require additional documentation beyond standard subscription forms. This might include AML/KYC verification discussed below, beneficial ownership certifications identifying individuals controlling the secondaries fund, compliance questionnaires addressing regulatory status and potential conflicts, and legal opinions from the buyer's counsel addressing qualification status or other legal matters. The CCO tracks these requirements during diligence, ensuring special documentation is identified early and prepared in advance of closing timelines.</p>

<h3>Power of Attorney and Signatory Authority</h3>

<p>Subscription documents require authorized signatures on behalf of the secondaries fund. The CCO maintains and updates signature authority documentation showing who has authority to execute subscription documents, fund agreements, and related materials on behalf of the fund. This typically includes managing members or general partners who have ultimate authority, senior investment professionals granted delegated authority for specific transactions, and administrative personnel authorized to execute routine documents. Clear authority documentation prevents closing delays from signature disputes and ensures subscription documents are validly executed.</p>

<p>Many secondaries funds execute powers of attorney allowing designated individuals to sign subscription documents and other fund-related instruments on behalf of the fund across numerous transactions. The CCO ensures powers of attorney are properly executed, contain appropriate scope covering secondaries transactions being pursued, are updated when authorized signatories change due to personnel turnover, and are provided to underlying fund administrators who often require POA copies in their records before accepting signatures.</p>

<h2>AML/KYC for Secondaries Transactions</h2>

<p>Anti-money laundering and know-your-customer requirements apply to secondaries funds both as investment advisers conducting AML/KYC on their own investors and as buyers subject to AML/KYC review by underlying fund GPs when acquiring LP interests.</p>

<h3>AML/KYC Requirements as Buyers</h3>

<p>When acquiring LP interests, secondaries funds complete KYC questionnaires and provide supporting documentation to underlying fund GPs or their administrators who conduct AML reviews on the buyer. Requirements typically include corporate organizational documents showing the secondaries fund's legal structure and governing parties, beneficial ownership information identifying individuals who ultimately control the fund, compliance questionnaires addressing regulatory status and potential sanctions exposure, and source of funds documentation in some cases explaining the origin of capital being deployed. The CCO maintains a current KYC package ready for distribution when underlying funds request verification, updating annually or when material changes occur.</p>

<p>Some underlying funds require certification that the secondaries buyer has conducted appropriate AML diligence on its own investors and maintains appropriate AML compliance programs. This effectively outsources AML responsibility to the buyer rather than requiring the underlying fund to conduct separate AML review on ultimate beneficial owners. The CCO ensures the secondaries fund's own AML program satisfies these certification requirements, maintaining documentation that supports representations made to underlying funds.</p>

<h3>AML/KYC Obligations for Secondaries Fund Investors</h3>

<p>The secondaries fund conducts its own AML/KYC on investors committing capital to the fund. The CCO establishes a risk-based AML program including written policies and procedures addressing customer identification, beneficial ownership determination, monitoring for suspicious activity, sanctions screening, and recordkeeping. For institutional investors like pension funds, endowments, and fund-of-funds who are themselves subject to robust regulatory oversight, streamlined AML procedures often suffice given low risk profiles. For individual investors, family offices, or investors from higher-risk jurisdictions, enhanced due diligence may be appropriate including source of wealth verification, screening against sanctions lists and negative news, and ongoing monitoring for unusual activity patterns.</p>

<p>The CCO coordinates AML/KYC review during investor onboarding before accepting capital commitments. This includes reviewing investor subscription documents for completeness, conducting sanctions screening against OFAC and other relevant lists, collecting and verifying beneficial ownership information for entities to identify controlling individuals, and documenting AML review conclusions and any risk factors identified. Investors who raise AML concerns or fail to provide satisfactory information are excluded from fund participation protecting the fund from potential money laundering exposure.</p>

<h3>Ongoing Monitoring and Updates</h3>

<p>AML compliance extends beyond initial investor onboarding to ongoing monitoring for suspicious activity and periodic refresh of investor information. The CCO establishes monitoring procedures including periodic sanctions list screening to identify if existing investors become subject to sanctions requiring action, reviewing capital contributions and distributions for unusual patterns that might indicate illicit activity, and updating investor information annually or when significant changes occur. While secondaries funds face relatively low inherent AML risk given institutional investor base and absence of cash-intensive operations, maintaining robust AML procedures demonstrates regulatory compliance and protects against reputational risk from unknowingly facilitating illicit activity.</p>

<h2>Regulatory Approvals for Cross-Border Transactions</h2>

<p>Secondaries transactions involving non-US buyers, funds with international portfolio companies, or acquisitions exceeding certain value thresholds may require regulatory approvals that must be obtained before closing.</p>

<h3>CFIUS Review for Foreign Investments</h3>

<p>The Committee on Foreign Investment in the United States (CFIUS) reviews foreign investments in US businesses to assess national security implications. When non-US secondaries funds acquire LP interests in funds holding portfolio companies in sensitive sectors—including technology, telecommunications, energy infrastructure, defense, or companies with government contracts—CFIUS review may be required or advisable. The CCO coordinates with legal counsel to determine CFIUS applicability by analyzing the buyer's foreign ownership and control, reviewing portfolio companies held by the underlying fund to identify those in sensitive sectors, and assessing whether the LP interest acquisition provides access to material non-public technical information, board representation, or other involvement rights that increase CFIUS sensitivity.</p>

<p>CFIUS filings involve detailed disclosures about the buyer's ownership structure, source of funds, business operations in sensitive technologies or sectors, and details about the US business being acquired including operations, technology, facilities, government contracts, and customer relationships. The review process typically takes 45-90 days including initial review and, if CFIUS determines to investigate further, a detailed investigation period. During review, the transaction cannot close until CFIUS approves or declines to take action. The CCO manages filing preparation and coordinates timing with transaction schedules, ideally initiating CFIUS review early in diligence to avoid closing delays.</p>

<h3>HSR Antitrust Clearance</h3>

<p>The Hart-Scott-Rodino (HSR) Act requires premerger notification filings and waiting periods for acquisitions exceeding value thresholds (adjusted annually, $111.4 million for 2024). When a secondaries fund acquires LP interests where the value of portfolio companies attributable to the acquired interest exceeds HSR thresholds, HSR filing may be required. The analysis is complex: the acquiring person's size (the secondaries fund and any affiliates), the size of transaction (typically calculated as 50% of the assets of the fund being acquired times the percentage interest being purchased), and whether exemptions apply such as the investment-only exemption for passive LP interests.</p>

<p>The CCO coordinates HSR analysis with antitrust counsel for larger secondaries transactions, filing HSR notifications when required and observing the mandatory waiting period (30 days for standard filings, 15 days for early termination if granted). HSR violations carry significant penalties making proper analysis critical. Even when HSR filing isn't required, maintaining documentation of the analysis provides protection if the determination is later questioned.</p>

<h3>Industry-Specific Regulatory Approvals</h3>

<p>Certain portfolio company sectors require regulatory approval for ownership changes. Banking: Federal Reserve, OCC, or state banking regulators may need to approve acquisitions of interests in funds holding banks or bank holding companies, requiring the secondaries buyer to satisfy "source of strength" requirements and potential fitness reviews. Insurance: State insurance regulators may require approval for acquisitions that result in control or significant ownership of insurance companies. Telecommunications and media: FCC approval may be required for acquisitions involving broadcast licenses, spectrum rights, or telecom operations. Gaming: Gaming commissions conduct detailed suitability reviews before approving ownership of gaming operations. Utilities: State public utility commissions may need to approve ownership changes in regulated utilities.</p>

<p>The CCO identifies these issues during diligence by reviewing portfolio company descriptions and discussing with underlying fund GPs whether proposed transfers require regulatory approvals. When approvals are required, the CCO coordinates filing preparation often working with specialized regulatory counsel, manages timelines which can extend months for complex reviews, and structures transactions to minimize regulatory burden such as by avoiding control acquisition thresholds when possible.</p>

<h2>Compliance Monitoring of Underlying GPs</h2>

<p>As an LP in multiple underlying funds, the secondaries fund must monitor whether underlying fund GPs maintain adequate compliance programs and respond appropriately when GP compliance issues arise.</p>

<h3>GP Compliance Assessment During Diligence</h3>

<p>When evaluating secondaries acquisitions, the CCO reviews underlying fund GPs' compliance track records including regulatory examination history with the SEC or other regulators, Form ADV disclosures identifying disciplinary events or conflicts of interest, publicly available enforcement actions or litigation involving the GP, and reference calls with other LPs addressing their experience with GP compliance and transparency. Strong GPs demonstrate transparent compliance programs, proactive communication about regulatory developments, and rapid response to LP questions or concerns. Weak GPs exhibit opacity about compliance matters, hostile responses to LP inquiries, or patterns of regulatory issues.</p>

<p>Material GP compliance concerns identified during diligence may affect transaction decisions. Serious issues like ongoing SEC investigations, significant disciplinary history, or pervasive compliance failures warrant careful evaluation of whether the risks justify proceeding with the acquisition. The CCO coordinates with investment team members on whether compliance issues materially impair the GP's ability to manage the fund, increase risk of future enforcement actions that could affect fund performance, or raise questions about the GP's integrity and reliability. In some cases, compliance issues justify walking away from otherwise attractive transactions; in others, they warrant pricing adjustments reflecting elevated risk.</p>

<h3>Ongoing GP Compliance Monitoring</h3>

<p>After acquiring LP interests, the CCO monitors GP compliance on an ongoing basis. This includes reviewing quarterly and annual reports for any disclosure of regulatory examinations, investigations, or enforcement actions, monitoring SEC Form ADV amendments for underlying fund GPs to identify new disciplinary events, tracking industry news and publications for reports of enforcement actions or litigation involving portfolio GPs, and maintaining dialogue with other LPs in the same funds to share information about GP compliance matters. Early awareness of GP compliance problems enables proactive response before issues escalate.</p>

<p>When GP compliance issues arise, the CCO coordinates response strategies. Minor issues like technical compliance violations that the GP promptly corrects may require only monitoring to ensure resolution. More significant issues like SEC investigations, substantial penalties, or allegations of investor harm warrant more active response including requesting information from the GP about the issue and remediation steps, coordinating with other LPs on collective response or advisory committee involvement, consulting with counsel on potential legal remedies if the GP's conduct breaches fiduciary duties, and considering whether the issue triggers rights under the LPA such as key person provisions or removal rights.</p>

<h3>Advisory Committee Participation</h3>

<p>Many underlying funds have LP advisory committees that provide governance oversight, review conflicts of interest, approve valuations or certain transactions, and communicate LP concerns to GPs. When the secondaries fund acquires a sufficiently large interest to qualify for advisory committee participation, serving on committees provides visibility into fund governance and compliance matters. The CCO coordinates with investment team members on advisory committee participation, attends committee meetings when appropriate, reviews committee materials addressing conflicts and compliance matters, and provides compliance perspective on issues under committee consideration.</p>

<p>Advisory committee participation creates its own compliance considerations. Committee members owe duties to the fund and all LPs, not just their own interests, requiring decisions based on fund-level considerations. Committee members receive confidential information requiring appropriate handling and restrictions on using information for trading or competitive purposes. The CCO ensures committee representatives understand these obligations and maintain appropriate information barriers when representing the secondaries fund on multiple committees across funds that may compete in similar sectors.</p>

<h2>Conflicts of Interest in GP-Led Transactions</h2>

<p>GP-led transactions including continuation funds, tender offers, and asset strip sales create unique conflicts requiring enhanced disclosure, fair process, and regulatory compliance.</p>

<h3>Conflicts in Continuation Funds</h3>

<p>Continuation funds generate conflicts because the selling GP typically continues managing assets in the continuation fund while also representing selling LPs in the sale transaction. The GP benefits from high valuations that maximize sale proceeds to selling LPs but also benefits from deal completion that generates new management fees and carried interest even if pricing proves unfavorable to buyers. The GP controls timing, asset selection, and buyer selection, creating advantages over selling LPs who must rely on the GP to negotiate optimal terms.</p>

<p>The CCO ensures appropriate conflict mitigation when the secondaries fund participates in GP-led deals. Key protections include independent valuation opinions from qualified third parties validating that asset pricing is reasonable, competitive processes where multiple secondaries buyers submit bids rather than negotiated sales to single buyers reducing price discovery, LP advisory committee review and approval of transaction terms providing independent LP oversight, and disclosure to all LPs of GP conflicts and economics so selling LPs can make informed decisions about whether to roll into the continuation fund or exit. The CCO reviews documentation for these protections and coordinates with legal counsel when protections appear inadequate to protect the secondaries fund's interests.</p>

<h3>Regulatory Expectations for GP-Led Deals</h3>

<p>The SEC has indicated enhanced scrutiny of GP-led transactions in examination priorities and enforcement actions. Examiners focus on whether GPs disclose conflicts clearly and completely to all LPs, conduct fair valuation processes rather than inflating valuations to maximize their own economics, maintain appropriate separation between their roles as selling LP representative and continuation fund manager, and comply with fiduciary duties to both selling LPs and continuation fund buyers. The CCO ensures the secondaries fund's participation in GP-led deals includes appropriate diligence on these factors, requesting information about GP valuation processes and conflict management, reviewing offering materials and transaction documents for adequate conflict disclosure, and declining participation when GP conflict management appears inadequate.</p>

<h3>Documentation and Disclosure</h3>

<p>The CCO ensures the secondaries fund's own disclosure to its investors appropriately addresses GP-led transaction conflicts. Form ADV Part 2A should explain that the fund participates in GP-led deals where the selling GP may have conflicts, the fund's diligence processes for evaluating conflicts and valuation fairness, and circumstances where the fund might decline participation due to inadequate conflict mitigation. Quarterly reports to secondaries fund investors should identify GP-led transactions completed during the period, summarize key terms and pricing, and describe conflict mitigation measures that were implemented. This transparency demonstrates to secondaries fund investors that their GP takes conflicts seriously and conducts appropriate diligence rather than blindly participating in conflicted deals.</p>

<h2>Multi-Fund Compliance Coordination</h2>

<p>Secondaries funds holding LP interests in dozens or hundreds of underlying funds face ongoing compliance coordination requirements across multiple GPs each operating their own compliance frameworks.</p>

<h3>Annual Compliance Questionnaires</h3>

<p>Many underlying funds distribute annual compliance questionnaires to all LPs requesting information about regulatory status changes, beneficial ownership updates, compliance with fund restrictions, and various other matters. The CCO establishes systems for tracking questionnaire requests across the portfolio, completing questionnaires accurately and consistently, meeting response deadlines which vary across funds, and maintaining records of completed questionnaires. Template responses for commonly asked questions accelerate completion while ensuring accuracy.</p>

<p>Some questionnaires request certification of compliance with fund restrictions such as confirmation that the LP remains a qualified purchaser, the LP hasn't violated confidentiality obligations, and the LP isn't in breach of any fund covenants. The CCO reviews these certifications carefully, verifying that the secondaries fund can truthfully make requested certifications before signing. If issues exist that prevent certification, the CCO coordinates with the underlying fund GP on disclosure and resolution.</p>

<h3>Subscription Document Updates</h3>

<p>Underlying funds sometimes require LPs to complete updated subscription documents reflecting amended fund terms, updated investor information, or new regulatory requirements. The CCO monitors for these requests, coordinates completion of updated documents, ensures authorized signatories execute updates, and maintains current subscription documents in fund records. Failure to complete updates can result in delayed distributions, inability to participate in certain fund decisions, or other adverse consequences making timely response important.</p>

<h3>Beneficial Ownership Reporting</h3>

<p>Some underlying funds require periodic beneficial ownership reporting identifying individuals who control the secondaries fund. This requirement has increased following FinCEN's beneficial ownership reporting rule requiring companies to report beneficial owners to the government. The CCO tracks underlying funds requiring beneficial ownership reports, completes reports showing ultimate controlling persons of the secondaries fund, updates reports when control persons change, and coordinates with fund counsel on whether specific individuals meet beneficial ownership thresholds requiring disclosure.</p>

<h3>Coordinating Information Across Multiple GPs</h3>

<p>Managing compliance across numerous underlying funds requires organization and systematic tracking. The CCO implements compliance tracking systems showing each underlying fund position, key compliance contacts at each fund, pending compliance requests and deadlines, completed compliance items, and upcoming requirements. Many CCOs use spreadsheets or specialized compliance software to maintain this information, enabling efficient tracking and preventing missed deadlines or lost requests.</p>

<h2>Key Takeaways</h2>

<ul>
<li><strong>Transfer restrictions require systematic management across dozens of funds:</strong> GP consent provisions, ROFR requirements, lock-up periods, and minimum transfer sizes must be identified during diligence, navigated during transaction execution, and tracked across a large portfolio requiring specialized processes and persistent follow-up to avoid closing delays.</li>

<li><strong>GP consent approval timelines vary significantly:</strong> Some underlying fund GPs approve transfers within days while others take weeks or months. Building reputation as a reliable, professional secondaries buyer through thorough consent packages and responsive communication accelerates approvals and facilitates better transaction execution over time.</li>

<li><strong>ERISA plan asset considerations affect many secondaries positions:</strong> When underlying funds hold plan assets, secondaries funds must evaluate cascading plan asset exposure, comply with prohibited transaction restrictions, document exemption compliance, and often structure vehicles to segregate plan asset positions from non-plan assets.</li>

<li><strong>Form ADV disclosure must address secondaries-specific conflicts:</strong> GP-led transaction conflicts, relationships with underlying GPs, allocation of opportunities across multiple accounts, and unique fee structures require clear disclosure updated annually and when material changes occur to maintain regulatory compliance.</li>

<li><strong>Form PF reporting requires data aggregation from numerous underlying funds:</strong> Accurate reporting demands robust systems pulling information from underlying fund statements, normalizing data into Form PF categories, and conducting validation reviews to ensure completeness and accuracy before filing deadlines.</li>

<li><strong>Side letter compliance operates in two directions:</strong> Secondaries funds must honor side letter obligations acquired with LP interests while also negotiating their own side letters for new positions, managing MFN provisions that may entitle acquired positions to benefit from favorable terms granted to other LPs.</li>

<li><strong>AML/KYC requirements apply both to secondaries fund investors and underlying GPs:</strong> The CCO maintains current KYC packages for distribution when underlying funds request verification, while also conducting appropriate AML diligence on the secondaries fund's own investor base with risk-based procedures reflecting institutional investor profiles.</li>

<li><strong>Cross-border transactions may require CFIUS review or HSR clearance:</strong> Foreign investment in sensitive sectors triggers CFIUS national security review, while large acquisitions exceeding value thresholds may require HSR antitrust filing, adding 45-90 days to transaction timelines and requiring coordination with specialized counsel.</li>

<li><strong>GP-led transactions create conflicts requiring enhanced scrutiny:</strong> Continuation funds, tender offers, and strip sales involve GPs who benefit from deal completion regardless of pricing fairness. The CCO ensures appropriate protections including independent valuations, competitive processes, advisory committee oversight, and clear conflict disclosure.</li>

<li><strong>Ongoing multi-fund compliance coordination demands systematic tracking:</strong> Annual compliance questionnaires, subscription document updates, beneficial ownership reporting, and various information requests from dozens of underlying fund GPs require organized systems tracking obligations, deadlines, and completion status to avoid missed requirements.</li>
</ul>`,
  metaTitle: 'Secondaries Fund Compliance: Transfer Restrictions, ERISA, GP Consent & Regulatory Approvals',
  metaDescription: 'Comprehensive guide to secondaries compliance covering LP transfer approvals, GP consent processes, Form ADV/PF reporting, ERISA plan assets, AML/KYC, cross-border regulatory requirements, and multi-fund oversight coordination.',
  publishedDate: 'November 8, 2025',
  readingTime: 18,
}

export default article
