import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, Home, Search, BookOpen } from "lucide-react"
import { getAllFundTypes } from "@/lib/content/fund-types"

const fundTypes = getAllFundTypes().slice(0, 5)

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-8">
                <span className="text-8xl font-bold text-muted-foreground/20">404</span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight mb-4">
                Page Not Found
              </h1>

              <p className="text-lg text-muted-foreground mb-8">
                The page you're looking for doesn't exist or has been moved.
                Let's get you back on track.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Button asChild size="lg">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/tools">
                    <Search className="mr-2 h-4 w-4" />
                    Explore Tools
                  </Link>
                </Button>
              </div>

              <div className="border-t border-border pt-12">
                <h2 className="text-xl font-semibold mb-6">
                  Browse by Fund Type
                </h2>
                <div className="flex flex-wrap justify-center gap-3">
                  {fundTypes.map((fundType) => (
                    <Link
                      key={fundType.slug}
                      href={`/funds/${fundType.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: fundType.color }}
                      />
                      {fundType.name}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-12 p-6 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Looking for something specific?</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Check out our{" "}
                  <Link href="/help" className="text-primary hover:underline">
                    help resources
                  </Link>{" "}
                  or{" "}
                  <Link href="/contact" className="text-primary hover:underline">
                    get in touch
                  </Link>{" "}
                  if you need assistance.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
