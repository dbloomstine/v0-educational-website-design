'use client'

import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface PillarCardProps {
  title: string
  description: string
  articleCount: number
  href: string
  color: string
}

export function PillarCard({ title, description, href, color }: PillarCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 px-4 py-3.5 rounded-sm border border-border/40 bg-card hover:border-foreground/20 transition-colors"
    >
      <div
        className="mt-1.5 h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold text-foreground mb-0.5">{title}</div>
        <div className="text-sm text-muted-foreground leading-snug line-clamp-2">{description}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 mt-1 transition-colors" />
    </Link>
  )
}
