"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StaggeredGrid } from "@/components/staggered-grid"
import { AnimateOnScroll } from "@/components/animate-on-scroll"
import { cn } from "@/lib/utils"

interface FundType {
  name: string
  description: string
  href: string
  color: string
}

interface Role {
  slug: string
  title: string
  description: string
}

interface ResourceTabsProps {
  fundTypes: FundType[]
  roles: Role[]
}

export function ResourceTabs({ fundTypes, roles }: ResourceTabsProps) {
  const [activeTab, setActiveTab] = useState<"fund-types" | "roles">("fund-types")

  return (
    <section id="resources" className="py-16 scroll-mt-16">
      <div className="container mx-auto px-4">
        <AnimateOnScroll>
          <div className="mb-10">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Resources
            </p>
            <h2 className="mb-6 text-3xl font-bold" style={{ letterSpacing: '-0.01em' }}>
              Explore the Library
            </h2>

            {/* Tab buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("fund-types")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === "fund-types"
                    ? "bg-foreground text-background"
                    : "bg-accent text-foreground hover:bg-accent/80"
                )}
              >
                By Fund Type
              </button>
              <button
                onClick={() => setActiveTab("roles")}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === "roles"
                    ? "bg-foreground text-background"
                    : "bg-accent text-foreground hover:bg-accent/80"
                )}
              >
                By Role
              </button>
            </div>
          </div>
        </AnimateOnScroll>

        {/* Fund Types Grid */}
        {activeTab === "fund-types" && (
          <StaggeredGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={75} duration={700}>
            {fundTypes.map((fund) => (
              <Link key={fund.name} href={fund.href} className="group h-full">
                <Card className="h-full transition-colors duration-200 border-border/60 hover:border-foreground/20">
                  <CardHeader className="pb-2">
                    <div
                      className="mb-3 h-1 w-10 rounded-full"
                      style={{ backgroundColor: fund.color }}
                    />
                    <CardTitle className="text-base font-semibold">{fund.name}</CardTitle>
                    <CardDescription className="leading-relaxed text-sm">{fund.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      Explore
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </StaggeredGrid>
        )}

        {/* Roles Grid */}
        {activeTab === "roles" && (
          <StaggeredGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={100} duration={700}>
            {roles.map((role) => (
              <Link key={role.slug} href={`/roles/${role.slug}`} className="group h-full">
                <Card className="h-full transition-colors duration-200 border-border/60 hover:border-foreground/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">{role.title}</CardTitle>
                    <CardDescription className="leading-relaxed text-sm">{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      View Resources
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </StaggeredGrid>
        )}
      </div>
    </section>
  )
}
