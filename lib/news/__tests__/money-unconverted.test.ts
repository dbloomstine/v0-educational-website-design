import { describe, expect, it } from 'vitest'
import { unconvertedSize } from '../money'

describe('a fund size left in its own currency', () => {
  const t = 'Graphite Capital said to return to fundraising after eight years with £500m target'
  it('is converted at the middle of the band when the size equals the original amount', () => {
    expect(unconvertedSize({ fund_size_usd_millions: 500, original_currency: 'GBP', original_amount_millions: 500 }, t)).toBe(625)
    expect(unconvertedSize({ fund_size_usd_millions: 10000, original_currency: 'JPY', original_amount_millions: 10000 }, '¥10bn fund')).toBe(68)
  })
  it('is left alone once converted, or in dollars, or in a currency near the dollar, or unknown', () => {
    expect(unconvertedSize({ fund_size_usd_millions: 638, original_currency: 'GBP', original_amount_millions: 500 }, t)).toBeNull()
    expect(unconvertedSize({ fund_size_usd_millions: 500, original_currency: 'USD', original_amount_millions: 500 }, t)).toBeNull()
    expect(unconvertedSize({ fund_size_usd_millions: 500, original_currency: null, original_amount_millions: null }, t)).toBeNull()
    expect(unconvertedSize({ fund_size_usd_millions: 500, original_currency: 'XYZ', original_amount_millions: 500 }, t)).toBeNull()
  })
  it('is left alone when the article prints that figure in dollars', () => {
    expect(unconvertedSize({ fund_size_usd_millions: 500, original_currency: 'GBP', original_amount_millions: 500 }, 'Fund closes on $500m, about £390m')).toBeNull()
  })
})
