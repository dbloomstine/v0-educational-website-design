/**
 * A claimed person who moves firm (plan B8). Pure, so it is tested.
 *
 * The crawl sees a mover as two rows: the old profile, whose bio page went
 * (missing_since), and a new one at another firm's domain, loaded for review.
 * The desk links them (review.ts link-move) once `moveCandidates` has found
 * the pair; the person then confirms a claim on the NEW profile from an
 * address at the NEW firm (the ordinary claim check), and on that confirmation
 * what they wrote before is carried across as pending edits for the desk (the
 * description may name the old firm), and the old profile is hidden, never
 * deleted: its claims and history stay.
 */
import { baseDomain } from '@/lib/submit/validate'
import type { ProfileEdits } from './edit-shape'

export interface MoveSide {
  id: string
  slug: string
  full_name: string
  firm_name: string
  firm_domain: string
  status: string
  bar_admissions?: string[] | null
  education?: { school?: string | null }[] | null
  practice_areas?: string[] | null
  claimed_at?: string | null
  missing_since?: string | null
}

/** "Jeffrey (Jeff) A. Misher, Jr." → "jeffrey misher": first and last word, no nickname, initials or suffix. */
export function nameKey(fullName: string): string {
  const words = fullName
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)|"[^"]*"/g, ' ')
    .replace(/,?\s+(jr|sr|ii|iii|iv|esq|cpa|phd|pc)\.?$/g, '')
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)
  if (words.length === 0) return ''
  return words.length === 1 ? words[0] : `${words[0]} ${words[words.length - 1]}`
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const overlap = (a: string[], b: string[]) => {
  const B = new Set(b.map(norm).filter(Boolean))
  return a.map(norm).filter((x) => x && B.has(x)).length
}

export interface MoveCandidate {
  from: MoveSide
  to: MoveSide
  /** What else matched beyond the name: shared bar admissions, schools, practice areas. */
  evidence: string[]
  score: number
}

/**
 * Pairs a claimed profile at one firm with a profile of the same name at another firm. The name alone is
 * never enough: at least one more shared fact (an admission, a school or a practice area) is required.
 * Strongest first. Only claimed `from` rows are considered: an unclaimed mover needs nothing carried.
 */
export function moveCandidates(rows: MoveSide[]): MoveCandidate[] {
  const byName = new Map<string, MoveSide[]>()
  for (const r of rows) {
    const k = nameKey(r.full_name)
    if (!k) continue
    byName.set(k, [...(byName.get(k) ?? []), r])
  }
  const out: MoveCandidate[] = []
  for (const group of byName.values()) {
    for (const from of group) {
      if (!from.claimed_at || from.status === 'removed') continue
      for (const to of group) {
        if (to.id === from.id || to.status === 'removed') continue
        if (baseDomain(to.firm_domain.toLowerCase()) === baseDomain(from.firm_domain.toLowerCase())) continue
        const bars = overlap(from.bar_admissions ?? [], to.bar_admissions ?? [])
        const schools = overlap((from.education ?? []).map((e) => e?.school ?? ''), (to.education ?? []).map((e) => e?.school ?? ''))
        const practices = overlap(from.practice_areas ?? [], to.practice_areas ?? [])
        const evidence = [
          ...(bars ? [`${bars} bar admission${bars > 1 ? 's' : ''}`] : []),
          ...(schools ? [`${schools} school${schools > 1 ? 's' : ''}`] : []),
          ...(practices ? [`${practices} practice area${practices > 1 ? 's' : ''}`] : []),
        ]
        if (!evidence.length) continue
        // The old bio gone and the new one waiting for review is the shape of a real move.
        const score = bars * 3 + schools * 3 + practices + (from.missing_since ? 2 : 0) + (to.status === 'review' ? 1 : 0)
        out.push({ from, to, evidence, score })
      }
    }
  }
  return out.sort((a, b) => b.score - a.score || a.from.slug.localeCompare(b.from.slug))
}

export interface OwnerFields {
  headline: string | null
  description: string | null
  photo_url: string | null
  contact_url: string | null
  claimed_practice_areas: string[] | null
  notable: { text: string; year?: number | null }[] | null
  pending_edits?: unknown
}

/**
 * What a mover takes to the new profile: what was live on the old one, or what was waiting for review there
 * if that is newer. The contact link is dropped: it most likely points at the old firm. Null when there is
 * nothing to carry.
 */
export function carryOver(from: OwnerFields): ProfileEdits | null {
  const pending = from.pending_edits && typeof from.pending_edits === 'object' ? (from.pending_edits as Partial<ProfileEdits>) : null
  const src: Partial<ProfileEdits> = pending ?? {
    headline: from.headline,
    description: from.description,
    photo_url: from.photo_url,
    practice_areas: from.claimed_practice_areas ?? [],
    notable: (from.notable ?? []).map((n) => ({ text: n.text, year: n.year ?? null })),
  }
  const edits: ProfileEdits = {
    headline: src.headline ?? null,
    description: src.description ?? null,
    photo_url: src.photo_url ?? null,
    contact_url: null,
    practice_areas: src.practice_areas ?? [],
    notable: (src.notable ?? []).map((n) => ({ text: n.text, year: n.year ?? null })),
  }
  const any = edits.headline || edits.description || edits.photo_url || edits.practice_areas.length || edits.notable.length
  return any ? edits : null
}
