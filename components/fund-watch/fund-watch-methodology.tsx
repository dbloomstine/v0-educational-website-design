import { Rss, Sparkles } from "lucide-react"

export function FundWatchMethodology() {
  return (
    <div className="border-b border-border/40">
      <div className="container mx-auto px-4 py-3">
        <p className="text-xs text-muted-foreground/70 text-center flex items-center justify-center gap-4 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <Rss className="h-3 w-3" />
            30+ news sources scanned nightly
          </span>
          <span className="text-border">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            AI-extracted fund data
          </span>
          <span className="text-border">•</span>
          <span>
            Sizes marked "Undisclosed" were not publicly reported
          </span>
        </p>
      </div>
    </div>
  )
}
