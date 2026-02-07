import { Card, CardContent } from "@/components/ui/card"
import { Database, DollarSign, LayoutGrid, Calendar } from "lucide-react"
import type { FundWatchStats } from "@/lib/content/fund-watch"
import { formatAum } from "@/lib/content/fund-watch"

interface StatsCardsProps {
  stats: FundWatchStats
  categoryCount: number
}

export function StatsCards({ stats, categoryCount }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Funds",
      value: stats.total_funds.toString(),
      detail: `${stats.total_covered} covered, ${stats.total_uncovered} pending`,
      icon: Database,
    },
    {
      label: "Total AUM",
      value: formatAum(stats.total_aum_millions),
      detail: "Aggregate fund size tracked",
      icon: DollarSign,
    },
    {
      label: "Categories",
      value: categoryCount.toString(),
      detail: "Active fund categories",
      icon: LayoutGrid,
    },
    {
      label: "Date Range",
      value: stats.date_range.earliest && stats.date_range.latest
        ? formatDateRange(stats.date_range.earliest, stats.date_range.latest)
        : "N/A",
      detail: stats.date_range.earliest && stats.date_range.latest
        ? `${stats.date_range.earliest} to ${stats.date_range.latest}`
        : "No dates available",
      icon: Calendar,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="hover:-translate-y-0 hover:shadow-sm">
          <CardContent className="pt-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/60">
                <card.icon className="h-5 w-5 text-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold tracking-tight">{card.value}</p>
                <p className="text-xs text-muted-foreground truncate">{card.detail}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatDateRange(earliest: string, latest: string): string {
  const e = new Date(earliest)
  const l = new Date(latest)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const eStr = `${months[e.getUTCMonth()]} ${e.getUTCFullYear()}`
  const lStr = `${months[l.getUTCMonth()]} ${l.getUTCFullYear()}`
  if (eStr === lStr) return lStr
  return `${eStr} - ${lStr}`
}
