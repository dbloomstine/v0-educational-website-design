/**
 * How complete a claimed profile is: the six things a claimer can add (plan B5,
 * after LinkedIn's "All-Star" meter and Avvo's). Browser-safe: the edit form
 * runs it as the person types. Counts only what the person adds; the firm's
 * own facts are always there.
 */
import type { ProfileEdits } from './edit-shape'

export interface CompletenessItem {
  id: 'headline' | 'description' | 'photo' | 'contact' | 'practices' | 'notable'
  label: string
  done: boolean
}

export interface Completeness {
  done: number
  total: number
  /** 0 to 100, whole numbers. */
  percent: number
  items: CompletenessItem[]
}

const filled = (s: string | null | undefined) => typeof s === 'string' && s.trim().length > 0

/** A description counts once it says something: at least 80 characters. */
export const DESCRIPTION_MIN = 80

export function completeness(e: Partial<ProfileEdits> & { photo_data?: string | null }): Completeness {
  const items: CompletenessItem[] = [
    { id: 'headline', label: 'A headline', done: filled(e.headline) },
    { id: 'description', label: `A description (${DESCRIPTION_MIN} characters or more)`, done: (e.description ?? '').trim().length >= DESCRIPTION_MIN },
    { id: 'photo', label: 'A photo', done: filled(e.photo_url) || filled(e.photo_data) },
    { id: 'contact', label: 'A contact link', done: filled(e.contact_url) },
    { id: 'practices', label: 'Your practice areas', done: (e.practice_areas?.length ?? 0) > 0 },
    { id: 'notable', label: 'At least one notable matter', done: (e.notable ?? []).some((n) => filled(n?.text)) },
  ]
  const done = items.filter((i) => i.done).length
  return { done, total: items.length, percent: Math.round((done / items.length) * 100), items }
}
