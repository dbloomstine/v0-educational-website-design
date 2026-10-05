import { describe, it, expect } from 'vitest'
import { cleanSummary, isClassifierRemark } from '../summary-clean'

// Every summary here is one the classifier wrote, on a row the site could show
// between 2026-06-27 and 2026-10-05 — except the last block, which is made up
// and says so.

describe('cleanSummary: the classifier’s remarks come off the end', () => {
  it('a remark on how much it was told', () => {
    expect(cleanSummary('MAPP appoints senior advisor to leadership team—executive hire with insufficient detail to assess seniority or relevance.'))
      .toBe('MAPP appoints senior advisor to leadership team.')
    expect(cleanSummary('Warburg Pincus appoints Philip Nolan as head of US wealth. Appointment details and portfolio significance are not provided.'))
      .toBe('Warburg Pincus appoints Philip Nolan as head of US wealth.')
    expect(cleanSummary('Lifecore Biomedical take-private deal valued at $663.7M led by 3 firms — insufficient detail provided.'))
      .toBe('Lifecore Biomedical take-private deal valued at $663.7M led by 3 firms.')
    expect(cleanSummary('KCM appoints two senior portfolio managers; no details on strategy, AUM, or fund specifics.'))
      .toBe('KCM appoints two senior portfolio managers.')
  })

  it('a remark about the text it was given', () => {
    expect(cleanSummary('Coastal Ridge closes first close on debut student housing fund; size not disclosed in snippet.'))
      .toBe('Coastal Ridge closes first close on debut student housing fund.')
    expect(cleanSummary('Ares holds final close for US and European value-add real estate funds; specific fund sizes not mentioned in headline.'))
      .toBe('Ares holds final close for US and European value-add real estate funds.')
    expect(cleanSummary('GIC Europe real estate head to depart (limited details available in snippet).'))
      .toBe('GIC Europe real estate head to depart.')
    expect(cleanSummary('OceanSound Partners-backed PAR Excellence Systems acquired Terso Solutions, an RFID inventory-tracking provider for healthcare. Article frames acquisition within broader PE appetite for better-for-you food subsector.'))
      .toBe('OceanSound Partners-backed PAR Excellence Systems acquired Terso Solutions, an RFID inventory-tracking provider for healthcare.')
    expect(cleanSummary('Main Capital Partners acquired Qbees, German managed IT services and financial software provider; headline references separate Hg and Elvaston deals in Greece and Poland.'))
      .toBe('Main Capital Partners acquired Qbees, German managed IT services and financial software provider.')
  })

  it('a remark arguing how the story was filed', () => {
    expect(cleanSummary('KKR-backed Spectris acquires sensor business Sentech; portfolio company M&A, not fund vehicle activity.'))
      .toBe('KKR-backed Spectris acquires sensor business Sentech.')
    expect(cleanSummary('Jones Day hires fund finance lawyer; law firm service provider hire, not a fund GP/LP capital event.'))
      .toBe('Jones Day hires fund finance lawyer.')
    expect(cleanSummary('Cognition raised over $2B in Series E at $48B post-money valuation led by Andreessen Horowitz and Accel. This is a portfolio company venture round, not an alternative asset manager capital raise.'))
      .toBe('Cognition raised over $2B in Series E at $48B post-money valuation led by Andreessen Horowitz and Accel.')
    expect(cleanSummary('Sentinel Net Lease closes Sentinel Opportunity Fund I—specific fund vehicle, final close confirmed.'))
      .toBe('Sentinel Net Lease closes Sentinel Opportunity Fund I.')
    expect(cleanSummary('Sofinnova closed €82M fund for medical device startups; appears to be early-stage venture vehicle targeting medtech.'))
      .toBe('Sofinnova closed €82M fund for medical device startups.')
  })

  it('a clause that is only the name of a filing', () => {
    expect(cleanSummary('Adams Street names partner for venture secondaries strategy. Leadership hire at secondary fund manager.'))
      .toBe('Adams Street names partner for venture secondaries strategy.')
    expect(cleanSummary('Monroe Capital adds team member to originations department. Executive hire at credit fund manager.'))
      .toBe('Monroe Capital adds team member to originations department.')
    expect(cleanSummary("Singapore's GIC plans $30B allocation to hedge funds; LP commitment announcement."))
      .toBe("Singapore's GIC plans $30B allocation to hedge funds.")
    expect(cleanSummary('TD Bank launches Global Private Credit Fund with first loan deployment; fund launch without stated size or target.'))
      .toBe('TD Bank launches Global Private Credit Fund with first loan deployment.')
  })

  it('more than one remark, and a remark inside brackets', () => {
    expect(cleanSummary('Pittsburgh PE firm closes $548M fund. Article also mentions DefenseTech startup Hadrian Series D ($1.3B), which is portfolio company fundraising, not a fund launch.'))
      .toBe('Pittsburgh PE firm closes $548M fund.')
    expect(cleanSummary('Keidan Harrison hires Rachel Cropper-Mawer as partner; investigations and regulatory expertise relevant to fund compliance, but hiring at a legal services firm (not a fund manager or fund finance lender).'))
      .toBe('Keidan Harrison hires Rachel Cropper-Mawer as partner; investigations and regulatory expertise relevant to fund compliance, but hiring at a legal services firm.')
  })
})

