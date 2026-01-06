'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { WaterfallOutput, formatCurrency } from './waterfallCalculations'

// Confetti Celebration Effect
export function Confetti({ show, duration = 3000 }: { show: boolean; duration?: number }) {
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    color: string
    delay: number
    rotation: number
  }>>([])

  useEffect(() => {
    if (show) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ['#f59e0b', '#fbbf24', '#f97316', '#ef4444', '#a855f7', '#3b82f6', '#10b981'][
          Math.floor(Math.random() * 7)
        ],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360
      }))
      setParticles(newParticles)

      const timer = setTimeout(() => setParticles([]), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, y: -20, x: `${p.x}%`, rotate: 0 }}
          animate={{
            opacity: 0,
            y: '110vh',
            rotate: p.rotation * 2
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: p.delay,
            ease: 'easeIn'
          }}
          className="absolute top-0 w-3 h-3"
          style={{
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px'
          }}
        />
      ))}
    </div>
  )
}

// Animated Counter
export function AnimatedCounter({
  value,
  duration = 1.5,
  prefix = '',
  suffix = '',
  className = ''
}: {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const spring = useSpring(0, { duration: duration * 1000 })
  const display = useTransform(spring, (latest) => `${prefix}${Math.floor(latest).toLocaleString()}${suffix}`)

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  )
}

