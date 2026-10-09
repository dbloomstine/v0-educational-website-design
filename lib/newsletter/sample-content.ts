/**
 * Today's edition, ready to be rendered with any sponsor in it: what the
 * builder on /sponsor uses to show a prospect their own ad in the real email.
 *
 * The stories, the events and the reader counts are read once and kept for
 * ten minutes, so a prospect trying wording after wording (or anything else
 * pressing the button) costs the database nothing more.
 */
import { unstable_cache } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { queryNewsletterArticles, type ArticleGroup } from './query-articles'
import { queryEventFeed } from '@/lib/events/api'
import type { IndustryEvent } from '@/lib/events/types'
import { readerFirmDomains } from '@/lib/sponsor/reader-firms'

export interface SampleContent {
  groups: ArticleGroup[]
  totalArticles: number
  editionDate: string
  events: IndustryEvent[]
  subscriberCount?: number
  readerFirms?: number
}

async function load(): Promise<SampleContent> {
  const db = getSupabaseAdmin()
  const content = await queryNewsletterArticles(db, 72, { excludePriorEdition: false })
  const editionDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const { data: subs } = await db.from('newsletter_subscribers').select('email').eq('status', 'confirmed').limit(10000)
  const events = await queryEventFeed({ when: '1w', limit: 150 }).then((f) => f.events).catch<IndustryEvent[]>(() => [])
  return {
    groups: content.groups,
    totalArticles: content.totalArticles,
    editionDate,
    events,
    subscriberCount: subs?.length || undefined,
    readerFirms: subs ? readerFirmDomains(subs.map((s) => String(s.email))).size : undefined,
  }
}

export const getSampleContent = unstable_cache(load, ['newsletter-sample-content-v1'], { revalidate: 600 })
