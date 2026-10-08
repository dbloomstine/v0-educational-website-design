import { describe, it, expect } from 'vitest'
import {
  buildWriterInput, callWriter, checkAmounts, checkCopying, checkFormat, checkLength, checkNames, checkProcessLanguage,
  checkQuotes, checkSummary, isThin, judgeAnswer, pageSummary, parseWriterOutput, pickLongSummary, prepareRows,
  realTextLength, StorySummaryApiError, summaryParagraphs, ROW_CHARS, STORY_CHARS, SUMMARY_MAX_TOKENS, SUMMARY_MODEL,
  SYSTEM_PROMPT, type SourceRow,
} from '../story-summary'

// The stories below are from the 2026-10-08 trial of the writer (20 real stories, each
// summarised by claude-haiku-5-5 and claude-sonnet-5-5). Summaries quoted in a test are
// what a model wrote; the source text is what it was given.

const row = (o: Partial<SourceRow> & { title: string }): SourceRow => ({
  id: o.id ?? `r${Math.random().toString(36).slice(2, 8)}`,
  description: null, full_text: null, source_name: 'PE Hub', published_date: '2026-10-06', ...o,
})

// ─── Rows from the trial ────────────────────────────────────────────────────

/** Option Care Health: PE Hub's teaser and HedgeCo's full description. */
const OPTION_CARE = [
  row({ source_name: 'PE Hub', title: 'CD&R and McKesson ink $5.8bn take-private deal for Option Care Health', description: 'Option Care Health provides home and alternate site infusion services in all 50 US states, with more than 8,000 staff including over 5,000 clinicians. The post CD&R and McKesson ink $5.8bn take-private deal for Option Care Health appeared first on PE Hub.' }),
  row({ source_name: 'HedgeCo Insights', published_date: '2026-10-07', title: 'CD&R and McKesson Agreed to Acquire Option Care Health for About $5.8 Billion:', description: 'HedgeCo.Net — Clayton Dubilier & Rice and McKesson Corporation have signed a definitive agreement to take Option Care Health private for $32.05 per share in cash, a total enterprise value of approximately $5.8 billion, the companies announced on Tuesday. Option Care Health, the largest independent U.S. provider of home and alternate-site infusion services, will remain a separate company led by its existing management team after the deal closes. The structure is a sponsor-strategic partnership rather than a conventional buyout. CD&R will hold a majority interest of about 51%, while McKesson will invest roughly $1.4 billion for a minority stake of about 49% and account for it under the equity method. The agreement also sets out a framework under which McKesson could later acquire CD&R’s interest, subject to specified conditions and regulatory approvals. The price represents a premium of about 37% to Option Care Health’s closing share price on the last full trading day before the announcement. The transaction requires approval by the company’s stockholders and regulators and is expected to close in the first half of calendar 2027. In light of the deal, the company withdrew its previously issued financial guidance and said it will release third-quarter results on November 4 without a conference call.' }),
]
const OPTION_CARE_SUMMARY = 'Clayton Dubilier & Rice and McKesson have agreed to take Option Care Health private at $32.05 per share in cash, an enterprise value of about $5.8 billion. The price is roughly a 37% premium to the last full trading day’s close before the announcement. CD&R will own about 51%. McKesson will invest around $1.4 billion for about 49% and book it under the equity method, with a framework allowing it to buy CD&R’s stake later, subject to conditions and regulatory approvals.\n\nStockholder and regulatory approval is needed, and closing is expected in the first half of calendar 2027. Option Care Health’s management team stays in place, and the company withdrew its financial guidance.'

