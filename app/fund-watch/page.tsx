import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FundWatchClient } from "@/components/fund-watch/fund-watch-client"
import { getFundDirectoryData } from "@/lib/content/fund-watch-loader"
import { ArrowLeft, Activity, TrendingUp, Layers, Radio } from "lucide-react"
import { formatAum } from "@/lib/content/fund-watch"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "FundWatch Tracker | FundOpsHQ",
  description:
    "Track fund closes and launches across private equity, venture capital, credit, infrastructure, real estate, and secondaries. Updated weekly.",
  openGraph: {
    title: "FundWatch Tracker | FundOpsHQ",
    description:
      "Track fund closes and launches across private equity, venture capital, credit, infrastructure, real estate, and secondaries.",
    type: "website",
    url: "https://fundopshq.com/fund-watch",
  },
  alternates: {
    canonical: "https://fundopshq.com/fund-watch",
  },
}

export default async function FundWatchPage() {
  const data = await getFundDirectoryData()

  const stats = data?.stats
  const totalAum = stats?.total_aum_millions
    ? formatAum(stats.total_aum_millions)
    : null
  const categoryCount = stats ? Object.keys(stats.by_category).length : 0

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="relative border-b border-border overflow-hidden">
          {/* Layered background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, oklch(0.18 0.02 250) 0%, oklch(0.24 0.04 260) 50%, oklch(0.20 0.03 270) 100%)",
            }}
          />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.6 0.02 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.6 0.02 250) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {/* Glow accent */}
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.07]"
            style={{
              background: "radial-gradient(circle, oklch(0.6 0.15 250), transparent 70%)",
            }}
          />

          <div className="container relative mx-auto px-4 pt-10 pb-12">
            <Link
              href="/newsletter/fundwatch-briefing"
              className="inline-flex items-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors mb-8"
            >
              <ArrowLeft className="mr-1.5 h-3 w-3" />
              FundWatch Briefing
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              {/* Left: branding + copy */}
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 mb-5">
                  <Radio className="h-3 w-3" />
                  Live Fund Intelligence
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-3">
                  FundWatch Tracker
                </h1>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  Every fund close, launch, and raise tracked by the FundWatch pipeline.
                  Filter, sort, and export across categories, stages, date ranges, and fund sizes.
                </p>
                {data && (
                  <p className="mt-4 text-xs text-muted-foreground/50">
                    Last updated {new Date(data.generated_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>

              {/* Right: stat cards */}
              {stats && (
                <div className="grid grid-cols-3 gap-3 lg:gap-4">
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3 min-w-[120px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground/50 mb-1">
                      <Activity className="h-3 w-3" />
                      <span className="text-[11px] font-medium uppercase tracking-wider">Funds</span>
                    </div>
                    <p className="text-2xl font-semibold tabular-nums">{stats.total_funds}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3 min-w-[120px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground/50 mb-1">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-[11px] font-medium uppercase tracking-wider">Total AUM</span>
                    </div>
                    <p className="text-2xl font-semibold tabular-nums">{totalAum}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3 min-w-[120px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground/50 mb-1">
                      <Layers className="h-3 w-3" />
                      <span className="text-[11px] font-medium uppercase tracking-wider">Categories</span>
                    </div>
                    <p className="text-2xl font-semibold tabular-nums">{categoryCount}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {data ? (
          <section className="py-10 pb-16">
            <div className="container mx-auto px-4">
              <Suspense fallback={<div className="h-96 flex items-center justify-center text-muted-foreground">Loading tracker...</div>}>
                <FundWatchClient
                  funds={data.funds}
                  categories={data.categories}
                  stages={data.stages}
                />
              </Suspense>
            </div>
          </section>
        ) : (
          <section className="py-20">
            <div className="container mx-auto px-4 text-center">
              <p className="text-lg text-muted-foreground">
                No fund data available. Run{" "}
                <code className="rounded bg-accent px-2 py-1 text-sm font-mono">fundwatch sync</code>{" "}
                to populate.
              </p>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