// Animated Waterfall Flow Visualization
export function WaterfallFlowAnimation({
  output,
  isPlaying = true
}: {
  output: WaterfallOutput
  isPlaying?: boolean
}) {
  const [currentTier, setCurrentTier] = useState(0)
  const [_flowAmount, setFlowAmount] = useState(0)

  const tierColors = [
    { bg: 'from-blue-400 to-blue-500', water: 'bg-blue-400' },
    { bg: 'from-green-400 to-green-500', water: 'bg-green-400' },
    { bg: 'from-purple-400 to-purple-500', water: 'bg-purple-400' },
    { bg: 'from-amber-400 to-amber-500', water: 'bg-amber-400' }
  ]

  useEffect(() => {
    if (!isPlaying) return

    let tier = 0
    const interval = setInterval(() => {
      tier = (tier + 1) % (output.tiers.length + 1)
      setCurrentTier(tier)
      if (tier > 0 && tier <= output.tiers.length) {
        setFlowAmount(output.tiers[tier - 1].total)
      } else {
        setFlowAmount(output.input.grossProceeds)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isPlaying, output])

  return (
    <div className="relative bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6 overflow-hidden">
      {/* Top reservoir (Gross Proceeds) */}
      <div className="relative h-20 mb-4">
        <motion.div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg"
          initial={{ height: 0 }}
          animate={{ height: currentTier === 0 ? '100%' : '30%' }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {formatCurrency(output.input.grossProceeds)}
            </span>
          </div>
          {/* Water ripple effect */}
          <motion.div
            className="absolute inset-x-0 top-0 h-2 bg-white/30"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
        <div className="absolute bottom-0 left-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-cyan-400 transform -translate-x-1/2 translate-y-full" />
      </div>

      {/* Waterfall tiers */}
      <div className="space-y-2">
        {output.tiers.map((tier, index) => (
          <motion.div
            key={tier.tier}
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
          >
            {/* Tier container */}
            <div
              className={`relative h-16 rounded-lg overflow-hidden border-2 ${
                currentTier === index + 1
                  ? 'border-primary shadow-lg'
                  : 'border-transparent'
              }`}
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-r opacity-20 dark:opacity-30 ${tierColors[index % tierColors.length].bg}" />

              {/* Fill animation */}
              <motion.div
                className={`absolute inset-y-0 left-0 ${tierColors[index % tierColors.length].water}`}
                initial={{ width: 0 }}
                animate={{
                  width: currentTier > index
                    ? `${(tier.total / output.totalDistributed) * 100}%`
                    : 0
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {/* Water shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['0%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>

              {/* Labels */}
              <div className="relative z-10 h-full flex items-center justify-between px-4">
                <div>
                  <p className="font-semibold text-sm">{tier.name}</p>
                  <p className="text-xs text-muted-foreground">Tier {tier.tier}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(tier.total)}</p>
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-600 dark:text-green-400">
                      LP: {formatCurrency(tier.toLPs)}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400">
                      GP: {formatCurrency(tier.toGP)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connecting waterfall */}
            {index < output.tiers.length - 1 && (
              <div className="h-4 flex justify-center">
                <motion.div
                  className={`w-1 ${tierColors[index % tierColors.length].water} rounded-full`}
                  animate={{
                    height: currentTier > index + 1 ? '100%' : 0,
                    opacity: currentTier > index + 1 ? 1 : 0
                  }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Final reservoirs (LP & GP) */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <motion.div
          className="relative h-24 rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-300 dark:border-green-700"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-green-500 to-emerald-400"
            animate={{
              height: currentTier > output.tiers.length
                ? `${(output.totalToLPs / output.totalDistributed) * 100}%`
                : 0
            }}
            transition={{ duration: 1 }}
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center">
            <p className="text-xs font-medium text-green-700 dark:text-green-300">LP Distributions</p>
            <p className="text-lg font-bold text-green-800 dark:text-green-200">
              {formatCurrency(output.totalToLPs)}
            </p>
          </div>
        </motion.div>

        <motion.div
          className="relative h-24 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 border-2 border-purple-300 dark:border-purple-700"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-purple-500 to-violet-400"
            animate={{
              height: currentTier > output.tiers.length
                ? `${(output.totalToGP / output.totalDistributed) * 100}%`
                : 0
            }}
            transition={{ duration: 1 }}
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-300">GP Distributions</p>
            <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
              {formatCurrency(output.totalToGP)}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Floating Bubbles Background Effect
export function FloatingBubbles({ count = 15 }: { count?: number }) {
  const [bubbles] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 30 + 10,
      x: Math.random() * 100,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5
    }))
  )

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full bg-primary/5"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.x}%`
          }}
          initial={{ y: '110%', opacity: 0 }}
          animate={{
            y: '-10%',
            opacity: [0, 0.5, 0.5, 0]
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  )
}

// Success Checkmark Animation
export function SuccessCheckmark({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center"
        >
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-10 h-10 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path d="M5 13l4 4L19 7" />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Pulsing Glow Effect
export function PulsingGlow({ color = 'primary', size = 'md' }: { color?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full bg-${color}-500`}
      animate={{
        boxShadow: [
          `0 0 0 0 rgba(var(--${color}), 0.4)`,
          `0 0 0 10px rgba(var(--${color}), 0)`,
          `0 0 0 0 rgba(var(--${color}), 0)`
        ]
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  )
}

// Sparkle Effect
export function SparkleEffect({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: Math.cos((i / 8) * Math.PI * 2) * 30,
            y: Math.sin((i / 8) * Math.PI * 2) * 30
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.1
          }}
          className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-400 rounded-full"
          style={{ marginLeft: -4, marginTop: -4 }}
        />
      ))}
    </div>
  )
}

// Number Fly Animation (for XP gains)
export function FlyingNumber({
  value,
  show,
  onComplete
}: {
  value: string
  show: boolean
  onComplete: () => void
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 1500)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 1, 0], y: -50, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute top-0 left-1/2 -translate-x-1/2 text-amber-500 font-bold text-xl whitespace-nowrap"
        >
          {value}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Tier Highlight Animation
export function TierHighlight({
  tierNumber,
  color
}: {
  tierNumber: number
  color: string
}) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}
    >
      {tierNumber}
    </motion.div>
  )
}

// Progress Ring Animation
export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  color = 'primary'
}: {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted stroke-current"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className={`text-${color}-500 stroke-current`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}
