import { fetchStory } from '@/lib/news/api'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ArrowLeft, ExternalLink, Zap, Newspaper, Clock } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

// ── Badge color maps ──────────────────────────────────────────────

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  fund_launch: { label: 'Launch', color: 'bg-red-900/50 text-red-300 border-red-800' },
  fund_close: { label: 'Close', color: 'bg-red-900/50 text-red-300 border-red-800' },
  capital_raise: { label: 'Raise', color: 'bg-orange-900/50 text-orange-300 border-orange-800' },
  executive_hire: { label: 'Hire', color: 'bg-violet-900/50 text-violet-300 border-violet-800' },
  executive_change: { label: 'Exec Change', color: 'bg-violet-900/50 text-violet-300 border-violet-800' },
  acquisition: { label: 'M&A', color: 'bg-blue-900/50 text-blue-300 border-blue-800' },
  regulatory_action: { label: 'Regulatory', color: 'bg-amber-900/50 text-amber-300 border-amber-800' },
  market_commentary: { label: 'Market', color: 'bg-muted text-muted-foreground border-border' },
  press_release: { label: 'Press', color: 'bg-muted text-muted-foreground border-border' },
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  PE: { label: 'PE', color: 'bg-indigo-900/50 text-indigo-300' },
  VC: { label: 'VC', color: 'bg-emerald-900/50 text-emerald-300' },
  credit: { label: 'Credit', color: 'bg-amber-900/50 text-amber-300' },
  hedge: { label: 'Hedge', color: 'bg-purple-900/50 text-purple-300' },
  real_estate: { label: 'Real Estate', color: 'bg-orange-900/50 text-orange-300' },
  infrastructure: { label: 'Infra', color: 'bg-sky-900/50 text-sky-300' },
  secondaries: { label: 'Secondaries', color: 'bg-rose-900/50 text-rose-300' },
  gp_stakes: { label: 'GP-Stakes', color: 'bg-teal-900/50 text-teal-300' },
}

// ── Helpers ───────────────────────────────────────────────────────

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}

function formatFundSize(usd: number | null): string | null {
  if (!usd) return null
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(0)}M`
  return `$${usd.toLocaleString()}`
}

function formatArticleDate(date: string | null): string {
  if (!date) return ''
  try {
    return format(new Date(date), 'MMM d, yyyy')
  } catch {
    return ''
  }
}

function formatRelative(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return ''
  }
}

// ── Dynamic metadata ──────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const { id } = await params
    const story = await fetchStory(id)
    return {
      title: story.headline,
      description:
        story.summary ||
        `${story.articleCount} sources covering this fund operations story`,
      openGraph: {
        title: story.headline,
        description:
          story.summary ||
          `${story.articleCount} sources covering this fund operations story`,
        type: 'article',
        url: `https://fundops.com/news/story/${id}`,
      },
      twitter: {
        card: 'summary',
        title: story.headline,
        description:
          story.summary ||
          `${story.articleCount} sources covering this fund operations story`,
      },
    }
  } catch {
    return { title: 'Story Not Found' }
  }
}

// ── Page ──────────────────────────────────────────────────────────

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let story
  try {
    story = await fetchStory(id)
  } catch {
    notFound()
  }

  const eventLabel = story.eventType ? EVENT_LABELS[story.eventType] : null
  const fundSize = formatFundSize(story.maxFundSizeUsd)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1 bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-8">
          {/* Back link */}
          <Link
            href="/news"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to News
          </Link>

          {/* Headline */}
          <h1 className="text-2xl font-heading font-bold text-foreground leading-tight sm:text-3xl lg:text-4xl">
            {decodeHtmlEntities(story.headline)}
          </h1>

          {/* Metadata row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {story.isHighSignal && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-800 bg-red-900/50 px-2.5 py-1 text-xs font-medium text-red-300">
                <Zap className="h-3 w-3" />
                High Signal
              </span>
            )}
            {eventLabel && (
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${eventLabel.color}`}
              >
                {eventLabel.label}
              </span>
            )}
            {story.fundCategories.map((cat) => {
              const catInfo = CATEGORY_LABELS[cat]
              return (
                <span
                  key={cat}
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    catInfo?.color || 'bg-muted text-muted-foreground'
                  }`}
                >
                  {catInfo?.label || cat.replace('_', ' ')}
                </span>
              )
            })}
            {fundSize && (
              <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {fundSize}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatRelative(story.lastUpdated)}
            </span>
          </div>

          {/* AI Summary */}
          {story.summary && (
            <div className="mt-6 rounded-lg border border-border bg-muted/50 p-5">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Summary
              </h2>
              <p className="text-sm leading-relaxed text-foreground">
                {decodeHtmlEntities(story.summary)}
              </p>
            </div>
          )}

          {/* Firm chips */}
          {story.firmChips.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Firms Mentioned
              </h2>
              <div className="flex flex-wrap gap-2">
                {story.firmChips.map((firm) => (
                  <span
                    key={firm.slug}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground"
                  >
                    {firm.logoUrl ? (
                      <img
                        src={firm.logoUrl}
                        alt=""
                        width={16}
                        height={16}
                        className="rounded-sm"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-muted text-[9px] font-bold text-muted-foreground">
                        {firm.name.charAt(0)}
                      </span>
                    )}
                    {firm.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* GP Names */}
          {story.gpNames.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                People
              </h2>
              <div className="flex flex-wrap gap-2">
                {story.gpNames.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sources section — Techmeme style */}
          <div className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                {story.articleCount} {story.articleCount === 1 ? 'Source' : 'Sources'}
              </h2>
            </div>

            <div className="space-y-0 divide-y divide-border rounded-lg border border-border bg-card">
              {story.articles.map((article) => (
                <div key={article.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {article.sourceName || 'Unknown Source'}
                      </span>
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block text-sm text-foreground hover:text-blue-400 transition-colors leading-snug"
                      >
                        {decodeHtmlEntities(article.title)}
                      </a>
                      {article.publishedDate && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {formatArticleDate(article.publishedDate)}
                        </span>
                      )}
                    </div>
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`Open article from ${article.sourceName || 'source'}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Back to news (bottom) */}
          <div className="mt-8 pt-6 border-t border-border">
            <Link
              href="/news"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to News
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
