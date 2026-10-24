/**
 * Extraction (2026-10-25): one call to Claude Haiku 5.5 per bio page (or per
 * chunk of a team page), structured output in a fixed schema, effort low.
 * The model reads; the validators (./validate.ts) decide. Bio prose, photos,
 * emails and phone numbers are never asked for and never kept.
 *
 * Raw HTTP like the rest of the site's Claude calls (lib/news/classify-articles.ts).
 * Spend is tracked per call and a run stops before the call that would pass its
 * budget (default $5, Danny's cap for a refresh).
 */
import { CATEGORIES, PRACTICES, type CategoryId } from '../taxonomy'
import type { ExtractedPerson } from './types'

export const EXTRACT_MODEL = 'claude-haiku-5-5'
/** Claude Haiku 5.5, $/token (prompts under 100K tokens). Every input token is priced at the full rate: an upper bound. */
export const PRICE_IN = 0.1 / 1e6
export const PRICE_OUT = 0.5 / 1e6

export class BudgetExceeded extends Error {}

export class Budget {
  input = 0
  output = 0
  calls = 0
  constructor(readonly limitUsd: number) {}
  get usd() {
    return this.input * PRICE_IN + this.output * PRICE_OUT
  }
  /** Throw before a call whose worst case would pass the limit. */
  reserve(inputChars: number, maxTokens: number) {
    const worst = this.usd + (inputChars / 3) * PRICE_IN + maxTokens * PRICE_OUT
    if (worst > this.limitUsd) throw new BudgetExceeded(`budget $${this.limitUsd} reached ($${this.usd.toFixed(4)} spent)`)
  }
  add(u: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number }) {
    this.input += (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0)
    this.output += u.output_tokens ?? 0
    this.calls++
  }
  toJSON() {
    return { model: EXTRACT_MODEL, input_tokens: this.input, output_tokens: this.output, calls: this.calls, usd: +this.usd.toFixed(4), limit_usd: this.limitUsd, price_basis: '$0.10/M in, $0.50/M out (Haiku 5.5 list; all input at full rate)' }
  }
}

const SCOPE: Record<CategoryId, string> = {
  fund_lawyer:
    'a lawyer whose page clearly shows an investment funds / private funds practice (a funds practice-group membership counts, or fund formation, fund finance, funds regulatory or secondaries work described). A corporate/M&A lawyer who only acts for private equity firms on portfolio deals is NOT in scope.',
  fund_auditor:
    "an audit / assurance professional whose audit work serves investment funds or asset managers (PE, hedge, venture, real estate, private credit/BDC funds, fund of funds, investment advisers). NOT in scope: fund administration, outsourced fund accounting or CFO services, outsourced investor tax reporting, compliance consulting, wealth management, or anyone working for a GP/LP rather than the firm.",
  fund_tax_advisor:
    "a tax professional whose tax work serves investment funds or fund managers (fund tax, partnership tax for funds, carried interest, fund structuring). NOT in scope: fund administration, outsourced investor tax reporting sold as a managed service (K-1 factories), outsourced CFO, wealth management, or anyone at a GP/LP.",
  placement_agent:
    "a professional (managing director, partner, principal, director, vice president, associate, analyst, senior advisor, head of) in the firm's private-fund placement / fundraising / private capital advisory business (raising capital for private funds, GP-led or LP secondaries advisory). NOT in scope: operations, finance, HR, marketing, IT, compliance, legal, coordinators, assistants, and bankers in the firm's other businesses (M&A, restructuring, capital markets, wealth management, sector coverage). Judge the CURRENT role only: founders, CEOs and heads who lead the placement / capital advisory business are in scope, and an earlier career in M&A does not matter.",
  fund_finance_banker:
    'a professional who works on fund finance lending: subscription / capital call lines, NAV loans, GP / management-company financing, hybrid facilities, fund banking relationship management, or (for a specialist NAV/GP lender) its investment team. NOT in scope: operations, finance, HR, marketing, IT, compliance, legal, assistants, investor relations, and anyone in fund administration, fund services, custody or depositary roles.',
}

export function systemPrompt(categories: CategoryId[]): string {
  const trades = categories.map((c) => `- ${c}: ${SCOPE[c]}`).join('\n')
  const practices = PRACTICES.filter((p) => p.id !== 'other')
    .map((p) => `${p.id} (${p.label.toLowerCase()})`)
    .join(', ')
  return `You extract structured facts about people from a page on a professional firm's own website: an individual bio page, or a team page listing many people. Output only facts stated on the page. Never guess, infer or fill a gap from general knowledge.

Return one entry per distinct person who has their own entry on the page (a name with a title). On an individual bio page return just that person, never other names it mentions. A page that is not about people (a 404, a service page, an article, a search page) returns an empty list.

Fields:
- full_name: as displayed, without honorifics or post-nominals (drop "CPA", "CFA", "Esq.", "Ph.D."). Keep middle names or initials and suffixes (Jr., III, IV) exactly as the heading shows them.
- title: the professional title as shown ("Partner", "Managing Director", "Principal", "Of Counsel"). Empty string if none is shown.
- offices: the person's own office or base city as stated (an office field, "based in New York", the office label beside their name): city, US two-letter state, country "US". A non-US office: state "" and the country name. A coverage region ("covers North American investors", "Americas", "EMEA") is NOT an office. The firm's office list in a footer is NOT this person's office. Empty if no city is stated for this person.
- office_evidence: at most 10 words of the page that state that office ("Office: New York", "based in our Boston office", "New York" under the name). "" when no office is stated.
- in_scope: true only for ${categories.length === 1 ? SCOPE[categories[0]] : 'one of these trades (and pick it in `trade`):\n' + trades}
- trade: ${categories.length === 1 ? `"${categories[0]}" when in_scope, else "none"` : `the trade above that fits (${categories.join(', ')}), or "none"`}.
- scope_evidence: at most 12 words, your own words, saying why in or out of scope. Not a quote.
- practice_areas: ONLY practices the page states for this person (or their named group): ${practices}. For a placement agent, primary fund placement is not "fund_formation" (that is legal formation work); tag the fund types raised instead.
- practice_evidence: at most 12 words naming where the page says it ("practice list", "group: Fund Finance"), or "" if no tags.
- client_focus: ONLY when the page says so for this person or their group: emerging_managers, first_time_funds, mid_market_sponsors, large_sponsors, family_offices. Empty otherwise.
- represents: ONLY when the page states the side this person acts for: sponsors_gps or investors_lps. Empty otherwise.
- bar_admissions: for a lawyer, the bars listed (e.g. "New York"); empty for anyone else.
- education: school, degree ("B.A.", "J.D.", "M.B.A."), year if stated else null. Only this person's degrees actually listed.
Never output contact details, photos or bio prose.`
}

