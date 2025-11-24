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

// Category color mapping
const categoryColors: Record<string, string> = {
  'Fund Formation': 'oklch(0.65 0.19 275)', // Purple
  'Pricing and Costs': 'oklch(0.55 0.15 150)', // Teal
  'Fund Economics': 'oklch(0.65 0.22 230)', // Blue
  'Operations and Compliance': 'oklch(0.68 0.19 35)' // Orange
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
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in oklch, ${categoryColor} 20%, transparent)` }}
        >
          <IconComponent className="h-6 w-6" style={{ color: categoryColor }} />
        </div>

        <CardTitle className="text-xl mb-2">{tool.title}</CardTitle>
        <CardDescription className="leading-relaxed">
          {tool.shortDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-auto">
        {tool.status === 'coming-soon' ? (
          <Button className="w-full" variant="outline" disabled>
            Coming Soon
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link href={`/tools/${tool.slug}`}>
              Launch Tool <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
