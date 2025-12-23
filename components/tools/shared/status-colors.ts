/**
 * Shared status color definitions for consistent styling across all calculator tools.
 * Uses semantic color names that work with both light and dark themes.
 */

// Status card backgrounds with borders - used for result cards and metrics
export const statusCardColors = {
  success: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  warning: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  error: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
  purple: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
  neutral: "bg-muted/50 border-border",
} as const

// Status text colors - for labels and values inside status cards
export const statusTextColors = {
  success: {
    label: "text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-900 dark:text-emerald-100",
  },
  warning: {
    label: "text-amber-600 dark:text-amber-400",
    value: "text-amber-900 dark:text-amber-100",
  },
  info: {
    label: "text-blue-600 dark:text-blue-400",
    value: "text-blue-900 dark:text-blue-100",
  },
  error: {
    label: "text-red-600 dark:text-red-400",
    value: "text-red-900 dark:text-red-100",
  },
  purple: {
    label: "text-purple-600 dark:text-purple-400",
    value: "text-purple-900 dark:text-purple-100",
  },
  neutral: {
    label: "text-muted-foreground",
    value: "text-foreground",
  },
} as const

// Combined status styles for convenience
export const statusStyles = {
  success: {
    card: statusCardColors.success,
    ...statusTextColors.success,
  },
  warning: {
    card: statusCardColors.warning,
    ...statusTextColors.warning,
  },
  info: {
    card: statusCardColors.info,
    ...statusTextColors.info,
  },
  error: {
    card: statusCardColors.error,
    ...statusTextColors.error,
  },
  purple: {
    card: statusCardColors.purple,
    ...statusTextColors.purple,
  },
  neutral: {
    card: statusCardColors.neutral,
    ...statusTextColors.neutral,
  },
} as const

// Badge color variants for inline status indicators
export const badgeColors = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  error: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
} as const

// Trend indicator colors - for showing positive/negative changes
export const trendColors = {
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-red-600 dark:text-red-400",
  neutral: "text-muted-foreground",
} as const

// Table row highlight colors
export const tableRowColors = {
  highlight: "bg-primary/5 font-medium",
  normal: "border-b border-border/50",
} as const

// Helper function to get trend color based on value
export function getTrendColor(value: number, invertedLogic = false): string {
  if (Math.abs(value) < 0.001) return trendColors.neutral
  const isPositive = invertedLogic ? value < 0 : value > 0
  return isPositive ? trendColors.positive : trendColors.negative
}

// Type exports
export type StatusType = keyof typeof statusStyles
export type TrendType = keyof typeof trendColors