const str = { type: 'string' } as const
const arr = (items: object) => ({ type: 'array', items })

export function schema(categories: CategoryId[]) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['people'],
    properties: {
      people: arr({
        type: 'object',
        additionalProperties: false,
        required: ['full_name', 'title', 'offices', 'office_evidence', 'in_scope', 'trade', 'scope_evidence', 'practice_areas', 'practice_evidence', 'client_focus', 'represents', 'bar_admissions', 'education'],
        properties: {
          full_name: str,
          title: str,
          offices: arr({ type: 'object', additionalProperties: false, required: ['city', 'state', 'country'], properties: { city: str, state: str, country: str } }),
          office_evidence: str,
          in_scope: { type: 'boolean' },
          trade: { type: 'string', enum: [...categories, 'none'] },
          scope_evidence: str,
          practice_areas: arr({ type: 'string', enum: PRACTICES.map((p) => p.id) }),
          practice_evidence: str,
          client_focus: arr({ type: 'string', enum: ['emerging_managers', 'first_time_funds', 'mid_market_sponsors', 'large_sponsors', 'family_offices'] }),
          represents: arr({ type: 'string', enum: ['sponsors_gps', 'investors_lps'] }),
          bar_admissions: arr(str),
          education: arr({ type: 'object', additionalProperties: false, required: ['school', 'degree', 'year'], properties: { school: str, degree: str, year: { type: ['integer', 'null'] } } }),
        },
      }),
    },
  }
}

export type ExtractResult = { people: ExtractedPerson[] } | { error: string }

const MAX_TOKENS = 12000

/** One page (or chunk) through the model. Retries rate limits and server errors; never retries a refusal. */
export async function extractPeople(
  args: { apiKey: string; categories: CategoryId[]; url: string; text: string; firmName: string; budget: Budget; purePlay?: boolean },
  fetchImpl: typeof fetch = fetch,
): Promise<ExtractResult> {
  const { apiKey, categories, url, text, firmName, budget, purePlay } = args
  const firmLine = purePlay
    ? `Firm: ${firmName}. The firm's whole business is ${categories.map((c) => CATEGORIES[c].singular.toLowerCase()).join(' / ')} work: every client-facing professional here is in scope unless the page shows a back-office or support role.`
    : `Firm: ${firmName}`
  for (const c of categories) if (!CATEGORIES[c]) return { error: `unknown category ${c}` }
  budget.reserve(text.length + 6000, MAX_TOKENS)
  for (let attempt = 0; attempt < 4; attempt++) {
    let r: Response
    try {
      r = await fetchImpl('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: EXTRACT_MODEL,
          max_tokens: MAX_TOKENS,
          thinking: { type: 'disabled' },
          output_config: { effort: 'low', format: { type: 'json_schema', schema: schema(categories) } },
          system: [{ type: 'text', text: systemPrompt(categories), cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: `${firmLine}\nPage URL: ${url}\n\nPage text:\n${text}` }],
        }),
        signal: AbortSignal.timeout(120000),
      })
    } catch (e) {
      await new Promise((res) => setTimeout(res, 4000 * (attempt + 1)))
      if (attempt === 3) return { error: `unreachable: ${e instanceof Error ? e.message : String(e)}` }
      continue
    }
    if (r.status === 429 || r.status >= 500) {
      await new Promise((res) => setTimeout(res, 5000 * (attempt + 1)))
      continue
    }
    const j = (await r.json().catch(() => null)) as { usage?: Record<string, number>; stop_reason?: string; content?: { type: string; text?: string }[]; error?: { message?: string } } | null
    if (!r.ok || !j) return { error: `api ${r.status}: ${j?.error?.message?.slice(0, 200) ?? 'no body'}` }
    if (j.usage) budget.add(j.usage)
    if (j.stop_reason === 'refusal') return { error: 'refusal' }
    if (j.stop_reason === 'max_tokens') return { error: 'max_tokens' }
    const t = j.content?.find((c) => c.type === 'text')?.text
    try {
      const parsed = JSON.parse(t ?? '') as { people?: ExtractedPerson[] }
      return { people: Array.isArray(parsed.people) ? parsed.people : [] }
    } catch {
      return { error: 'unparseable output' }
    }
  }
  return { error: 'retries exhausted' }
}
