'use client'

import { useState } from 'react'

interface ArticleItem {
  id: string
  title: string
  sourceUrl: string
  sourceName: string | null
  publishedDate: string | null
  articleType: string | null
  eventType: string | null
  fundCategories: string[]
  isHighSignal: boolean
  relevanceScore: number | null
  tldr: string | null
  firmName: string | null
  fundSizeUsdMillions: number | null
}

interface ArticleGroup {
  category: string
  articles: ArticleItem[]
}

interface PrepResponse {
  dateRange: { start: string; end: string }
  totalArticles: number
  groups: ArticleGroup[]
}

const CATEGORY_DISPLAY: Record<string, string> = {
  PE: 'PRIVATE EQUITY',
  VC: 'VENTURE CAPITAL',
  credit: 'CREDIT',
  hedge: 'HEDGE FUNDS',
  real_estate: 'REAL ESTATE',
  infrastructure: 'INFRASTRUCTURE',
  secondaries: 'SECONDARIES',
  gp_stakes: 'GP STAKES',
}

function formatSize(millions: number | null): string {
  if (!millions) return ''
  if (millions >= 1000) return `$${(millions / 1000).toFixed(1)}B`
  return `$${millions}M`
}

export default function NewsletterPrepPage() {
  const [start, setStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [end, setEnd] = useState(() => new Date().toISOString().split('T')[0])
  const [password, setPassword] = useState('')
  const [data, setData] = useState<PrepResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const setQuickRange = (days: number) => {
    const e = new Date()
    const s = new Date()
    s.setDate(s.getDate() - days)
    setStart(s.toISOString().split('T')[0])
    setEnd(e.toISOString().split('T')[0])
  }

  const pullArticles = async () => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(
        `/api/admin/newsletter-prep?start=${start}&end=${end}&password=${encodeURIComponent(password)}`
      )
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to fetch')
        return
      }
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const formatForClaude = (): string => {
    if (!data) return ''
    const lines: string[] = []

    for (const group of data.groups) {
      const label = CATEGORY_DISPLAY[group.category] ?? group.category.toUpperCase()
      lines.push(`## ${label}`)
      lines.push('')

      for (const article of group.articles) {
        const firm = article.firmName ?? 'Unknown Firm'
        const size = formatSize(article.fundSizeUsdMillions)
        const sizeStr = size ? ` | ${size}` : ''
        const event = article.eventType ?? article.articleType ?? 'other'

        lines.push(`${firm}${sizeStr} | [${event}]`)
        lines.push(`**${article.title}**`)
        if (article.tldr) {
          lines.push(article.tldr)
        }
        lines.push(`Sources (1): [${article.sourceName ?? 'Source'}](${article.sourceUrl})`)
        lines.push('')
      }
    }

    return lines.join('\n')
  }

  const copyForClaude = async () => {
    const text = formatForClaude()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Newsletter Prep</h1>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div>
            <label htmlFor="prep-start" className="block text-xs text-gray-400 mb-1">Start Date</label>
            <input
              id="prep-start"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="prep-end" className="block text-xs text-gray-400 mb-1">End Date</label>
            <input
              id="prep-end"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-100"
            />
          </div>
          <div className="flex gap-1">
            {[7, 10, 14].map((d) => (
              <button
                key={d}
                onClick={() => setQuickRange(d)}
                className="rounded border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
              >
                {d}d
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="prep-password" className="block text-xs text-gray-400 mb-1">Password</label>
            <input
              id="prep-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-100"
              placeholder="Admin password"
            />
          </div>
          <button
            onClick={pullArticles}
            disabled={loading || !password}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? 'Pulling...' : 'Pull Articles'}
          </button>
        </div>

        {error && (
          <div className="rounded border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {data.totalArticles} articles from {data.dateRange.start} to {data.dateRange.end}
              </p>
              <button
                onClick={copyForClaude}
                className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
              >
                {copied ? 'Copied!' : 'Copy for Claude'}
              </button>
            </div>

            {data.groups.map((group) => (
              <div key={group.category} className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-200 border-b border-gray-800 pb-1">
                  {CATEGORY_DISPLAY[group.category] ?? group.category.toUpperCase()}
                  <span className="ml-2 text-sm font-normal text-gray-500">({group.articles.length})</span>
                </h2>
                {group.articles.map((article) => (
                  <div key={article.id} className="rounded border border-gray-800 bg-gray-900/50 p-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {article.firmName && <span className="font-medium text-gray-300">{article.firmName}</span>}
                      {article.fundSizeUsdMillions && (
                        <span className="text-emerald-400 font-mono">{formatSize(article.fundSizeUsdMillions)}</span>
                      )}
                      <span className="rounded bg-gray-800 px-1.5 py-0.5">{article.eventType}</span>
                      {article.isHighSignal && (
                        <span className="rounded bg-red-900/50 text-red-300 px-1.5 py-0.5">HIGH</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-100">{article.title}</p>
                    {article.tldr && <p className="text-xs text-gray-400">{article.tldr}</p>}
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {article.sourceName ?? 'Source'}
                    </a>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
