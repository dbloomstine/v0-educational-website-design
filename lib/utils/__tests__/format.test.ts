import { describe, it, expect } from 'vitest'
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '../format'

describe('format utilities', () => {
  describe('formatNumber', () => {
    it('should format integers without decimals by default', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
    })

    it('should format numbers with specified decimals', () => {
      expect(formatNumber(1000.5, 2)).toBe('1,000.50')
      expect(formatNumber(1234.567, 1)).toBe('1,234.6')
    })

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0')
    })
  })

  describe('formatCurrency', () => {
    it('should format as currency with dollar sign', () => {
      expect(formatCurrency(1000)).toBe('$1,000')
      expect(formatCurrency(1234567)).toBe('$1,234,567')
    })

    it('should format currency with decimals', () => {
      expect(formatCurrency(1000.5, 2)).toBe('$1,000.50')
    })
  })

  describe('formatPercent', () => {
    it('should format as percentage with default 1 decimal', () => {
      expect(formatPercent(50)).toBe('50.0%')
      expect(formatPercent(2.5)).toBe('2.5%')
    })

    it('should format percentage with specified decimals', () => {
      expect(formatPercent(25, 0)).toBe('25%')
      expect(formatPercent(33.333, 2)).toBe('33.33%')
    })
  })

  describe('formatCompact', () => {
    it('should format large numbers in compact notation', () => {
      expect(formatCompact(1000)).toBe('1K')
      expect(formatCompact(1500)).toBe('1.5K')
      expect(formatCompact(1000000)).toBe('1M')
      expect(formatCompact(1500000)).toBe('1.5M')
    })

    it('should handle small numbers', () => {
      expect(formatCompact(100)).toBe('100')
      expect(formatCompact(999)).toBe('999')
    })
  })
})
