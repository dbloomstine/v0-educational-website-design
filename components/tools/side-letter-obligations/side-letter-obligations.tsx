"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle } from 'lucide-react'
import { SideLetterData } from './types'
import { FundSetup } from './fund-setup'
import { InvestorsManager } from './investors-manager'
import { ClausesManager } from './clauses-manager'
import { MFNConfig } from './mfn-config'
import { ScenariosManager } from './scenarios-manager'
import { ObligationsMatrix } from './obligations-matrix'
import { getSampleData } from './sample-data'

export function SideLetterObligations() {
  const [data, setData] = useState<SideLetterData>(getSampleData())

  const loadSampleData = () => {
    setData(getSampleData())
  }

  const clearAllData = () => {
    if (confirm('Clear all data? This cannot be undone.')) {
      setData({
        fund: { name: '', type: 'Venture Capital', vintage: 2024, standardFee: 2.0, standardCarry: 20.0, term: 10 },
        investors: [],
        clauses: [],
        mfnConfig: { tier1Threshold: 25, tier2Threshold: 10, tier1Scope: ['fees'], tier2Scope: ['fees'], exclusions: '' },
        scenarios: []
      })
    }
  }

  const exportMatrix = () => {
    const rows = [
      ['Investor', 'Commitment ($M)', 'Category', 'MFN Tier', 'Fees', 'MFN', 'Liquidity', 'Reporting', 'ESG', 'Co-invest', 'Regulatory', 'Other']
    ]

    data.investors.forEach(investor => {
      const tier = getMFNTier(investor)
      const clausesByCategory: Record<string, string[]> = {
        fees: [], mfn: [], liquidity: [], reporting: [],
        esg: [], coinvest: [], regulatory: [], other: []
      }

      data.clauses
        .filter(c => c.investorId === investor.id)
        .forEach(c => {
          if (clausesByCategory[c.category]) {
            clausesByCategory[c.category].push(c.description)
          }
        })

      rows.push([
        investor.name,
        investor.commitment.toString(),
        investor.category,
        tier,
        clausesByCategory.fees.join('; ') || '—',
        clausesByCategory.mfn.join('; ') || '—',
        clausesByCategory.liquidity.join('; ') || '—',
        clausesByCategory.reporting.join('; ') || '—',
        clausesByCategory.esg.join('; ') || '—',
        clausesByCategory.coinvest.join('; ') || '—',
        clausesByCategory.regulatory.join('; ') || '—',
        clausesByCategory.other.join('; ') || '—'
      ])
    })

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'side-letter-obligations-matrix.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getMFNTier = (investor: any) => {
    if (investor.commitment >= data.mfnConfig.tier1Threshold) {
      return 'Tier 1 MFN'
    } else if (investor.commitment >= data.mfnConfig.tier2Threshold) {
      return 'Tier 2 MFN'
    }
    return 'No MFN'
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">Side Letter Obligations Modeler</h2>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          Model, track, and stress test side letter obligations across your LP base. Understand MFN triggers
          and cascading effects before granting new terms.
        </p>
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900 dark:text-blue-100">
            This tool helps you understand side letter complexity and MFN mechanics. It does not constitute
            legal advice. Always consult with fund counsel before finalizing side letter terms.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 bg-card border rounded-lg">
        <Button variant="outline" onClick={loadSampleData}>Load Sample Data</Button>
        <Button variant="outline" onClick={clearAllData}>Clear All</Button>
        <div className="flex-1" />
        <Button variant="outline" onClick={exportMatrix}>Export Matrix (CSV)</Button>
      </div>

      <Tabs defaultValue="fund" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="fund">Fund Setup</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="clauses">Clauses</TabsTrigger>
          <TabsTrigger value="mfn">MFN Rules</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="matrix">Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="fund">
          <FundSetup data={data} setData={setData} />
        </TabsContent>

        <TabsContent value="investors">
          <InvestorsManager data={data} setData={setData} />
        </TabsContent>

        <TabsContent value="clauses">
          <ClausesManager data={data} setData={setData} />
        </TabsContent>

        <TabsContent value="mfn">
          <MFNConfig data={data} setData={setData} />
        </TabsContent>

        <TabsContent value="scenarios">
          <ScenariosManager data={data} setData={setData} />
        </TabsContent>

        <TabsContent value="matrix">
          <ObligationsMatrix data={data} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
