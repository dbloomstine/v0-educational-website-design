/** What a claimer may send, and its limits: browser-safe (the edit form imports it), checked in lib/directory/claim.ts. */
export const EDIT_LIMITS = { headline: 120, description: 600, notable: 5, notableText: 200 } as const

export interface ProfileEdits {
  headline: string | null
  description: string | null
  photo_url: string | null
  contact_url: string | null
  practice_areas: string[]
  /** Self-reported, and shown as such. */
  notable: { text: string; year: number | null }[]
}
