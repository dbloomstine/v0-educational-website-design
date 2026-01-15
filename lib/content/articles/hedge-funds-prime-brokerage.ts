import { Article } from '../types'

const article: Article = {
  id: 'hedge-funds-prime-brokerage-prime-brokerage',
  title: 'Prime Brokerage for Hedge Funds',
  slug: 'prime-brokerage',
  subtitle: 'Financing, custody, and execution services from prime brokerage relationships',
  fundType: 'hedge-funds',
  pillar: 'prime-brokerage',
  content: `<p>Prime brokerage relationships form the operational backbone of most hedge fund trading activities. Unlike traditional brokerage relationships focused on trade execution, prime brokers provide a comprehensive suite of services including margin financing, securities lending, custody, and operational support. For hedge funds employing leverage, short selling, or derivatives, the prime brokerage relationship determines much of what is operationally possible. Understanding this relationship—its services, economics, and risks—is essential for hedge fund operations.</p>

<h2>Core Prime Brokerage Services</h2>
<p>Margin financing allows hedge funds to leverage their capital by borrowing against securities positions. The prime broker extends credit secured by the fund's portfolio, enabling the fund to hold positions larger than its equity would otherwise allow. Margin terms—rates, haircuts, and concentration limits—significantly affect strategy economics and capacity.</p>

<p>Securities lending enables short selling by providing shares the fund can sell without owning. The prime broker locates and borrows securities from other clients or external sources, making them available for the fund to short. Lending availability and cost vary by security—widely held stocks may be easy to borrow while smaller issues or heavily shorted names can be expensive or unavailable.</p>

<p>Custody services hold the fund's assets. The prime broker maintains records of positions, processes corporate actions, and holds securities in custody. This differs from traditional custody in that assets held with the prime broker may be rehypothecated—used by the broker as collateral for its own financing—which creates counterparty exposure discussed below.</p>

<p>Trade execution, while not exclusive to prime brokers, is often provided. Funds may execute through their prime broker, other executing brokers, or electronic trading platforms. Executed trades typically settle to the prime brokerage account regardless of where execution occurs.</p>

<h2>Margin and Leverage Management</h2>
<p>Effective margin management requires understanding how the prime broker calculates margin requirements and how those requirements might change. Regulatory margin rules establish minimums, but prime brokers often impose more restrictive house requirements based on their risk assessment.</p>

<p>Margin calls occur when portfolio value declines or margin requirements increase. The fund must post additional collateral—typically cash or additional securities—or reduce positions. Understanding margin call mechanics, timing, and acceptable collateral helps manage liquidity during stress periods.</p>

<p>Leverage ratios describe how much borrowing the fund employs relative to its equity. Gross leverage counts long and short positions separately; net leverage reflects the difference. Prime brokers monitor leverage and may restrict additional borrowing if ratios exceed agreed thresholds.</p>

<p>Concentration limits restrict how much of the portfolio may be in single positions or sectors. These limits protect the prime broker from losses if concentrated positions decline sharply. Managing concentration constraints requires coordination between portfolio management and operations.</p>

<h2>Prime Broker Selection</h2>
<p>Major prime brokers include Goldman Sachs, Morgan Stanley, JPMorgan, Bank of America, and UBS, among others. Selection involves evaluating multiple factors: financing capacity and rates, securities lending capabilities, execution quality, technology platforms, operational support, and relationship service.</p>

<p>Strategy requirements drive selection priorities. Equity long/short funds prioritize securities lending. Fixed income strategies may emphasize financing terms for bond positions. Quantitative strategies might prioritize execution technology and market access. Multi-strategy funds may need prime brokers with broad capabilities.</p>

<p>Creditworthiness and stability matter given counterparty exposure. The prime broker holds fund assets and extends credit; its financial health directly affects fund security. Evaluating prime broker credit ratings, capital adequacy, and business stability forms part of the selection process.</p>

<h2>Multi-Prime Arrangements</h2>
<p>Many hedge funds engage multiple prime brokers rather than concentrating with a single provider. Multi-prime arrangements offer several benefits: competitive tension on pricing, reduced single-counterparty exposure, access to different securities lending inventories, and operational redundancy.</p>

<p>Managing multiple prime relationships adds operational complexity. Position reconciliation across primes, margin optimization, and relationship management all require additional effort. The benefits of diversification must be weighed against these operational costs.</p>

<p>Some funds use a primary prime broker for most activity while maintaining secondary relationships for specific purposes—perhaps accessing a broader securities lending pool or maintaining a backup relationship.</p>

<h2>Key Prime Brokerage Considerations</h2>
<ul>
<li><strong>Financing Terms:</strong> Margin rates, haircuts, and leverage limits affecting strategy capacity</li>
<li><strong>Securities Lending:</strong> Inventory availability, locate procedures, and borrow costs</li>
<li><strong>Custody and Rehypothecation:</strong> Understanding what happens to assets held with the prime broker</li>
<li><strong>Counterparty Risk:</strong> Exposure to prime broker credit and operational risk</li>
<li><strong>Reporting and Technology:</strong> Quality of position reporting, risk analytics, and operational tools</li>
<li><strong>Capital Introduction:</strong> Access to the prime broker's investor network for fundraising</li>
<li><strong>Operational Support:</strong> Trade support, corporate actions processing, and issue resolution</li>
</ul>

<h2>Counterparty Risk Management</h2>
<p>Assets held with prime brokers create counterparty exposure. If a prime broker fails, fund assets may be at risk or inaccessible during resolution proceedings. The Lehman Brothers failure demonstrated these risks when hedge fund assets were frozen during bankruptcy proceedings.</p>

<p>Segregation arrangements can reduce counterparty exposure. Excess margin may be held in segregated accounts protected from prime broker creditors. Understanding what segregation options exist and their implications helps manage counterparty risk.</p>

<p>Monitoring prime broker financial health provides early warning of potential issues. Tracking credit spreads, credit ratings, and public financial disclosures helps identify deterioration before it becomes critical. Having contingency plans for prime broker distress, including the ability to transfer positions, reduces vulnerability.</p>

<h2>Prime Brokerage Economics</h2>
<p>Prime broker revenue comes from multiple sources: spread on margin financing, securities lending fees, execution commissions, and other services. Understanding this economics helps in fee negotiations and relationship management.</p>

<p>Funds generate revenue for prime brokers through their activity—more trading, more borrowing, and more shorting generally means more revenue. This creates negotiating leverage for active funds and explains why prime brokers compete for hedge fund business.</p>

<h2>Questions for Prime Brokerage Relationships</h2>
<ul>
<li>What margin rates and haircuts apply to our typical positions?</li>
<li>How does the prime broker determine leverage limits, and what triggers changes?</li>
<li>What is the securities lending inventory for names we typically short?</li>
<li>What segregation options exist for excess margin and free cash?</li>
<li>What happens to our positions if the prime broker experiences distress?</li>
<li>How do we evaluate prime broker financial health and counterparty exposure?</li>
</ul>`,
  metaTitle: 'Prime Brokerage for Hedge Funds | Operations Guide',
  metaDescription: 'Guide to hedge fund prime brokerage including margin financing, securities lending, custody, counterparty risk, and prime broker selection.',
  publishedDate: 'January 15, 2026',
  lastUpdatedDate: 'January 15, 2026',
  readingTime: 4,
}

export default article
