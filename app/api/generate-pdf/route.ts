import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'

// Use default Helvetica font (built-in) to avoid font loading issues

interface BrandSettings {
  websiteUrl?: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  isAutoExtracted: boolean
}

interface GenerationSettings {
  fundName: string
  fundType: string // Free-form fund type (e.g., "Venture Capital", "Real Estate", "Private Credit")
  reportingPeriod: string
  tone: string
  format: string
  sections: Record<string, boolean>
}

interface NarrativeSection {
  id: string
  title: string
  content: string
}

interface GeneratedNarrative {
  fundName: string
  reportingPeriod: string
  sections: NarrativeSection[]
  generatedAt: string
}

// Helper to parse markdown content to simple segments
function parseMarkdownContent(content: string): Array<{ type: 'text' | 'bold' | 'italic' | 'bullet' | 'heading' | 'quote'; text: string }> {
  const segments: Array<{ type: 'text' | 'bold' | 'italic' | 'bullet' | 'heading' | 'quote'; text: string }> = []

  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('### ')) {
      segments.push({ type: 'heading', text: trimmed.replace(/^###\s*/, '') })
      continue
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      segments.push({ type: 'bullet', text: trimmed.replace(/^[-*]\s*/, '') })
      continue
    }

    if (trimmed.startsWith('> ')) {
      segments.push({ type: 'quote', text: trimmed.replace(/^>\s*/, '') })
      continue
    }

    segments.push({ type: 'text', text: trimmed })
  }

  return segments
}

// Parse inline formatting and return plain text segments with formatting flags
function parseInlineFormatting(text: string): Array<{ text: string; bold?: boolean; italic?: boolean }> {
  const parts: Array<{ text: string; bold?: boolean; italic?: boolean }> = []

  let remaining = text
  const boldRegex = /\*\*([^*]+)\*\*/g
  const italicRegex = /\*([^*]+)\*/g

  remaining = remaining.replace(boldRegex, '___BOLD_START___$1___BOLD_END___')
  remaining = remaining.replace(italicRegex, '___ITALIC_START___$1___ITALIC_END___')

  const segments = remaining.split(/(___(?:BOLD|ITALIC)_(?:START|END)___)/g).filter(Boolean)

  let currentBold = false
  let currentItalic = false

  for (const segment of segments) {
    if (segment === '___BOLD_START___') {
      currentBold = true
    } else if (segment === '___BOLD_END___') {
      currentBold = false
    } else if (segment === '___ITALIC_START___') {
      currentItalic = true
    } else if (segment === '___ITALIC_END___') {
      currentItalic = false
    } else if (segment) {
      parts.push({ text: segment, bold: currentBold, italic: currentItalic })
    }
  }

  return parts
}

function createStyles(brandSettings: BrandSettings) {
  return StyleSheet.create({
    coverPage: {
      padding: 50,
      backgroundColor: brandSettings.primaryColor,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    },
    coverLogo: {
      width: 80,
      height: 80,
      marginBottom: 40,
      backgroundColor: 'white',
      borderRadius: 10,
    },
    coverTitle: {
      fontSize: 32,
      fontFamily: 'Helvetica-Bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: 16,
    },
    coverSubtitle: {
      fontSize: 18,
      fontFamily: 'Helvetica',
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
      marginBottom: 8,
    },
    coverPeriod: {
      fontSize: 14,
      fontFamily: 'Helvetica',
      color: 'rgba(255,255,255,0.7)',
      textAlign: 'center',
      marginTop: 20,
    },
    coverDate: {
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
      position: 'absolute',
      bottom: 50,
    },
    page: {
      padding: 50,
      paddingTop: 70,
      paddingBottom: 70,
      fontFamily: 'Helvetica',
      fontSize: 11,
      color: '#333',
    },
    header: {
      position: 'absolute',
      top: 20,
      left: 50,
      right: 50,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e5e5',
    },
    headerLogo: {
      width: 24,
      height: 24,
    },
    headerText: {
      fontSize: 10,
      color: '#666',
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 50,
      right: 50,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#e5e5e5',
    },
    footerText: {
      fontSize: 9,
      color: '#999',
    },
    confidential: {
      fontSize: 8,
      color: '#999',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: 'Helvetica-Bold',
      color: brandSettings.primaryColor,
      marginBottom: 12,
      paddingBottom: 6,
      borderBottomWidth: 2,
      borderBottomColor: brandSettings.accentColor,
    },
    subheading: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: brandSettings.secondaryColor,
      marginTop: 12,
      marginBottom: 6,
    },
    paragraph: {
      fontSize: 11,
      lineHeight: 1.6,
      marginBottom: 10,
      color: '#444',
    },
    bulletContainer: {
      flexDirection: 'row',
      marginBottom: 4,
      paddingLeft: 10,
    },
    bulletPoint: {
      width: 15,
      fontSize: 11,
      color: brandSettings.primaryColor,
    },
    bulletText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 1.5,
      color: '#444',
    },
    quote: {
      borderLeftWidth: 3,
      borderLeftColor: brandSettings.accentColor,
      paddingLeft: 12,
      marginVertical: 8,
      backgroundColor: '#f9f9f9',
      padding: 10,
    },
    quoteText: {
      fontFamily: 'Helvetica-Oblique',
      color: '#555',
    },
    bold: {
      fontFamily: 'Helvetica-Bold',
    },
    italic: {
      fontFamily: 'Helvetica-Oblique',
    },
  })
}

