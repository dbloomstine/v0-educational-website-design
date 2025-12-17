import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AnimateOnScroll } from '@/components/animate-on-scroll'
import { Button } from '@/components/ui/button'
import { getAllTools } from '@/lib/content/tools'
import { Tool } from '@/lib/content/types'
import {
  Calendar,
  DollarSign,
  Building,
  TrendingUp,
  LineChart,
  Split,
  Play,
  Zap
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Free Tools & Calculators | FundOpsHQ',
  description: 'Free fund operations tools and calculators for fund formation, management fees, waterfall distributions, and expense allocation.',
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

// Tool-specific accent colors (more vibrant but still professional)
const toolAccents: Record<string, { gradient: string; glow: string; icon: string }> = {
  'fund-formation-timeline': {
    gradient: 'from-blue-500/15 via-indigo-500/5 to-transparent',
    glow: 'group-hover:shadow-blue-500/10',
    icon: 'text-blue-500'
  },
  'management-fee-calculator': {
    gradient: 'from-emerald-500/15 via-teal-500/5 to-transparent',
    glow: 'group-hover:shadow-emerald-500/10',
    icon: 'text-emerald-500'
  },
  'management-company-budget': {
    gradient: 'from-violet-500/15 via-purple-500/5 to-transparent',
    glow: 'group-hover:shadow-violet-500/10',
    icon: 'text-violet-500'
  },
  'distribution-waterfall': {
    gradient: 'from-amber-500/15 via-orange-500/5 to-transparent',
    glow: 'group-hover:shadow-amber-500/10',
    icon: 'text-amber-500'
  },
  'subscription-credit-line': {
    gradient: 'from-cyan-500/15 via-sky-500/5 to-transparent',
    glow: 'group-hover:shadow-cyan-500/10',
    icon: 'text-cyan-500'
  },
  'fund-expense-allocation': {
    gradient: 'from-rose-500/15 via-pink-500/5 to-transparent',
    glow: 'group-hover:shadow-rose-500/10',
    icon: 'text-rose-500'
  }
}

// Tool icon mapping
const toolIconMap: Record<string, any> = {
  Calendar,
  DollarSign,
  Building,
  TrendingUp,
  LineChart,
  Split
}

function ToolCard({ tool }: { tool: Tool }) {
  const IconComponent = tool.icon ? toolIconMap[tool.icon] : Zap
  const accent = toolAccents[tool.slug] || {
    gradient: 'from-primary/20 via-primary/10 to-transparent',
    glow: 'group-hover:shadow-primary/20',
    icon: 'text-primary'
  }

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={`group relative flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-border hover:shadow-2xl ${accent.glow}`}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accent.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* Content */}
      <div className="relative p-6 flex flex-col flex-1">
        {/* Icon - larger and more prominent */}
        <div className="mb-5">
          <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-accent/50 transition-all duration-300 group-hover:bg-accent`}>
            <IconComponent className={`h-7 w-7 transition-colors duration-300 ${accent.icon}`} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-foreground transition-colors">
          {tool.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">
          {tool.shortDescription}
        </p>

        {/* Launch button - appears on hover */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground/5 text-sm font-medium text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-all duration-300">
            <Play className="h-4 w-4" />
            Launch Tool
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function ToolsPage() {
  const tools = getAllTools()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero Section - More dynamic */}
        <section className="relative border-b border-border overflow-hidden py-20">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-violet-500/5 to-emerald-500/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/40 via-transparent to-transparent" />

          <div className="container relative mx-auto px-4">
            <AnimateOnScroll className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-foreground/5 border border-border px-4 py-1.5 text-sm font-medium text-foreground mb-6">
                <Zap className="h-4 w-4 text-amber-500" />
                {tools.length} Free Tools
              </div>
              <h1 className="mb-5 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Tools & Calculators
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Interactive tools for fund formation, economics, and operations.
                Model scenarios, visualize outcomes, and make better decisions.
              </p>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-16 bg-gradient-to-b from-background to-accent/10">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Request Section */}
        <section className="border-t border-border bg-card py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-3 text-2xl font-bold">Have an idea for a tool?</h2>
              <p className="mb-6 text-muted-foreground text-balance">
                I'm always building new tools based on what fund ops professionals actually need.
              </p>
              <Button asChild size="lg">
                <Link href="/contact">Suggest a Tool</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
