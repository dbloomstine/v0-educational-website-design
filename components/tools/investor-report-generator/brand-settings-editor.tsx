"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Palette, RotateCcw, Check } from 'lucide-react'
import { BrandSettings } from './types'

interface BrandSettingsEditorProps {
  brandSettings: BrandSettings
  onBrandSettingsChange: (settings: BrandSettings) => void
}

const DEFAULT_COLORS: BrandSettings = {
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#3b82f6',
  isAutoExtracted: false,
}

export function BrandSettingsEditor({
  brandSettings,
  onBrandSettingsChange,
}: BrandSettingsEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleColorChange = (key: keyof BrandSettings, value: string) => {
    onBrandSettingsChange({
      ...brandSettings,
      [key]: value,
      isAutoExtracted: false, // Mark as manually edited
    })
  }

  const handleReset = () => {
    onBrandSettingsChange(DEFAULT_COLORS)
  }

  const colorFields = [
    { key: 'primaryColor' as const, label: 'Primary', description: 'Main brand color' },
    { key: 'secondaryColor' as const, label: 'Secondary', description: 'Supporting color' },
    { key: 'accentColor' as const, label: 'Accent', description: 'Highlight color' },
  ]

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="py-3 px-4 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Brand Colors
            {brandSettings.isAutoExtracted && (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                Auto-extracted
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Color preview swatches */}
            <div className="flex gap-1">
              <div
                className="w-4 h-4 rounded-full border border-white/50 shadow-sm"
                style={{ backgroundColor: brandSettings.primaryColor }}
              />
              <div
                className="w-4 h-4 rounded-full border border-white/50 shadow-sm"
                style={{ backgroundColor: brandSettings.secondaryColor }}
              />
              <div
                className="w-4 h-4 rounded-full border border-white/50 shadow-sm"
                style={{ backgroundColor: brandSettings.accentColor }}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 px-4 pb-4">
          <div className="space-y-4">
            {colorFields.map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative">
                      <input
                        type="color"
                        value={brandSettings[field.key] as string}
                        onChange={(e) => handleColorChange(field.key, e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        style={{ padding: 0 }}
                      />
                    </div>
                    <Input
                      value={brandSettings[field.key] as string}
                      onChange={(e) => handleColorChange(field.key, e.target.value)}
                      className="h-8 w-24 font-mono text-xs uppercase"
                      placeholder="#000000"
                    />
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {field.description}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="h-3 w-3" />
                Reset to defaults
              </Button>

              {brandSettings.isAutoExtracted && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-green-500" />
                  Extracted from website
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
