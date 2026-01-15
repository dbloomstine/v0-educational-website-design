import { Article } from '../types'

const article: Article = {
  id: 'hedge-funds-fund-administration-fund-administration',
  title: 'Fund Administration for Hedge Funds',
  slug: 'fund-administration',
  subtitle: 'NAV calculation, investor servicing, and operational support for hedge fund structures',
  fundType: 'hedge-funds',
  pillar: 'fund-administration',
  content: `<p>Fund administration for hedge funds differs substantially from administration for private equity or venture capital. The frequency of NAV calculations, the complexity of trading activity, and the periodic liquidity offered to investors create operational demands that require specialized administrative capabilities. Most hedge funds engage third-party administrators, though some larger managers maintain certain functions in-house while outsourcing others.</p>

<h2>NAV Calculation Services</h2>
<p>The core function of hedge fund administration is calculating net asset value. Depending on fund terms, this may occur daily, weekly, or monthly. The administrator prices all portfolio positions, applies accruals for expenses and performance fees, and produces the NAV per share that determines investor account values.</p>

<p>For liquid securities trading on exchanges, pricing is relatively straightforward, typically using closing prices from primary exchanges. Over-the-counter instruments, derivatives, and less liquid positions require more judgment. Administrators may use pricing services, broker quotes, or manager-provided valuations depending on the instrument type and fund policies.</p>

<p>The administrator maintains the official books and records of the fund, serving as an independent check on the manager's internal accounting. This independence provides comfort to investors and supports the audit process. Discrepancies between manager and administrator records must be investigated and resolved, typically before NAV is finalized.</p>

<h2>Investor Servicing</h2>
<p>Administrators handle much of the operational interaction with fund investors. This includes processing subscription documents for new investors, verifying investor eligibility and conducting AML/KYC checks, and maintaining the investor register. Ongoing servicing encompasses distributing investor statements, processing redemption requests, and responding to investor inquiries about account balances and activity.</p>

<p>For funds with multiple share classes—perhaps offering different fee structures or currency denominations—the administrator tracks each class separately and ensures proper allocation of fund-level activity to each class. Some funds offer managed account structures or funds of one for larger investors, creating additional complexity in investor servicing.</p>

<h2>Subscription and Redemption Processing</h2>
<p>The subscription process involves reviewing investor documentation, verifying accredited investor or qualified purchaser status, conducting identity verification, and processing capital contributions. Administrators maintain checklists and procedures to ensure all required documentation is collected before accepting subscriptions.</p>

<p>Redemption processing requires careful attention to fund terms. The administrator tracks notice periods, lock-up expirations, gate provisions, and any side pocket allocations that affect what investors may redeem. When redemption requests exceed gate limits, the administrator implements the allocation methodology specified in fund documents.</p>

<p>Some administrators provide investor portal technology that allows investors to view statements, submit subscription and redemption requests, and access fund documents online. This self-service capability can reduce manual processing while improving investor experience.</p>

<h2>Performance Fee and High Water Mark Tracking</h2>
<p>Calculating performance fees in hedge funds requires tracking each investor's high water mark individually. When an investor experiences losses, no performance fee is charged on subsequent gains until the previous high NAV is exceeded. This creates investor-level accounting complexity that administrators must manage.</p>

<p>Additional complications arise from hurdle rates, crystallization frequencies, and the treatment of subscriptions and redemptions during a performance period. An investor subscribing mid-period may have a different high water mark than one who has been invested since period start. The administrator maintains these calculations and produces the periodic reports that support performance fee accruals.</p>

<h2>Reconciliation and Controls</h2>
<p>Administrators reconcile fund positions and cash balances with prime brokers and custodians. This daily or periodic reconciliation identifies discrepancies that could affect NAV accuracy. The reconciliation process covers trade settlement, corporate actions, margin movements, and other activity that affects positions or cash.</p>

<p>Control frameworks at administrators typically align with SOC 1 reporting standards. These reports, produced annually by independent auditors, describe the administrator's control environment and test the effectiveness of controls relevant to client financial reporting. Managers should review administrator SOC reports and understand any identified control deficiencies.</p>

<h2>Key Administrative Functions</h2>
<ul>
<li><strong>NAV Calculation:</strong> Pricing positions, accruing expenses and fees, and producing net asset values</li>
<li><strong>Investor Servicing:</strong> Processing subscriptions and redemptions, maintaining investor registers</li>
<li><strong>AML/KYC:</strong> Conducting investor verification and ongoing monitoring</li>
<li><strong>High Water Mark Tracking:</strong> Maintaining investor-level performance fee calculations</li>
<li><strong>Reconciliation:</strong> Verifying positions and cash with prime brokers and custodians</li>
<li><strong>Financial Reporting:</strong> Producing investor statements and supporting audit preparation</li>
<li><strong>Regulatory Reporting:</strong> Assisting with Form PF and other required filings</li>
</ul>

<h2>Administrator Selection Considerations</h2>
<p>Selecting an administrator involves evaluating capabilities against fund requirements. Key factors include experience with the fund's strategy and instruments, technology platforms for NAV calculation and investor servicing, pricing capabilities for less liquid positions, and geographic presence matching investor and fund domiciles.</p>

<p>Service level agreements should specify NAV delivery timing, reconciliation frequency, response times for investor inquiries, and escalation procedures for issues. Fee structures vary—some administrators charge basis points on AUM, others charge fixed fees or per-investor fees. Understanding the fee structure helps evaluate total cost as the fund grows.</p>

<h2>Questions When Engaging Administrators</h2>
<ul>
<li>What is the administrator's experience with our specific strategy and instrument types?</li>
<li>How are illiquid or hard-to-price positions handled in the NAV process?</li>
<li>What is the timeline for NAV delivery, and what happens if discrepancies arise?</li>
<li>How does the investor servicing team handle complex redemption scenarios?</li>
<li>What technology platform supports investor reporting and self-service?</li>
<li>What does the most recent SOC 1 report indicate about control effectiveness?</li>
</ul>`,
  metaTitle: 'Fund Administration for Hedge Funds | Operations Guide',
  metaDescription: 'Guide to hedge fund administration including NAV calculation, investor servicing, high water mark tracking, and administrator selection.',
  publishedDate: 'January 15, 2026',
  lastUpdatedDate: 'January 15, 2026',
  readingTime: 4,
}

export default article
