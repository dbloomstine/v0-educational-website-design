import { Article } from '../types'

const article: Article = {
  id: 'secondaries-tax-tax-compliance',
  title: 'Tax Planning for Secondaries Funds: Acquisition Basis, Multi-Fund K-1s, and Partnership Tax Complexity',
  slug: 'tax-compliance',
  subtitle: 'Managing secondaries tax including purchase basis allocation, coordinating multiple fund K-1s, and investor tax reporting',
  fundType: 'secondaries',
  pillar: 'tax',
  content: `<p>Secondaries fund taxation involves unique complexities from acquiring LP interests requiring tax basis allocation to underlying portfolio companies at purchase prices potentially differing from book basis, coordinating tax reporting across multiple underlying funds each issuing separate K-1s to the secondaries fund, managing inside versus outside basis differences when purchase prices exceed or fall below pro-rata shares of underlying fund basis, and preparing secondaries fund K-1s for investors consolidating tax impacts from numerous underlying holdings. Tax advisors must understand partnership taxation, secondary transfer rules, and basis tracking across complex structures.</p>

<h2>Purchase Basis Allocation and Tracking</h2>

<p>Acquiring LP interests creates tax basis equal to purchase price requiring allocation to underlying portfolio companies using Section 743(b) basis adjustments when elections are made. Adjustments reflect differences between purchase price and seller's share of partnership basis, affecting depreciation and gain/loss calculations on underlying company exits. The tax team tracks basis adjustments separately for each acquired position, calculates depreciation or amortization on adjustments, and determines gain/loss impacts when underlying companies are sold. Inside versus outside basis differences create complexities requiring specialized partnership tax expertise.</p>

<h2>Multi-Fund K-1 Coordination</h2>

<p>Secondaries funds receive K-1s from each underlying fund held, potentially 30-50+ K-1s annually. Each K-1 shows allocated ordinary income, capital gains, dividends, interest, state source income, and other separately stated items. The tax team aggregates underlying K-1s into consolidated secondaries fund K-1s for investors, tracks state source income across multiple jurisdictions, calculates UBTI from leveraged underlying funds, and manages timing as underlying fund K-1s arrive on different schedules. Delayed underlying K-1s cascade to secondaries fund K-1 delays affecting investor tax return timing.</p>

<h2>Tax Reporting for Complex Structures</h2>

<p>Secondaries funds may use blocker corporations for certain investors isolating partnership UBTI or foreign income. Blockers add corporate tax returns and dividend reporting complexity. International holdings create foreign tax credit calculations. The tax team coordinates with advisors managing multistate and international tax compliance across complex structures.</p>

<h2>Key Takeaways</h2>

<ul>
<li><strong>Basis tracking is essential:</strong> Section 743(b) adjustments from purchase prices create basis differences requiring tracking for depreciation and exit gain/loss calculations.</li>

<li><strong>Multi-fund K-1 consolidation is complex:</strong> Receiving dozens of underlying fund K-1s requires aggregation into investor K-1s with timing dependencies on underlying fund schedules.</li>

<li><strong>Blocker structures add complexity:</strong> Corporate entities isolating UBTI or foreign income create additional tax returns and reporting requirements.</li>

<li><strong>Specialized expertise is required:</strong> Partnership taxation complexity in secondaries structures demands experienced tax advisors and systematic processes.</li>
</ul>`,
  metaTitle: 'Secondaries Fund Tax: Basis Allocation, Multi-Fund K-1s, and Reporting',
  metaDescription: 'Guide to secondaries tax covering purchase basis allocation, coordinating underlying fund K-1s, and investor tax reporting.',
  publishedDate: 'December 18, 2024',
  readingTime: 3,
}

export default article
