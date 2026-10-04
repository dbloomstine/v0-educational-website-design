import { NextResponse } from 'next/server'
import { socialGate } from '@/lib/social/auth'
import { SOCIAL_BUCKET, isUploadPath } from '@/lib/social/records'
import { getSupabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_FILES = 150

/**
 * Upload slots for the night's finished files.
 *
 * The job sends the paths it is about to upload; it gets back, for each, a
 * one-time address to PUT the file to and the public address the file will
 * have afterwards. The files go straight to storage, so their size never
 * meets this function's request limit, and the storage key never leaves the
 * site. The scheduler fetches a file from its public address when the post
 * goes out, which can be a day later: the bucket is public and nothing in it
 * expires on its own.
 */
export async function POST(req: Request) {
  const refused = socialGate(req)
  if (refused) return refused

  const body = await req.json().catch(() => null)
  const paths: unknown = body?.paths
  if (!Array.isArray(paths) || paths.length === 0 || paths.length > MAX_FILES || !paths.every(isUploadPath)) {
    return NextResponse.json({ error: `paths must be 1 to ${MAX_FILES} of the form YYYY-MM-DD/post-slug/file.jpg|mp4|pdf` }, { status: 400 })
  }

  try {
    const storage = getSupabaseAdmin().storage.from(SOCIAL_BUCKET)
    const files: { path: string; uploadUrl: string; publicUrl: string }[] = []
    // A few at a time: each slot is one request to storage.
    for (let i = 0; i < paths.length; i += 8) {
      const batch = await Promise.all(
        (paths.slice(i, i + 8) as string[]).map(async (path) => {
          const { data, error } = await storage.createSignedUploadUrl(path, { upsert: true })
          if (error || !data) throw new Error(`${path}: ${error?.message ?? 'no upload slot'}`)
          return { path, uploadUrl: data.signedUrl, publicUrl: storage.getPublicUrl(path).data.publicUrl }
        }),
      )
      files.push(...batch)
    }
    return NextResponse.json({ files })
  } catch (err) {
    console.error('[social] upload slots failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'upload slots failed' }, { status: 500 })
  }
}
