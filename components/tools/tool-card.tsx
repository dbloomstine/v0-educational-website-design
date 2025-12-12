import Link from 'next/link'
import {
  Calendar,
  DollarSign,
  Building,
  FileText,
  Calculator,
  ClipboardCheck,
  Receipt,
  UserCheck,
  TrendingUp,
  LineChart,
  Split,
  ArrowRight
} from 'lucide-react'
import { Tool } from '@/lib/content/types'

const iconMap: Record<string, any> = {
  Calendar,
  DollarSign,
  Building,
  FileText,
  Calculator,
  ClipboardCheck,
  Receipt,
  UserCheck,
  TrendingUp,
  LineChart,
  Split
}

// Category color mapping - updated for FundOpsHQ brand
const categoryColors: Record<string, string> = {
  'Fund Formation': 'oklch(0.55 0.03 250)',  // Slate gray (monochrome)
  'Pricing and Costs': 'oklch(0.58 0.14 160)', // Muted teal
  'Fund Economics': 'oklch(0.62 0.16 220)',   // Steel blue
  'Operations and Compliance': 'oklch(0.60 0.16 270)' // Muted purple
}

interface ToolCardProps {
  tool: Tool
}

export function ToolCard({ tool }: ToolCardProps) {
  const IconComponent = tool.icon ? iconMap[tool.icon] : FileText
  const primaryCategory = tool.categories[0]
  const categoryColor = categoryColors[primaryCategory] || 'oklch(0.6 0.16 210)'

  if (tool.status === 'coming-soon') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-sm border border-border/40 bg-card/50 opacity-60">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `color-mix(in oklch, ${categoryColor} 15%, transparent)` }}
        >
          <IconComponent className="h-4 w-4" style={{ color: categoryColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-medium text-foreground truncate">{tool.title}</div>
          <div className="text-sm text-muted-foreground truncate">{tool.shortDescription}</div>
        </div>
        <span className="text-sm text-muted-foreground shrink-0">Soon</span>
      </div>
    )
  }

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex items-center gap-3 px-4 py-3 rounded-sm border border-border/40 bg-card hover:border-foreground/20 transition-colors"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `color-mix(in oklch, ${categoryColor} 15%, transparent)` }}
      >
        <IconComponent className="h-4 w-4" style={{ color: categoryColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-medium text-foreground truncate">{tool.title}</div>
        <div className="text-sm text-muted-foreground truncate">{tool.shortDescription}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
    </Link>
  )
}