/** A headline and a teaser, from outlets that repeat each other: the third of stories that stay short. */
const COLLECTIVE = [
  row({ source_name: 'Buyouts', title: 'LP-backed Collective Global eyes $1bn for sophomore GP stakes fund', description: 'LP-backed Collective Global eyes $1bn for sophomore GP stakes fund Buyouts' }),
  row({ source_name: 'Buyouts Insider', title: 'LP-backed Collective Global eyes $1bn for sophomore GP stakes fund', description: 'A key objective of the firm’s GP staking is to help LPs secure access to leading venture and growth managers.' }),
]
const COOK_COUNTY = [
  row({ source_name: 'Buyouts Insider', title: 'Cook County pension to tick up private equity allocation', description: 'The increase to the private equity asset class is a rare uptick for a steady and reliable part of the pension’s portfolio.' }),
]
const IFC = [
  row({ source_name: 'New Private Markets', title: 'In brief: IFC readies commitment to Just Climate LatAm fund', description: 'Just Climate unveiled its growth equity strategy, which will primarily focus on Brazil, in May 2025.' }),
]
const CONVERSANT = [
  row({ source_name: 'AltAssets Private Equity News', published_date: '2026-10-07', title: 'Conversant beats debut real estate fund target by 40% with $705m close', description: 'Conversant beats debut real estate fund target by 40% with $705m close AltAssets Private Equity News' }),
  row({ source_name: 'Law360 Asset Management', published_date: '2026-10-07', title: 'Fried Frank-Led Conversant Wraps $845M Real Estate Fund', description: 'Real estate-focused investment firm Conversant Capital LLC, advised by Fried Frank Shriver Harris & Jacobson LLP, revealed Wednesday it closed its inaugural private investment fund with $845 million in tow.', full_text: 'Try our Advanced Search for more refined results\n\nA Law360 subscription puts you at the center of fast-moving legal issues, trends and developments so you can act with speed and confidence. Over 200 articles are published daily across more than 60 topics, industries, practice areas and jurisdictions.\n\nAlready a subscriber? Click here to login' }),
]

// ─── Thin stories ───────────────────────────────────────────────────────────

describe('isThin: a headline and a teaser stay short', () => {
  it('two outlets, one headline, one teaser sentence', () => {
    expect(isThin(prepareRows(COLLECTIVE))).toBe(true)
    expect(realTextLength(prepareRows(COLLECTIVE))).toBeLessThan(150)
  })
  it('a single teaser', () => {
    expect(isThin(prepareRows(COOK_COUNTY))).toBe(true)
    expect(isThin(prepareRows(IFC))).toBe(true)
  })
  it('headline-only mirrors have no text at all', () => {
    const rows = prepareRows([
      row({ source_name: 'Alternatives Watch', title: 'Canyon Partners Real Estate makes senior origination hire', description: 'Canyon Partners Real Estate makes senior origination hire Alternatives Watch' }),
      row({ source_name: 'Simply Wall Street', title: 'KKR (KKR) Acquires Fund Administrator To Add More Recurring Fee Income', description: null }),
    ])
    expect(realTextLength(rows)).toBe(0)
    expect(isThin(rows)).toBe(true)
  })
  it('a feed’s own tag line is not text', () => {
    const rows = prepareRows([row({ title: 'Vestar Capital-backed Roland Foods acquires Savor Brands', description: 'The post Vestar Capital-backed Roland Foods acquires Savor Brands appeared first on Agri Investor.' })])
    expect(realTextLength(rows)).toBe(0)
  })
  it('a story with a real description is not thin', () => {
    expect(isThin(prepareRows(OPTION_CARE))).toBe(false)
  })
  it('a paywall notice stored in place of the article is not text', () => {
    const rows = prepareRows([CONVERSANT[1]])
    expect(rows[0].fullText).toBe('')
    expect(realTextLength(rows)).toBeLessThan(300) // the one description sentence
  })
  it('the same teaser from five outlets counts once', () => {
    const teaser = 'Gen II Fund Services provides fund administration to more than 275 private markets managers representing over $2 trillion in assets.'
    const rows = prepareRows(['Reuters', 'Axios', 'Quartz', 'Dealroom', 'TradingView'].map((s) => row({ source_name: s, title: 'KKR buys Gen II', description: teaser })))
    expect(realTextLength(rows)).toBe(teaser.length)
  })
  it('the threshold is about 300 characters of real text', () => {
    const two = 'The fund will invest in middle-market technology companies across North America. It has made two investments since its first close in March.'
    const four = `${two} Commitments came from institutional investors in Europe, the Middle East and Asia. The manager said it expects to complete the remaining investments over the next three years.`
    expect(two.length).toBeLessThan(300)
    expect(four.length).toBeGreaterThan(300)
    expect(isThin(prepareRows([row({ title: 'Some fund closes', description: two })]))).toBe(true)
    expect(isThin(prepareRows([row({ title: 'Some fund closes', description: four })]))).toBe(false)
  })
})

