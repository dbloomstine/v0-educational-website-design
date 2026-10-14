/**
 * Answer one reply to an outreach email, in its own thread, from Danny.
 *
 *   npx tsx --env-file=.env.local scripts/outreach-v2/answer-reply.ts <reply-id> <answer.txt> [--dry]
 *
 * Used by the twice-daily reply round (Danny, 2026-10-14: Claude answers routine replies itself: pricing,
 * dates, specs, how to book, from the /sponsor page's facts; anything else goes to him). The answer is plain
 * text; a signature is not added (write it in the file). Marks the reply handled. Refuses a reply that asked
 * to stop, one already handled, and one with no matched outreach message.
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { FROM, REPLY_TO } from '../../lib/outreach-v2/config'
import { resendSend } from '../../lib/outreach-v2/send'

async function main() {
  const [replyId, file, flag] = process.argv.slice(2)
  if (!replyId || !file) throw new Error('usage: answer-reply.ts <reply-id> <answer.txt> [--dry]')
  const text = fs.readFileSync(file, 'utf8').trim()
  if (text.length < 20) throw new Error('answer is empty')
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: r, error } = await db.from('outreach_v2_replies').select('id, message_id, from_address, subject, rfc_message_id, unsubscribe_intent, handled_at').eq('id', replyId).single()
  if (error || !r) throw new Error(`no reply ${replyId}: ${error?.message}`)
  if (r.handled_at) throw new Error('already handled')
  if (r.unsubscribe_intent) throw new Error('the reply asked to stop: do not answer')
  if (!r.message_id || !r.from_address) throw new Error('reply is not matched to an outreach message')
  const subject = /^re:/i.test(r.subject ?? '') ? r.subject! : `Re: ${r.subject ?? 'FundOps Daily'}`
  const headers: Record<string, string> = r.rfc_message_id ? { 'In-Reply-To': r.rfc_message_id, References: r.rfc_message_id } : {}
  const payload = { from: FROM, to: [r.from_address], reply_to: REPLY_TO, subject, text, headers, tags: [{ name: 'kind', value: 'answer' }] }
  if (flag === '--dry') { console.log(JSON.stringify(payload, null, 2)); return }
  const { id } = await resendSend(payload, `answer-${replyId}`)
  await db.from('outreach_v2_replies').update({ handled_at: new Date().toISOString(), handled_note: `answered by Claude (resend ${id}): ${text.slice(0, 300)}` }).eq('id', replyId)
  console.log(`sent ${id} to ${r.from_address}`)
}
main().catch((e) => { console.error(e.message); process.exit(1) })
