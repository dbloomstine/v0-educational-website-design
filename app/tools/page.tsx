import { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText, CheckSquare, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Fund Operations Tools & Templates - FundOpsHQ',
  description: 'Free downloadable checklists, templates, and tools for fund operations professionals. Practical resources for CFOs, compliance officers, and operations teams.',
  openGraph: {
    title: 'Fund Operations Tools & Templates - FundOpsHQ',
    description: 'Free downloadable checklists and templates for fund operations professionals.',
    type: 'website',
    url: 'https://fundops.com/tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fund Operations Tools & Templates',
    description: 'Free downloadable resources for fund operations professionals.',
  },
  alternates: {
    canonical: 'https://fundops.com/tools',
  },
}

const tools = [
  {
    icon: CheckSquare,
    title: 'Quarterly Close Checklist',
    description: 'A comprehensive checklist covering NAV calculation, management fees, carried interest, and investor reporting for quarter-end close.',
    category: 'Fund Administration',
    fundTypes: 'All Fund Types',
    downloadUrl: '#', // TODO: Replace with actual download link
    comingSoon: true,
  },
  {
    icon: FileText,
    title: 'LP Quarterly Report Template',
    description: 'Standard quarterly report structure including portfolio updates, financial performance, capital activity, and key metrics.',
    category: 'Investor Relations',
    fundTypes: 'PE, VC, RE',
    downloadUrl: '#',
    comingSoon: true,
  },
  {
    icon: Calendar,
    title: 'Annual Compliance Calendar',
    description: 'Month-by-month compliance deadlines including Form ADV, Form PF, K-1 distribution, annual audit, and regulatory filings.',
    category: 'Compliance',
    fundTypes: 'All Fund Types',
    downloadUrl: '#',
    comingSoon: true,
  },
]

export default function ToolsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-background to-accent/20 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-balance">
                Tools & Templates
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                Free, practical resources for fund operations professionals. Checklists, templates, and tools you can use immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12">
                <h2 className="mb-4 text-3xl font-bold">Available Resources</h2>
                <p className="text-lg text-muted-foreground">
                  Download templates and checklists to streamline your fund operations. More resources added regularly.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => {
                  const IconComponent = tool.icon
                  return (
                    <Card key={tool.title} className="flex flex-col">
                      <CardHeader>
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {tool.category}
                          </span>
                          {tool.comingSoon && (
                            <span className="text-xs font-medium text-primary uppercase tracking-wider">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-xl">{tool.title}</CardTitle>
                        <CardDescription className="leading-relaxed">
                          {tool.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto">
                        <div className="mb-4 text-sm text-muted-foreground">
                          <span className="font-medium">Relevant for:</span> {tool.fundTypes}
                        </div>
                        <Button
                          className="w-full"
                          variant={tool.comingSoon ? "outline" : "default"}
                          disabled={tool.comingSoon}
                          asChild={!tool.comingSoon}
                        >
                          {tool.comingSoon ? (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Coming Soon
                            </>
                          ) : (
                            <a href={tool.downloadUrl} download>
                              <Download className="mr-2 h-4 w-4" />
                              Download Template
                            </a>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Request Section */}
        <section className="border-t border-border bg-accent/20 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold">Need a Specific Tool?</h2>
              <p className="mb-8 text-lg text-muted-foreground text-balance">
                Have a template or checklist that would make your operations easier? Let me know what would be most helpful.
              </p>
              <Button asChild size="lg">
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