// ─── What the model is shown ────────────────────────────────────────────────

describe('buildWriterInput', () => {
  it('lists outlets, titles, descriptions and no machine-extracted fields', () => {
    const input = buildWriterInput(prepareRows(OPTION_CARE))
    expect(input.user).toContain('OUTLETS (2): ')
    expect(input.user).toContain('HedgeCo Insights')
    expect(input.user).toContain('Title: CD&R and McKesson ink $5.8bn take-private deal for Option Care Health')
    expect(input.user).toContain('$32.05 per share')
    expect(input.user).not.toMatch(/EXTRACTED|firm_name|fund_size|FROM OUR OWN RECORDS/)
    expect(input.user).not.toMatch(/paywalled|teaser/i)
  })
  it('shows the richest report first and says when a report adds nothing', () => {
    const input = buildWriterInput(prepareRows(COLLECTIVE))
    expect(input.user.indexOf('Buyouts Insider')).toBeLessThan(input.user.indexOf('--- Report: Buyouts '))
    expect(input.user).toContain('Feed description: (nothing beyond the headline)')
  })
  it('names a sentence once however many outlets carry it', () => {
    const teaser = 'Gen II Fund Services provides fund administration to more than 275 private markets managers representing over $2 trillion in assets.'
    const input = buildWriterInput(prepareRows(['Reuters', 'Axios', 'Quartz'].map((s) => row({ source_name: s, title: 'KKR buys Gen II', description: teaser }))))
    expect(input.user.split('more than 275 private markets managers')).toHaveLength(2)
  })
  it('caps one report at 6,000 characters and the story at 15,000', () => {
    const long = Array.from({ length: 400 }, (_, i) => `Sentence number ${i} says that the manager closed fund ${i} with commitments from investors.`).join(' ')
    const one = prepareRows([row({ title: 'A fund closes', full_text: long })])
    expect(one[0].fullText.length).toBeLessThanOrEqual(ROW_CHARS)

    const many = prepareRows(Array.from({ length: 8 }, (_, k) => row({ source_name: `Outlet ${k}`, title: `Fund ${k} closes`, full_text: long.replace(/number (\d+)/g, `number $1 of report ${k}`) })))
    const input = buildWriterInput(many)
    const text = input.rows.reduce((n, r) => n + r.body.length, 0)
    expect(input.user.length).toBeLessThan(STORY_CHARS + 2500)
    expect(text).toBeGreaterThan(STORY_CHARS) // prepared rows are capped per row only…
    expect(input.source.length).toBeLessThan(STORY_CHARS + 2500) // …what is shown, and checked against, is capped per story
  })
})

// ─── (a) numbers and sums ───────────────────────────────────────────────────

describe('checkAmounts', () => {
  const source = buildWriterInput(prepareRows(OPTION_CARE)).source
  it('passes the Option Care summary: every sum and percentage is in the source', () => {
    expect(checkAmounts(OPTION_CARE_SUMMARY, source)).toEqual([])
  })
  it('allows a sum written another way', () => {
    expect(checkAmounts('The enterprise value is about $5.8bn.', source)).toEqual([])
    expect(checkAmounts('McKesson will invest 1.4 billion dollars.', source)).toEqual([])
  })
  it('fails a sum the source never gives', () => {
    expect(checkAmounts('CD&R is committing about $2.1 billion of equity.', source)).toEqual(['sum $2.1 billion is not in the source'])
  })
  it('fails a number the source never gives', () => {
    expect(checkAmounts('Option Care Health employs more than 9,000 people.', source)).toEqual(['number 9,000 is not in the source'])
    expect(checkAmounts('CD&R will own about 61%.', source)).toEqual(['number 61 is not in the source'])
  })
  it('reads dates and years against the dates on the reports', () => {
    expect(checkAmounts('The reports are dated 6 and 7 October 2026.', source)).toEqual([])
    expect(checkAmounts('Closing is expected in 2028.', source)).toEqual(['number 2028 is not in the source'])
  })
  it('accepts a source figure rounded to the summary’s precision', () => {
    expect(checkAmounts('The fund beat its target by 40%.', 'It beat the target by 40.2% with the close.')).toEqual([])
    expect(checkAmounts('The fund beat its target by 41%.', 'It beat the target by 40.2% with the close.')).toEqual(['number 41 is not in the source'])
  })
  it('catches the figure that is another outlet’s (Conversant: $705m and $845m)', () => {
    const conv = buildWriterInput(prepareRows(CONVERSANT)).source
    expect(checkAmounts('Conversant closed at $705 million, Law360 says $845 million.', conv)).toEqual([])
    expect(checkAmounts('Conversant closed at $705 million, Law360 says $1.2 billion.', conv)).toEqual(['sum $1.2 billion is not in the source'])
  })
})

