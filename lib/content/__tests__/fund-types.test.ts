import { describe, it, expect } from 'vitest'
import { fundTypes, getFundType, getAllFundTypes } from '../fund-types'

describe('fund-types', () => {
  describe('fundTypes registry', () => {
    it('should contain 8 fund types', () => {
      expect(Object.keys(fundTypes).length).toBe(8)
    })

    it('should have expected fund types', () => {
      const expectedTypes = [
        'private-equity',
        'private-credit',
        'venture-capital',
        'hedge-funds',
        'real-estate',
        'infrastructure',
        'secondaries',
        'gp-stakes',
      ]
      expectedTypes.forEach(type => {
        expect(fundTypes[type]).toBeDefined()
      })
    })

    it('should have valid fund type structure', () => {
      const peFundType = fundTypes['private-equity']
      expect(peFundType).toHaveProperty('id')
      expect(peFundType).toHaveProperty('name')
      expect(peFundType).toHaveProperty('slug')
      expect(peFundType).toHaveProperty('description')
      expect(peFundType).toHaveProperty('color')
      expect(peFundType).toHaveProperty('pillars')
      expect(Array.isArray(peFundType.pillars)).toBe(true)
    })
  })

  describe('getFundType', () => {
    it('should return fund type for valid slug', () => {
      const pe = getFundType('private-equity')
      expect(pe).toBeDefined()
      expect(pe?.slug).toBe('private-equity')
      expect(pe?.name).toBe('Private Equity')
    })

    it('should return undefined for invalid slug', () => {
      const invalid = getFundType('invalid-fund-type')
      expect(invalid).toBeUndefined()
    })
  })

  describe('getAllFundTypes', () => {
    it('should return all fund types as array', () => {
      const allTypes = getAllFundTypes()
      expect(Array.isArray(allTypes)).toBe(true)
      expect(allTypes.length).toBe(8)
    })

    it('should return fund type objects', () => {
      const allTypes = getAllFundTypes()
      allTypes.forEach(fundType => {
        expect(fundType).toHaveProperty('id')
        expect(fundType).toHaveProperty('name')
        expect(fundType).toHaveProperty('slug')
      })
    })
  })
})
