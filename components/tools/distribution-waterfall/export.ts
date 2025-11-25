import { WaterfallOutput, formatCurrency, formatPercent, formatMultiple } from './waterfallCalculations'

export function exportWaterfallSummary(output: WaterfallOutput) {
  const timestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const content = `
DISTRIBUTION WATERFALL ANALYSIS
Generated: ${timestamp}
Source: FundOpsHQ Distribution Waterfall Visualizer

═══════════════════════════════════════════════════════════════════════

KEY INPUTS
═══════════════════════════════════════════════════════════════════════

Fund Size:               ${formatCurrency(output.input.fundSize)}
Contributed Capital:     ${formatCurrency(output.input.contributedCapital)}
Gross Proceeds:          ${formatCurrency(output.input.grossProceeds)}
Years to Exit:           ${output.input.yearsToExit} years

Waterfall Type:          ${output.input.waterfallType === 'european' ? 'European (Whole-Fund)' : 'American (Deal-by-Deal)'}
Preferred Return:        ${formatPercent(output.input.prefRate, 1)} annual (${output.input.prefCompounding})
Carried Interest:        ${formatPercent(output.input.carryRate, 0)}
GP Catch-Up:             ${output.input.hasCatchUp ? `Yes (${formatPercent(output.input.catchUpRate, 0)} to GP)` : 'No'}
GP Commitment:           ${formatPercent(output.input.gpCommitmentPercent, 2)}

═══════════════════════════════════════════════════════════════════════

DISTRIBUTION SUMMARY
═══════════════════════════════════════════════════════════════════════

Total Proceeds:          ${formatCurrency(output.totalDistributed)}

LP Distributions:        ${formatCurrency(output.totalToLPs)}
  LP Multiple (MOIC):    ${formatMultiple(output.lpMultiple)}
  LP Share of Total:     ${formatPercent(output.totalToLPs / output.totalDistributed, 1)}

GP Distributions:        ${formatCurrency(output.totalToGP)}
  GP Multiple (MOIC):    ${formatMultiple(output.gpMultiple)}
  GP Share of Total:     ${formatPercent(output.totalToGP / output.totalDistributed, 1)}

Total Profit:            ${formatCurrency(output.totalProfit)}
  LP Profit:             ${formatCurrency(output.lpProfit)}
  GP Profit:             ${formatCurrency(output.gpProfit)}
  Effective Carry Rate:  ${formatPercent(output.effectiveCarryRate, 2)}

═══════════════════════════════════════════════════════════════════════

TIER-BY-TIER BREAKDOWN
═══════════════════════════════════════════════════════════════════════

${output.tiers.map((tier, index) => `
TIER ${tier.tier}: ${tier.name.toUpperCase()}
${tier.description}

  Amount Distributed:    ${formatCurrency(tier.total)}
  To LPs:                ${formatCurrency(tier.toLPs)}
  To GP:                 ${formatCurrency(tier.toGP)}

  Cumulative to LPs:     ${formatCurrency(tier.cumulativeLPs)}
  Cumulative to GP:      ${formatCurrency(tier.cumulativeGP)}
  Cumulative Total:      ${formatCurrency(tier.cumulativeTotal)}

  % of Total Proceeds:   ${formatPercent(tier.total / output.totalDistributed, 1)}
${index < output.tiers.length - 1 ? '\n───────────────────────────────────────────────────────────────────────' : ''}
`).join('\n')}

═══════════════════════════════════════════════════════════════════════

WATERFALL MECHANICS EXPLAINED
═══════════════════════════════════════════════════════════════════════

${output.input.waterfallType === 'european' ? `
EUROPEAN (WHOLE-FUND) WATERFALL:

In a European waterfall structure, the GP does not receive any carried
interest until ALL limited partners have received:
1. Return of their contributed capital
2. Their full preferred return

This structure is generally considered more LP-friendly because it ensures
LPs are "made whole" before the GP participates in profits.

The typical flow is:
  → Tier 1: Return of Capital - 100% to LPs (including GP's LP commitment)
  → Tier 2: Preferred Return - 100% to LPs until pref is satisfied
  → Tier 3: GP Catch-Up - GP receives disproportionate share to "catch up"
  → Tier 4: Ongoing Split - Remaining profits split per carry agreement
` : `
AMERICAN (DEAL-BY-DEAL) WATERFALL:

In an American waterfall structure, the GP can receive carried interest on
individual deals or investments, even if the entire fund has not yet returned
all LP capital plus preferred return.

This structure allows GPs to access carry earlier, which can be beneficial
for team retention and economics. However, it creates potential timing
mismatches if later deals underperform.

Key features:
  → Carry calculated deal-by-deal, not at fund level
  → GP typically receives carry as successful deals exit
  → Almost always includes CLAWBACK provisions
  → Clawback ensures LPs get full return + pref at fund level
  → More common in late-stage PE, less common in VC
`}

PREFERRED RETURN (HURDLE RATE):

The preferred return (${formatPercent(output.input.prefRate, 1)} ${output.input.prefCompounding} in this scenario)
is the minimum annual return LPs must receive before the GP participates
in profit-sharing. It aligns GP incentives with achieving strong returns.

${output.input.prefCompounding === 'simple' ? `
Simple Pref Calculation:
  Pref Amount = Capital × Rate × Years
  ${formatCurrency(output.input.contributedCapital)} × ${formatPercent(output.input.prefRate, 1)} × ${output.input.yearsToExit} years
` : `
Compound Pref Calculation:
  Pref Amount = Capital × ((1 + Rate)^Years - 1)
  More favorable to LPs as pref "compounds" like interest
`}

${output.input.hasCatchUp ? `
GP CATCH-UP:

After the preferred return is paid, the GP receives ${formatPercent(output.input.catchUpRate, 0)}
of subsequent distributions until they have "caught up" to their target
carry percentage (${formatPercent(output.input.carryRate, 0)}) of total profits.

This ensures the GP ultimately receives their full carry percentage, not
just their carry percentage of profits AFTER pref.

Example: If target carry is 20% and pref is paid, GP catch-up continues
until GP has received 20% of ALL profits (including the pref amount).
` : `
NO GP CATCH-UP:

In this scenario, there is no catch-up provision. After the preferred return
is paid, profits are immediately split according to the carry agreement.

This means the GP's economic share may be lower than the stated carry rate,
since the preferred return is paid entirely to LPs first.
`}

CARRIED INTEREST:

Carried interest (${formatPercent(output.input.carryRate, 0)} in this scenario) is the GP's
share of profits above the preferred return. It is the primary economic
incentive for fund managers.

Typical carry rates:
  • Buyout PE: 15-20%
  • Growth Equity: 20%
  • Venture Capital: 20-30%
  • Real Estate: 15-20%

In this analysis, the EFFECTIVE carry rate is ${formatPercent(output.effectiveCarryRate, 2)},
which represents the GP's actual share of total profits after accounting
for preferred return and catch-up mechanics.

═══════════════════════════════════════════════════════════════════════

Generated by FundOpsHQ Distribution Waterfall Visualizer
https://fundopshq.com/tools/distribution-waterfall

This is an educational model only. Actual fund economics depend on specific
LPA terms, timing of capital calls and distributions, fees, expenses, and
other factors. Consult with legal and financial advisors for fund structuring.

═══════════════════════════════════════════════════════════════════════
`.trim()

  // Create and download the file
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `waterfall-analysis-${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