// ─── (b) names ──────────────────────────────────────────────────────────────

describe('checkNames', () => {
  const option = buildWriterInput(prepareRows(OPTION_CARE)).source
  it('passes the Option Care summary', () => {
    expect(checkNames(OPTION_CARE_SUMMARY, option)).toEqual([])
  })
  it('catches an acronym the model wrote out from memory (IFC)', () => {
    const source = buildWriterInput(prepareRows(IFC)).source
    expect(checkNames('IFC is preparing a commitment to Just Climate LatAm, a growth equity fund focused on Brazil.', source)).toEqual([])
    expect(checkNames('The International Finance Corporation is preparing a commitment to Just Climate LatAm.', source)).toEqual(['name "International Finance Corporation" is not in the source'])
  })
  it('catches a fund name the model took from the extracted fields (Conversant “Fund I”)', () => {
    const source = buildWriterInput(prepareRows(CONVERSANT)).source
    expect(checkNames('Conversant Capital LLC has closed its inaugural private investment fund.', source)).toEqual([])
    expect(checkNames('Conversant Capital LLC has closed its inaugural fund, Fund I, with $845 million.', source)).toEqual(['name "Fund I" is not in the source'])
  })
  it('catches an adviser the headline only hints at (Simpson Thacher-Led KKR)', () => {
    const source = 'Law360. Title: Simpson Thacher-Led KKR Buys Fund Administrator For $5B. KKR will invest through its Core Private Equity strategy.'
    expect(checkNames('KKR will invest through its Core Private Equity strategy.', source)).toEqual([])
    expect(checkNames('Simpson Thacher & Bartlett advised KKR, according to Law360.', source)).toEqual(['name "Simpson Thacher & Bartlett" is not in the source'])
  })
  it('matches names across case, punctuation, & and possessives', () => {
    const source = 'Fried Frank Shriver Harris & Jacobson LLP advised. The Bank of England said Adam Jacobs-Dean of AIMA, the hedge fund body, is in London.'
    expect(checkNames('Fried Frank Shriver Harris and Jacobson LLP advised on the close. The Bank of England’s letter came from AIMA’s Adam Jacobs-Dean.', source)).toEqual([])
  })
  it('sets a title aside from the name after it', () => {
    const source = 'managing partner Chip Schorr said the fund exceeded its target. Partner Mike Pompeo spoke too.'
    expect(checkNames('Managing Partner Chip Schorr said the fund beat its target.', source)).toEqual([])
    expect(checkNames('Managing Partner Chip Shaw said the fund beat its target.', source)).toEqual(['name "Chip Shaw" is not in the source'])
  })
  it('does not take a sentence’s first word, a month or a day for a name', () => {
    expect(checkNames('Completion is expected on Tuesday 6 October. Both outlets agree.', 'The deal should complete on Tuesday 6 October. Outlets agree.')).toEqual([])
  })
  it('lets a lone invented person through only if the name appears (Europe / European)', () => {
    expect(checkNames('The European arm hired Sloan Sutta.', 'The firm’s Europe arm hired Sloan Sutta.')).toEqual([])
    expect(checkNames('The European arm hired Sloan Brown.', 'The firm’s Europe arm hired Sloan Sutta.')).toEqual(['name "Sloan Brown" is not in the source'])
  })
})

// ─── (c) process language ───────────────────────────────────────────────────

