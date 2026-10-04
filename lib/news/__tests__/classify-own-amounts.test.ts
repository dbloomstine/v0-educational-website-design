import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { classifyPendingArticles } from '@/lib/news/classify-articles'

/**
 * The classifier's loop, end to end, against a pretend database and a pretend
 * Claude API: a figure taken from a batch neighbour must never be stored.
 *
 * The case is the one that showed the bug (2026-10-01): EQT's sale of Acuon,
 * terms not disclosed, stored at the $2.92B that belonged to the Vicinity
 * Energy deal classified beside it.
 */

interface Article { id: string; title: string; description: string | null; full_text: string | null; source_name: string | null }

const ACUON: Article = {
  id: 'acuon', source_name: 'HedgeCo Insights', full_text: null,
  title: 'EQT Agreed to Sell Korea’s Acuon Group to a Hanwha Life-Led Consortium:',
  description: 'EQT has agreed to sell Acuon Group to a consortium led by Hanwha Life. Financial terms were not disclosed.',
}
const VICINITY: Article = {
  id: 'vicinity', source_name: 'HedgeCo Insights', full_text: null,
  title: 'Harrison Street and Kenon Agreed to Buy Control of Vicinity Energy from Antin at a $2.92 Billion Valuation:',
  description: 'Harrison Street and Kenon agreed to buy a majority of Vicinity Energy from Antin at a $2.92 billion enterprise value.',
}

const answer = (id: number, o: Record<string, unknown>) => ({
  id, fund_categories: ['PE'], article_type: 'acquisition', source_type: 'trade_press', is_high_signal: true, signal_reason: 'deal',
  relevance_score: 0.8, entities: [], fund_size_usd_millions: null, original_currency: null, original_amount_millions: null,
  close_type: null, fund_name: null, fund_strategy: null, geography: [], person_name: null, person_title: null, city: null, fund_number: null, ...o,
})
const VICINITY_OK = { firm_name: 'Harrison Street', summary_ai: 'Harrison Street and Kenon agreed to buy control of Vicinity Energy from Antin at a $2.92B enterprise value.', fund_size_usd_millions: 2920 }
const ACUON_BORROWED = { firm_name: 'EQT', summary_ai: "EQT exits Korea's Acuon Group to a Hanwha Life-led consortium; deal valued at $2.92B enterprise value.", fund_size_usd_millions: 2920 }
const ACUON_ALONE = { firm_name: 'EQT', summary_ai: "EQT agreed to sell Korea's Acuon Group to a Hanwha Life-led consortium; terms not disclosed." }

/** A database that hands out the pending articles once and remembers every update. */
function pretendDb(pending: Article[]) {
  const updates: { values: Record<string, unknown>; ids: string[] }[] = []
  const table = () => {
    let values: Record<string, unknown> | null = null
    let selecting = ''
    const chain: Record<string, unknown> = {
      select: (cols: string) => { selecting = cols; return chain },
      update: (v: Record<string, unknown>) => { values = v; return chain },
      eq: (col: string, v: string) => { if (values && col === 'id') updates.push({ values, ids: [v] }); return chain },
      in: (_col: string, ids: string[]) => { if (values) updates.push({ values, ids }); return chain },
      is: () => chain, lt: () => chain, gte: () => chain, order: () => chain,
      single: async () => ({ data: { processing_attempts: 0 }, error: null }),
      limit: async () => ({ data: selecting.includes('title') ? pending : [], error: null }),
      then: (resolve: (v: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null }),
    }
    return chain
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { db: { from: table } as any, updates }
}

/** A Claude API that answers each call from a list, and remembers what it was sent. */
function pretendClaude(replies: unknown[][]) {
  const calls: { titles: string[] }[] = []
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body: string }) => {
    const sent = JSON.parse(init.body).messages[0].content as string
    const input = JSON.parse(sent.slice(sent.indexOf('['))) as { title: string }[]
    calls.push({ titles: input.map((a) => a.title) })
    const reply = replies.shift()
    if (!reply) throw new Error('the classifier was called more often than the test expected')
    return new Response(JSON.stringify({ content: [{ text: JSON.stringify(reply) }] }), { status: 200 })
  }))
  return calls
}

const stored = (updates: { values: Record<string, unknown>; ids: string[] }[], id: string) =>
  updates.filter((u) => u.ids.length === 1 && u.ids[0] === id && u.values.classification_status === 'complete').map((u) => u.values)

