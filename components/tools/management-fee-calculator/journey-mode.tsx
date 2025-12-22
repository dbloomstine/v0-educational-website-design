'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  ChevronRight,
  ChevronLeft,
  Building2,
  DollarSign,
  Clock,
  Percent,
  Calculator,
  ArrowRight,
  Check,
  X
} from 'lucide-react'
import { FundInputs, FeePhase, FundType, FeeBase } from './types'

interface JourneyModeProps {
  onComplete: (inputs: FundInputs, phases: FeePhase[]) => void
  onSkip: () => void
  existingData?: { inputs: FundInputs; phases: FeePhase[] } | null
}

// Step configuration
const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'fund-type', title: 'Fund Type' },
  { id: 'fund-size', title: 'Fund Size' },
  { id: 'timeline', title: 'Timeline' },
  { id: 'fee-structure', title: 'Fee Structure' },
  { id: 'review', title: 'Review' },
] as const

type StepId = typeof STEPS[number]['id']

const fundTypeOptions: { type: FundType; description: string; typicalFee: string; icon: string }[] = [
  { type: 'Private Equity', description: 'Buyouts, growth equity, special situations', typicalFee: '2.0%', icon: '🏢' },
  { type: 'Venture Capital', description: 'Early to late stage startups', typicalFee: '2.0-2.5%', icon: '🚀' },
  { type: 'Private Credit', description: 'Direct lending, mezzanine, distressed', typicalFee: '1.0-1.5%', icon: '💳' },
  { type: 'Real Estate', description: 'Property acquisition and development', typicalFee: '1.0-1.5%', icon: '🏠' },
  { type: 'Hedge Fund', description: 'Long/short, macro, quant strategies', typicalFee: '1.5-2.0%', icon: '📈' },
  { type: 'Other', description: 'Infrastructure, secondaries, custom', typicalFee: 'Varies', icon: '⚡' },
]

const fundTypeDefaults: Record<FundType, { feeRate: number; term: number; ip: number }> = {
  'Private Equity': { feeRate: 2.0, term: 10, ip: 5 },
  'Venture Capital': { feeRate: 2.0, term: 10, ip: 4 },
  'Private Credit': { feeRate: 1.25, term: 7, ip: 3 },
  'Real Estate': { feeRate: 1.5, term: 8, ip: 3 },
  'Hedge Fund': { feeRate: 1.5, term: 10, ip: 10 },
  'Other': { feeRate: 2.0, term: 10, ip: 5 }
}

