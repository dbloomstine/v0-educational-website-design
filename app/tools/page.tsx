import { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ToolCard } from '@/components/tools/tool-card'
import { Button } from '@/components/ui/button'
import { getAllTools, getAllCategories } from '@/lib/content/tools'
import { Tool, ToolCategory } from '@/lib/content/types'

export const metadata: Metadata = {
  title: 'Free Tools & Calculators | FundOpsHQ',
  description: 'Free fund operations tools and calculators for fund formation, management fees, waterfall distributions, fund admin pricing, audit fees, and more.',
  openGraph: {
    title: 'Free Tools & Calculators | FundOpsHQ',
    description: 'Free fund operations tools and calculators for fund formation, budgeting, economics, and operations.',
    type: 'website',
    url: 'https://fundops.com/tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Tools & Calculators | FundOpsHQ',
    description: 'Free fund operations tools and calculators for fund formation, budgeting, economics, and operations.',
  },
  alternates: {
    canonical: 'https://fundops.com/tools',
  },
}

export default function ToolsPage() {
  const tools = getAllTools()
  const categories = getAllCategories()

  // Group tools by primary category for display
  const toolsByCategory: Record<ToolCategory, Tool[]> = {} as Record<ToolCategory, Tool[]>
  categories.forEach((category) => {
    toolsByCategory[category] = tools.filter((tool) =>
      tool.categories.includes(category)
    )
  })

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section - Compact */}
        <section className="border-b border-border bg-gradient-to-b from-background to-accent/20 py-10">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-3 text-4xl font-bold tracking-tight text-balance">
                Free Tools & Calculators
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed text-balance">
                Simple, practical tools for fund formation, budgeting, economics, and operations.
              </p>
            </div>
          </div>
        </section>

        {/* Tools Grid by Category - Compact */}
        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-7xl space-y-8">
              {categories.map((category) => {
                const categoryTools = toolsByCategory[category]
                if (categoryTools.length === 0) return null

                return (
                  <div key={category}>
                    <h2 className="text-xl font-bold mb-4 pb-2 border-b border-border">
                      {category}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {categoryTools.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Request Section - Compact */}
        <section className="border-t border-border bg-accent/20 py-10">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-3 text-2xl font-bold">Need a Specific Tool?</h2>
              <p className="mb-6 text-base text-muted-foreground text-balance">
                Have a calculator or tool that would make your operations easier? Let me know what would be most helpful.
              </p>
              <Button asChild size="default">
                <a href="/contact">Request a Tool</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
