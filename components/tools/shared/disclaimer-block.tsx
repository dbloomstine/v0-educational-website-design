"use client"

import { AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface DisclaimerBlockProps {
  /** Additional tool-specific disclaimers to display */
  additionalDisclaimer?: string
  /** Variant style: 'default' is subtle, 'prominent' is more visible */
  variant?: "default" | "prominent"
  /** Optional className for custom styling */
  className?: string
}

/**
 * DisclaimerBlock - Standard disclaimer for all tools
 *
 * Displays the required legal/educational disclaimers that should appear
 * on every tool page. Can include tool-specific additional disclaimers.
 */
export function DisclaimerBlock({
  additionalDisclaimer,
  variant = "default",
  className
}: DisclaimerBlockProps) {
  const isProminent = variant === "prominent"

  return (
    <div
      className={cn(
        "rounded-lg border p-4 sm:p-6",
        isProminent
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border bg-muted/30",
        className
      )}
    >
      <div className="flex gap-3">
        <div className="shrink-0">
          {isProminent ? (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          ) : (
            <Info className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-3 text-sm">
          <p className={cn(
            "font-medium",
            isProminent ? "text-amber-900 dark:text-amber-200" : "text-foreground"
          )}>
            Important Disclaimer
          </p>

          <div className="space-y-2 text-muted-foreground">
            <p>
              This tool provides <strong>educational estimates only</strong> and should not be
              considered financial, legal, or tax advice. Actual costs and outcomes depend on
              your specific situation, service providers, and market conditions.
            </p>

            <ul className="list-disc list-inside space-y-1 ml-0">
              <li>Estimates are based on industry ranges and may not reflect current market pricing</li>
              <li>Always obtain formal quotes from qualified service providers</li>
              <li>Consult with legal, tax, and financial advisors for your specific situation</li>
            </ul>

            {additionalDisclaimer && (
              <p className="pt-2 border-t border-border/50">
                {additionalDisclaimer}
              </p>
            )}

            <p className="text-xs pt-2 text-muted-foreground/80">
              FundOpsHQ is an educational resource and does not provide professional services.
            </p>

            <p className="text-xs pt-3 border-t border-border/30 text-muted-foreground/70 font-medium">
              Content last reviewed: December 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * InlineDisclaimer - A smaller, inline disclaimer for use within tool sections
 */
interface InlineDisclaimerProps {
  children: React.ReactNode
  className?: string
}

export function InlineDisclaimer({ children, className }: InlineDisclaimerProps) {
  return (
    <p className={cn(
      "text-xs text-muted-foreground italic flex items-start gap-1.5",
      className
    )}>
      <Info className="h-3 w-3 mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}