export function JourneyMode({ onComplete, onSkip, existingData }: JourneyModeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [showWelcomeBack, setShowWelcomeBack] = useState(!!existingData)

  // Form state
  const [fundType, setFundType] = useState<FundType>(existingData?.inputs.fundType || 'Venture Capital')
  const [fundSize, setFundSize] = useState(existingData?.inputs.fundSize || 50)
  const [fundTerm, setFundTerm] = useState(existingData?.inputs.fundTerm || 10)
  const [investmentPeriod, setInvestmentPeriod] = useState(existingData?.inputs.investmentPeriod || 4)
  const [phase1Rate, setPhase1Rate] = useState(existingData?.phases?.[0]?.feeRate || 2.0)
  const [phase2Rate, setPhase2Rate] = useState(existingData?.phases?.[1]?.feeRate || 1.5)

  const step = STEPS[currentStep]
  const progress = ((currentStep) / (STEPS.length - 1)) * 100
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === STEPS.length - 1

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isLastStep) {
        handleNext()
      } else if (e.key === 'Escape' && !isFirstStep) {
        handleBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, isFirstStep, isLastStep])

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1)
      setCurrentStep(prev => prev + 1)
    } else {
      // Complete the journey
      const inputs: FundInputs = {
        fundType,
        fundSize,
        fundTerm,
        investmentPeriod,
        gpCommitment: 2,
        navGrowthRate: 0
      }

      const phases: FeePhase[] = [
        {
          id: 'phase-1',
          startYear: 1,
          endYear: investmentPeriod,
          feeBase: 'Committed Capital',
          feeRate: phase1Rate
        },
        {
          id: 'phase-2',
          startYear: investmentPeriod + 1,
          endYear: fundTerm,
          feeBase: 'Invested Cost',
          feeRate: phase2Rate
        }
      ]

      onComplete(inputs, phases)
    }
  }, [currentStep, fundType, fundSize, fundTerm, investmentPeriod, phase1Rate, phase2Rate, onComplete])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleFundTypeSelect = (type: FundType) => {
    setFundType(type)
    const defaults = fundTypeDefaults[type]
    setFundTerm(defaults.term)
    setInvestmentPeriod(defaults.ip)
    setPhase1Rate(defaults.feeRate)
    setPhase2Rate(Math.max(defaults.feeRate - 0.5, 0.75))
  }

  const handleContinueExisting = () => {
    if (existingData) {
      onComplete(existingData.inputs, existingData.phases)
    }
  }

  const handleStartFresh = () => {
    setShowWelcomeBack(false)
    setCurrentStep(0)
  }

  // Calculate preview values
  const totalFees = (fundSize * phase1Rate / 100 * investmentPeriod) +
                    (fundSize * 0.7 * phase2Rate / 100 * (fundTerm - investmentPeriod))

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      y: direction > 0 ? -40 : 40,
      opacity: 0,
    }),
  }

  // Welcome back modal for returning users
  if (showWelcomeBack) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1220]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg mx-4 p-8 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">
              You have a previous fee model saved. Would you like to continue where you left off?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleContinueExisting}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-400 hover:to-orange-400 transition-all"
            >
              Continue with saved model
            </button>
            <button
              onClick={handleStartFresh}
              className="w-full p-4 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
            >
              Start fresh
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0B1220] overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0B1220] to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/20 via-transparent to-transparent" />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Skip button (appears after first step) */}
      {currentStep > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onSkip}
          className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors flex items-center gap-1"
        >
          Skip to calculator
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      )}

      {/* Back button */}
      {currentStep > 0 && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleBack}
          className="absolute top-6 left-6 text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>
      )}

      {/* Step indicators */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentStep
                ? 'w-6 bg-amber-400'
                : i < currentStep
                ? 'bg-amber-400/60'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Main content area */}
      <div className="relative h-full flex flex-col items-center justify-center px-6 py-20">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-2xl"
          >
            {/* Welcome Step */}
            {step.id === 'welcome' && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20"
                >
                  <DollarSign className="h-10 w-10 text-white" />
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight"
                >
                  Management Fee Calculator
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-slate-400 mb-12 max-w-md mx-auto leading-relaxed"
                >
                  Model your fund's management fee structure and understand how it impacts GP economics over the fund lifecycle.
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8"
                >
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="text-2xl font-bold text-amber-400 mb-1">2 min</div>
                    <div className="text-xs text-slate-500">to complete</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="text-2xl font-bold text-amber-400 mb-1">5</div>
                    <div className="text-xs text-slate-500">questions</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="text-2xl font-bold text-amber-400 mb-1">Free</div>
                    <div className="text-xs text-slate-500">forever</div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Fund Type Step */}
            {step.id === 'fund-type' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Building2 className="h-6 w-6 text-amber-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">What type of fund?</h2>
                  <p className="text-slate-400">Different fund types have different fee conventions</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fundTypeOptions.map((option) => (
                    <motion.button
                      key={option.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleFundTypeSelect(option.type)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        fundType === option.type
                          ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-400/50'
                          : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-semibold text-white text-sm mb-1">{option.type}</div>
                      <div className="text-xs text-slate-500 mb-2 line-clamp-2">{option.description}</div>
                      <div className="text-xs font-medium text-amber-400">{option.typicalFee} typical</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Fund Size Step */}
            {step.id === 'fund-size' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <DollarSign className="h-6 w-6 text-amber-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Target fund size?</h2>
                  <p className="text-slate-400">Total capital commitments you're targeting</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">$</span>
                    <Input
                      type="number"
                      value={fundSize}
                      onChange={(e) => setFundSize(parseFloat(e.target.value) || 50)}
                      className="pl-10 pr-16 h-16 text-3xl font-bold text-center bg-slate-800/50 border-slate-700 text-white focus:border-amber-400 focus:ring-amber-400/20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">million</span>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {[25, 50, 100, 150, 200, 500].map((size) => (
                      <button
                        key={size}
                        onClick={() => setFundSize(size)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          fundSize === size
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        ${size}M
                      </button>
                    ))}
                  </div>

                  <p className="text-center text-sm text-slate-500 mt-6">
                    At ${fundSize}M, your annual management fee income would be approximately ${(fundSize * phase1Rate / 100).toFixed(1)}M
                  </p>
                </div>
              </div>
            )}

            {/* Timeline Step */}
            {step.id === 'timeline' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Clock className="h-6 w-6 text-amber-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Fund timeline</h2>
                  <p className="text-slate-400">How long is the fund term and investment period?</p>
                </div>

                <div className="max-w-md mx-auto space-y-8">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white font-medium">Fund Term</span>
                      <span className="text-2xl font-bold text-amber-400">{fundTerm} years</span>
                    </div>
                    <Slider
                      value={[fundTerm]}
                      onValueChange={([v]) => {
                        setFundTerm(v)
                        if (investmentPeriod > v - 2) setInvestmentPeriod(Math.max(2, v - 2))
                      }}
                      min={5}
                      max={15}
                      step={1}
                      className="[&_[role=slider]]:bg-amber-400 [&_[role=slider]]:border-amber-400 [&_.bg-primary]:bg-amber-400"
                    />
                    <p className="text-xs text-slate-500 mt-2">Total lifecycle of the fund</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white font-medium">Investment Period</span>
                      <span className="text-2xl font-bold text-amber-400">{investmentPeriod} years</span>
                    </div>
                    <Slider
                      value={[investmentPeriod]}
                      onValueChange={([v]) => setInvestmentPeriod(v)}
                      min={2}
                      max={fundTerm - 2}
                      step={1}
                      className="[&_[role=slider]]:bg-amber-400 [&_[role=slider]]:border-amber-400 [&_.bg-primary]:bg-amber-400"
                    />
                    <p className="text-xs text-slate-500 mt-2">Period when new investments can be made</p>
                  </div>

                  {/* Visual timeline */}
                  <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1">
                        <div className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${(investmentPeriod / fundTerm) * 100}%` }} />
                      </div>
                      <div className="flex-1">
                        <div className="h-3 rounded-full bg-slate-600" />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Year 1</span>
                      <span>Investment Period (Yr 1-{investmentPeriod})</span>
                      <span>Harvest (Yr {investmentPeriod + 1}-{fundTerm})</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fee Structure Step */}
            {step.id === 'fee-structure' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Percent className="h-6 w-6 text-amber-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Fee structure</h2>
                  <p className="text-slate-400">Set your management fee rates for each period</p>
                </div>

                <div className="max-w-md mx-auto space-y-8">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/20">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-white font-medium">Investment Period Fee</span>
                        <p className="text-xs text-slate-400">Years 1-{investmentPeriod} on committed capital</p>
                      </div>
                      <span className="text-3xl font-bold text-amber-400">{phase1Rate.toFixed(2)}%</span>
                    </div>
                    <Slider
                      value={[phase1Rate]}
                      onValueChange={([v]) => setPhase1Rate(v)}
                      min={0.5}
                      max={3.0}
                      step={0.1}
                      className="[&_[role=slider]]:bg-amber-400 [&_[role=slider]]:border-amber-400 [&_.bg-primary]:bg-amber-400"
                    />
                  </div>

                  <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-white font-medium">Harvest Period Fee</span>
                        <p className="text-xs text-slate-400">Years {investmentPeriod + 1}-{fundTerm} on invested capital</p>
                      </div>
                      <span className="text-3xl font-bold text-slate-300">{phase2Rate.toFixed(2)}%</span>
                    </div>
                    <Slider
                      value={[phase2Rate]}
                      onValueChange={([v]) => setPhase2Rate(v)}
                      min={0.5}
                      max={2.5}
                      step={0.1}
                      className="[&_[role=slider]]:bg-slate-400 [&_[role=slider]]:border-slate-400"
                    />
                  </div>

                  <div className="text-center p-4 rounded-xl bg-slate-800/30">
                    <p className="text-slate-400 text-sm">Estimated total fees over fund life</p>
                    <p className="text-3xl font-bold text-white mt-1">${totalFees.toFixed(1)}M</p>
                    <p className="text-xs text-slate-500 mt-1">{((totalFees / fundSize) * 100).toFixed(1)}% of commitments</p>
                  </div>
                </div>
              </div>
            )}

            {/* Review Step */}
            {step.id === 'review' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Ready to calculate</h2>
                  <p className="text-slate-400">Review your inputs and see the full analysis</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Fund Type</span>
                      <span className="text-white font-semibold">{fundType}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Fund Size</span>
                      <span className="text-white font-semibold">${fundSize}M</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Timeline</span>
                      <span className="text-white font-semibold">{fundTerm} years ({investmentPeriod}yr IP)</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Fee Rates</span>
                      <span className="text-white font-semibold">{phase1Rate}% → {phase2Rate}%</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30 text-center">
                    <p className="text-slate-300 text-sm mb-1">Estimated Total Management Fees</p>
                    <p className="text-4xl font-bold text-white">${totalFees.toFixed(1)}M</p>
                    <p className="text-amber-400 text-sm mt-1">over {fundTerm} years</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Continue button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-8 left-0 right-0 flex justify-center px-6"
        >
          <Button
            onClick={handleNext}
            size="lg"
            className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 rounded-full shadow-lg shadow-amber-500/25"
          >
            {isLastStep ? (
              <>
                See Full Analysis
                <Check className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="ml-1 h-5 w-5" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Keyboard hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-slate-600">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-1">Enter</kbd> to continue
          {!isFirstStep && (
            <>
              {' '}or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 mx-1">Esc</kbd> to go back
            </>
          )}
        </div>
      </div>
    </div>
  )
}
