"use client"

import { useState } from "react"
import { Rss, Sparkles, ChevronDown, ChevronUp } from "lucide-react"

const DATA_SOURCES = [
  { name: "PR Newswire", type: "Press Releases" },
  { name: "Business Wire", type: "Press Releases" },
  { name: "GlobeNewswire", type: "Press Releases" },
  { name: "TechCrunch", type: "VC/Tech News" },
  { name: "PE Hub", type: "PE News" },
  { name: "Private Debt Investor", type: "Credit News" },
  { name: "Secondaries Investor", type: "Secondaries News" },
  { name: "Infrastructure Investor", type: "Infrastructure News" },
  { name: "PERE", type: "Real Estate News" },
  { name: "Hedgeweek", type: "Alternatives News" },
  { name: "PitchBook", type: "PE/VC Data" },
  { name: "Buyouts Insider", type: "PE News" },
  { name: "Crunchbase News", type: "VC/Tech News" },
  { name: "VentureBeat", type: "VC/Tech News" },
  { name: "Fortune", type: "Business News" },
  { name: "Axios", type: "Business News" },
]

export function FundWatchMethodology() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-b border-border/40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <p className="text-xs text-muted-foreground/70 flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <Rss className="h-3 w-3" />
              45+ news sources scanned nightly
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
            <span className="text-border">•</span>
            <span>
              Data coverage begins January 2024
            </span>
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors inline-flex items-center gap-1"
          >
            {expanded ? "Hide sources" : "View sources"}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-4 pt-3 border-t border-border/30">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              {DATA_SOURCES.map((source) => (
                <div key={source.name} className="text-muted-foreground/60">
                  <span className="text-muted-foreground/80">{source.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground/50 text-center">
              Pipeline runs daily at 1 AM EST via GitHub Actions. Fund data is extracted using Claude AI and deduplicated automatically. Data coverage: January 2024 to present.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
