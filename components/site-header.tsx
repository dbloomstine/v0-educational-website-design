"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown } from "lucide-react"
import { getAllFundTypes } from "@/lib/content/fund-types"
import { getAllTools } from "@/lib/content/tools"
import { cn } from "@/lib/utils"

const fundTypes = getAllFundTypes().map((fundType) => ({
  name: fundType.name,
  href: `/funds/${fundType.slug}`,
  color: fundType.color,
}))

const tools = getAllTools().filter(tool => tool.status === 'active')

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function Dropdown({ trigger, children, isOpen, onOpenChange }: DropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onOpenChange])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => onOpenChange(!isOpen)}
        className={cn(
          "group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
          isOpen && "bg-accent/50"
        )}
      >
        {trigger}
        <ChevronDown
          className={cn(
            "ml-1 h-3 w-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div
          className="absolute top-full mt-2 z-50 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-200 left-1/2 -translate-x-1/2"
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const handleDropdownOpen = (name: string) => (open: boolean) => {
    setOpenDropdown(open ? name : null)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-xl font-semibold tracking-tight">
            Fund<span className="text-muted-foreground">OpsHQ</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Fund Types Dropdown */}
          <Dropdown
            trigger="Fund Types"
            isOpen={openDropdown === 'fund-types'}
            onOpenChange={handleDropdownOpen('fund-types')}
          >
            <ul className="grid w-[600px] grid-cols-2 gap-3 p-4">
              {fundTypes.map((fund) => (
                <li key={fund.name}>
                  <Link
                    href={fund.href}
                    onClick={() => setOpenDropdown(null)}
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
          </Dropdown>

          {/* Newsletters Dropdown */}
          <Dropdown
            trigger="Newsletters"
            isOpen={openDropdown === 'newsletter'}
            onOpenChange={handleDropdownOpen('newsletter')}
          >
            <div className="w-[480px] p-6">
              <div className="space-y-4">
                <Link
                  href="/newsletter/fundopshq-insights"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg p-4 transition-all hover:bg-accent/50"
                >
                  <div className="font-semibold text-sm text-foreground mb-1">FundOpsHQ Insights</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    Deep dives on fund operations topics, practical frameworks, and lessons learned from the field.
                  </div>
                </Link>
                <Link
                  href="/newsletter/fundwatch-briefing"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-lg p-4 transition-all hover:bg-accent/50"
                >
                  <div className="font-semibold text-sm text-foreground mb-1">FundWatch Briefing</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    Weekly curated news, regulatory updates, and market intelligence for fund operations professionals.
                  </div>
                </Link>
              </div>
              <div className="pt-4 mt-4 border-t border-border">
                <Link
                  href="/newsletter"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-md p-2 text-sm text-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  View All Newsletters
                </Link>
              </div>
            </div>
          </Dropdown>

          {/* Free Tools Dropdown */}
          <Dropdown
            trigger="Free Tools"
            isOpen={openDropdown === 'tools'}
            onOpenChange={handleDropdownOpen('tools')}
          >
            <div className="w-[600px] p-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                {tools.slice(0, 6).map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    onClick={() => setOpenDropdown(null)}
                    className="block rounded-lg p-3 transition-all hover:bg-accent/50"
                  >
                    <div className="font-semibold text-sm text-foreground mb-1">{tool.title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {tool.shortDescription}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="pt-4 mt-4 border-t border-border">
                <Link
                  href="/tools"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-md p-2 text-sm text-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  View All Tools
                </Link>
              </div>
            </div>
          </Dropdown>

          {/* About Link */}
          <Link
            href="/about"
            className="inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            About
          </Link>

          {/* Shop Link */}
          <a
            href="https://fundopshq-shop.myshopify.com/collections/all"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Shop
          </a>
        </nav>

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
            <Link href="/contact">
              Contact
            </Link>
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


            {/* Newsletters */}
            <div className="pt-4 border-t border-border">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Newsletters
              </h3>
              <div className="space-y-2">
                <Link
                  href="/newsletter/fundopshq-insights"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md border border-border bg-card p-3 text-sm transition-all hover:border-accent hover:bg-accent/50"
                >
                  <span className="font-medium text-foreground">FundOpsHQ Insights</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Danny Bloomstine</span>
                </Link>
                <Link
                  href="/newsletter/fundwatch-briefing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md border border-border bg-card p-3 text-sm transition-all hover:border-accent hover:bg-accent/50"
                >
                  <span className="font-medium text-foreground">FundWatch Briefing</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Weekly fund operations intel</span>
                </Link>
                <Link
                  href="/newsletter"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-center"
                >
                  View All Newsletters
                </Link>
              </div>
            </div>

            {/* Other Links */}
            <div className="space-y-2 pt-4 border-t border-border">
              <Link
                href="/tools"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Free Tools & Calculators
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                About
              </Link>
              <a
                href="https://fundopshq-shop.myshopify.com/collections/all"
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
                  Contact
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
