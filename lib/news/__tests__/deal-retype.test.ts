import { describe, it, expect } from 'vitest'
import { isHiddenDeal, retypeHiddenDeal } from '../deal-retype'

/**
 * Real headlines from the fortnight to 2026-10-12, with the type and relevance
 * the classifier gave them. The first group were deals nothing showed; the
 * second must stay as filed.
 */
const other = (firm: string | null, relevance = 0.4) => ({ article_type: 'other', relevance_score: relevance, firm_name: firm })
const commentary = (firm: string | null, relevance = 0.3) => ({ article_type: 'market_commentary', relevance_score: relevance, firm_name: firm })

describe('isHiddenDeal', () => {
  it('finds a deal filed as other or commentary', () => {
    expect(isHiddenDeal('Aurora Capital Partners acquires education and government software firm Softdocs', other('Aurora Capital Partners'))).toBe(true)
    expect(isHiddenDeal('KKR exits Japanese midscale hotel portfolio after two-year turnaround', other('KKR'))).toBe(true)
    expect(isHiddenDeal('KKR sells Four Points Flex by Sheraton portfolio in Japan', other('KKR'))).toBe(true)
    expect(isHiddenDeal('HIG exits Italian beauty and personal care retailer', other('HIG Capital', 0.3))).toBe(true)
    expect(isHiddenDeal('Catella fund sells Dutch residential property portfolio for €215m', other('Catella', 0.3))).toBe(true)
    expect(isHiddenDeal('KKR takes majority stake in Cisternina in Indian liquid gas storage push', other('KKR', 0.3))).toBe(true)
    expect(isHiddenDeal('Trilantic North America inks $945m sale of SOFIE Biosciences to GE HealthCare', other('Trilantic North America'))).toBe(true)
    expect(isHiddenDeal('Albaron Partners exits Prime Psychiatry in sale to Beacon Behavioral', other('Albaron Partners', 0.3))).toBe(true)
    expect(isHiddenDeal('Align Capital’s MKB Company acquires erosion control maker Siltworm', other('Align Capital', 0.3))).toBe(true)
    expect(isHiddenDeal('Pritzker Private Capital explores $1bn-plus sale of propane distributor EDP', commentary('Pritzker Private Capital', 0.4))).toBe(true)
    expect(isHiddenDeal('Savills Investment Management sells prime retail asset in Almere, Netherlands, to Bouwinvest Dutch Institutional Retail Fund', other('Savills Investment Management', 0.3))).toBe(true)
  })

  it('leaves commentary, columns, lists and the noun "exits" alone', () => {
    expect(isHiddenDeal('Morgan Stanley caps private credit exits again as 11% want out', commentary('Morgan Stanley'))).toBe(false)
    expect(isHiddenDeal('Warburg Pincus hits $12bn of exits in 2026', commentary('Warburg Pincus'))).toBe(false)
    expect(isHiddenDeal('Ridgewood Infrastructure on looking for exit optionality', commentary('Ridgewood Infrastructure'))).toBe(false)
    expect(isHiddenDeal('Japanese GP returns entire debut fund with first exit', commentary('Nihon PMI'))).toBe(false)
    expect(isHiddenDeal('Point72 extends investor exit period to three years', commentary('Point72 Asset Management'))).toBe(false)
    expect(isHiddenDeal('Private equity invests in garage door businesses: 5 standout deals', { article_type: 'industry_analysis', relevance_score: 0.4, firm_name: 'Sterling Group' })).toBe(false)
    expect(isHiddenDeal('Bain Capital’s Matt Evans details partial exit of MRO Holdings', commentary('Bain Capital'))).toBe(false)
    expect(isHiddenDeal('Inside IVEST and Cloverlay’s early Care Bears exit', other('IVEST', 0.5))).toBe(false)
    expect(isHiddenDeal('HIG exits Italian beauty and personal care retailer; Ambienta buys four aquaculture businesses', other('HIG Capital', 0.3))).toBe(false)
    expect(isHiddenDeal('Global PE exits surge 65% in value, fundraising keeps shrinking as recovery concentrates in megadeals', commentary(null))).toBe(false)
    expect(isHiddenDeal('Widening Access Does Not Widen the Exit', commentary('ARK Invest'))).toBe(false)
  })

  it('needs the extracted firm in the subject, a shown relevance and a hidden type', () => {
    expect(isHiddenDeal('KKR exits Japanese midscale hotel portfolio', other('Blackstone'))).toBe(false)
    expect(isHiddenDeal('KKR exits Japanese midscale hotel portfolio', other(null))).toBe(false)
    expect(isHiddenDeal('KKR exits Japanese midscale hotel portfolio', other('KKR', 0.2))).toBe(false)
    expect(isHiddenDeal('KKR exits Japanese midscale hotel portfolio', { article_type: 'acquisition', relevance_score: 0.8, firm_name: 'KKR' })).toBe(false)
    // A long run-up before the verb is not a firm acting.
    expect(isHiddenDeal('After two years of talks and a failed auction, the owners finally sell the Dutch retailer', other('Mutares'))).toBe(false)
  })
})

describe('retypeHiddenDeal', () => {
  it('changes only the type', () => {
    const c = { article_type: 'other', relevance_score: 0.4, firm_name: 'KKR', summary_ai: 'KKR sold the portfolio.' }
    const out = retypeHiddenDeal('KKR sells Four Points Flex by Sheraton portfolio in Japan', c)
    expect(out).toEqual({ ...c, article_type: 'acquisition' })
    expect(c.article_type).toBe('other')
  })

  it('returns the same object when nothing changes', () => {
    const c = { article_type: 'market_commentary', relevance_score: 0.3, firm_name: 'Warburg Pincus' }
    expect(retypeHiddenDeal('Warburg Pincus hits $12bn of exits in 2026', c)).toBe(c)
  })
})
