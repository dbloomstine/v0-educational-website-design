/**
 * Server-side helpers for the directory's forms (claim, edit, hide, request).
 * Uncached reads: these run for one person at a time, never for a crawler.
 */
import { revalidateTag } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { imageSize } from '@/lib/sponsor/requests'
import { DIRECTORY_TAG } from './data'
import { PERSON_COLUMNS, type Person } from './people'

export type AdminPerson = Person & { pending_edits: unknown; hidden_by: string | null }

const COLUMNS = `${PERSON_COLUMNS}, pending_edits, hidden_by`

export async function personBySlug(slug: string): Promise<AdminPerson | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null
  const { data, error } = await getSupabaseAdmin().from('directory_people').select(COLUMNS).eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as unknown as AdminPerson | null) ?? null
}

export async function personById(id: string): Promise<AdminPerson | null> {
  const { data, error } = await getSupabaseAdmin().from('directory_people').select(COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as unknown as AdminPerson | null) ?? null
}

/** Drop the cached lists and profiles at once (a hide or a removal must not wait an hour). */
export function refreshDirectory() {
  try {
    revalidateTag(DIRECTORY_TAG, { expire: 0 })
  } catch (err) {
    console.error('[directory] revalidate failed:', err)
  }
}

export const PHOTO_BUCKET = 'directory-photos'
export const PHOTO_MAX_BYTES = 1_000_000

/** A photo sent as a data URL: PNG or JPEG by its own first bytes, at most 1 MB, 200 to 3000 pixels a side. */
export function readPhoto(dataUrl: unknown): { bytes: Buffer; ext: 'png' | 'jpg'; type: string } | { error: string } | null {
  if (typeof dataUrl !== 'string' || !dataUrl) return null
  const m = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!m) return { error: 'The photo must be a PNG or JPEG file.' }
  const bytes = Buffer.from(m[2], 'base64')
  if (bytes.length > PHOTO_MAX_BYTES) return { error: 'The photo is too large: keep it under 1 MB.' }
  const png = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  const jpg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (!png && !jpg) return { error: 'The photo must be a PNG or JPEG file.' }
  const size = imageSize(bytes)
  if (!size || size.width < 200 || size.height < 200) return { error: 'Use a photo at least 200 pixels on each side.' }
  if (size.width > 3000 || size.height > 3000) return { error: 'Use a photo under 3,000 pixels a side.' }
  return png ? { bytes, ext: 'png', type: 'image/png' } : { bytes, ext: 'jpg', type: 'image/jpeg' }
}

/** Upload a checked photo; its public address, or null if storage refused it. */
export async function storePhoto(personId: string, photo: { bytes: Buffer; ext: string; type: string }): Promise<string | null> {
  const store = getSupabaseAdmin().storage.from(PHOTO_BUCKET)
  const path = `${personId}/${crypto.randomUUID()}.${photo.ext}`
  const { error } = await store.upload(path, photo.bytes, { contentType: photo.type, upsert: false })
  if (error) {
    console.error('[directory] photo upload failed:', error.message)
    return null
  }
  return store.getPublicUrl(path).data.publicUrl
}