describe('checkProcessLanguage', () => {
  it('catches the remarks the trial’s model made', () => {
    expect(checkProcessLanguage('The outlet’s teaser calls the increase a rare uptick. The material does not give the new target.').length).toBe(2)
    expect(checkProcessLanguage('The report is available only as a headline and teaser, so no commitment amount or timing is given.').length).toBeGreaterThan(0)
    expect(checkProcessLanguage('Only the headline and a short teaser are available, so no further detail on the plan is known.').length).toBeGreaterThan(0)
    expect(checkProcessLanguage('The full article is paywalled.').length).toBe(2)
    expect(checkProcessLanguage('According to the report’s feed description, the fund is looking for up to $402 million.').length).toBeGreaterThan(0)
    expect(checkProcessLanguage('Neither report’s available text gives a fundraising timeline.').length).toBeGreaterThan(0)
  })
  it('leaves news alone, including the words that look similar', () => {
    expect(checkProcessLanguage(OPTION_CARE_SUMMARY)).toEqual([])
    expect(checkProcessLanguage('The deal is subject to a material adverse change clause. Cargill’s animal feed business was sold. The fund did not disclose the size.')).toEqual([])
    expect(checkProcessLanguage('The report is available on request from the regulator’s website.')).toEqual(['remark about the material: "report is available"'])
  })
})

// ─── (d) length ─────────────────────────────────────────────────────────────

describe('checkLength', () => {
  const n = (k: number) => Array.from({ length: k }, () => 'word').join(' ')
  it('25 to 130 words', () => {
    expect(checkLength(n(25))).toEqual([])
    expect(checkLength(n(130))).toEqual([])
    expect(checkLength(n(24))).toEqual(['24 words (allowed 25 to 130)'])
    expect(checkLength(n(131))).toEqual(['131 words (allowed 25 to 130)'])
  })
})

// ─── (e) copying ────────────────────────────────────────────────────────────

describe('checkCopying', () => {
  const cook = [{ title: COOK_COUNTY[0].title, body: COOK_COUNTY[0].description ?? '' }]
  it('fails the sentence the trial’s model lifted from a teaser', () => {
    const copied = 'The outlet calls the increase a rare uptick for what it describes as a steady and reliable part of the pension’s portfolio.'
    expect(checkCopying(copied, cook)[0]).toMatch(/copies 9 words from a source: "a steady and reliable part of the pensions portfolio"/)
  })
  it('passes the same facts in other words', () => {
    expect(checkCopying('Cook County’s pension plans to give private equity a larger share, a rare increase for the plan.', cook)).toEqual([])
  })
  it('fails nine words in a row, not eight', () => {
    const body = 'one two three four five six seven eight nine ten eleven'
    expect(checkCopying('alpha two three four five six seven eight nine ten omega', [{ title: 'x', body }])).toHaveLength(1)
    expect(checkCopying('alpha two three four five six seven eight omega nine ten', [{ title: 'x', body }])).toEqual([])
  })
  it('fails a long run taken from a headline, names and all', () => {
    const title = 'Clayton Dubilier & Rice and McKesson ink take-private deal for Option Care Health'
    expect(checkCopying('Clayton Dubilier & Rice and McKesson ink take-private deal for Option Care Health, a provider.', [{ title, body: '' }])).toHaveLength(1)
  })
  it('does not count a long name as nine words', () => {
    const body = 'Hamilton Lane Private Assets Fund IV closed at $2 billion on Monday.'
    expect(checkCopying('Hamilton Lane Private Assets Fund IV closed at $2 billion, with commitments from pensions.', [{ title: 'x', body }])).toEqual([])
  })
  it('does fail the prose around names when it follows the source', () => {
    const body = 'KKR has agreed to acquire Gen II Fund Services, a private capital fund administrator, from Hg and General Atlantic.'
    expect(checkCopying('KKR agreed to acquire Gen II Fund Services, a private capital fund administrator, in a deal.', [{ title: 'x', body }]).length).toBe(1)
  })
  it('compares with one source row at a time', () => {
    const rows = [{ title: 'a', body: 'one two three four five' }, { title: 'b', body: 'six seven eight nine ten' }]
    expect(checkCopying('one two three four five six seven eight nine ten', rows)).toEqual([])
  })
})

// ─── (f) quotation marks, and prose ─────────────────────────────────────────

