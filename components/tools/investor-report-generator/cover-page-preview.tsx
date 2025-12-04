"use client"

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, Edit2, Upload, Trash2 } from 'lucide-react'
import { BrandSettings, GenerationSettings } from './types'

interface CoverPagePreviewProps {
  settings: GenerationSettings
  brandSettings?: BrandSettings
  onSettingsChange: (settings: Partial<GenerationSettings>) => void
  onBrandSettingsChange?: (settings: BrandSettings) => void
}

export function CoverPagePreview({
  settings,
  brandSettings,
  onSettingsChange,
  onBrandSettingsChange,
}: CoverPagePreviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const primaryColor = brandSettings?.primaryColor || '#2563eb'
  const accentColor = brandSettings?.accentColor || '#3b82f6'

  const handleLogoClick = () => {
    fileInputRef.current?.click()
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onBrandSettingsChange || !brandSettings) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return
    }

    // Convert to data URL
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      onBrandSettingsChange({
        ...brandSettings,
        logoUrl: dataUrl,
      })
    }
    reader.readAsDataURL(file)

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onBrandSettingsChange || !brandSettings) return
    onBrandSettingsChange({
      ...brandSettings,
      logoUrl: undefined,
    })
  }

  const handleStartEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValues({ ...editValues, [field]: currentValue })
  }

  const handleSave = (field: string) => {
    const value = editValues[field]
    if (field === 'fundName') {
      onSettingsChange({ fundName: value })
    } else if (field === 'fundType') {
      onSettingsChange({ fundType: value })
    } else if (field === 'reportingPeriod') {
      onSettingsChange({ reportingPeriod: value })
    }
    setEditingField(null)
  }

  const handleCancel = () => {
    setEditingField(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') {
      handleSave(field)
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const renderEditableField = (
    field: string,
    value: string,
    placeholder: string,
    className: string
  ) => {
    if (editingField === field) {
      return (
        <div className="flex items-center justify-center gap-2 w-full max-w-xs mx-auto">
          <Input
            value={editValues[field] || ''}
            onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
            onKeyDown={(e) => handleKeyDown(e, field)}
            className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 text-center flex-1"
            placeholder={placeholder}
            autoFocus
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleSave(field)}
            className="h-8 w-8 text-white hover:bg-white/20 flex-shrink-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancel}
            className="h-8 w-8 text-white/70 hover:bg-white/20 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )
    }

    return (
      <div
        className={`group cursor-text relative flex items-center justify-center gap-2 w-full ${className}`}
        onClick={() => handleStartEdit(field, value)}
      >
        <span className="text-center">{value || placeholder}</span>
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity absolute right-0" />
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Cover page mockup */}
        <div
          className="relative aspect-[8.5/11] max-h-[400px] flex flex-col items-center justify-center p-8 text-center"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
          }}
        >
          {/* Hidden file input for logo upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />

          {/* Clickable logo area */}
          {brandSettings?.logoUrl ? (
            <div
              className="relative group cursor-pointer mb-6"
              onClick={handleLogoClick}
            >
              <img
                src={brandSettings.logoUrl}
                alt="Logo"
                className="w-16 h-16 rounded-lg bg-white p-2 object-contain transition-opacity group-hover:opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <div className="p-1.5 bg-black/50 rounded-full">
                    <Upload className="h-3 w-3 text-white" />
                  </div>
                  <button
                    onClick={handleRemoveLogo}
                    className="p-1.5 bg-red-500/80 rounded-full hover:bg-red-500"
                  >
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="w-16 h-16 mb-6 rounded-lg bg-white/20 border-2 border-dashed border-white/40 flex flex-col items-center justify-center cursor-pointer hover:bg-white/30 hover:border-white/60 transition-colors group"
              onClick={handleLogoClick}
            >
              <Upload className="h-4 w-4 text-white/60 group-hover:text-white/80 mb-1" />
              <span className="text-white/60 text-xs group-hover:text-white/80">Logo</span>
            </div>
          )}

          {/* Editable fund name */}
          <div className="text-white mb-3 w-full px-4">
            {renderEditableField(
              'fundName',
              settings.fundName,
              'Fund Name',
              'text-2xl font-bold hover:bg-white/10 px-3 py-1 rounded transition-colors'
            )}
          </div>

          {/* Editable fund type - now a free text field */}
          <div className="text-white/90 text-sm mb-4 w-full px-4">
            {renderEditableField(
              'fundType',
              settings.fundType,
              'Fund Type (e.g., Venture Capital)',
              'hover:bg-white/10 px-2 py-0.5 rounded transition-colors'
            )}
          </div>

          {/* Editable reporting period */}
          <div className="text-white/80 text-sm w-full px-4">
            {renderEditableField(
              'reportingPeriod',
              settings.reportingPeriod,
              'Q4 2024',
              'hover:bg-white/10 px-2 py-0.5 rounded transition-colors'
            )}
          </div>

          {/* Generated date */}
          <p className="absolute bottom-6 text-white/50 text-xs">
            Generated {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          {/* Preview label */}
          <div className="absolute top-3 right-3 bg-black/20 backdrop-blur-sm text-white/80 text-xs px-2 py-1 rounded">
            Cover Page Preview
          </div>
        </div>

        {/* Helper text */}
        <div className="px-4 py-3 bg-muted/30 border-t text-xs text-muted-foreground text-center">
          Click any text or the logo to edit. Changes will appear in your PDF and Word exports.
        </div>
      </CardContent>
    </Card>
  )
}
