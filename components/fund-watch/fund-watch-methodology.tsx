import { Rss, Sparkles } from "lucide-react"

const STEPS = [
  {
    icon: Rss,
    title: "Automated Collection",
    description:
      "RSS feeds from 30+ financial news sources are scanned nightly for fund announcements.",
  },
  {
    icon: Sparkles,
    title: "AI Extraction",
    description:
      "Each article is processed by AI to extract fund name, size, firm, category, and stage.",
  },
] as const

export function FundWatchMethodology() {
  return (
    <div className="border-b border-border/50 bg-muted/20">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 border border-border/50">
                <step.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground max-w-[220px]">
                  {step.description}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="hidden sm:block w-px h-8 bg-border/50 ml-4" />
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/50 text-center mt-4">
          Some entries may have incomplete data. Fund sizes marked &ldquo;Undisclosed&rdquo; were
          not publicly reported.
        </p>
      </div>
    </div>
  )
}
