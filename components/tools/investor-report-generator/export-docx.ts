import { GeneratedNarrative, GenerationSettings, BrandSettings } from './types'

export async function exportToWord(
  narrative: GeneratedNarrative,
  settings: GenerationSettings,
  editedContent?: Record<string, string>,
  brandSettings?: BrandSettings
): Promise<void> {
  try {
    const response = await fetch('/api/generate-docx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        narrative,
        settings,
        brandSettings,
        editedContent,
      }),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to generate Word document'
      try {
        const error = await response.json()
        errorMessage = error.error || errorMessage
      } catch {
        // Response might not be JSON
        errorMessage = `Failed to generate Word document (Status: ${response.status})`
      }
      throw new Error(errorMessage)
    }

    // Get the blob from response
    const blob = await response.blob()

    // Sanitize filename
    const sanitizedName = (settings.fundName || 'investor-report')
      .replace(/[\n\r]/g, ' ')
      .replace(/[<>:"/\\|?*]/g, '')
      .trim()

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${sanitizedName}.docx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Word export error:', error)
    throw error
  }
}
