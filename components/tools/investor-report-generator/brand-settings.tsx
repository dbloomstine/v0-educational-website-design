"use client"

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Globe,
  Loader2,
  RefreshCw,
  Upload,
  Palette,
  Check,
  X,
  Sparkles,
  ImageIcon,
} from 'lucide-react'
import { BrandSettings } from './types'

interface BrandSettingsProps {
  brandSettings: BrandSettings
  onBrandSettingsChange: (settings: BrandSettings) => void
}

export function BrandSettingsPanel({
  brandSettings,
  onBrandSettingsChange,
}: BrandSettingsProps) {
  const [websiteUrl, setWebsiteUrl] = useState(brandSettings.websiteUrl || '')
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExtractBrand = async () => {
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL')
      return
    }

    setIsExtracting(true)
    setError(null)

    try {
      const response = await fetch('/api/extract-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: websiteUrl.trim() }),
      })

      const data = await response.json()

      if (data.success && data.brand) {
        onBrandSettingsChange({
          websiteUrl: websiteUrl.trim(),
          logoUrl: data.brand.logoUrl,
          primaryColor: data.brand.primaryColor,
          secondaryColor: data.brand.secondaryColor,
          accentColor: data.brand.accentColor,
          isAutoExtracted: true,
          lastExtracted: new Date(),
        })
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      } else {
        setError(data.error || 'Failed to extract brand')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleColorChange = (colorType: 'primaryColor' | 'secondaryColor' | 'accentColor', value: string) => {
    onBrandSettingsChange({
      ...brandSettings,
      [colorType]: value,
      isAutoExtracted: false, // Mark as manually modified
    })
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        onBrandSettingsChange({
          ...brandSettings,
          logoUrl: dataUrl,
          isAutoExtracted: false,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClearBrand = () => {
    onBrandSettingsChange({
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      accentColor: '#3b82f6',
      isAutoExtracted: false,
    })
    setWebsiteUrl('')
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          Brand Customization
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            Optional - for PDF styling
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="website-url" className="text-sm">
            Extract from Website
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="website-url"
                type="url"
                placeholder="https://yourfirm.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleExtractBrand}
              disabled={isExtracting || !websiteUrl.trim()}
              className="gap-2"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : showSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  Done!
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extract
                </>
              )}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Brand Preview */}
        {(brandSettings.logoUrl || brandSettings.isAutoExtracted) && (
          <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
            {/* Logo */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-lg border bg-white flex items-center justify-center overflow-hidden">
                {brandSettings.logoUrl ? (
                  <img
                    src={brandSettings.logoUrl}
                    alt="Brand logo"
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
              >
                <Upload className="w-5 h-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>

            {/* Color Swatches */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Primary</label>
                  <input
                    type="color"
                    value={brandSettings.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Secondary</label>
                  <input
                    type="color"
                    value={brandSettings.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Accent</label>
                  <input
                    type="color"
                    value={brandSettings.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                  />
                </div>
              </div>

              {brandSettings.isAutoExtracted && brandSettings.lastExtracted && (
                <p className="text-xs text-muted-foreground">
                  Auto-extracted {new Date(brandSettings.lastExtracted).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1">
              {brandSettings.websiteUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExtractBrand}
                  disabled={isExtracting}
                  className="h-8 px-2"
                  title="Refresh brand"
                >
                  <RefreshCw className={`h-4 w-4 ${isExtracting ? 'animate-spin' : ''}`} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearBrand}
                className="h-8 px-2 text-muted-foreground hover:text-destructive"
                title="Clear brand"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Preview Strip */}
        {!brandSettings.logoUrl && !brandSettings.isAutoExtracted && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: brandSettings.primaryColor }}
              />
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: brandSettings.secondaryColor }}
              />
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: brandSettings.accentColor }}
              />
            </div>
            <span>Default colors - enter URL to auto-extract your brand</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
