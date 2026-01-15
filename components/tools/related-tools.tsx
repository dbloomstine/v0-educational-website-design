"use client"

import Link from 'next/link'
import { Tool } from '@/lib/content/types'
import {
  Calendar,
  DollarSign,
  Building,
  TrendingUp,
  LineChart,
  Split,
  Play,
  ArrowRight,
  Zap,
  Rocket,
  LucideIcon
} from 'lucide-react'

// Tool-specific accent colors
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

const toolIconMap: Record<string, LucideIcon> = {
  Calendar,
  DollarSign,
  Building,
  TrendingUp,
  LineChart,
  Split,
  Rocket
}

interface RelatedToolCardProps {
  tool: Tool
  compact?: boolean
}

function RelatedToolCard({ tool, compact = false }: RelatedToolCardProps) {
  const IconComponent = tool.icon ? toolIconMap[tool.icon] : Zap
  const accent = toolAccents[tool.slug] || {
    gradient: 'from-primary/15 via-primary/5 to-transparent',
    glow: 'group-hover:shadow-primary/10',
    icon: 'text-primary'
  }

  if (compact) {
    return (
      <Link
        href={`/tools/${tool.slug}`}
        className={`group relative flex items-center gap-4 rounded-lg border border-border/50 bg-card p-4 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl ${accent.glow}`}
      >
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${accent.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

        <div className="relative flex items-center gap-4 flex-1">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/50 transition-all duration-300 group-hover:scale-110 group-hover:bg-accent`}>
            <IconComponent className={`h-5 w-5 transition-colors duration-300 ${accent.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-foreground">
              {tool.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {tool.shortDescription}
            </p>
          </div>
          <Play className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={`group relative flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl ${accent.glow}`}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accent.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-accent/50 transition-all duration-300 group-hover:scale-110 group-hover:bg-accent`}>
            <IconComponent className={`h-5 w-5 transition-colors duration-300 ${accent.icon}`} />
          </div>
        </div>

        <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-foreground">
          {tool.title}
        </h3>

        <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4 line-clamp-2">
          {tool.shortDescription}
        </p>

        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-foreground/5 text-xs font-medium text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-all duration-300 w-fit">
          <Play className="h-3 w-3" />
          Launch
        </span>
      </div>
    </Link>
  )
}

interface RelatedToolsProps {
  tools: Tool[]
  title?: string
  subtitle?: string
  compact?: boolean
  showViewAll?: boolean
  maxTools?: number
  columns?: 2 | 3
}

export function RelatedTools({
  tools,
  title = "Related Tools",
  subtitle = "Calculators and planning tools",
  compact = false,
  showViewAll = true,
  maxTools = 6,
  columns = 3
}: RelatedToolsProps) {
  const displayTools = tools.slice(0, maxTools)

  if (displayTools.length === 0) return null

  const gridCols = columns === 2
    ? "sm:grid-cols-2"
    : "sm:grid-cols-2 lg:grid-cols-3"

  return (
    <div>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="mb-1 text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {showViewAll && (
          <Link
            href="/tools"
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            All Tools <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className={`grid gap-4 ${gridCols}`}>
        {displayTools.map((tool) => (
          <RelatedToolCard key={tool.id} tool={tool} compact={compact} />
        ))}
      </div>
    </div>
  )
}

// Single tool CTA for embedding in articles or specific contexts
interface ToolCtaProps {
  tool: Tool
  context?: string // Optional context text like "Model your fund's fee schedule"
}

export function ToolCta({ tool, context }: ToolCtaProps) {
  const IconComponent = tool.icon ? toolIconMap[tool.icon] : Zap
  const accent = toolAccents[tool.slug] || {
    gradient: 'from-primary/15 via-primary/5 to-transparent',
    glow: 'shadow-primary/10',
    icon: 'text-primary'
  }

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={`group relative flex items-center gap-4 rounded-xl border border-border bg-card p-5 overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-primary/30 hover:shadow-lg ${accent.glow}`}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accent.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative flex items-center gap-4 flex-1">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent transition-all duration-300 group-hover:scale-105`}>
          <IconComponent className={`h-6 w-6 ${accent.icon}`} />
        </div>
        <div className="flex-1">
          {context && (
            <p className="text-xs text-muted-foreground mb-0.5">{context}</p>
          )}
          <h3 className="text-base font-semibold text-foreground">
            {tool.title}
          </h3>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium transition-all duration-300 group-hover:gap-3">
          <Play className="h-4 w-4" />
          Launch
        </span>
      </div>
    </Link>
  )
}
