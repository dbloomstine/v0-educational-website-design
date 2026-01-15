import { describe, it, expect } from 'vitest'
import { pillars, getPillar, getPillarsByFundType } from '../pillars'

describe('pillars', () => {
  describe('pillars registry', () => {
    it('should contain 14 pillars', () => {
      expect(Object.keys(pillars).length).toBe(14)
    })

    it('should have core pillars available to all fund types', () => {
      const corePillars = ['cfo', 'compliance', 'fund-administration', 'investor-relations', 'tax', 'banking', 'fundraising', 'insurance', 'audit', 'cyber-it', 'legal', 'hr']
      corePillars.forEach(pillarSlug => {
        expect(pillars[pillarSlug]).toBeDefined()
        expect(pillars[pillarSlug].fundTypes.length).toBe(8)
      })
    })

    it('should have loan-administration only for private-credit', () => {
      const loanAdmin = pillars['loan-administration']
      expect(loanAdmin).toBeDefined()
      expect(loanAdmin.fundTypes).toEqual(['private-credit'])
    })

    it('should have prime-brokerage only for hedge-funds', () => {
      const primeBrokerage = pillars['prime-brokerage']
      expect(primeBrokerage).toBeDefined()
      expect(primeBrokerage.fundTypes).toEqual(['hedge-funds'])
    })

    it('should have valid pillar structure', () => {
      const cfoPillar = pillars['cfo']
      expect(cfoPillar).toHaveProperty('id')
      expect(cfoPillar).toHaveProperty('title')
      expect(cfoPillar).toHaveProperty('slug')
      expect(cfoPillar).toHaveProperty('description')
      expect(cfoPillar).toHaveProperty('fundTypes')
      expect(Array.isArray(cfoPillar.fundTypes)).toBe(true)
    })
  })

  describe('getPillar', () => {
    it('should return pillar for valid slug', () => {
      const cfo = getPillar('cfo')
      expect(cfo).toBeDefined()
      expect(cfo?.slug).toBe('cfo')
      expect(cfo?.title).toBe('CFO')
    })

    it('should return undefined for invalid slug', () => {
      const invalid = getPillar('invalid-pillar')
      expect(invalid).toBeUndefined()
    })
  })

  describe('getPillarsByFundType', () => {
    it('should return 12 pillars for private-equity', () => {
      const pePillars = getPillarsByFundType('private-equity')
      expect(pePillars.length).toBe(12)
    })

    it('should return 13 pillars for private-credit (includes loan-administration)', () => {
      const pcPillars = getPillarsByFundType('private-credit')
      expect(pcPillars.length).toBe(13)
      expect(pcPillars.find(p => p.slug === 'loan-administration')).toBeDefined()
    })

    it('should return 13 pillars for hedge-funds (includes prime-brokerage)', () => {
      const hfPillars = getPillarsByFundType('hedge-funds')
      expect(hfPillars.length).toBe(13)
      expect(hfPillars.find(p => p.slug === 'prime-brokerage')).toBeDefined()
    })

    it('should return empty array for invalid fund type', () => {
      const noPillars = getPillarsByFundType('invalid-fund-type')
      expect(noPillars).toEqual([])
    })
  })
})
