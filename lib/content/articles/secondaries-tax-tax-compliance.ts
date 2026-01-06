import { Article } from '../types'

const article: Article = {
  id: 'secondaries-tax-tax-compliance',
  title: 'Tax Planning for Secondaries Funds: Section 743(b) Basis Adjustments, Multi-Fund K-1 Consolidation, Built-In Gains, and Cross-Border Tax Complexity',
  slug: 'tax-compliance',
  subtitle: 'Comprehensive guide to managing secondaries tax including purchase basis allocation, Section 754 elections, coordinating dozens of underlying fund K-1s, built-in gain/loss tracking, UBTI calculations, state and international tax reporting, and investor K-1 preparation across complex multi-fund structures',
  fundType: 'secondaries',
  pillar: 'tax',
  content: `<p>Secondaries fund taxation is more complex than primary fund taxation because acquiring existing LP interests triggers partnership tax rules governing basis allocation, Section 743(b) adjustments, built-in gains or losses from the seller's holding period, and coordination across 30-100+ underlying funds each issuing separate K-1s. Each acquired interest brings its own tax history: the seller's holding period affecting capital gain treatment, inside/outside basis disparities, state tax exposure from portfolio companies across multiple jurisdictions, UBTI from leveraged funds, and foreign tax credits from international holdings. Secondaries funds frequently use blocker corporations and parallel structures to accommodate different investor tax profiles, multiplying returns and adding corporate-level taxation.</p>

<h2>Understanding Secondaries Tax Framework</h2>

<h3>Partnership Tax Principles Applied to Secondaries</h3>

<p>Partnerships are pass-through entities that don't pay entity-level tax. Income is taxable when earned, not when distributed, creating "phantom income" where partners owe taxes despite receiving no cash. When purchasing an existing LP interest, the buyer's initial tax basis equals the purchase price. This basis determines gain or loss when the interest is sold and limits loss deductions to basis amount, with excess losses suspended until basis increases.</p>

<p>The buyer's outside basis (tax basis in the partnership interest) often differs from inside basis (the partnership's basis in underlying assets). Example: a secondaries fund pays $50 million for a 10% LP interest in a fund with $400 million total tax basis in portfolio companies. Outside basis is $50 million; share of inside basis is $40 million (10% of $400M). This $10 million disparity complicates calculating taxable gains as underlying companies are sold.</p>

<h3>Section 743(b) Basis Adjustments</h3>

<p>Section 743(b) addresses inside/outside basis disparities when partnership interests transfer. With a Section 754 election in effect (or with substantial built-in loss), the buyer receives a special basis adjustment: a step-up if purchase price exceeds inside basis share, or step-down if less. This adjustment is personal to the buyer and adjusts how gains, losses, and depreciation are allocated.</p>

<p>In the example above, the fund receives a $10 million Section 743(b) step-up. When portfolio companies are sold, the fund's taxable gain is reduced by the adjustment portion allocated to that asset. The adjustment must be allocated among partnership assets using prescribed methodologies based on fair market value and tax basis. For secondaries funds holding dozens of LP interests, tracking these calculations across multiple funds and hundreds of portfolio companies requires sophisticated tax systems.</p>

<h3>Section 754 Elections and Their Importance</h3>

<p>A Section 754 election is made by the partnership and remains in effect for all future transfers unless IRS-approved revocation. Most institutional PE and VC funds maintain Section 754 elections because they facilitate LP transfers and provide tax benefits to buyers. Without the election, the buyer receives no Section 743(b) adjustment (unless substantial built-in loss exists), meaning the inside/outside basis disparity persists and the secondaries fund pays more tax than economic reality suggests.</p>

<p>During diligence, the tax team identifies Section 754 election status. When absent, they estimate additional taxable gain from basis disparity, incorporate this into pricing models, and sometimes negotiate price reductions or request retroactive elections (which require IRS consent).</p>

<h3>Built-In Gains and Losses</h3>

<p>When a secondaries fund acquires an LP interest, it inherits certain tax attributes from the selling LP including built-in gains or losses on the underlying partnership's assets. Built-in gains exist when a portfolio company's fair market value exceeds its tax basis. Even though the secondaries fund paid fair market value for its LP interest, the partnership's tax basis in the portfolio company remains unchanged (except to the extent of Section 743(b) adjustments). When the portfolio company is eventually sold, the partnership recognizes gain equal to the sale proceeds minus the partnership's (low) tax basis, and this gain is allocated to all partners including the secondaries fund even though the secondaries fund purchased its interest at a price reflecting the built-in gain.</p>

<p>For example, assume a fund holds a portfolio company with $100 million fair market value and $30 million tax basis, creating $70 million of built-in gain. If a secondaries fund acquires a 10% LP interest at fair value for $10 million, the fund has purchased its share of $10 million fair value with $3 million of underlying tax basis. If the partnership subsequently sells the portfolio company for $100 million, the partnership recognizes $70 million gain ($100M proceeds - $30M basis), and the secondaries fund is allocated $7 million of that gain (10% of $70M). However, the secondaries fund paid $10 million for the interest, so economically it has $0 gain ($10M sale proceeds from its 10% interest - $10M purchase price). The $7 million of taxable gain allocated to the secondaries fund exceeds its economic gain due to the built-in gain that existed when it purchased the interest.</p>

<p>If the fund has a Section 754 election in effect, the secondaries fund receives a $7 million Section 743(b) basis adjustment that offsets the $7 million built-in gain allocation, resulting in $0 net taxable gain consistent with economic reality. This illustrates why Section 754 elections are valuable for secondaries buyers—they eliminate the mismatch between taxable and economic results caused by built-in gains.</p>

<p>Conversely, built-in losses can benefit secondaries buyers even without Section 743(b) adjustments. If a partnership holds assets with tax basis exceeding fair market value, the eventual sale will generate taxable losses allocated to partners including secondaries buyers who acquired interests after the losses accrued. This provides a tax benefit to the buyer that isn't reflected in the purchase price if the seller wasn't able to utilize the losses (e.g., due to insufficient basis or passive loss limitations).</p>

<h2>Purchase Basis Allocation and Calculation</h2>

<p>Determining the secondaries fund's initial tax basis in acquired LP interests and properly allocating that basis for purposes of Section 743(b) adjustments requires careful analysis and documentation.</p>

<h3>Components of Purchase Price Basis</h3>

<p>The secondaries fund's tax basis in an acquired LP interest generally equals the total amount paid for the interest including cash purchase price paid to the selling LP, the secondaries fund's assumption of any liabilities associated with the interest (such as unfunded capital commitments or environmental liabilities related to underlying assets), and transaction costs directly related to acquiring the interest such as legal fees, due diligence costs, and brokerage commissions. Transaction costs that benefit multiple acquisitions (such as general due diligence on the secondaries market or fundraising costs for the secondaries fund itself) are not included in the basis of specific LP interests but instead reduce the secondaries fund's overall returns or are capitalized as organizational costs.</p>

<p>Unfunded capital commitments require particular attention. When a secondaries fund acquires an LP interest with remaining unfunded commitments, the purchase price typically reflects a discount from the pro-rata NAV because the buyer must provide additional capital in the future. The buyer's initial tax basis includes only the cash paid upfront; it does not include unfunded commitments. As the underlying fund issues capital calls and the secondaries fund contributes additional capital, the secondaries fund's basis increases by the amount of each contribution. This creates a timing issue where the secondaries fund's basis builds gradually over time as commitments are funded rather than being established fully at acquisition.</p>

<p>For example, if a secondaries fund pays $40 million for an LP interest with $100 million of committed capital, $60 million already called, and $40 million unfunded, the secondaries fund's initial basis is approximately $40 million (the cash paid). When the underlying fund subsequently calls the remaining $40 million commitment, the secondaries fund's basis increases by $40 million as it contributes that capital, resulting in total basis of $80 million. This step-up occurs over time as capital calls are made rather than all upfront.</p>

<h3>Determining Section 743(b) Adjustment Amounts</h3>

<p>Once the secondaries fund's outside basis (purchase price) is determined, calculating the Section 743(b) adjustment requires determining the fund's share of the partnership's inside basis—the partnership's tax basis in its assets allocable to the acquired interest. The selling LP typically provides tax information as part of the transaction documentation including the LP's capital account balances (both tax and book), the LP's share of partnership liabilities (which affect basis under Section 752), the LP's share of the partnership's inside basis in assets, and calculations of the Section 743(b) adjustment if a Section 754 election is in effect.</p>

<p>The adjustment equals the difference between the buyer's outside basis and the buyer's share of inside basis. The calculation requires adding the buyer's share of partnership liabilities to inside basis because liabilities increase a partner's basis under Section 752. For leveraged funds with significant borrowings, liability allocations can be substantial and materially affect the adjustment calculation.</p>

<p>Example calculation: A secondaries fund pays $50 million for a 10% LP interest. At the acquisition date, the partnership's total inside basis in assets is $400 million, and the partnership has $100 million of recourse debt allocated to partners. The secondaries fund's share of inside basis is $40 million (10% of $400M), and its share of liabilities is $10 million (10% of $100M), giving total inside basis including liabilities of $50 million. The buyer's outside basis equals $50 million (purchase price). Since outside basis equals inside basis including liabilities, the Section 743(b) adjustment is $0 in this case—the purchase price exactly equals the buyer's share of inside basis plus liabilities, indicating no basis disparity requiring adjustment.</p>

<p>In contrast, if the secondaries fund paid $60 million for the same 10% interest (perhaps because the fund's assets appreciated in value since the last valuation), outside basis of $60 million exceeds inside basis plus liabilities of $50 million by $10 million, resulting in a $10 million step-up Section 743(b) adjustment. Conversely, if the fund paid $45 million (perhaps due to a discount for an illiquid position or concerns about portfolio company performance), the outside basis of $45 million is $5 million less than inside basis plus liabilities of $50 million, resulting in a $5 million step-down Section 743(b) adjustment that reduces the buyer's share of future depreciation and increases gain on asset sales.</p>

<h3>Allocating Basis Adjustments to Specific Assets</h3>

<p>The total Section 743(b) adjustment must be allocated among the partnership's individual assets using methodologies prescribed in Treasury Regulations. The allocation follows a two-step process. First, the adjustment is divided between ordinary income assets (such as inventory, receivables, and depreciation recapture) and capital gain assets (such as portfolio company equity interests held for more than one year). This division is based on the hypothetical gain or loss that would be allocated to the buying partner if the partnership sold all assets at fair market value immediately after the transfer.</p>

<p>Second, within each category, the adjustment is allocated to specific assets based on the amount of gain or loss that would be allocated to the buying partner on a hypothetical sale of each asset. For example, if a partnership holds three portfolio companies—Company A (FMV $100M, basis $60M), Company B (FMV $80M, basis $70M), and Company C (FMV $50M, basis $55M)—and a buyer acquires a 10% interest with a $7 million Section 743(b) step-up, the allocation might distribute $4 million to Company A (reflecting 10% of the $40M built-in gain), $1 million to Company B (10% of the $10M built-in gain), and $0 to Company C which has a built-in loss. The negative adjustment of $500K related to Company C's built-in loss would reduce the basis adjustment allocated to other assets.</p>

<p>In practice, these calculations are performed by specialized tax advisors with expertise in partnership taxation. The selling LP's tax advisor often prepares a draft calculation showing the buyer's share of inside basis and preliminary allocation of the Section 743(b) adjustment to assets. The buyer's tax advisor reviews these calculations, verifies the underlying asset valuations and basis figures, and documents the final allocation for the buyer's tax records. Accurate allocation is critical because it determines how the adjustment affects the buyer's tax results when specific assets are subsequently sold or depreciated.</p>

<h3>Tracking Basis Adjustments Over Time</h3>

<p>After acquisition, the tax team tracks how the Section 743(b) adjustment affects the secondaries fund's tax reporting as the underlying partnership disposes of assets. When a portfolio company is sold, the partnership allocates gain or loss to all partners based on their profit-sharing ratios. The secondaries fund then applies its Section 743(b) adjustment allocable to that specific company, reducing gain (or increasing loss) by the amount of step-up adjustment allocated to the company. This adjusted gain or loss flows through to the secondaries fund's investors on their K-1 schedules.</p>

<p>For example, continuing the illustration above, if the partnership subsequently sells Company A for $100 million, the partnership recognizes $40 million gain ($100M proceeds - $60M basis). The secondaries fund is allocated $4 million of this gain (10% partnership interest × $40M total gain). However, the secondaries fund has a $4 million Section 743(b) adjustment allocated to Company A. This adjustment offsets the $4 million gain allocation, resulting in $0 net taxable gain to the secondaries fund on the Company A sale—which correctly reflects economic reality since the fund paid a price reflecting Company A's $100 million fair value and received $10 million of proceeds (10% of $100M) on the sale.</p>

<p>As each underlying portfolio company is sold over the life of the fund, the portion of the Section 743(b) adjustment allocated to that company is utilized and eliminated. By the time all portfolio companies are sold and the partnership terminates, the entire Section 743(b) adjustment should be fully utilized, and the secondaries fund's cumulative taxable gains and losses should align with its economic results (purchase price versus proceeds received).</p>

<p>The tax team maintains detailed records showing the original Section 743(b) adjustment amount, the allocation to each underlying portfolio company or asset, adjustments to gain or loss as specific assets are sold, and remaining unapplied adjustment balance after each transaction. These records may span 10+ years as underlying funds mature and exit portfolio companies, requiring robust recordkeeping systems and continuity of tax advisors familiar with the original acquisition analysis.</p>

<h2>Multi-Fund K-1 Coordination and Consolidation</h2>

<p>Secondaries funds typically hold LP interests in 20 to 100+ underlying funds simultaneously, each of which issues a separate K-1 schedule annually reporting the secondaries fund's allocable share of income, gains, losses, deductions, and credits. Coordinating receipt of these K-1s and consolidating them into K-1s for secondaries fund investors creates substantial operational complexity.</p>

<h3>K-1 Collection and Timing Challenges</h3>

<p>Each underlying fund operates on its own fiscal year and follows its own tax reporting timeline. While many institutional funds target March 15 or March 31 for K-1 delivery (45 or 60 days after December 31 fiscal year-end), actual delivery dates vary widely. Some well-administered funds deliver K-1s by mid-March. Others routinely extend to mid-April or May. Funds with complex international holdings, pending portfolio company tax returns, or multiple layers of blocker entities often don't finalize K-1s until summer or even fall. Delayed K-1s from even a few underlying funds can prevent the secondaries fund from finalizing its own K-1s to investors, creating a cascading delay that frustrates investors who need K-1s to complete their own tax returns.</p>

<p>The tax team implements systematic K-1 tracking and follow-up processes. This begins with maintaining a complete list of all underlying fund positions showing each fund's tax ID number, fiscal year-end, expected K-1 delivery date based on prior years' experience, and contact information for the underlying fund's tax advisor or administrator. Several months before the secondaries fund's tax return deadline, the team initiates outreach to underlying funds confirming expected K-1 delivery dates, requesting early drafts or estimates for funds with anticipated delays, and escalating with persistent follow-up for funds that miss expected deadlines.</p>

<p>Some secondaries funds file extensions for their tax returns as a standard practice, pushing the filing deadline from March 15 to September 15 and providing additional time to collect underlying K-1s. This approach acknowledges the difficulty of obtaining all K-1s by mid-March but delays delivery of secondaries fund K-1s to investors for six months. Other secondaries funds pressure underlying fund GPs for timely K-1 delivery, threatening to exclude late-delivering funds from future secondaries acquisitions or escalating complaints through LP advisory committees. These tactics have mixed effectiveness but signal the importance of timely reporting.</p>

<h3>K-1 Review and Validation</h3>

<p>As underlying fund K-1s are received, the tax team reviews each for accuracy and completeness. The review includes verifying that the K-1 reflects the correct ownership percentage based on the secondaries fund's LP interest, confirming that beginning and ending capital accounts reconcile with prior year K-1s and interim capital calls and distributions, checking that income and gain allocations appear reasonable relative to fund performance and portfolio company exits during the year, identifying any unusual items requiring follow-up such as unexpected UBTI, foreign taxes, or penalty-related items, and flagging errors or inconsistencies requiring correction by the underlying fund.</p>

<p>When issues are identified, the tax team contacts the underlying fund's tax preparer requesting corrections or clarification. Common issues include incorrect ownership percentages due to failing to update records after secondary transfers, timing differences where distributions or capital calls aren't reflected consistently between the secondaries fund's records and underlying fund records, and computational errors in allocating income or expenses across partners. Resolving these issues can take weeks of back-and-forth correspondence, further delaying K-1 finalization.</p>

<h3>Consolidating Underlying K-1s into Investor K-1s</h3>

<p>Once all underlying fund K-1s are received and validated, the tax team consolidates them into K-1s issued to secondaries fund investors. This consolidation aggregates hundreds of line items across dozens of source K-1s. Each underlying K-1 may have 30+ separately stated items that can't simply be netted together—instead, similar items from different underlying funds are added together while maintaining required separate statement categorizations.</p>

<p>Key items requiring aggregation include ordinary income from portfolio company operations (though this is rare in typical PE/VC funds), long-term and short-term capital gains from portfolio company exits, qualified dividend income if underlying companies pay dividends, interest income and expense, Section 1256 gains for funds trading certain derivatives or commodities, other portfolio income and deductions, Section 743(b) gain adjustments (tracked separately for each acquired position as discussed above), state source income showing taxable income in each state where underlying portfolio companies operate, and foreign source income and foreign tax credits from international investments.</p>

<p>The tax team uses specialized partnership tax software to manage consolidation. Popular platforms include GoSystems, CCH ProSystem, and specialty partnership tax packages that import K-1 data from underlying funds, perform aggregation calculations, track basis and Section 743(b) adjustments, and generate secondaries fund K-1s for investors. Proper software configuration is essential—errors in mapping underlying K-1 line items to the correct investor K-1 categories can result in incorrect character of income (e.g., short-term versus long-term capital gains) affecting investors' tax liabilities.</p>

<h3>Managing Amended K-1s</h3>

<p>Amended K-1s from underlying funds create substantial additional complexity. It's not uncommon for one or more underlying funds to issue amended K-1s months after the original K-1 was delivered, correcting errors discovered during the underlying fund's tax return review process or reflecting revised information from portfolio company tax returns that were initially estimated. When an underlying fund issues an amended K-1, the secondaries fund must evaluate whether the changes are material enough to require amending its own K-1s to investors.</p>

<p>Immaterial changes—small adjustments to income or loss amounts that don't significantly affect any investor's tax liability—may not warrant amended K-1s, particularly if investors have already filed tax returns using the original K-1s. Material changes—substantial income or loss adjustments, changes in character of income (e.g., from long-term to short-term gains), or corrections to state tax apportionment affecting investors in high-tax states—typically require amended K-1s even though this creates burden for investors who must file amended tax returns.</p>

<p>The decision whether to amend involves balancing the administrative burden and investor frustration from amended returns against the risk that material errors go uncorrected, potentially triggering IRS examinations or penalties. The tax team coordinates with fund counsel and senior management on amendment decisions for borderline situations, clearly communicates with investors when amendments are necessary explaining why the amendment was required and what changed, and maintains detailed documentation supporting amendment decisions for potential future IRS scrutiny.</p>

<h2>State Tax Considerations and Multi-Jurisdictional Reporting</h2>

<p>Secondaries funds inherit state tax exposure from underlying portfolio companies operating across multiple states, creating complex compliance obligations and potential tax liabilities in dozens of jurisdictions.</p>

<h3>State Income Tax Nexus and Filing Requirements</h3>

<p>Each underlying portfolio company operating in a state creates potential nexus (taxable presence) in that state for the partnership holding the company, and by extension for the secondaries fund as a partner in that partnership. Most states tax nonresident partners on their share of partnership income derived from in-state sources. For a secondaries fund holding positions in 50 underlying funds, each with portfolio companies in multiple states, the fund may have filing obligations in 30-40 states or more, even if the secondaries fund itself has no operations or employees in those states.</p>

<p>State filing requirements vary significantly. Some states have minimum income thresholds below which nonresident partners don't need to file—for example, Massachusetts exempts nonresidents with less than $8,000 of Massachusetts-source income. Other states require filing regardless of income amount. Some states allow composite returns where the partnership files a single return reporting and paying tax on behalf of all nonresident partners, simplifying compliance for partners who would otherwise need to file individual returns. Other states don't allow composites, forcing each partner to file separately.</p>

<p>The tax team coordinates with underlying fund GPs to determine state filing requirements and ensure compliance. This includes requesting from each underlying fund detailed state source income schedules showing the secondaries fund's allocable share of income in each state, confirming whether underlying funds file composite returns covering all nonresident partners or whether separate partner filing is required, and for states requiring separate filing, preparing and filing nonresident tax returns on behalf of the secondaries fund. Managing compliance across dozens of states demands systematic tracking, expertise in multistate tax rules, and typically engagement of specialized state tax advisors for complex situations.</p>

<h3>State Tax Credits and Estimated Payments</h3>

<p>Many underlying funds file composite returns and remit estimated tax payments on behalf of nonresident partners including secondaries funds. These payments create state tax credits that reduce the secondaries fund's own state tax liability or can be claimed as credits by secondaries fund investors on their returns. Tracking state tax payments and credits across multiple underlying funds and multiple states requires careful recordkeeping.</p>

<p>Each underlying fund that makes composite payments should provide documentation showing the amount paid to each state on behalf of the secondaries fund. These amounts are claimed as tax payments or credits on the secondaries fund's state tax returns or passed through to investors if the secondaries fund files its own composite returns for its investors. Failure to properly track and claim these credits results in double-payment of state taxes—once by the underlying fund on behalf of the secondaries fund, and again by the secondaries fund or its investors who are unaware credits exist.</p>

<h3>Avoiding Double-State Taxation</h3>

<p>Partners in tiered partnership structures face potential double taxation where both the upper-tier partnership (secondaries fund) and lower-tier partnerships (underlying funds) create state tax filing obligations. For example, a secondaries fund domiciled in Delaware might hold an LP interest in a private equity fund organized in California with portfolio companies in Texas. This structure could create filing requirements in Delaware (where the secondaries fund is organized), California (where the underlying fund is organized), and Texas (where portfolio companies operate). Proper structuring and credit mechanisms should eliminate double taxation, but compliance complexity increases substantially.</p>

<p>Some states offer relief provisions for tiered partnerships, allowing upper-tier partners to claim credits for taxes paid at lower-tier levels. Other states tax both tiers without relief, creating genuine double taxation that can only be avoided through restructuring such as using blockers to interrupt pass-through taxation. The tax team evaluates state tax exposure during acquisition diligence, estimates the incremental state tax burden from acquiring positions with substantial operations in high-tax states, and incorporates state tax costs into return projections. In some cases, state tax burden is significant enough to affect acquisition decisions or pricing negotiations.</p>

<h2>UBTI and Tax-Exempt Investor Considerations</h2>

<p>Unrelated business taxable income (UBTI) arises when tax-exempt investors such as pension funds, endowments, or charitable foundations receive certain types of income incompatible with tax-exempt status, most commonly income from leveraged investments or operating businesses. Secondaries funds must manage UBTI exposure both for tax-exempt investors in the secondaries fund itself and by tracking UBTI in underlying fund positions.</p>

<h3>Sources of UBTI in Secondaries Funds</h3>

<p>The most common source of UBTI in secondaries structures is acquisition indebtedness—debt incurred by a partnership to acquire or carry property. When an underlying fund employs leverage such as subscription credit lines or fund-level acquisition financing, income attributable to debt-financed property generates UBTI for tax-exempt partners. The amount of UBTI equals the partner's share of income multiplied by the average acquisition indebtedness ratio (debt divided by adjusted basis of property) for the year.</p>

<p>For example, if an underlying fund has average debt of $30 million and average property basis of $100 million during the year, the acquisition indebtedness percentage is 30%. If the fund generates $10 million of income and a tax-exempt LP holds a 10% interest, the LP's share of income is $1 million. Of this, $300,000 (30% × $1M) is UBTI subject to tax, while the remaining $700,000 is tax-exempt. The tax-exempt investor must file Form 990-T reporting the UBTI and pay tax on it (currently 21% corporate rate for most tax-exempt entities), eliminating the tax exemption for the leveraged portion of returns.</p>

<p>When secondaries funds have tax-exempt investors, they must track UBTI from all underlying fund positions, aggregate UBTI across positions, and report consolidated UBTI to tax-exempt investors on their K-1s. Accurate tracking requires obtaining detailed debt schedules from underlying funds showing monthly debt balances and corresponding asset basis figures to calculate average indebtedness percentages. Some underlying funds provide UBTI calculations on K-1s or supplemental schedules; others require the LP's tax advisor to perform calculations based on financial statement data.</p>

<h3>Blocker Corporations to Eliminate UBTI</h3>

<p>Many secondaries funds use blocker corporations—taxable C corporations that hold LP interests generating UBTI—to shield tax-exempt investors from UBTI exposure. Income earned by the blocker corporation is subject to corporate-level tax (21% federal rate plus state taxes where applicable), but distributions from the blocker to tax-exempt investors are generally tax-free dividends not treated as UBTI. This structure trades partnership pass-through taxation for corporate-level tax, accepting the corporate tax cost to provide tax-exempt investors with UBTI-free returns.</p>

<p>The decision whether to use blockers involves analyzing expected UBTI levels, comparing corporate tax cost against tax-exempt investors' UBTI tax cost, considering additional complexity and administrative expense of maintaining blocker entities, and evaluating investor preferences—some tax-exempt investors prefer UBTI-free structures even if slightly less efficient, while others are comfortable with UBTI if overall returns are higher. Blockers are most attractive when UBTI is expected to be substantial (e.g., because many underlying funds use significant leverage) and when the secondaries fund has a large tax-exempt investor base that would otherwise incur significant UBTI tax.</p>

<h3>Blocker Structure and Mechanics</h3>

<p>A typical blocker structure involves establishing one or more offshore corporations (often in the Cayman Islands or another jurisdiction with favorable corporate tax rules and no withholding on distributions to US investors) that hold LP interests in underlying funds generating UBTI. Tax-exempt investors invest in the secondaries fund through the blocker, while taxable investors invest directly in the main fund, creating parallel fund structures with different tax treatment.</p>

<p>The blocker corporation files its own corporate tax return (Form 1120 for a US corporation or Form 5471 information reporting for a foreign corporation owned by US persons), pays corporate income tax on its share of underlying fund income, and distributes after-tax proceeds to tax-exempt investors. From the tax-exempt investor's perspective, it holds stock in a corporation and receives dividend income that isn't UBTI. The corporation absorbs the complexity of tracking underlying K-1s, calculating UBTI, and managing multi-state tax compliance.</p>

<p>However, blockers add costs including corporate tax on blocker-level income (21% federal plus potential state taxes), additional tax return preparation fees for corporate returns, potential foreign corporate filing requirements if offshore corporations are used, and transfer pricing and related-party transaction concerns if the blocker and main fund interact. These costs must be weighed against the benefit of UBTI elimination for tax-exempt investors.</p>

<h2>International Tax Considerations</h2>

<p>Secondaries funds with international exposure face additional tax complexity from foreign taxes, withholding requirements, and cross-border reporting obligations.</p>

<h3>Foreign Tax Credits and Withholding</h3>

<p>When underlying funds hold non-US portfolio companies or international assets, those investments may generate foreign-source income subject to foreign income taxes. Foreign taxes paid are generally creditable against US federal income tax liability for US investors, preventing double taxation of the same income. However, foreign tax credits are subject to complex limitations including the requirement that credits not exceed the US tax that would be owed on the foreign income, separate limitation categories for passive income versus general category income requiring credits to be calculated separately, and the rule that excess foreign tax credits that can't be used in the current year can be carried back one year or forward ten years but may expire unused if not absorbed during those periods.</p>

<p>For secondaries funds, managing foreign tax credits requires tracking foreign-source income and foreign taxes paid from each underlying fund position, allocating these amounts to secondaries fund investors on their K-1s with appropriate categorization for foreign tax credit limitation calculations, and ensuring investors receive sufficient information to properly calculate their allowable foreign tax credits on personal or corporate returns. Investors in low US tax brackets may be unable to fully utilize foreign tax credits, reducing after-tax returns from international investments. Conversely, investors in high brackets may benefit from credits that offset their US tax on foreign income.</p>

<h3>Non-US Investors in Secondaries Funds</h3>

<p>When non-US investors participate in secondaries funds, additional complexity arises from US withholding tax on US-source income, potential US filing requirements for non-US investors earning US income, and tax treaty considerations that may reduce withholding or provide exemptions. The secondaries fund typically withholds 30% on US-source income (or lower treaty rates if applicable) paid to non-US investors and remits withheld amounts to the IRS with Forms 1042 and 1042-S reporting withholding.</p>

<p>Determining the correct amount of US-source income allocable to non-US investors requires look-through analysis of underlying fund holdings. Income from US portfolio companies is generally US-source, while income from foreign companies is foreign-source. For secondaries funds with diverse underlying holdings spanning multiple geographies, calculating the US-source percentage for each position and aggregating across the portfolio to determine total US-source income allocable to non-US investors demands detailed analysis.</p>

<h3>FATCA and CRS Reporting</h3>

<p>The Foreign Account Tax Compliance Act (FATCA) requires foreign financial institutions to report US account holders to the IRS, and the Common Reporting Standard (CRS) establishes similar reporting requirements for many countries' tax authorities. Secondaries funds with non-US investors or non-US holdings may have FATCA or CRS reporting obligations including filing Form 8966 to report foreign financial accounts held by US persons, withholding on payments to non-participating foreign financial institutions that don't comply with FATCA, and coordinating with fund administrators to ensure proper FATCA/CRS classification and reporting. These rules add administrative burden and require specialized expertise, typically managed by fund administrators with international tax compliance capabilities.</p>

<h2>Investor K-1 Preparation and Delivery</h2>

<p>After consolidating all underlying fund K-1s and completing the secondaries fund's tax calculations, the tax team prepares and distributes K-1s to secondaries fund investors.</p>

<h3>K-1 Content and Presentation</h3>

<p>Investor K-1s report each investor's allocable share of the secondaries fund's income, gains, losses, deductions, and credits for the year. Key sections include ordinary income or loss from operations (though typically minimal in secondaries funds), long-term and short-term capital gains or losses from portfolio company sales and partnership interest sales, qualified dividends and interest income, Section 743(b) adjustments that affect individual investors' basis calculations, state source income showing taxable income allocated to each state for multistate tax compliance, foreign source income and foreign tax credits for investors with foreign tax credit calculations, UBTI for tax-exempt investors, and beginning and ending capital account balances showing investor equity at year-start and year-end.</p>

<p>The K-1 package also includes supplemental statements providing additional detail beyond what fits on the standard K-1 form. These statements might include detailed state apportionment schedules showing income by state, foreign tax credit calculations showing foreign income and taxes by country and limitation category, UBTI calculations explaining the sources and calculation methodology, and Section 743(b) adjustment tracking showing how adjustments affect the investor's specific tax results. Clear, comprehensive supplemental statements help investors and their tax preparers understand the K-1 and correctly report items on investor tax returns.</p>

<h3>Timing and Investor Communication</h3>

<p>Most secondaries funds target mid-March to early April for K-1 delivery, providing investors sufficient time to file personal or corporate tax returns by the standard April 15 deadline (or September 15 if investors file extensions). However, as noted earlier, delays in receiving underlying fund K-1s often push secondaries fund K-1 delivery to May, June, or later, forcing investors to file extensions and delaying their tax filing.</p>

<p>The tax team communicates proactively with investors about expected K-1 timing. Early in the year (January or February), the team provides investors with an estimated K-1 delivery date based on historical experience and progress collecting underlying K-1s. If delays emerge, the team updates investors regularly explaining the reason for delays (e.g., "We are awaiting K-1s from 3 underlying funds that have not yet delivered; we expect to finalize K-1s within 2 weeks of receiving these outstanding items"). This transparency helps investors plan their own tax filing processes and reduces frustration from unexpected delays.</p>

<p>Some secondaries funds provide draft or estimated K-1s to investors in March even if final K-1s won't be available until later. Draft K-1s allow investors to prepare substantially complete tax returns, filing extensions based on reasonable estimates and amending if necessary when final K-1s arrive. While drafts add workload for the tax team, they provide value to investors who prefer early estimates over waiting months for final numbers.</p>

<h3>Electronic Delivery and Tax Reporting Platforms</h3>

<p>Most institutional investors prefer electronic K-1 delivery through secure portals rather than paper documents by mail. Electronic delivery is faster, more secure (no risk of documents lost in mail), and integrates with investors' tax return preparation systems. The secondaries fund establishes a secure investor portal (often provided by the fund administrator) where investors can log in to access K-1s and other tax documents. The portal should provide K-1s in PDF format for review and printing, machine-readable data files (e.g., XML or CSV) allowing automated import into tax software, prior year K-1s for reference and comparison, and supplemental tax information such as state schedules and detailed calculations.</p>

<p>Some investors use third-party tax reporting aggregation platforms such as Black Diamond, eFront, or specialized partnership tax systems that consolidate K-1s from multiple fund investments. The secondaries fund can facilitate integration by providing K-1 data in formats compatible with these platforms, reducing manual data entry for investors and accelerating their tax return preparation.</p>

<h2>Working with Tax Advisors and Specialists</h2>

<p>The complexity of secondaries fund taxation typically requires engagement of specialized tax advisors with partnership tax expertise rather than relying solely on internal tax staff or generalist accounting firms.</p>

<h3>Selecting Tax Advisors</h3>

<p>Secondaries funds typically work with accounting firms that have significant private funds tax practices and deep partnership taxation expertise. The Big Four firms (Deloitte, EY, KPMG, PwC) all have specialized groups focused on alternative investments including secondaries. Regional and boutique firms also serve this market, often providing more partner attention and responsive service than large national firms. Key selection criteria include demonstrated experience with secondaries funds and complex partnership structures, depth of partnership tax technical expertise including Section 743(b) adjustments and tiered partnership issues, capabilities in multistate and international tax for funds with broad geographic exposure, capacity to handle the volume of underlying K-1s and complexity of consolidation, and technology systems that integrate with the secondaries fund's financial reporting platforms.</p>

<p>The relationship typically spans multiple years as the tax team needs continuity and institutional knowledge about the fund's structure, history of acquisitions and dispositions, and ongoing issues. Changing tax advisors mid-stream is disruptive and risks errors if the new advisor doesn't fully understand historical decisions and calculations.</p>

<h3>Tax Advisor Engagement Model</h3>

<p>Most secondaries funds engage tax advisors to prepare annual tax returns for the fund and blocker entities if applicable, prepare and deliver K-1s to investors, and coordinate with underlying fund tax preparers on issues requiring resolution. The advisor also provides tax planning and structuring advice during the year addressing acquisition tax due diligence for proposed secondaries purchases, evaluating whether Section 754 elections exist in underlying funds and the tax impact if absent, advising on blocker structures and whether to employ them for specific acquisitions generating UBTI, and planning for tax-efficient disposition of positions considering holding periods, character of income, and investor impacts.</p>

<p>The fee structure varies, with some advisors charging fixed annual retainers covering routine tax return preparation and a specified number of K-1s, with incremental charges if the number of investors or underlying positions increases significantly. Others charge hourly for all services, providing detailed billing showing time allocation across different activities. For secondaries funds, tax advisor fees typically range from $100,000 to $500,000+ annually depending on fund size, number of underlying positions, number of investors, and complexity factors like international holdings or blocker corporations.</p>

<h3>Internal Tax Team Responsibilities</h3>

<p>While external advisors handle technical tax return preparation, the internal tax team (which may be one person or a dedicated group depending on fund size) coordinates overall tax operations. Responsibilities include serving as primary contact with external tax advisors, providing information and documentation they need, collecting and organizing underlying fund K-1s and supporting schedules, tracking K-1 delivery status and following up on late items, reviewing draft K-1s prepared by advisors for accuracy and reasonableness, coordinating with investors on K-1 questions or issues, managing multistate tax compliance and estimated payment requirements, and maintaining tax records and documentation for potential IRS examination.</p>

<p>For tax due diligence on acquisitions, the internal team coordinates with external advisors and legal counsel to analyze tax aspects including requesting tax information from selling LPs, evaluating Section 754 election status and impact on after-tax returns, identifying state tax exposure and multistate filing requirements, assessing UBTI implications for tax-exempt investors, and incorporating tax considerations into financial models and acquisition decisions. This due diligence must be completed during the compressed timeframe of transaction execution, requiring responsive tax advisors and clear internal processes.</p>

<h2>Tax Due Diligence on Secondaries Acquisitions</h2>

<p>Before acquiring LP interests, thorough tax due diligence identifies issues that affect after-tax returns and structures transactions to optimize tax efficiency.</p>

<h3>Reviewing Seller's Tax Information</h3>

<p>The selling LP provides tax information as part of transaction documentation including recent K-1s showing the seller's allocations of income, gains, and losses, capital account statements showing tax and book capital account balances, liability shares showing the seller's allocable share of partnership debt affecting basis, and holding period information indicating when the LP interest was acquired for purposes of determining long-term versus short-term capital gain treatment if the secondaries fund subsequently sells the interest. The buyer's tax advisor reviews this information to calculate the expected Section 743(b) adjustment, identify any potential issues such as seller capital accounts that don't reconcile with reported K-1s or unexpected prior-year tax items, and estimate the tax basis and holding period the buyer will inherit.</p>

<h3>Confirming Section 754 Election Status</h3>

<p>As discussed earlier, determining whether the underlying fund has a Section 754 election in effect is critical. The buyer requests confirmation from the underlying fund GP or tax preparer, reviews prior year tax returns if available showing whether the election was made, and if no election exists, evaluates the tax cost and considers negotiating for an election or adjusting pricing. Some purchase agreements include representations from the seller about Section 754 election status, with indemnification if representations prove incorrect and the buyer incurs incremental tax costs.</p>

<h3>Evaluating Built-In Gains and Losses</h3>

<p>The buyer estimates built-in gains or losses on underlying portfolio companies by comparing fair market values to tax basis. This information is often difficult to obtain during diligence because underlying fund GPs may not share detailed portfolio company tax basis information with prospective buyers. However, the buyer can estimate built-in gains based on the fund's overall NAV, total capital contributed, and distributions to date. If NAV plus distributions substantially exceeds capital contributions, significant built-in gains likely exist. The buyer evaluates how built-in gains affect expected tax liability when portfolio companies exit, particularly if no Section 754 election provides offsetting basis adjustments, and incorporates estimated tax costs into pricing models.</p>

<h3>Assessing State and International Tax Exposure</h3>

<p>The buyer reviews where underlying portfolio companies operate to estimate state tax filing requirements and tax exposure. Companies in high-tax states like California, New York, or Massachusetts create more significant state tax burden than companies in no-tax states like Texas or Florida. International holdings create foreign tax credit considerations and potentially foreign filing requirements. The buyer estimates incremental state and international tax costs and evaluates whether these costs materially affect returns or require structural consideration such as using blockers for high-tax international positions.</p>

<h2>Key Takeaways</h2>

<ul>
<li><strong>Section 743(b) basis adjustments are essential for aligning tax with economic results:</strong> When secondaries funds purchase LP interests at prices differing from underlying tax basis, Section 743(b) adjustments prevent mismatches between taxable gains/losses and economic gains/losses, but only if the underlying fund has a Section 754 election in effect—confirming election status during diligence is critical.</li>

<li><strong>Inside versus outside basis disparities create ongoing complexity:</strong> The difference between a buyer's purchase price (outside basis) and share of partnership's asset basis (inside basis) must be tracked and applied correctly as underlying assets are sold over 10+ years, requiring sophisticated systems and continuity of tax advisors familiar with original acquisition analysis.</li>

<li><strong>Multi-fund K-1 coordination is operationally intensive:</strong> Collecting, reviewing, and consolidating 30-100+ underlying fund K-1s with varying delivery schedules demands systematic tracking, persistent follow-up, and specialized software to aggregate hundreds of line items while maintaining proper tax characterization.</li>

<li><strong>Delayed underlying K-1s cascade to investor K-1 delays:</strong> Late delivery from even a few underlying funds prevents finalizing secondaries fund investor K-1s, frustrating investors who need K-1s to complete tax returns—many secondaries funds file extensions as standard practice or provide draft K-1s to mitigate timing issues.</li>

<li><strong>State tax compliance spans 30-40+ jurisdictions:</strong> Underlying portfolio companies operating across multiple states create filing obligations in each state, composite return coordination, and multistate tax credit tracking requiring specialized expertise and systematic management to avoid missed filings or double-payment of state taxes.</li>

<li><strong>UBTI from leveraged funds requires careful management:</strong> Debt-financed income from underlying funds using subscription lines or acquisition financing generates UBTI for tax-exempt investors, often requiring blocker corporations that accept corporate-level tax costs to shield tax-exempt LPs from UBTI exposure.</li>

<li><strong>Blocker corporations trade simplicity for tax cost:</strong> While blockers eliminate UBTI and simplify reporting for tax-exempt investors, corporate-level tax (21% federal plus state) and additional administrative complexity must be weighed against benefits—blockers are most valuable when UBTI would otherwise be substantial.</li>

<li><strong>Foreign tax credits and international exposure add complexity:</strong> Non-US holdings generate foreign tax credits subject to limitations, withholding requirements for non-US investors, and FATCA/CRS reporting obligations requiring specialized international tax expertise and coordination with administrators.</li>

<li><strong>Built-in gains create tax exposure for buyers:</strong> Purchasing LP interests at fair value doesn't eliminate taxable gains from underlying appreciated assets—without Section 754 elections providing offsetting adjustments, buyers pay tax on gains that accrued before their purchase, reducing after-tax returns.</li>

<li><strong>Specialized partnership tax expertise is essential:</strong> The technical complexity of secondaries taxation demands engagement of experienced partnership tax advisors, robust tax software systems, and internal coordination capabilities to manage acquisition diligence, annual compliance, multi-jurisdictional reporting, and investor K-1 delivery across complex multi-fund structures.</li>
</ul>`,
  metaTitle: 'Secondaries Fund Tax: Section 743(b) Adjustments, Multi-Fund K-1s, UBTI & State Tax',
  metaDescription: 'Comprehensive guide to secondaries tax covering purchase basis allocation, Section 754 elections, coordinating underlying fund K-1s, built-in gains, UBTI, blocker corporations, state and international tax, and investor reporting.',
  publishedDate: 'November 14, 2025',
  lastUpdatedDate: 'January 6, 2025',
  readingTime: 37,
}

export default article
