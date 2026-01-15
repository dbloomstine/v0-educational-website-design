"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Menu, X, ChevronDown, ExternalLink, DollarSign, Building, TrendingUp, LineChart, Split, Rocket } from "lucide-react"
import { getAllFundTypes } from "@/lib/content/fund-types"
import { getAllTools } from "@/lib/content/tools"
import { getAllRoles } from "@/lib/content/roles"
import { cn } from "@/lib/utils"

const fundTypes = getAllFundTypes().map((fundType) => ({
  name: fundType.name,
  href: `/funds/${fundType.slug}`,
  color: fundType.color,
}))

const tools = getAllTools().filter(tool => tool.status === 'active')

const roles = getAllRoles().map((role) => ({
  name: role.shortTitle,
  fullName: role.title,
  href: `/roles/${role.slug}`,
}))

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  id: string
}

function Dropdown({ trigger, children, isOpen, onOpenChange, id }: DropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onOpenChange(false)
        buttonRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscapeKey)
      }
    }
  }, [isOpen, onOpenChange])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={isOpen ? `${id}-menu` : undefined}
        className={cn(
          "group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isOpen && "bg-accent/50"
        )}
      >
        {trigger}
        <ChevronDown
          className={cn(
            "ml-1 h-3 w-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div
          id={`${id}-menu`}
          role="menu"
          aria-label={`${trigger} menu`}
          className="absolute top-full mt-2 z-50 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-300 left-1/2 -translate-x-1/2"
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
        <Link href="/" className="flex items-center" aria-label="FundOpsHQ - Home">
          <Logo height={28} className="text-foreground" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Fund Types Dropdown */}
          <Dropdown
            trigger="Fund Types"
            id="fund-types"
            isOpen={openDropdown === 'fund-types'}
            onOpenChange={handleDropdownOpen('fund-types')}
          >
            <ul className="grid w-[400px] grid-cols-2 gap-1 p-3">
              {fundTypes.map((fund) => (
                <li key={fund.name}>
                  <Link
                    href={fund.href}
                    onClick={() => setOpenDropdown(null)}
                    className="group flex items-center gap-2.5 rounded-md px-3 py-2 text-foreground transition-colors hover:bg-accent/50"
                  >
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: fund.color }} />
                    <span className="text-sm font-medium">{fund.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Dropdown>

          {/* Roles Dropdown */}
          <Dropdown
            trigger="Roles"
            id="roles"
            isOpen={openDropdown === 'roles'}
            onOpenChange={handleDropdownOpen('roles')}
          >
            <ul className="w-[220px] p-3">
              {roles.map((role) => (
                <li key={role.name}>
                  <Link
                    href={role.href}
                    onClick={() => setOpenDropdown(null)}
                    className="block rounded-md px-3 py-2 transition-colors hover:bg-accent/50"
                  >
                    <span className="text-sm font-medium text-foreground">{role.fullName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Dropdown>

          {/* Newsletters Dropdown */}
          <Dropdown
            trigger="Newsletters"
            id="newsletters"
            isOpen={openDropdown === 'newsletter'}
            onOpenChange={handleDropdownOpen('newsletter')}
          >
            <div className="w-[280px] p-3">
              <Link
                href="/newsletter/fundopshq-insights"
                onClick={() => setOpenDropdown(null)}
                className="block rounded-md px-3 py-2 transition-colors hover:bg-accent/50"
              >
                <div className="text-sm font-medium text-foreground">FundOpsHQ Insights</div>
                <div className="text-xs text-muted-foreground">Deep dives & frameworks</div>
              </Link>
              <Link
                href="/newsletter/fundwatch-briefing"
                onClick={() => setOpenDropdown(null)}
                className="block rounded-md px-3 py-2 transition-colors hover:bg-accent/50"
              >
                <div className="text-sm font-medium text-foreground">FundWatch Briefing</div>
                <div className="text-xs text-muted-foreground">Weekly news & updates</div>
              </Link>
              <div className="pt-2 mt-2 border-t border-border">
                <Link
                  href="/newsletter"
                  onClick={() => setOpenDropdown(null)}
                  className="block rounded-md px-3 py-1.5 text-xs text-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  View All
                </Link>
              </div>
            </div>
          </Dropdown>

          {/* Tools Dropdown */}
          <Dropdown
            trigger="Tools"
            id="tools"
            isOpen={openDropdown === 'tools'}
            onOpenChange={handleDropdownOpen('tools')}
          >
            <div className="w-[380px] p-4">
              <div className="space-y-1">
                {tools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/60 mt-0.5">
                      {tool.icon === 'Rocket' && <Rocket className="h-4 w-4 text-foreground" />}
                      {tool.icon === 'DollarSign' && <DollarSign className="h-4 w-4 text-foreground" />}
                      {tool.icon === 'Building' && <Building className="h-4 w-4 text-foreground" />}
                      {tool.icon === 'TrendingUp' && <TrendingUp className="h-4 w-4 text-foreground" />}
                      {tool.icon === 'LineChart' && <LineChart className="h-4 w-4 text-foreground" />}
                      {tool.icon === 'Split' && <Split className="h-4 w-4 text-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{tool.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{tool.shortDescription}</div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* View All Link */}
              <div className="pt-3 mt-3 border-t border-border">
                <Link
                  href="/tools"
                  onClick={() => setOpenDropdown(null)}
                  className="flex items-center justify-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  View All {tools.length} Tools
                  <span className="text-xs">→</span>
                </Link>
              </div>
            </div>
          </Dropdown>

          {/* Videos Link */}
          <Link
            href="/interviews"
            className="inline-flex h-9 w-max items-center gap-1.5 justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Videos
            <span className="inline-flex items-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
              Soon
            </span>
          </Link>

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
            className="inline-flex h-9 w-max items-center gap-1 justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Shop
            <ExternalLink className="h-3 w-3" />
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav
          id="mobile-menu"
          role="navigation"
          aria-label="Mobile navigation"
          className="md:hidden border-t border-border bg-background max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
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


            {/* Roles */}
            <div className="pt-4 border-t border-border">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                By Role
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <Link
                    key={role.name}
                    href={role.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-md border border-border bg-card p-2.5 text-sm transition-all hover:border-accent hover:bg-accent/50"
                  >
                    <span className="font-medium text-foreground text-xs">{role.fullName}</span>
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

            {/* Tools */}
            <div className="pt-4 border-t border-border">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Tools
              </h3>
              <div className="space-y-2">
                {tools.slice(0, 6).map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-md border border-border bg-card p-3 text-sm transition-all hover:border-accent hover:bg-accent/50"
                  >
                    <span className="font-medium text-foreground">{tool.title}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-1">{tool.shortDescription}</span>
                  </Link>
                ))}
                <Link
                  href="/tools"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md border border-dashed border-border px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent hover:border-accent transition-colors text-center"
                >
                  View All {tools.length} Tools →
                </Link>
              </div>
            </div>

            {/* Videos */}
            <div className="pt-4 border-t border-border">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Videos
              </h3>
              <Link
                href="/interviews"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md border border-border bg-card p-3 text-sm transition-all hover:border-accent hover:bg-accent/50"
              >
                <span className="font-medium text-foreground flex items-center gap-2">
                  FundOpsHQ Interviews
                  <span className="inline-flex items-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                    Soon
                  </span>
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">Conversations with fund operations professionals</span>
              </Link>
            </div>

            {/* About */}
            <div className="pt-4 border-t border-border">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                About
              </h3>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md border border-border bg-card p-3 text-sm transition-all hover:border-accent hover:bg-accent/50"
              >
                <span className="font-medium text-foreground">About FundOpsHQ</span>
                <span className="block text-xs text-muted-foreground mt-0.5">The person and mission behind the site</span>
              </Link>
            </div>

            {/* Shop */}
            <div className="pt-4 border-t border-border">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Shop
              </h3>
              <a
                href="https://fundopshq-shop.myshopify.com/collections/all"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md border border-border bg-card p-3 text-sm transition-all hover:border-accent hover:bg-accent/50"
              >
                <span className="font-medium text-foreground flex items-center gap-1">
                  FundOpsHQ Merch
                  <ExternalLink className="h-3 w-3" />
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">Gear for fund operations professionals</span>
              </a>
            </div>

          </div>
        </nav>
      )}
    </header>
  )
}
