'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  DollarSign,
  TrendingUp,
  Building2,
  Layers,
  Target,
  Percent,
  PieChart,
  Users,
  Clock,
  ArrowRight,
  Check,
  Calculator
} from 'lucide-react'
import { WaterfallInput, defaultInput } from './waterfallCalculations'

interface JourneyModeProps {
  onComplete: (input: WaterfallInput) => void
  onSkip: () => void
  existingData?: WaterfallInput | null
}

// Step configuration
const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'fund-size', title: 'Fund Size' },
  { id: 'waterfall-type', title: 'Waterfall Type' },
  { id: 'preferred-return', title: 'Preferred Return' },
  { id: 'catch-up', title: 'Catch-Up' },
  { id: 'carried-interest', title: 'Carried Interest' },
  { id: 'gp-commitment', title: 'GP Commitment' },
  { id: 'review', title: 'Review' },
] as const

type StepId = typeof STEPS[number]['id']

export function JourneyMode({ onComplete, onSkip, existingData }: JourneyModeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [showWelcomeBack, setShowWelcomeBack] = useState(!!existingData)

  // Form state
  const [fundSize, setFundSize] = useState(existingData?.fundSize || 100000000)
  const [contributedCapital, setContributedCapital] = useState(existingData?.contributedCapital || 100000000)
  const [grossProceeds, setGrossProceeds] = useState(existingData?.grossProceeds || 200000000)
  const [waterfallType, setWaterfallType] = useState<'european' | 'american'>(existingData?.waterfallType || 'european')
  const [prefRate, setPrefRate] = useState(existingData?.prefRate || 0.08)
  const [prefCompounding, setPrefCompounding] = useState<'simple' | 'compound'>(existingData?.prefCompounding || 'simple')
  const [catchUpRate, setCatchUpRate] = useState(existingData?.catchUpRate || 1.0)
  const [hasCatchUp, setHasCatchUp] = useState(existingData?.hasCatchUp ?? true)
  const [carryRate, setCarryRate] = useState(existingData?.carryRate || 0.20)
  const [gpCommitmentPercent, setGpCommitmentPercent] = useState(existingData?.gpCommitmentPercent || 0.02)
  const [yearsToExit, setYearsToExit] = useState(existingData?.yearsToExit || 5)

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
      const input: WaterfallInput = {
        fundSize,
        contributedCapital,
        grossProceeds,
        waterfallType,
        prefRate,
        prefCompounding,
        carryRate,
        catchUpRate,
        hasCatchUp,
        yearsToExit,
        gpCommitmentPercent
      }

      onComplete(input)
    }
  }, [currentStep, fundSize, contributedCapital, grossProceeds, waterfallType, prefRate, prefCompounding, carryRate, catchUpRate, hasCatchUp, yearsToExit, gpCommitmentPercent, onComplete])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleContinueExisting = () => {
    if (existingData) {
      onComplete(existingData)
    }
  }

  const handleStartFresh = () => {
    setShowWelcomeBack(false)
    setCurrentStep(0)
  }

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
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">
              You have a previous waterfall model saved. Would you like to continue where you left off?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleContinueExisting}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-medium hover:from-purple-400 hover:to-violet-400 transition-all"
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-400 to-violet-500"
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
                ? 'w-6 bg-purple-400'
                : i < currentStep
                ? 'bg-purple-400/60'
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
                  className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-500/20"
                >
                  <Sparkles className="h-10 w-10 text-white" />
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight"
                >
                  Distribution Waterfall
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-slate-400 mb-12 max-w-md mx-auto leading-relaxed"
                >
                  Model how fund proceeds flow through preferred return, GP catch-up, and carried interest tiers. Understand LP and GP economics.
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8"
                >
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="text-2xl font-bold text-purple-400 mb-1">2 min</div>
                    <div className="text-xs text-slate-500">to complete</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="text-2xl font-bold text-purple-400 mb-1">7</div>
                    <div className="text-xs text-slate-500">questions</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="text-2xl font-bold text-purple-400 mb-1">Free</div>
                    <div className="text-xs text-slate-500">forever</div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Fund Size Step */}
            {step.id === 'fund-size' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Building2 className="h-6 w-6 text-purple-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">How much is your fund?</h2>
                  <p className="text-slate-400">Total committed capital from LPs</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">$</span>
                    <Input
                      type="number"
                      value={fundSize / 1000000}
                      onChange={(e) => {
                        const sizeM = parseFloat(e.target.value) || 100
                        setFundSize(sizeM * 1000000)
                        setContributedCapital(sizeM * 1000000)
                        setGrossProceeds(sizeM * 2000000)
                      }}
                      className="pl-10 pr-16 h-16 text-3xl font-bold text-center bg-slate-800/50 border-slate-700 text-white focus:border-purple-400 focus:ring-purple-400/20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">million</span>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {[50, 100, 200, 500, 1000].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setFundSize(size * 1000000)
                          setContributedCapital(size * 1000000)
                          setGrossProceeds(size * 2000000)
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          fundSize === size * 1000000
                            ? 'bg-purple-400 text-slate-900'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        ${size}M
                      </button>
                    ))}
                  </div>

                  <p className="text-center text-sm text-slate-500 mt-6">
                    Typical ranges: Micro VC ($10-50M), Early-stage VC ($50-250M), Buyout PE ($500M-5B)
                  </p>
                </div>
              </div>
            )}

            {/* Waterfall Type Step */}
            {step.id === 'waterfall-type' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Layers className="h-6 w-6 text-purple-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">What waterfall structure?</h2>
                  <p className="text-slate-400">This determines when the GP can receive carry</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setWaterfallType('european')}
                    className={`p-6 rounded-xl text-left transition-all ${
                      waterfallType === 'european'
                        ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-2 border-purple-400/50'
                        : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl">🇪🇺</div>
                      <h4 className="font-semibold text-white text-lg">European (Whole-Fund)</h4>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      GP receives carry only after the entire fund returns capital + preferred return to all LPs
                    </p>
                    <ul className="text-xs text-slate-500 space-y-1">
                      <li>✓ More LP-friendly</li>
                      <li>✓ Standard in buyout PE</li>
                      <li>✓ No clawback needed</li>
                    </ul>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setWaterfallType('american')}
                    className={`p-6 rounded-xl text-left transition-all ${
                      waterfallType === 'american'
                        ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-2 border-purple-400/50'
                        : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl">🇺🇸</div>
                      <h4 className="font-semibold text-white text-lg">American (Deal-by-Deal)</h4>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      GP can receive carry on individual profitable deals before full fund is returned
                    </p>
                    <ul className="text-xs text-slate-500 space-y-1">
                      <li>✓ Earlier GP carry</li>
                      <li>✓ Common in VC</li>
                      <li>✓ Requires clawback provision</li>
                    </ul>
                  </motion.button>
                </div>
              </div>
            )}

            {/* Preferred Return Step */}
            {step.id === 'preferred-return' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Target className="h-6 w-6 text-purple-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">What is the preferred return?</h2>
                  <p className="text-slate-400">The annual hurdle LPs must receive before GP earns carry</p>
                </div>

                <div className="max-w-md mx-auto space-y-8">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white font-medium">Preferred Return Rate</span>
                      <span className="text-2xl font-bold text-purple-400">{(prefRate * 100).toFixed(1)}%</span>
                    </div>
                    <Slider
                      value={[prefRate * 100]}
                      onValueChange={([v]) => setPrefRate(v / 100)}
                      min={0}
                      max={12}
                      step={0.5}
                      className="[&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-purple-400 [&_.bg-primary]:bg-purple-400"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>0% (No hurdle)</span>
                      <span>8% (Standard)</span>
                      <span>12%</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setPrefCompounding('simple')}
                      className={`flex-1 p-4 rounded-xl text-left transition-all ${
                        prefCompounding === 'simple'
                          ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-2 border-purple-400/50'
                          : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-semibold text-white mb-1">Simple</div>
                      <div className="text-xs text-slate-400">Linear calculation</div>
                    </button>
                    <button
                      onClick={() => setPrefCompounding('compound')}
                      className={`flex-1 p-4 rounded-xl text-left transition-all ${
                        prefCompounding === 'compound'
                          ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-2 border-purple-400/50'
                          : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-semibold text-white mb-1">Compound</div>
                      <div className="text-xs text-slate-400">Compounds annually</div>
                    </button>
                  </div>

                  {prefRate > 0 && (
                    <div className="text-center p-4 rounded-xl bg-slate-800/30">
                      <p className="text-slate-400 text-sm">Over {yearsToExit} years, LPs get</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        ${(prefCompounding === 'simple'
                          ? contributedCapital * prefRate * yearsToExit
                          : contributedCapital * (Math.pow(1 + prefRate, yearsToExit) - 1)
                        / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-slate-500 mt-1">in preferred return</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Catch-Up Step */}
            {step.id === 'catch-up' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <PieChart className="h-6 w-6 text-purple-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Enable GP catch-up?</h2>
                  <p className="text-slate-400">Allows GP to catch up to their target carry percentage</p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setHasCatchUp(true)}
                      className={`p-6 rounded-xl text-center transition-all ${
                        hasCatchUp
                          ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-2 border-purple-400/50'
                          : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-3xl mb-2">✓</div>
                      <div className="font-semibold text-white">Yes</div>
                      <div className="text-xs text-slate-400 mt-1">Enable catch-up</div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setHasCatchUp(false)}
                      className={`p-6 rounded-xl text-center transition-all ${
                        !hasCatchUp
                          ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-2 border-purple-400/50'
                          : 'bg-slate-800/50 border-2 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-3xl mb-2">✗</div>
                      <div className="font-semibold text-white">No</div>
                      <div className="text-xs text-slate-400 mt-1">Skip catch-up</div>
                    </motion.button>
                  </div>

                  {hasCatchUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-white font-medium">Catch-Up Rate</span>
                          <span className="text-2xl font-bold text-purple-400">{(catchUpRate * 100).toFixed(0)}%</span>
                        </div>
                        <Slider
                          value={[catchUpRate * 100]}
                          onValueChange={([v]) => setCatchUpRate(v / 100)}
                          min={50}
                          max={100}
                          step={10}
                          className="[&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-purple-400 [&_.bg-primary]:bg-purple-400"
                        />
                        <p className="text-xs text-slate-500 mt-2">100% = GP gets all distributions during catch-up phase</p>
                      </div>
                    </motion.div>
                  )}

                  <div className="p-4 rounded-xl bg-slate-800/30">
                    <p className="text-sm text-slate-300">
                      {hasCatchUp
                        ? `After LPs receive their pref, GP gets ${(catchUpRate * 100).toFixed(0)}% of distributions until they've received ${(carryRate * 100).toFixed(0)}% of total profits.`
                        : `Without catch-up, GP earns ${(carryRate * 100).toFixed(0)}% carry only on profits ABOVE the preferred return.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Carried Interest Step */}
            {step.id === 'carried-interest' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Percent className="h-6 w-6 text-purple-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">What is the carry rate?</h2>
                  <p className="text-slate-400">GP's share of profits after clearing the hurdle</p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white font-medium">Carried Interest Rate</span>
                      <span className="text-2xl font-bold text-purple-400">{(carryRate * 100).toFixed(0)}%</span>
                    </div>
                    <Slider
                      value={[carryRate * 100]}
                      onValueChange={([v]) => setCarryRate(v / 100)}
                      min={10}
                      max={30}
                      step={1}
                      className="[&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-purple-400 [&_.bg-primary]:bg-purple-400"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>10%</span>
                      <span>20% (Standard)</span>
                      <span>30%</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {[15, 20, 25, 30].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setCarryRate(rate / 100)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          carryRate === rate / 100
                            ? 'bg-purple-400 text-slate-900'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-400/20 text-center">
                    <p className="text-slate-300 text-sm mb-1">At a 2.0x return</p>
                    <p className="text-3xl font-bold text-white">
                      ${((grossProceeds - contributedCapital) * carryRate / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-purple-400 text-sm mt-1">potential GP carry</p>
                  </div>
                </div>
              </div>
            )}

            {/* GP Commitment Step */}
            {step.id === 'gp-commitment' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 mb-4">
                    <Users className="h-6 w-6 text-purple-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">GP commitment size?</h2>
                  <p className="text-slate-400">How much skin in the game does the GP have?</p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white font-medium">GP Commitment</span>
                      <span className="text-2xl font-bold text-purple-400">{(gpCommitmentPercent * 100).toFixed(1)}%</span>
                    </div>
                    <Slider
                      value={[gpCommitmentPercent * 100]}
                      onValueChange={([v]) => setGpCommitmentPercent(v / 100)}
                      min={0.5}
                      max={5}
                      step={0.5}
                      className="[&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-purple-400 [&_.bg-primary]:bg-purple-400"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>0.5%</span>
                      <span>2-3% (Typical)</span>
                      <span>5%</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {[1, 2, 3, 5].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setGpCommitmentPercent(rate / 100)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          gpCommitmentPercent === rate / 100
                            ? 'bg-purple-400 text-slate-900'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>

                  <div className="text-center p-4 rounded-xl bg-slate-800/30">
                    <p className="text-slate-400 text-sm">GP commitment amount</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      ${((fundSize * gpCommitmentPercent) / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-slate-500 mt-1">of the ${(fundSize / 1000000).toFixed(0)}M fund</p>
                  </div>
                </div>
              </div>
            )}

            {/* Review Step */}
            {step.id === 'review' && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 mb-4">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Ready to visualize</h2>
                  <p className="text-slate-400">Review your waterfall parameters</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Fund Size</span>
                      <span className="text-white font-semibold">${(fundSize / 1000000).toFixed(0)}M</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Waterfall Type</span>
                      <span className="text-white font-semibold capitalize">{waterfallType}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Preferred Return</span>
                      <span className="text-white font-semibold">{(prefRate * 100).toFixed(1)}% ({prefCompounding})</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Carried Interest</span>
                      <span className="text-white font-semibold">{(carryRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">Catch-Up</span>
                      <span className="text-white font-semibold">{hasCatchUp ? `${(catchUpRate * 100).toFixed(0)}%` : 'None'}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-800/50">
                      <span className="text-slate-400">GP Commitment</span>
                      <span className="text-white font-semibold">{(gpCommitmentPercent * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-400/30 text-center">
                    <p className="text-slate-300 text-sm mb-1">Modeled at 2.0x return</p>
                    <p className="text-4xl font-bold text-white">${(grossProceeds / 1000000).toFixed(0)}M</p>
                    <p className="text-purple-400 text-sm mt-1">in gross proceeds</p>
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
            className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-purple-400 to-violet-500 hover:from-purple-300 hover:to-violet-400 text-slate-900 rounded-full shadow-lg shadow-purple-500/25"
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
