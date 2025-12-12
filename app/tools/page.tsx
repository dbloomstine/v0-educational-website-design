import { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AnimateOnScroll } from '@/components/animate-on-scroll'
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
        {/* Hero Section */}
        <section className="border-b border-border bg-background py-12">
          <div className="container mx-auto px-4">
            <AnimateOnScroll className="max-w-3xl">
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Resources
              </p>
              <h1 className="mb-3 text-3xl font-bold" style={{ letterSpacing: '-0.01em' }}>
                Tools & Calculators
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                Practical tools for fund formation, budgeting, economics, and operations.
              </p>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Tools Grid by Category */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl space-y-8">
              {categories.map((category) => {
                const categoryTools = toolsByCategory[category]
                if (categoryTools.length === 0) return null

                return (
                  <div key={category}>
                    <h2 className="text-base font-bold mb-3 pb-2 border-b border-border text-muted-foreground uppercase tracking-wide">
                      {category}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Request Section */}
        <section className="border-t border-border bg-accent/5 py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Feedback
              </p>
              <h2 className="mb-3 text-xl font-bold" style={{ letterSpacing: '-0.01em' }}>Need a Specific Tool?</h2>
              <p className="mb-5 text-base text-muted-foreground text-balance">
                Have a calculator or tool that would make your operations easier?
              </p>
              <Button asChild>
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
