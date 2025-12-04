"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Shield,
  Lock,
  Eye,
  Server,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Monitor,
} from 'lucide-react'

export function SecurityPanel() {
  const [isExpanded, setIsExpanded] = useState(false)

  const securityFeatures = [
    {
      icon: Monitor,
      title: 'Browser-Based Processing',
      description: 'Your Excel, CSV, and Word files are parsed entirely in your browser. The raw files never leave your device.',
      badge: 'Client-Side',
    },
    {
      icon: Lock,
      title: 'Encrypted Transmission',
      description: 'When data is sent for AI processing, it travels over HTTPS with TLS 1.3 encryption.',
      badge: 'TLS 1.3',
    },
    {
      icon: Trash2,
      title: 'Zero Data Retention',
      description: 'We never store your fund data. Once your letter is generated, all processed data is immediately discarded.',
      badge: 'No Storage',
    },
    {
      icon: Eye,
      title: 'No Third-Party Sharing',
      description: 'Your data is only used to generate your letter. It is never shared with, sold to, or accessed by third parties.',
      badge: 'Private',
    },
  ]

  return (
    <Card className="border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10">
      <CardContent className="p-0">
        {/* Collapsed view */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-green-100/50 dark:hover:bg-green-900/20 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                Enterprise-Grade Security
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verified
                </span>
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your sensitive fund data is protected at every step
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-green-600 dark:text-green-400" />
          )}
        </button>

        {/* Expanded view */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="h-px bg-green-200 dark:bg-green-800" />

            <div className="grid gap-4 md:grid-cols-2">
              {securityFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    className="flex gap-3 p-3 rounded-lg bg-white/60 dark:bg-black/20 border border-green-100 dark:border-green-900"
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg h-fit">
                      <Icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-green-900 dark:text-green-100">
                          {feature.title}
                        </p>
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                          {feature.badge}
                        </span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Data flow diagram */}
            <div className="p-4 rounded-lg bg-white/60 dark:bg-black/20 border border-green-100 dark:border-green-900">
              <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-3">How Your Data Flows</p>
              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-col items-center gap-1">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Monitor className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-green-700 dark:text-green-300">Your Browser</span>
                  <span className="text-green-500 dark:text-green-500 text-[10px]">Files parsed here</span>
                </div>

                <div className="flex-1 flex items-center justify-center px-2">
                  <div className="flex items-center gap-1 text-green-400">
                    <div className="h-px flex-1 bg-green-300 dark:bg-green-700" />
                    <Lock className="w-3 h-3" />
                    <span className="text-[10px]">HTTPS</span>
                    <div className="h-px flex-1 bg-green-300 dark:bg-green-700" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Server className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-green-700 dark:text-green-300">AI Processing</span>
                  <span className="text-green-500 dark:text-green-500 text-[10px]">No data stored</span>
                </div>

                <div className="flex-1 flex items-center justify-center px-2">
                  <div className="flex items-center gap-1 text-green-400">
                    <div className="h-px flex-1 bg-green-300 dark:bg-green-700" />
                    <Lock className="w-3 h-3" />
                    <span className="text-[10px]">HTTPS</span>
                    <div className="h-px flex-1 bg-green-300 dark:bg-green-700" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Monitor className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-green-700 dark:text-green-300">Your Letter</span>
                  <span className="text-green-500 dark:text-green-500 text-[10px]">Stays with you</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
