'use client'

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

interface PillarCardProps {
  title: string
  description: string
  articleCount: number
  href: string
  color: string
}

export function PillarCard({ title, description, articleCount, href, color }: PillarCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link href={href} className="group">
      <Card
        className="h-full transition-all hover:shadow-lg"
        style={{
          borderColor: isHovered ? color : undefined,
          boxShadow: isHovered ? `0 10px 15px -3px ${color}10` : undefined,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader>
          <CardTitle className="flex items-start justify-between text-xl">
            <span>{title}</span>
            <ArrowRight
              className="h-5 w-5 transition-all group-hover:translate-x-1"
              style={{
                color: color,
                opacity: isHovered ? 1 : 0,
              }}
            />
          </CardTitle>
          <CardDescription className="leading-relaxed">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {articleCount > 0 ? `${articleCount} article${articleCount !== 1 ? 's' : ''}` : 'Coming soon'}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
