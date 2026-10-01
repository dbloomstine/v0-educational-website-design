import type { Story } from './stories'
import { ASSET_LABEL, KIND_LABEL } from './sections'

/** "$5.4B", "$550M", "$11.3M". */
export function sizeLabel(usdM: number | null | undefined): string | null {
  if (!usdM || usdM <= 0) return null
  if (usdM >= 1000) return `$${(usdM / 1000).toFixed(usdM >= 100_000 ? 0 : 1).replace(/\.0$/, '')}B`
  return `$${usdM >= 100 ? Math.round(usdM) : Number(usdM.toFixed(1))}M`
}

/** "$18.1B" for totals. */
export function totalLabel(usdM: number): string {
  if (usdM >= 1000) return `$${(usdM / 1000).toFixed(1).replace(/\.0$/, '')}B`
  return `$${Math.round(usdM)}M`
}

/**
 * How long ago a story reached us. Hours while it is fresh, then the
 * calendar: "3h ago" means something, "41h ago" does not.
 */
export function timeLabel(iso: string, nowMs: number): string {
  const then = new Date(iso)
  const diffMin = Math.max(0, Math.floor((nowMs - then.getTime()) / 60_000))
  if (diffMin < 50) return `${Math.max(diffMin, 5)}m ago`
  if (diffMin < 60 * 20) return `${Math.max(1, Math.round(diffMin / 60))}h ago`
  const et = (d: Date) => d.toLocaleDateString('en-US', { timeZone: 'America/New_York' })
  const yesterday = new Date(nowMs - 86_400_000)
  if (et(then) === et(new Date(nowMs))) return 'Today'
  if (et(then) === et(yesterday)) return 'Yesterday'
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })
}

/** Calendar day heading for a river: "Today", "Yesterday", "Monday, September 29". */
export function dayHeading(iso: string, nowMs: number): string {
  const then = new Date(iso)
  const et = (d: Date) => d.toLocaleDateString('en-US', { timeZone: 'America/New_York' })
  if (et(then) === et(new Date(nowMs))) return 'Today'
  if (et(then) === et(new Date(nowMs - 86_400_000))) return 'Yesterday'
  return then.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' })
}

export function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

const CLOSE_LABEL: Record<string, string> = {
  final_close: 'Final close',
  first_close: 'First close',
  interim_close: 'Interim close',
  second_close: 'Second close',
  launch: 'Launch',
  target: 'Target',
}

/** The stage of a fund event, in words, or null when there is nothing honest to say. */
export function stageLabel(story: Story): string | null {
  if (story.kind !== 'fundraising') return null
  if (!story.leadEligible) return null
  if (story.closeType && CLOSE_LABEL[story.closeType]) return CLOSE_LABEL[story.closeType]
  if (story.eventType === 'fund_launch') return 'Launch'
  if (story.eventType === 'fund_close') return 'Close'
  return 'Raising'
}

/** Short label over a story: its market for a fund event, its type otherwise. */
export function kickerLabel(story: Story): string {
  if (story.kind === 'fundraising' && story.assetClasses[0]) return ASSET_LABEL[story.assetClasses[0]] ?? KIND_LABEL.fundraising
  return KIND_LABEL[story.kind]
}
