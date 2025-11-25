"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Menu, X } from "lucide-react"
import { getAllFundTypes } from "@/lib/content/fund-types"
import { getAllTools, getAllCategories } from "@/lib/content/tools"

const fundTypes = getAllFundTypes().map((fundType) => ({
  name: fundType.name,
  href: `/funds/${fundType.slug}`,
  color: fundType.color,
}))

const tools = getAllTools().filter(tool => tool.status === 'active')
const toolCategories = getAllCategories()

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-xl font-semibold tracking-tight">
            Fund<span className="text-muted-foreground">OpsHQ</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent">Fund Types</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[600px] grid-cols-2 gap-3 p-4">
                  {fundTypes.map((fund) => (
                    <li key={fund.name}>
                      <Link
                        href={fund.href}
                        className="group block rounded-lg border border-border bg-card p-4 text-foreground transition-all hover:border-accent hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: fund.color }} />
                          <div className="font-medium text-sm">{fund.name}</div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/blog" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                Newsletter
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent">Free Tools & Calculators</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[800px] grid-cols-2 gap-3 p-4">
                  {/* Group tools by category */}
                  {toolCategories.map((category) => {
                    const categoryTools = tools.filter(tool => tool.categories.includes(category))
                    if (categoryTools.length === 0) return null

                    return (
                      <li key={category} className="col-span-2">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {category}
                        </div>
                        <div className="grid gap-2">
                          {categoryTools.map((tool) => (
                            <Link
                              key={tool.slug}
                              href={`/tools/${tool.slug}`}
                              className="block rounded-lg border border-border bg-card p-3 text-foreground transition-all hover:border-accent hover:bg-accent/50"
                            >
                              <div className="font-medium text-sm">{tool.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">{tool.shortDescription}</div>
                            </Link>
                          ))}
                        </div>
                      </li>
                    )
                  })}
                  {/* View All Tools Link */}
                  <li className="col-span-2 border-t border-border pt-3">
                    <Link
                      href="/tools"
                      className="block rounded-lg bg-primary/10 p-3 text-center font-medium text-sm text-primary transition-all hover:bg-primary/20"
                    >
                      View All Tools →
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/about" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                About
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <a href="#" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50" target="_blank" rel="noopener noreferrer">
                Shop
              </a>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/contact">Let's Chat</Link>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Fund Types */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Fund Types
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {fundTypes.map((fund) => (
                  <Link
                    key={fund.name}
                    href={fund.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md border border-border bg-card p-3 text-sm transition-all hover:border-accent hover:bg-accent/50"
                  >
                    <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: fund.color }} />
                    <span className="font-medium text-foreground">{fund.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Free Tools & Calculators
              </h3>
              <div className="space-y-3">
                {toolCategories.map((category) => {
                  const categoryTools = tools.filter(tool => tool.categories.includes(category))
                  if (categoryTools.length === 0) return null

                  return (
                    <div key={category}>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {category}
                      </div>
                      <div className="space-y-1">
                        {categoryTools.map((tool) => (
                          <Link
                            key={tool.slug}
                            href={`/tools/${tool.slug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block rounded-md border border-border bg-card p-2 text-xs transition-all hover:border-accent hover:bg-accent/50"
                          >
                            <span className="font-medium text-foreground">{tool.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })}
                <Link
                  href="/tools"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md bg-primary/10 p-2 text-center text-xs font-medium text-primary transition-all hover:bg-primary/20"
                >
                  View All Tools →
                </Link>
              </div>
            </div>

            {/* Other Links */}
            <div className="space-y-2 pt-4 border-t border-border">
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Newsletter
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                About
              </Link>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Shop
              </a>
            </div>

            {/* Mobile CTA */}
            <div className="pt-4 border-t border-border">
              <Button asChild size="sm" className="w-full">
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                  Let's Chat
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
