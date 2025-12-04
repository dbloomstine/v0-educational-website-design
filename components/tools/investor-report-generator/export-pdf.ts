import { GeneratedNarrative, GenerationSettings, BrandSettings } from './types'

// Default brand settings if none provided
const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#3b82f6',
  isAutoExtracted: false,
}

export async function exportToPDF(
  narrative: GeneratedNarrative,
  settings: GenerationSettings,
  editedContent?: Record<string, string>,
  brandSettings?: BrandSettings
) {
  const brand = brandSettings || DEFAULT_BRAND_SETTINGS

  try {
    // Call the server-side PDF generation API
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        narrative,
        settings,
        brandSettings: brand,
        editedContent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to generate PDF')
    }

    // Get the PDF blob from the response
    const blob = await response.blob()

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0]
    const safeFundName = (settings.fundName || 'investor-letter')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const filename = `${safeFundName}-${settings.reportingPeriod?.toLowerCase().replace(/\s+/g, '-') || 'report'}-${dateStr}.pdf`

    // Trigger download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF export error:', error)
    throw error
  }
}
