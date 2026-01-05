/**
 * Shared formatting utilities
 * Used by: csv-export.ts, excel-export.ts, and tool components
 */

/**
 * Format a number with locale-aware thousands separators
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Format a currency value with dollar sign
 */
export function formatCurrency(value: number, decimals: number = 0): string {
  return '$' + formatNumber(value, decimals)
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return formatNumber(value, decimals) + '%'
}

/**
 * Format a number in compact notation (e.g., 1.5M, 2.3K)
 */
export function formatCompact(value: number): string {
  return value.toLocaleString('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  })
}