describe('checkQuotes', () => {
  it('fails straight and curly double quotes, and curly single quotes used to quote', () => {
    expect(checkQuotes('AIMA warned of "new vulnerabilities" in the market.')).toHaveLength(1)
    expect(checkQuotes('AIMA warned of “new vulnerabilities” in the market.')).toHaveLength(1)
    expect(checkQuotes('AIMA warned of ‘new vulnerabilities’ in the market.')).toHaveLength(1)
    expect(checkQuotes("AIMA warned of 'new vulnerabilities' in the market.")).toHaveLength(1)
  })
  it('passes an apostrophe', () => {
    expect(checkQuotes('Canyon’s head of originations said the firm’s 2020s plan isn\'t changing.')).toEqual([])
  })
})

describe('checkFormat', () => {
  it('fails markdown and JSON, passes two paragraphs', () => {
    expect(checkFormat('- KKR buys Gen II\n- for $5.1bn')).toHaveLength(1)
    expect(checkFormat('**KKR** buys Gen II')).toHaveLength(1)
    expect(checkFormat('{"summary": "x"}')).toHaveLength(1)
    expect(checkFormat(OPTION_CARE_SUMMARY)).toEqual([])
  })
})

// ─── All of them, on the trial’s answers ────────────────────────────────────

describe('checkSummary on real answers', () => {
  const inputFor = (rows: SourceRow[]) => buildWriterInput(prepareRows(rows))

  it('passes the Option Care summary', () => {
    expect(checkSummary(OPTION_CARE_SUMMARY, inputFor(OPTION_CARE))).toEqual([])
  })

  it('discards the Cook County summary: a teaser remark, a copied sentence, and “the material”', () => {
    const answer = 'Buyouts Insider reports that the Cook County pension plans to raise its allocation to private equity. The outlet’s teaser calls the increase a rare uptick for what it describes as a steady and reliable part of the pension’s portfolio. The material does not give the new target, the previous level, the timing or who approved the change.'
    const checks = checkSummary(answer, inputFor(COOK_COUNTY)).map((f) => f.check)
    expect(checks).toContain('process')
    expect(checks).toContain('copying')
  })

  it('discards the Conversant summary that wrote “Fund I” and “the material”', () => {
    const answer = 'Real estate-focused investment firm Conversant Capital LLC has closed its inaugural private investment fund, Fund I, according to a Law360 report. Law360 puts the final close at $845 million, and Fried Frank Shriver Harris & Jacobson LLP advised the firm. AltAssets Private Equity News reported a $705 million close for the same debut real estate fund. The two outlets’ figures differ, and the material does not explain the gap.'
    const checks = checkSummary(answer, inputFor(CONVERSANT)).map((f) => f.check)
    expect(checks).toEqual(expect.arrayContaining(['names', 'process']))
  })

  it('discards the IFC summary that expanded the acronym', () => {
    const answer = 'The International Finance Corporation is preparing a commitment to Just Climate LatAm, a growth equity fund managed by Just Climate, according to a New Private Markets brief. Just Climate unveiled its growth equity strategy in May 2025, with a primary focus on Brazil.'
    const failures = checkSummary(answer, inputFor(IFC))
    expect(failures.map((f) => f.check)).toEqual(['names'])
    expect(failures[0].detail).toContain('International Finance Corporation')
  })
})

// ─── The answer ─────────────────────────────────────────────────────────────

