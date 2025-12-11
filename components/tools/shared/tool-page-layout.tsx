"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DisclaimerBlock } from "./disclaimer-block"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

// Category color mapping - harmonized with brand palette
const categoryColors: Record<string, string> = {
  "Fund Formation": "oklch(0.55 0.03 250)",      // Slate gray (monochrome)
  "Pricing and Costs": "oklch(0.58 0.14 160)",   // Muted teal
  "Fund Economics": "oklch(0.62 0.16 220)",      // Steel blue
  "Operations and Compliance": "oklch(0.60 0.16 270)", // Muted purple
  "Investor Relations": "oklch(0.60 0.14 200)"  // Slate blue
}

interface ToolPageLayoutProps {
  /** Tool title */
  title: string
  /** Short description (1-2 sentences) */
  description: string
  /** Primary category for color theming */
  category: string
  /** All categories the tool belongs to */
  categories?: string[]
  /** Bullet points for "What you'll learn" or "Use this tool to" */
  highlights?: string[]
  /** The main tool interface */
  children: React.ReactNode
  /** Optional methodology/how it works section content */
  methodology?: React.ReactNode
  /** Optional FAQ content */
  faq?: React.ReactNode
  /** Tool-specific additional disclaimer text */
  additionalDisclaimer?: string
  /** Optional className for the root container */
  className?: string
}

/**
 * ToolPageLayout - Standard wrapper for all tool pages
 *
 * Provides consistent structure:
 * 1. Hero section with title, description, and highlights
 * 2. Main tool interface
 * 3. Optional collapsible methodology section
 * 4. Standard disclaimer block
 */
export function ToolPageLayout({
  title,
  description,
  category,
  categories = [],
  highlights,
  children,
  methodology,
  faq,
  additionalDisclaimer,
  className
}: ToolPageLayoutProps) {
  const allCategories = categories.length > 0 ? categories : [category]
  const primaryColor = categoryColors[category] || "oklch(0.6 0.16 210)"

  return (
    <div className={cn("py-8 sm:py-12", className)}>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            {/* Category badges */}
            <div className="flex flex-wrap items-center gap-2">
              {allCategories.map((cat) => (
                <span
                  key={cat}
                  className="text-xs font-medium uppercase tracking-wider px-3 py-1 rounded"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${categoryColors[cat] || primaryColor} 15%, transparent)`,
                    color: categoryColors[cat] || primaryColor
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* Title and description */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl">
              {description}
            </p>

            {/* Highlights/Use cases */}
            {highlights && highlights.length > 0 && (
              <div className="pt-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Use this tool to:
                </p>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                  {highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Main Tool Interface */}
          <div>
            {children}
          </div>

          {/* Methodology Section (Collapsible) */}
          {methodology && (
            <CollapsibleSection title="How This Tool Works" defaultOpen={false}>
              {methodology}
            </CollapsibleSection>
          )}

          {/* FAQ Section (Collapsible) */}
          {faq && (
            <CollapsibleSection title="Frequently Asked Questions" defaultOpen={false}>
              {faq}
            </CollapsibleSection>
          )}

          {/* Disclaimer */}
          <DisclaimerBlock additionalDisclaimer={additionalDisclaimer} />
        </div>
      </div>
    </div>
  )
}

/**
 * CollapsibleSection - A collapsible card section
 */
interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <Card className="border-border/60">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left"
      >
        <CardHeader className="cursor-pointer hover:bg-accent/30 transition-colors rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </CardHeader>
      </button>
      {isOpen && (
        <CardContent className="pt-0">
          <div className="prose prose-sm max-w-none text-muted-foreground">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

/**
 * ToolSection - A card wrapper for tool sections (inputs, outputs, etc.)
 */
interface ToolSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ToolSection({ title, description, children, className }: ToolSectionProps) {
  return (
    <Card className={cn("border-border/60", className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

/**
 * ToolGrid - Standard two-column grid layout for inputs/outputs
 */
interface ToolGridProps {
  children: React.ReactNode
  /** Column ratio: 'equal' (1:1), 'inputs-narrow' (1:2), 'outputs-narrow' (2:1) */
  ratio?: "equal" | "inputs-narrow" | "outputs-narrow"
  className?: string
}

export function ToolGrid({ children, ratio = "inputs-narrow", className }: ToolGridProps) {
  const gridCols = {
    equal: "lg:grid-cols-2",
    "inputs-narrow": "lg:grid-cols-3",
    "outputs-narrow": "lg:grid-cols-3"
  }

  return (
    <div className={cn("grid gap-6", gridCols[ratio], className)}>
      {children}
    </div>
  )
}

/**
 * InputColumn - Wrapper for the inputs side of ToolGrid
 */
export function InputColumn({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("lg:col-span-1 space-y-6", className)}>
      {children}
    </div>
  )
}

/**
 * OutputColumn - Wrapper for the outputs side of ToolGrid
 */
export function OutputColumn({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("lg:col-span-2 space-y-6", className)}>
      {children}
    </div>
  )
}
