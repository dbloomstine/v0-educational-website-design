import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Breadcrumb } from '@/components/breadcrumb'
import { getToolBySlug, getAllTools } from '@/lib/content/tools'
import { ToolPlaceholder } from '@/components/tools/tool-placeholder'

interface ToolPageProps {
  params: Promise<{
    toolSlug: string
  }>
}

export async function generateStaticParams() {
  const tools = getAllTools()
  return tools.map((tool) => ({
    toolSlug: tool.slug,
  }))
}

// Map tool slugs to enhanced SEO titles with intent keywords
const toolSeoTitles: Record<string, string> = {
  'fund-formation-timeline': 'Free Fund Formation Timeline Generator | Fund Launch Checklist',
  'management-fee-calculator': 'Free Management Fee Calculator | Private Fund Fee Modeling',
  'management-company-budget': 'Free Management Company Budget Planner | GP Runway Calculator',
  'fund-admin-pricing': 'Free Fund Admin Pricing Estimator | Administration Cost Calculator',
  'audit-fee-estimator': 'Free Audit Fee Estimator | Private Fund Audit Cost Calculator',
  'tax-fee-estimator': 'Free Tax Fee Estimator | Fund Tax Preparation Cost Calculator',
  'kyc-aml-cost-estimator': 'Free KYC/AML Cost Estimator | Investor Onboarding Calculator',
  'distribution-waterfall': 'Free Distribution Waterfall Calculator | PE/VC Carry Visualizer',
  'subscription-credit-line': 'Free Subscription Line Calculator | Credit Facility IRR Impact',
  'fund-expense-allocation': 'Free Fund Expense Allocation Tool | Expense Classification Helper',
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { toolSlug } = await params
  const tool = getToolBySlug(toolSlug)

  if (!tool) {
    return {
      title: 'Tool Not Found - FundOpsHQ',
    }
  }

  // Use enhanced SEO title if available, otherwise fall back to default
  const seoTitle = toolSeoTitles[tool.slug] || `Free ${tool.title}`
  const fullTitle = `${seoTitle} | FundOpsHQ`

  return {
    title: fullTitle,
    description: `Free online ${tool.title.toLowerCase()}. ${tool.shortDescription}`,
    openGraph: {
      title: seoTitle,
      description: `Free online tool: ${tool.shortDescription}`,
      type: 'website',
      url: `https://fundops.com/tools/${tool.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: `Free online tool: ${tool.shortDescription}`,
    },
    alternates: {
      canonical: `https://fundops.com/tools/${tool.slug}`,
    },
  }
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolSlug } = await params
  const tool = getToolBySlug(toolSlug)

  if (!tool) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-background">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Tools & Calculators', href: '/tools' },
                { label: tool.title, href: `/tools/${tool.slug}` },
              ]}
            />
          </div>
        </div>

        {/* Tool Content */}
        <ToolPlaceholder tool={tool} />
      </main>

      <SiteFooter />
    </div>
  )
}
