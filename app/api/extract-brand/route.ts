import { NextRequest, NextResponse } from 'next/server'
import { Vibrant } from 'node-vibrant/node'

interface ExtractBrandRequest {
  websiteUrl: string
}

function normalizeUrl(url: string): string {
  // Remove protocol and www prefix to get clean domain
  let domain = url.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0] // Remove path

  return domain
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export async function POST(request: NextRequest) {
  try {
    const body: ExtractBrandRequest = await request.json()
    const { websiteUrl } = body

    if (!websiteUrl) {
      return NextResponse.json(
        { success: false, error: 'Website URL is required' },
        { status: 400 }
      )
    }

    const domain = normalizeUrl(websiteUrl)

    // Get favicon URL from Google's Favicon API (returns high-quality icons)
    const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(domain)}`

    // Fetch the favicon image
    const faviconResponse = await fetch(faviconUrl)
    if (!faviconResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Could not fetch favicon from website' },
        { status: 400 }
      )
    }

    // Convert to buffer for vibrant processing
    const imageBuffer = await faviconResponse.arrayBuffer()
    const buffer = Buffer.from(imageBuffer)

    // Extract colors using node-vibrant
    let primaryColor = '#2563eb' // Default blue
    let secondaryColor = '#1e40af' // Darker blue
    let accentColor = '#3b82f6' // Lighter blue

    try {
      const palette = await Vibrant.from(buffer).getPalette()

      // Use vibrant as primary, or fall back through the palette
      if (palette.Vibrant) {
        primaryColor = rgbToHex(...palette.Vibrant.rgb as [number, number, number])
      } else if (palette.DarkVibrant) {
        primaryColor = rgbToHex(...palette.DarkVibrant.rgb as [number, number, number])
      } else if (palette.LightVibrant) {
        primaryColor = rgbToHex(...palette.LightVibrant.rgb as [number, number, number])
      }

      // Use dark vibrant or muted for secondary
      if (palette.DarkVibrant) {
        secondaryColor = rgbToHex(...palette.DarkVibrant.rgb as [number, number, number])
      } else if (palette.DarkMuted) {
        secondaryColor = rgbToHex(...palette.DarkMuted.rgb as [number, number, number])
      } else if (palette.Muted) {
        secondaryColor = rgbToHex(...palette.Muted.rgb as [number, number, number])
      }

      // Use light vibrant or light muted for accent
      if (palette.LightVibrant) {
        accentColor = rgbToHex(...palette.LightVibrant.rgb as [number, number, number])
      } else if (palette.LightMuted) {
        accentColor = rgbToHex(...palette.LightMuted.rgb as [number, number, number])
      } else if (palette.Vibrant) {
        // Lighten the vibrant color for accent
        const rgb = palette.Vibrant.rgb
        accentColor = rgbToHex(
          Math.min(255, rgb[0] + 40),
          Math.min(255, rgb[1] + 40),
          Math.min(255, rgb[2] + 40)
        )
      }
    } catch (colorError) {
      console.warn('Color extraction failed, using defaults:', colorError)
      // Keep default colors if extraction fails
    }

    return NextResponse.json({
      success: true,
      brand: {
        logoUrl: faviconUrl,
        primaryColor,
        secondaryColor,
        accentColor,
      },
    })
  } catch (error) {
    console.error('Brand extraction error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to extract brand information' },
      { status: 500 }
    )
  }
}
