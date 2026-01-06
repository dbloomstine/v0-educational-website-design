import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group"
        aria-label="Home"
      >
        <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
        <span className="sr-only md:not-sr-only">Home</span>
      </Link>
      {items.map((item, index) => {
        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
