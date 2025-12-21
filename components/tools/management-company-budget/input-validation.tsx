"use client"

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

// Validation rules for all inputs
export const VALIDATION_RULES = {
  fundSize: {
    min: 1,
    max: 10000,
    typical: { min: 25, max: 500 },
    unit: 'M',
    label: 'Fund Size'
  },
  feeRate: {
    min: 0.5,
    max: 5.0,
    typical: { min: 1.5, max: 2.5 },
    unit: '%',
    label: 'Management Fee'
  },
  startingCash: {
    min: 50000,
    max: 50000000,
    typical: { min: 250000, max: 2000000 },
    unit: '$',
    label: 'Starting Cash'
  },
  teamMonthlyCost: {
    min: 1000,
    max: 100000,
    typical: { min: 5000, max: 40000 },
    unit: '$/mo',
    label: 'Monthly Cost'
  },
  expenseMonthlyCost: {
    min: 100,
    max: 50000,
    typical: { min: 500, max: 15000 },
    unit: '$/mo',
    label: 'Monthly Cost'
  },
  firstCloseYear: {
    min: 2020,
    max: 2035,
    typical: { min: new Date().getFullYear(), max: new Date().getFullYear() + 2 },
    unit: '',
    label: 'First Close Year'
  }
} as const

export type ValidationField = keyof typeof VALIDATION_RULES

export interface ValidationResult {
  isValid: boolean
  status: 'valid' | 'warning' | 'error'
  message?: string
  suggestion?: string
}

export function validateInput(field: ValidationField, value: number): ValidationResult {
  const rules = VALIDATION_RULES[field]

  // Check absolute bounds
  if (value < rules.min) {
    return {
      isValid: false,
      status: 'error',
      message: `${rules.label} must be at least ${rules.min}${rules.unit}`,
      suggestion: `Typical range: ${rules.typical.min}-${rules.typical.max}${rules.unit}`
    }
  }

  if (value > rules.max) {
    return {
      isValid: false,
      status: 'error',
      message: `${rules.label} cannot exceed ${rules.max}${rules.unit}`,
      suggestion: `Typical range: ${rules.typical.min}-${rules.typical.max}${rules.unit}`
    }
  }

  // Check typical range
  if (value < rules.typical.min || value > rules.typical.max) {
    return {
      isValid: true,
      status: 'warning',
      message: `${rules.label} is outside typical range`,
      suggestion: `Industry typical: ${rules.typical.min}-${rules.typical.max}${rules.unit}`
    }
  }

  return {
    isValid: true,
    status: 'valid'
  }
}

interface ValidationFeedbackProps {
  field: ValidationField
  value: number
  showAlways?: boolean
  className?: string
}

export function ValidationFeedback({ field, value, showAlways = false, className }: ValidationFeedbackProps) {
  const result = useMemo(() => validateInput(field, value), [field, value])

  if (result.status === 'valid' && !showAlways) {
    return null
  }

  return (
    <div className={cn(
      "flex items-start gap-2 text-xs mt-1.5 p-2 rounded-md",
      result.status === 'error' && "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300",
      result.status === 'warning' && "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300",
      result.status === 'valid' && "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300",
      className
    )}>
      {result.status === 'error' && <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />}
      {result.status === 'warning' && <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />}
      {result.status === 'valid' && <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />}
      <div>
        {result.message && <p>{result.message}</p>}
        {result.suggestion && <p className="opacity-75">{result.suggestion}</p>}
        {result.status === 'valid' && <p>Value is within typical range</p>}
      </div>
    </div>
  )
}

interface ValidatedInputProps {
  field: ValidationField
  value: number
  onChange: (value: number) => void
  className?: string
  inputClassName?: string
  showValidation?: boolean
  prefix?: string
  suffix?: string
  step?: number
}

export function ValidatedInput({
  field,
  value,
  onChange,
  className,
  inputClassName,
  showValidation = true,
  prefix,
  suffix,
  step = 1
}: ValidatedInputProps) {
  const rules = VALIDATION_RULES[field]
  const result = useMemo(() => validateInput(field, value), [field, value])

  return (
    <div className={className}>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={rules.min}
          max={rules.max}
          step={step}
          className={cn(
            "w-full px-3 py-2 border rounded-md bg-background text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            prefix && "pl-8",
            suffix && "pr-12",
            result.status === 'error' && "border-red-500 focus:ring-red-500/50",
            result.status === 'warning' && "border-amber-500 focus:ring-amber-500/50",
            inputClassName
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {showValidation && <ValidationFeedback field={field} value={value} />}
    </div>
  )
}

// Helper to clamp value within bounds
export function clampValue(field: ValidationField, value: number): number {
  const rules = VALIDATION_RULES[field]
  return Math.max(rules.min, Math.min(rules.max, value))
}

// Helper to check if all inputs are valid
export function validateAllInputs(data: {
  fundSize?: number
  feeRate?: number
  startingCash?: number
  teamCosts?: number[]
  expenseCosts?: number[]
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (data.fundSize !== undefined) {
    const result = validateInput('fundSize', data.fundSize)
    if (!result.isValid) errors.push(result.message || 'Invalid fund size')
  }

  if (data.feeRate !== undefined) {
    const result = validateInput('feeRate', data.feeRate)
    if (!result.isValid) errors.push(result.message || 'Invalid fee rate')
  }

  if (data.startingCash !== undefined) {
    const result = validateInput('startingCash', data.startingCash)
    if (!result.isValid) errors.push(result.message || 'Invalid starting cash')
  }

  data.teamCosts?.forEach((cost, i) => {
    const result = validateInput('teamMonthlyCost', cost)
    if (!result.isValid) errors.push(`Team member ${i + 1}: ${result.message}`)
  })

  data.expenseCosts?.forEach((cost, i) => {
    const result = validateInput('expenseMonthlyCost', cost)
    if (!result.isValid) errors.push(`Expense ${i + 1}: ${result.message}`)
  })

  return { isValid: errors.length === 0, errors }
}