describe('parseWriterOutput and judgeAnswer', () => {
  const input = buildWriterInput(prepareRows(OPTION_CARE))
  const json = (summary: string, unsupported: string[] = []) => JSON.stringify({ summary, unsupported })

  it('reads the object, with or without a fence', () => {
    expect(parseWriterOutput(json('A summary.', ['x']))).toEqual({ summary: 'A summary.', unsupported: ['x'] })
    expect(parseWriterOutput('```json\n' + json('A summary.') + '\n```')?.summary).toBe('A summary.')
    expect(parseWriterOutput('not json')).toBeNull()
    expect(parseWriterOutput(json(''))).toBeNull()
  })
  it('keeps a whole summary from an answer cut off in the unsupported list', () => {
    const cut = `{"summary": "KKR agreed to buy Gen II.", "unsupported": ["size of the equity cheque", "adviser to Hg and Gener`
    expect(parseWriterOutput(cut)?.summary).toBe('KKR agreed to buy Gen II.')
  })
  it('drops an answer cut off inside the summary', () => {
    const j = judgeAnswer({ text: '{"summary": "KKR agreed to buy Gen', stopReason: 'max_tokens' }, input)
    expect(j).toMatchObject({ status: 'rejected', summary: null })
  })
  it('accepts a summary that passes, and keeps the model’s unsupported list', () => {
    const j = judgeAnswer({ text: json(OPTION_CARE_SUMMARY, ['debt financing amount']), stopReason: 'end_turn' }, input)
    expect(j).toEqual({ status: 'written', summary: OPTION_CARE_SUMMARY, unsupported: ['debt financing amount'] })
  })
  it('rejects one that fails a check and says which', () => {
    const j = judgeAnswer({ text: json('CD&R pays $9 billion for Option Care Health and the teaser says so, which is a longer sentence to reach twenty-five words in total.'), stopReason: 'end_turn' }, input)
    expect(j.status).toBe('rejected')
    expect(j.status === 'rejected' && j.reason).toMatch(/amounts.*process|process.*amounts/)
  })
})

// ─── The call ───────────────────────────────────────────────────────────────

describe('callWriter', () => {
  const ok = (text: string) => new Response(JSON.stringify({ content: [{ type: 'text', text }], stop_reason: 'end_turn', model: SUMMARY_MODEL, usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 1000 } }), { status: 200 })

  it('sends one story to claude-sonnet-5-5 with a cached system prompt and max_tokens 700', async () => {
    let seen: { url: string; init: RequestInit } | null = null
    const fetchImpl = (async (url: string, init: RequestInit) => { seen = { url, init }; return ok('{"summary":"x","unsupported":[]}') }) as unknown as typeof fetch
    const call = await callWriter('STORY MATERIAL', 'sk-test', fetchImpl)
    const body = JSON.parse(String(seen!.init.body))
    expect(seen!.url).toBe('https://api.anthropic.com/v1/messages')
    expect(body.model).toBe('claude-sonnet-5-5')
    expect(body.max_tokens).toBe(SUMMARY_MAX_TOKENS)
    expect(SUMMARY_MAX_TOKENS).toBe(700)
    expect(body.system).toEqual([{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }])
    expect(body.messages).toEqual([{ role: 'user', content: 'STORY MATERIAL' }])
    expect((seen!.init.headers as Record<string, string>)['x-api-key']).toBe('sk-test')
    expect(call.usage).toMatchObject({ input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 1000, cache_creation_input_tokens: 0 })
  })

  it('treats credit, key, rate-limit, server and network failures as an outage, and a bad request as one story’s', async () => {
    const status = (n: number) => (async () => new Response('nope', { status: n })) as unknown as typeof fetch
    for (const n of [401, 402, 429, 500, 529]) {
      await expect(callWriter('x', 'k', status(n))).rejects.toMatchObject({ outage: true, status: n })
    }
    await expect(callWriter('x', 'k', status(400))).rejects.toMatchObject({ outage: false, status: 400 })
    const down = (async () => { throw new Error('ECONNRESET') }) as unknown as typeof fetch
    const err = await callWriter('x', 'k', down).catch((e) => e)
    expect(err).toBeInstanceOf(StorySummaryApiError)
    expect(err.outage).toBe(true)
  })
})

describe('SYSTEM_PROMPT', () => {
  it('asks for what the checks enforce, and for no background or why-it-matters', () => {
    expect(SYSTEM_PROMPT).toMatch(/60 to 110 words/)
    expect(SYSTEM_PROMPT).toMatch(/Do not expand an acronym/)
    expect(SYSTEM_PROMPT).toMatch(/Do not use quotation marks/)
    expect(SYSTEM_PROMPT).toMatch(/eight words/)
    expect(SYSTEM_PROMPT).not.toMatch(/"background"|"why_it_matters"/)
  })
})

// ─── The page ───────────────────────────────────────────────────────────────