// Create the PDF document component inline for server-side rendering
function InvestorReportDocument({
  narrative,
  settings,
  brandSettings,
  editedContent,
}: {
  narrative: GeneratedNarrative
  settings: GenerationSettings
  brandSettings: BrandSettings
  editedContent?: Record<string, string>
}) {
  const styles = createStyles(brandSettings)

  const getContent = (sectionId: string, originalContent: string) => {
    return editedContent?.[sectionId] ?? originalContent
  }

  // Helper to render formatted text with bold/italic
  const renderFormattedText = (text: string) => {
    const parts = parseInlineFormatting(text)
    return React.createElement(
      Text,
      null,
      parts.map((part, i) => {
        const textStyle = part.bold && part.italic
          ? { ...styles.bold, ...styles.italic }
          : part.bold
            ? styles.bold
            : part.italic
              ? styles.italic
              : undefined
        return React.createElement(
          Text,
          { key: i, style: textStyle },
          part.text
        )
      })
    )
  }

  return React.createElement(
    Document,
    null,
    // Cover Page
    React.createElement(
      Page,
      { size: 'A4', style: styles.coverPage },
      brandSettings.logoUrl &&
        React.createElement(Image, {
          src: brandSettings.logoUrl,
          style: styles.coverLogo,
        }),
      React.createElement(
        Text,
        { style: styles.coverTitle },
        settings.fundName || 'Investor Letter'
      ),
      React.createElement(
        Text,
        { style: styles.coverSubtitle },
        settings.fundType || 'Fund Report'
      ),
      React.createElement(
        Text,
        { style: styles.coverPeriod },
        settings.reportingPeriod || 'Quarterly Report'
      ),
      React.createElement(
        Text,
        { style: styles.coverDate },
        `Generated ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`
      )
    ),
    // Content Pages
    React.createElement(
      Page,
      { size: 'A4', style: styles.page, wrap: true },
      // Header
      React.createElement(
        View,
        { style: styles.header, fixed: true },
        brandSettings.logoUrl &&
          React.createElement(Image, {
            src: brandSettings.logoUrl,
            style: styles.headerLogo,
          }),
        React.createElement(
          Text,
          { style: styles.headerText },
          `${settings.fundName} | ${settings.reportingPeriod}`
        )
      ),
      // Sections
      ...narrative.sections.map((section) => {
        const content = getContent(section.id, section.content)
        const segments = parseMarkdownContent(content)

        return React.createElement(
          View,
          { key: section.id, style: styles.section, wrap: false },
          React.createElement(Text, { style: styles.sectionTitle }, section.title),
          ...segments.map((segment, idx) => {
            if (segment.type === 'heading') {
              return React.createElement(
                Text,
                { key: idx, style: styles.subheading },
                segment.text
              )
            }

            if (segment.type === 'bullet') {
              return React.createElement(
                View,
                { key: idx, style: styles.bulletContainer },
                React.createElement(Text, { style: styles.bulletPoint }, '•'),
                React.createElement(
                  View,
                  { style: styles.bulletText },
                  renderFormattedText(segment.text)
                )
              )
            }

            if (segment.type === 'quote') {
              return React.createElement(
                View,
                { key: idx, style: styles.quote },
                React.createElement(
                  Text,
                  { style: styles.quoteText },
                  segment.text
                )
              )
            }

            return React.createElement(
              Text,
              { key: idx, style: styles.paragraph },
              renderFormattedText(segment.text)
            )
          })
        )
      }),
      // Footer
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(
          Text,
          { style: styles.confidential },
          'Confidential - For Investor Use Only'
        ),
        React.createElement(Text, {
          style: styles.footerText,
          render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Page ${pageNumber} of ${totalPages}`,
        })
      )
    )
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { narrative, settings, brandSettings, editedContent } = body

    if (!narrative || !settings) {
      return NextResponse.json(
        { success: false, error: 'Missing narrative or settings' },
        { status: 400 }
      )
    }

    // Default brand settings if none provided
    const brand: BrandSettings = brandSettings || {
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      accentColor: '#3b82f6',
      isAutoExtracted: false,
    }

    // Create the document element
    const doc = React.createElement(InvestorReportDocument, {
      narrative,
      settings,
      brandSettings: brand,
      editedContent,
    })

    // Render to buffer server-side
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(doc as any)

    // Return the PDF as a blob
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="investor-report.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
