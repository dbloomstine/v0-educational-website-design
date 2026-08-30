'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  getLogoCandidates,
  resolveLogoDomain,
  resolveFirmLogoDomain,
} from '@/lib/news/firm-logo-url'

// Extracted from ArticleRow so the homepage table can render the same logos
// without pulling in the whole row (and its hover card) as a client bundle.

const LOGO_COLORS = [
  'bg-blue-900/60 text-blue-300',
  'bg-emerald-900/60 text-emerald-300',
  'bg-violet-900/60 text-violet-300',
  'bg-amber-900/60 text-amber-300',
  'bg-rose-900/60 text-rose-300',
  'bg-cyan-900/60 text-cyan-300',
  'bg-indigo-900/60 text-indigo-300',
  'bg-orange-900/60 text-orange-300',
]

function getInitialColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length]
}

export function FirmLogo({
  domain,
  firmName,
  sourceName,
  size = 20,
}: {
  domain: string | null
  firmName: string | null
  sourceName?: string | null
  size?: number
}) {
  // When a firm is named, the icon must come from that firm — falling
  // through to the publication's domain paired the outlet's favicon with
  // the firm's name (the "Siri with Nikkei's logo" bug). With no firm at
  // all, the source favicon is honest (the initial fallback labels it).
  const resolvedDomain = firmName
    ? resolveFirmLogoDomain(firmName, domain)
    : resolveLogoDomain(firmName, domain, sourceName ?? null)
  const candidates = useMemo(
    () => (resolvedDomain ? getLogoCandidates(resolvedDomain) : []),
    [resolvedDomain],
  )

  // Walk the candidate list on each img load failure. Reset when the
  // resolved domain changes so a re-render with different props starts
  // over from the primary source.
  const [candidateIdx, setCandidateIdx] = useState(0)
  useEffect(() => {
    setCandidateIdx(0)
  }, [resolvedDomain])

  const currentUrl = candidates[candidateIdx]

  if (currentUrl) {
    return (
      <img
        key={resolvedDomain ?? ''}
        src={currentUrl}
        alt=""
        loading="lazy"
        className="rounded-full object-contain bg-white shrink-0 ring-1 ring-black/5"
        style={{ width: size, height: size }}
        onError={() => setCandidateIdx((i) => i + 1)}
      />
    )
  }

  // Final fallback: letter initial from firmName, or sourceName if no firm.
  const displayName = firmName || sourceName || '?'
  const initial = displayName[0].toUpperCase()
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold shrink-0 ring-1 ring-white/5',
        getInitialColor(displayName),
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, Math.round(size * 0.46)),
        lineHeight: 1,
      }}
      role="img"
      aria-label={displayName}
    >
      {initial}
    </div>
  )
}
