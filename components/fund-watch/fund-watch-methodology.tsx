"use client"

import { useState } from "react"
import { ChevronDown, Rss, Sparkles, Eye } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const STEPS = [
  {
    icon: Rss,
    title: "Automated Collection",
    description:
      "RSS feeds from 30+ financial news sources are scanned nightly for fund announcements.",
  },
  {
    icon: Sparkles,
    title: "AI Classification",
    description:
      "Each article is classified by an AI model that extracts fund name, size, firm, category, and stage.",
  },
  {
    icon: Eye,
    title: "Human Review",
    description:
      "Top announcements are reviewed and featured in the weekly FundWatch Briefing newsletter.",
  },
] as const

export function FundWatchMethodology() {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex justify-center">
        <CollapsibleTrigger className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-4">
          How this tracker works
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="pb-6 pt-1">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {STEPS.map((step) => (
                <div key={step.title} className="flex flex-col items-center text-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 border border-border">
                    <step.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/50 text-center mt-5">
              Some entries may have incomplete data. Fund sizes marked &ldquo;Undisclosed&rdquo; were
              not publicly reported.
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
