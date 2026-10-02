import { describe, it, expect } from 'vitest'
import { headlineFigureFor, headlineMoney, moneyMatchesUsd } from '../money'

const figures = (h: string) => headlineMoney(h).map((m) => `${m.currency} ${m.amountM}`)

describe('money in a headline', () => {
  it('reads dollars however the desk wrote them', () => {
    expect(figures('Ares Blows Past Target to Raise $4.2 Billion for Structured Fund')).toEqual(['USD 4200'])
    expect(figures('Oaktree closes debut ABF fund on $2bn')).toEqual(['USD 2000'])
    expect(figures('Two Google alumni raise $11.3M to back AI startups')).toEqual(['USD 11.3'])
    expect(figures('N49P’s $25-million USD first close for Fund IV')).toEqual(['USD 25'])
    expect(figures('CFM raises over USD 180m at first close of South Africa H2 fund')).toEqual(['USD 180'])
  })
  it('reads other currencies in their own units', () => {
    expect(figures('Azora closes largest-ever Southern Europe fund on €2.1bn')).toEqual(['EUR 2100'])
    expect(figures('Cheyne inks £3bn for RE debt fund')).toEqual(['GBP 3000'])
    expect(figures('NSSK Closes Series IV Funds at JPY 250 Billion Hardcap')).toEqual(['JPY 250000'])
    expect(figures('Ares Closes Fund at ¥612 Billion (US$4 Billion), Hitting Hard Cap')).toEqual(['JPY 612000', 'USD 4000'])
    expect(figures('Wentworth hits A$350m hard-cap for first flagship Australian fund')).toEqual(['AUD 350'])
    expect(figures('IIT Madras-backed deeptech fund raises Rs 450 crore in first close')).toEqual(['INR 4500'])
    expect(figures('Airnergize secures R3.89bn for clean technology')).toEqual(['ZAR 3890'])
    expect(figures('Korea exchange and depository institutions launch 1 trillion-won secondary fund')).toEqual(['KRW 1000000'])
  })
  it('skips a figure with no unit: a salary is not a fund size', () => {
    expect(figures('Point72 offering $300k salary to lure quant teacher')).toEqual([])
    expect(figures('Fund VI closes in 90 days')).toEqual([])
  })
  it('tells a plausible conversion from a different number', () => {
    const [eur] = headlineMoney('Charterhouse raises €1bn first close for CCP XII')
    expect(moneyMatchesUsd(eur, 1100)).toBe(true)
    expect(moneyMatchesUsd(eur, 1640)).toBe(false)
    expect(headlineFigureFor(740, 'Blackbird hits $740m Fund VI record close')?.amountM).toBe(740)
    expect(headlineFigureFor(1900, 'EIG raises $4bn across infrastructure debt platform')).toBeNull()
  })
})
