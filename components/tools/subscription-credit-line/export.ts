import {
  SubscriptionLineOutput,
  formatCurrency,
  formatPercent,
  formatBasisPoints,
  formatMultiple
} from './subscriptionLineCalculations'

export function exportSubscriptionLineAnalysis(output: SubscriptionLineOutput) {
  const timestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const content = `
SUBSCRIPTION CREDIT LINE IMPACT ANALYSIS
Generated: ${timestamp}
Source: FundOpsHQ Subscription Credit Line Impact Visualizer

═══════════════════════════════════════════════════════════════════════

KEY INPUTS
═══════════════════════════════════════════════════════════════════════

FUND STRUCTURE:
Fund Size:                    ${formatCurrency(output.input.fundSize)}
Investment Period:            ${output.input.investmentPeriodYears} years
Total Fund Term:              ${output.input.fundTermYears} years
Deployment Pace:              ${output.input.deploymentPaceType}
Realization Schedule:         ${output.input.realizationScheduleType}
Gross MOIC:                   ${formatMultiple(output.input.grossMOIC)}

ECONOMICS:
Management Fee:               ${formatPercent(output.input.managementFeeRate, 2)} on ${output.input.managementFeeBasis}
Carried Interest:             ${formatPercent(output.input.carryRate, 0)}
Preferred Return:             ${formatPercent(output.input.prefRate, 1)}

SUBSCRIPTION LINE:
Using Credit Facility:        ${output.input.useLine ? 'Yes' : 'No'}
${output.input.useLine ? `Facility Size:                ${formatPercent(output.input.facilitySize, 0)} of commitments (${formatCurrency(output.input.fundSize * output.input.facilitySize)})
Interest Rate:                ${formatPercent(output.input.interestRate, 2)} annual
Max Days Outstanding:         ${output.input.maxDaysOutstanding} days (ILPA recommends max 180 days)
Repayment Trigger:            ${output.input.repaymentTrigger === 'automatic' ? 'Automatic (time-based)' : 'Distribution-funded'}` : ''}

═══════════════════════════════════════════════════════════════════════

PERFORMANCE COMPARISON
═══════════════════════════════════════════════════════════════════════

Per ILPA guidance, funds should report both levered (with line) and
unlevered (without line) returns to provide transparency on the impact
of subscription credit facilities.

NET IRR:
  Without Line (Unlevered):   ${formatPercent(output.irrNoLine, 2)}
  With Line (Levered):        ${formatPercent(output.irrWithLine, 2)}
  Impact:                     ${formatBasisPoints(output.irrBoost)}

NET MOIC (Multiple on Invested Capital):
  Without Line:               ${formatMultiple(output.moicNoLine)}
  With Line:                  ${formatMultiple(output.moicWithLine)}
  Reduction:                  ${output.moicDrag.toFixed(2)}%

TVPI (Total Value to Paid-In):
  Without Line:               ${formatMultiple(output.tvpiNoLine)}
  With Line:                  ${formatMultiple(output.tvpiWithLine)}

DPI (Distributions to Paid-In):
  Without Line:               ${formatMultiple(output.dpiNoLine)}
  With Line:                  ${formatMultiple(output.dpiWithLine)}

═══════════════════════════════════════════════════════════════════════

COST ANALYSIS
═══════════════════════════════════════════════════════════════════════

Interest Expense:             ${formatCurrency(output.totalInterestPaid)}
Management Fees:              ${formatCurrency(output.totalManagementFees)}
Combined Fee Drag:            ${output.feeDrag.toFixed(2)}% of gross proceeds

Capital Efficiency:           ${output.capitalEfficiency.toFixed(2)}% reduction in capital outstanding
Avg Days Capital Outstanding: ${output.avgDaysCapitalOutstanding.toFixed(0)} days

═══════════════════════════════════════════════════════════════════════

CASH FLOW TIMELINE
═══════════════════════════════════════════════════════════════════════

Year-by-year breakdown of capital calls, distributions, and line activity:

${output.cashFlows.map(cf => `
YEAR ${cf.year}
  Capital Calls (No Line):    ${formatCurrency(cf.capitalCallsNoLine)}
  Capital Calls (With Line):  ${formatCurrency(cf.capitalCallsWithLine)}
  Distributions:              ${formatCurrency(cf.distributionsWithLine)}

  Line Activity:
    Draws:                    ${formatCurrency(cf.lineDraws)}
    Repayments:               ${formatCurrency(cf.lineRepayments)}
    Interest Paid:            ${formatCurrency(cf.interestPaid)}
    Ending Balance:           ${formatCurrency(cf.lineBalance)}

  Cumulative:
    Called (No Line):         ${formatCurrency(cf.cumulativeCalledNoLine)}
    Called (With Line):       ${formatCurrency(cf.cumulativeCalledWithLine)}
    Distributed:              ${formatCurrency(cf.cumulativeDistributedWithLine)}
`).join('\n───────────────────────────────────────────────────────────────────────\n')}

═══════════════════════════════════════════════════════════════════════

J-CURVE ANALYSIS
═══════════════════════════════════════════════════════════════════════

The J-curve represents the cumulative net cash flows over the fund's life.
Subscription lines typically flatten the J-curve by deferring capital calls.

Peak Negative NAV (Depth of J-Curve):
  Without Line:               ${formatCurrency(Math.min(...output.jCurveDataNoLine.map(d => d.nav)))}
  With Line:                  ${formatCurrency(Math.min(...output.jCurveDataWithLine.map(d => d.nav)))}

The subscription line ${Math.min(...output.jCurveDataWithLine.map(d => d.nav)) > Math.min(...output.jCurveDataNoLine.map(d => d.nav)) ? 'reduces' : 'increases'}
the depth of the J-curve by ${formatCurrency(Math.abs(Math.min(...output.jCurveDataWithLine.map(d => d.nav)) - Math.min(...output.jCurveDataNoLine.map(d => d.nav))))}

═══════════════════════════════════════════════════════════════════════

KEY INSIGHTS
═══════════════════════════════════════════════════════════════════════

IRR BOOST MECHANISM:
The subscription line ${output.irrBoost > 0 ? 'increases' : 'decreases'} IRR by ${formatBasisPoints(output.irrBoost)}.

This occurs because:
• The line delays capital calls from LPs, keeping their capital invested elsewhere longer
• This shortens the effective investment period for LP capital
• IRR is very sensitive to timing: later calls = shorter period = higher IRR

Research shows (Canterbury Consulting 2024):
• Median IRR boost of +206 bps by year 3 of fund life
• Impact diminishes to +35-45 bps by end of fund life
• The longer the facility stays outstanding, the greater the early IRR lift

MOIC REDUCTION:
The net multiple is reduced by ${output.moicDrag.toFixed(2)}% due to interest expense.

Key points:
• Interest paid: ${formatCurrency(output.totalInterestPaid)} over fund life
• This comes directly out of distributions to LPs
• The short-term IRR boost comes at the expense of long-term TVPI
• Over the last 10 years, average MOIC for US buyout funds has declined
  while net IRR has increased (partly due to increased subscription line usage)

J-CURVE IMPACT:
The subscription line ${Math.min(...output.jCurveDataWithLine.map(d => d.nav)) > Math.min(...output.jCurveDataNoLine.map(d => d.nav)) ? 'flattens' : 'deepens'} the J-curve.

Why this matters:
• Flatter J-curve = less negative NAV in early years
• Makes fund performance look better on interim IRR metrics
• Can be beneficial for fundraising during investment period
• However, may mask true underlying performance timing

BENCHMARKING CHALLENGES:
Per ILPA guidance and industry research:

• Makes it harder to compare funds with different line usage
• A fund with aggressive line usage may report higher IRR than a peer
  fund with identical investments but no line usage
• Only 13% of pre-2010 vintage funds used subscription facilities
• 47% of 2010-2019 vintage funds use them
• Now prevalent in most PE strategies (except VC which has seen recent decline)

═══════════════════════════════════════════════════════════════════════

ILPA GUIDANCE ON SUBSCRIPTION LINES
═══════════════════════════════════════════════════════════════════════

The Institutional Limited Partners Association (ILPA) issued guidance in
2017 and updated it in 2020 with specific recommendations:

RECOMMENDED LIMITS:
• Maximum facility size: 15-25% of uncalled capital
• Maximum days outstanding: 180 days
• Clear disclosure of terms in LPA and ongoing reporting

REQUIRED DISCLOSURES:
Quarterly:
• Net IRR both with and without use of the facility
• Clear methodology for calculating both metrics
• Current facility balance and utilization

Annual:
• Detailed information about facility terms and costs
• Total interest paid during the year
• Impact of facility on performance metrics
• Historical comparison of levered vs. unlevered returns

WHY THIS MATTERS:
• Ensures LPs can assess true fund performance
• Allows comparison across funds with different facility usage
• Prevents "gaming" of IRR metrics through aggressive line usage
• Maintains alignment of interests between GPs and LPs

═══════════════════════════════════════════════════════════════════════

MARKET CONTEXT (2024-2025)
═══════════════════════════════════════════════════════════════════════

Current Market Standards:
• Global subscription finance market: ~$400B-$900B
• Typical facility size: 15-25% of commitments
• Interest rates: 3-6% (few hundred bps below commercial lending)
• Days outstanding: Historically 90 days, trending to 180-360 days
• Usage: Prevalent in PE, declining in VC due to higher rates

Recent Trends:
• With higher interest rates in 2023-2024, some funds reduced line usage
• Buyout and VC usage dipped due to higher borrowing costs
• Usage continues to rise in other strategies (credit, infrastructure, real estate)
• Renewed activity expected through 2025 as rates stabilize

Benefits (GP Perspective):
• Improved interim IRR metrics
• Flattened J-curve for fundraising
• Operational flexibility for timing investments
• Bridge financing between deals and capital calls

Costs and Risks (LP Perspective):
• Interest expense reduces net returns (MOIC drag)
• Can artificially inflate IRR comparisons
• Creates additional fees and complexity
• May indicate LP capital is being called for non-investment purposes
• Timing mismatch risk if facility terms are aggressive

═══════════════════════════════════════════════════════════════════════

DISCLAIMER AND ASSUMPTIONS
═══════════════════════════════════════════════════════════════════════

This analysis is for educational and illustrative purposes only.

Key Assumptions:
• Cash flows are modeled annually (actual timing may vary)
• Interest is calculated on average annual balance
• No consideration of tax implications
• Simplified repayment mechanics
• Does not model clawback, carry, or LP-level economics in detail
• Assumes all LPs are treated equally (no side letter variations)

Actual Results May Vary Due To:
• Specific investment timing and hold periods
• Individual deal performance and realization timing
• Changes in management fee structure over fund life
• Actual facility terms, covenants, and fees
• Market conditions affecting borrowing costs
• Specific LPA terms and waterfall mechanics

For Fund Structuring:
Consult with legal, tax, and financial advisors regarding:
• Appropriate facility size for your strategy
• Terms that align with ILPA guidance
• Disclosure requirements to LPs
• Impact on fundraising and LP relationships
• Regulatory and compliance considerations

═══════════════════════════════════════════════════════════════════════

SOURCES AND METHODOLOGY
═══════════════════════════════════════════════════════════════════════

This analysis is based on market-standard subscription credit line
mechanics and incorporates guidance from:

• ILPA Subscription Lines of Credit Guidance (2017, 2020)
• Canterbury Consulting: Private Equity Deep Dive into Subscription Lines
• Callan Institute: Subscription Credit Facilities Research
• CAIA: Subscription Line of Credit Benefits, Risks, and Distortions
• Penn Mutual Asset Management: Increase in Use of Subscription Lines (2024)
• Osler: Private Equity Developments in Subscription Line Lending (2024)

IRR Calculation:
• Uses Newton's method for iterative IRR calculation
• Based on annual net cash flows (capital calls and distributions)
• Assumes mid-year timing convention

MOIC Calculation:
• Total distributions divided by total capital called
• Includes management fees and interest in capital called
• Gross MOIC input converted to net after all fees and costs

═══════════════════════════════════════════════════════════════════════

Generated by FundOpsHQ Subscription Credit Line Impact Visualizer
https://fundopshq.com/tools/subscription-credit-line

This is an educational model only. Actual fund economics depend on
specific investment timing, performance, fee structures, facility terms,
and many other factors. Always consult legal and financial advisors for
fund structuring and analysis.

═══════════════════════════════════════════════════════════════════════
`.trim()

  // Create and download the file
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `subscription-line-analysis-${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
