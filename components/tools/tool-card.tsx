import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

  return (
    <Card className="flex flex-col h-full hover:border-accent transition-all">
      <CardHeader>
        <div
          className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in oklch, ${categoryColor} 20%, transparent)` }}
        >
          <IconComponent className="h-4 w-4" style={{ color: categoryColor }} />
        </div>

        <CardTitle className="text-base mb-1">{tool.title}</CardTitle>
        <CardDescription className="text-xs leading-relaxed line-clamp-2">
          {tool.shortDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-auto">
        {tool.status === 'coming-soon' ? (
          <Button className="w-full" variant="outline" size="sm" disabled>
            Coming Soon
          </Button>
        ) : (
          <Button className="w-full" size="sm" asChild>
            <Link href={`/tools/${tool.slug}`}>
              Launch <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