let logged: string[]
beforeEach(() => { logged = []; vi.spyOn(console, 'warn').mockImplementation((s: string) => { logged.push(s) }) })
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('a figure from a batch neighbour is never stored', () => {
  it('the article that borrowed one is classified again alone, and its money comes from that answer', async () => {
    const { db, updates } = pretendDb([VICINITY, ACUON])
    const calls = pretendClaude([
      [answer(0, VICINITY_OK), answer(1, ACUON_BORROWED)], // the batch: Acuon comes back with Vicinity's price
      [answer(0, { ...ACUON_ALONE, article_type: 'other', relevance_score: 0 })], // Acuon, alone (and, alone, misjudged)
    ])
    const result = await classifyPendingArticles(db, 'sk-test')

    expect(calls.map((c) => c.titles.length)).toEqual([2, 1])
    expect(calls[1].titles[0]).toBe(ACUON.title)
    expect(result.articlesProcessed).toBe(2)
    expect(result.articlesFailed).toBe(0)

    const [acuon] = stored(updates, 'acuon')
    expect(acuon.tldr).toBe(ACUON_ALONE.summary_ai)
    expect((acuon.extracted_data as { fund_size_usd_millions: number | null }).fund_size_usd_millions).toBeNull()
    // What kind of story it is, and how much it matters, is still the batch's judgement.
    expect([acuon.article_type, acuon.relevance_score]).toEqual(['acquisition', 0.8])
    // The deal the figure belongs to keeps it.
    const [vicinity] = stored(updates, 'vicinity')
    expect((vicinity.extracted_data as { fund_size_usd_millions: number }).fund_size_usd_millions).toBe(2920)
    expect(logged.some((l) => /Acuon.*stated size 2920, USD 2.92bn.*classified again alone/.test(l))).toBe(true)
  })

  it('an unreadable answer alone costs that one article a retry, and its batch nothing', async () => {
    const { db, updates } = pretendDb([VICINITY, ACUON])
    let call = 0
    vi.stubGlobal('fetch', vi.fn(async () => {
      call++
      const text = call === 1 ? JSON.stringify([answer(0, VICINITY_OK), answer(1, ACUON_BORROWED)]) : 'I cannot classify this article.'
      return new Response(JSON.stringify({ content: [{ text }] }), { status: 200 })
    }))
    const result = await classifyPendingArticles(db, 'sk-test')
    expect(stored(updates, 'vicinity')).toHaveLength(1)
    expect(stored(updates, 'acuon')).toEqual([])
    expect([result.articlesProcessed, result.articlesFailed, result.apiOutage]).toEqual([1, 1, false])
  })

  it('the API going down while an article is asked about alone stops the run, as for any batch', async () => {
    const { db } = pretendDb([VICINITY, ACUON])
    let call = 0
    vi.stubGlobal('fetch', vi.fn(async () => {
      call++
      if (call === 1) return new Response(JSON.stringify({ content: [{ text: JSON.stringify([answer(0, ACUON_BORROWED), answer(1, VICINITY_OK)].map((a, i) => ({ ...a, id: 1 - i }))) }] }), { status: 200 })
      return new Response(JSON.stringify({ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }), { status: 529 })
    }))
    const result = await classifyPendingArticles(db, 'sk-test')
    expect(result.apiOutage).toBe(true)
    expect(result.articlesFailed).toBe(0) // an outage never burns an attempt
  })

  it('a batch with nothing foreign in it costs no extra call', async () => {
    const { db, updates } = pretendDb([VICINITY, ACUON])
    const calls = pretendClaude([[answer(0, VICINITY_OK), answer(1, ACUON_ALONE)]])
    await classifyPendingArticles(db, 'sk-test')
    expect(calls).toHaveLength(1)
    expect(stored(updates, 'acuon')[0].tldr).toBe(ACUON_ALONE.summary_ai)
    expect(logged).toEqual([])
  })

  it('a size the article does not give is dropped even from the answer given alone', async () => {
    const { db, updates } = pretendDb([VICINITY, ACUON])
    pretendClaude([
      [answer(0, VICINITY_OK), answer(1, ACUON_BORROWED)],
      [answer(0, { ...ACUON_ALONE, fund_size_usd_millions: 322 })], // a guess: the article says terms were not disclosed
    ])
    await classifyPendingArticles(db, 'sk-test')
    const [acuon] = stored(updates, 'acuon')
    expect((acuon.extracted_data as { fund_size_usd_millions: number | null }).fund_size_usd_millions).toBeNull()
    expect(acuon.tldr).toBe(ACUON_ALONE.summary_ai)
  })

  it('no answer alone: the article is not stored, and comes round again', async () => {
    const { db, updates } = pretendDb([VICINITY, ACUON])
    pretendClaude([
      [answer(0, VICINITY_OK), answer(1, ACUON_BORROWED)],
      [], // alone, the model returned nothing for it
    ])
    const result = await classifyPendingArticles(db, 'sk-test')
    expect(stored(updates, 'acuon')).toEqual([])
    expect(result.articlesProcessed).toBe(1)
    expect(result.articlesFailed).toBe(1)
    // …and it is handed back to the queue with one attempt marked.
    expect(updates.some((u) => u.ids[0] === 'acuon' && u.values.classification_status === 'pending' && u.values.processing_attempts === 1)).toBe(true)
  })
})
