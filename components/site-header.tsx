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

const fundTypes = [
  { name: "Private Equity", href: "/funds/private-equity", color: "oklch(0.65 0.19 275)" },
  { name: "Private Credit", href: "/funds/private-credit", color: "oklch(0.55 0.15 150)" },
  { name: "Venture Capital", href: "/funds/venture-capital", color: "oklch(0.65 0.22 30)" },
  { name: "Hedge Funds", href: "/funds/hedge-funds", color: "oklch(0.62 0.18 220)" },
  { name: "Real Estate", href: "/funds/real-estate", color: "oklch(0.58 0.14 90)" },
  { name: "Infrastructure", href: "/funds/infrastructure", color: "oklch(0.6 0.16 180)" },
  { name: "Secondaries", href: "/funds/secondaries", color: "oklch(0.64 0.20 320)" },
  { name: "GP-Stakes", href: "/funds/gp-stakes", color: "oklch(0.66 0.18 50)" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-xl font-semibold tracking-tight">
            Fund<span className="text-muted-foreground">Ops</span>
          </div>
        </Link>

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent">Fund Types</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[600px] grid-cols-2 gap-3 p-4">
                  {fundTypes.map((fund) => (
                    <Link
                      key={fund.name}
                      href={fund.href}
                      className="group block rounded-lg border border-border bg-card p-4 transition-all hover:border-accent hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: fund.color }} />
                        <div className="font-medium text-sm">{fund.name}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/tools" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                Tools & Resources
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/blog" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                Blog
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <Button asChild size="sm">
          <Link href="/contact">Get Help</Link>
        </Button>
      </div>
    </header>
  )
}