describe('which summary the page shows', () => {
  const rows = [
    { id: 'a', summary_long: null },
    { id: 'b', summary_long: 'From the second row.', summary_long_at: '2026-10-08T10:00:00Z' },
    { id: 'c', summary_long: 'From the best row.', summary_long_at: '2026-10-08T09:00:00Z' },
    { id: 'd', summary_long: 'From the newest other row.', summary_long_at: '2026-10-08T11:00:00Z' },
  ]
  it('prefers the best row’s, then the newest written', () => {
    expect(pickLongSummary(rows, 'c')).toBe('From the best row.')
    expect(pickLongSummary(rows, 'a')).toBe('From the newest other row.')
    expect(pickLongSummary(rows.slice(0, 1), 'a')).toBeNull()
    expect(pickLongSummary([], 'a')).toBeNull()
  })
  it('puts the long summary where the short one was, as paragraphs', () => {
    expect(pageSummary('Short.', 'First para.\n\nSecond para.')).toEqual({ kind: 'long', paragraphs: ['First para.', 'Second para.'] })
  })
  it('keeps the short one when there is no long one', () => {
    expect(pageSummary('Short.', null)).toEqual({ kind: 'short', text: 'Short.' })
    expect(pageSummary('Short.', '  \n\n ')).toEqual({ kind: 'short', text: 'Short.' })
    expect(pageSummary(null, null)).toBeNull()
  })
  it('summaryParagraphs', () => {
    expect(summaryParagraphs('One  line\nwrapped.\n\n\nTwo.')).toEqual(['One line wrapped.', 'Two.'])
    expect(summaryParagraphs(undefined)).toEqual([])
  })
})

// ─── one rewrite when a check fails ─────────────────────────────────────────

describe('writeStorySummary asks for one rewrite', () => {
  const answer = (summary: string) => new Response(JSON.stringify({
    content: [{ type: 'text', text: JSON.stringify({ summary, unsupported: [] }) }], stop_reason: 'end_turn', model: 'claude-sonnet-5-5',
    usage: { input_tokens: 100, output_tokens: 50, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
  }), { status: 200 })

  it('keeps a first answer that passes, with one call', async () => {
    const { writeStorySummary } = await import('../story-summary')
    const bodies: string[] = []
    const fetchImpl = (async (_url: unknown, init?: { body?: unknown }) => { bodies.push(String(init?.body)); return answer(OPTION_CARE_SUMMARY) }) as unknown as typeof fetch
    const out = await writeStorySummary(prepareRows(OPTION_CARE), 'k', fetchImpl)
    expect(out.status).toBe('written')
    expect(out.status !== 'thin' && out.calls).toBe(1)
    expect(bodies).toHaveLength(1)
  })

  it('sends a failed answer back once, saying what failed, and judges the second', async () => {
    const { writeStorySummary } = await import('../story-summary')
    const bodies: string[] = []
    const bad = OPTION_CARE_SUMMARY.replace('Clayton Dubilier & Rice', 'Carlyle Global Partners')
    const fetchImpl = (async (_url: unknown, init?: { body?: unknown }) => { bodies.push(String(init?.body)); return answer(bodies.length === 1 ? bad : OPTION_CARE_SUMMARY) }) as unknown as typeof fetch
    const out = await writeStorySummary(prepareRows(OPTION_CARE), 'k', fetchImpl)
    expect(bodies).toHaveLength(2)
    const second = JSON.parse(bodies[1]) as { messages: { role: string; content: string }[] }
    expect(second.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user'])
    expect(second.messages[2].content).toMatch(/Carlyle Global Partners/)
    expect(out.status).toBe('written')
    expect(out.status !== 'thin' && out.calls).toBe(2)
    expect(out.status !== 'thin' && out.usage.input_tokens).toBe(200)
  })

  it('gives up after the one rewrite', async () => {
    const { writeStorySummary } = await import('../story-summary')
    let n = 0
    const bad = OPTION_CARE_SUMMARY.replace('Clayton Dubilier & Rice', 'Carlyle Global Partners')
    const fetchImpl = (async () => { n++; return answer(bad) }) as unknown as typeof fetch
    const out = await writeStorySummary(prepareRows(OPTION_CARE), 'k', fetchImpl)
    expect(n).toBe(2)
    expect(out.status).toBe('rejected')
  })
})