describe('cleanSummary: the news stays', () => {
  const same = (s: string) => expect(cleanSummary(s)).toBe(s)

  it('what a reporter writes too: terms, value or size not disclosed', () => {
    same('Frazier Healthcare acquired MatrixCare from ResMed; deal size not disclosed.')
    same("Blackstone Capital Partners and Blackstone Energy Transition Partners are acquiring Flow Control Holdings from Audax Private Equity for an undisclosed sum, with Audax retaining a minority stake; the deal expands Blackstone's AI infrastructure portfolio in liquid-cooling technology.")
    same('KKR held first close for a real estate fund; no amount disclosed.')
    same('Continuim Equity Partners Fund II acquired majority stake in Resodyn Corporation (industrial mixing systems). Fifth platform investment for Fund II; purchase price undisclosed.')
  })

  it('a closing clause of fact, however short', () => {
    same('Stonelake Capital Partners closed Fund VIII at $1bn hard cap, a 34% increase from Fund VII, in its opportunistic real estate strategy.')
    same("Aon agreed to acquire USI from KKR and other shareholders for $17.0 billion ($16.7B net of tax attributes); KKR entry was ~$4.3B in 2017 for ~3.4x return. Close targeted for Q4 2026.")
    same('DwyerOmega (Arcline Investment Management portfolio company) acquires SOR Controls Group, a founded-1946 industrial instruments manufacturer; deal size not disclosed. Tenth acquisition for DwyerOmega since Arcline\'s 2021 Dwyer acquisition.')
    same('Avendus PE fund invests in Parag Parikh Financial ahead of its final close.')
    same('EU insurance regulator calls for private equity acquirers of European insurers to demonstrate long-term commitment to policyholders rather than pursue short-term investment strategies.')
  })

  it('a firm called Headline, and a regulator that wants to assess something', () => {
    same('Headline raises $400m for Fund VIII, its eighth European early-stage fund, focusing on AI sector exposure.')
    same('Bank of England conducts inaugural private credit stress test (SWES) to assess resilience of private markets; industry warns poor communication could dampen asset class growth.')
  })

  it('the fact in front of a remark, when a figure ends the sentence', () => {
    // "…$900M. Portfolio…" must part after the figure, or the news goes with the remark.
    expect(cleanSummary("Space startups raise $113M in '26; cumulative funding since 2021 nears $900M. Portfolio company funding, not a fund vehicle."))
      .toBe("Space startups raise $113M in '26; cumulative funding since 2021 nears $900M.")
  })

  it('never the first clause: a summary that is nothing but a remark is left as it is', () => {
    same('Leadership hire at secondary fund manager.')
    same('Article lacks fund name, manager identity, or specific capital raise details.')
    expect(cleanSummary(null)).toBeNull()
    expect(cleanSummary('')).toBeNull()
  })
})

describe('cleanSummary: clauses a reporter could write (made up, to pin the patterns)', () => {
  const same = (s: string) => expect(cleanSummary(s)).toBe(s)

  it('"not fund" as a verb, and "not a fund-of-funds"', () => {
    same('Apollo takes control of the lender; banks would not fund the buyout.')
    same('Blue Owl launches a co-investment programme; the vehicle is not a fund-of-funds.')
  })
  it('a label that goes on to say something', () => {
    same('KKR agrees to buy the unit; portfolio company acquisition expected to close in Q4.')
    same('SEC delays the reporting rule; regulatory update expected in March.')
    same('Secondaries volume hits a record; LP-led activity reached $50bn.')
    same('Ares hires a credit partner in London; senior hire joins from Goldman Sachs.')
  })
  it('"headline", "assess" and "launch without" in their ordinary senses', () => {
    same('Bank of England holds rates; a rise in headline inflation is expected.')
    same('FCA opens a review of private market valuations; aims to assess the impact on retail investors.')
    same('Fund to launch without a cornerstone investor.')
  })
})

describe('isClassifierRemark', () => {
  it('knows its own phrases and not a reporter’s', () => {
    expect(isClassifierRemark('portfolio company acquisition, not fund-related capital event')).toBe(true)
    expect(isClassifierRemark('specific role and seniority level not stated in snippet')).toBe(true)
    expect(isClassifierRemark('LP allocation activity across manager set')).toBe(true)
    expect(isClassifierRemark('deal value not disclosed')).toBe(false)
    expect(isClassifierRemark('portfolio company exits fund the distribution')).toBe(false)
    expect(isClassifierRemark('Tenth acquisition for DwyerOmega since Arcline\'s 2021 Dwyer acquisition')).toBe(false)
  })
})
