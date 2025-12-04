import { NextRequest, NextResponse } from 'next/server'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  BorderStyle,
  convertInchesToTwip,
  Header,
  Footer,
  PageNumber,
} from 'docx'

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

// Convert hex color to RGB for docx
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? hex.replace('#', '') : '2563eb'
}

// Parse markdown content into structured elements
function parseMarkdownContent(content: string): Array<{
  type: 'paragraph' | 'bullet' | 'heading' | 'quote'
  text: string
  formatting?: Array<{ type: 'bold' | 'italic'; start: number; end: number }>
}> {
  const elements: Array<{
    type: 'paragraph' | 'bullet' | 'heading' | 'quote'
    text: string
    formatting?: Array<{ type: 'bold' | 'italic'; start: number; end: number }>
  }> = []

  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('### ')) {
      elements.push({
        type: 'heading',
        text: trimmed.replace(/^###\s*/, ''),
      })
      continue
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push({
        type: 'bullet',
        text: trimmed.replace(/^[-*]\s*/, ''),
      })
      continue
    }

    if (trimmed.startsWith('> ')) {
      elements.push({
        type: 'quote',
        text: trimmed.replace(/^>\s*/, ''),
      })
      continue
    }

    elements.push({
      type: 'paragraph',
      text: trimmed,
    })
  }

  return elements
}

// Parse inline formatting (bold, italic) and create TextRuns
function createTextRuns(text: string, brandColor: string): TextRun[] {
  const runs: TextRun[] = []
  let remaining = text

  // Replace bold markers with placeholders
  remaining = remaining.replace(/\*\*([^*]+)\*\*/g, '___BOLD_START___$1___BOLD_END___')
  // Replace italic markers with placeholders
  remaining = remaining.replace(/\*([^*]+)\*/g, '___ITALIC_START___$1___ITALIC_END___')

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
      runs.push(
        new TextRun({
          text: segment,
          bold: currentBold,
          italics: currentItalic,
          font: 'Calibri',
          size: 22, // 11pt
        })
      )
    }
  }

  return runs
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { narrative, settings, brandSettings, editedContent } = body as {
      narrative: GeneratedNarrative
      settings: GenerationSettings
      brandSettings?: BrandSettings
      editedContent?: Record<string, string>
    }

    if (!narrative || !settings) {
      return NextResponse.json(
        { success: false, error: 'Missing narrative or settings' },
        { status: 400 }
      )
    }

    const brand: BrandSettings = brandSettings || {
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      accentColor: '#3b82f6',
      isAutoExtracted: false,
    }

    const primaryColorHex = hexToRgb(brand.primaryColor)

    // Get content with edits applied
    const getContent = (sectionId: string, originalContent: string) => {
      return editedContent?.[sectionId] ?? originalContent
    }

    // Build document sections
    const docSections: Paragraph[] = []

    // Cover Page
    docSections.push(
      new Paragraph({
        children: [],
        spacing: { after: 4000 },
      })
    )

    // Fund Name Title
    docSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: settings.fundName || 'Investor Letter',
            bold: true,
            size: 72, // 36pt
            font: 'Calibri',
            color: primaryColorHex,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    )

    // Fund Type
    docSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: settings.fundType || 'Fund Report',
            size: 32, // 16pt
            font: 'Calibri',
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    )

    // Reporting Period
    docSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: settings.reportingPeriod || 'Quarterly Report',
            size: 28, // 14pt
            font: 'Calibri',
            color: '888888',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      })
    )

    // Generated Date
    docSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}`,
            size: 20, // 10pt
            font: 'Calibri',
            color: 'AAAAAA',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    )

    // Page break after cover
    docSections.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    )

    // Content sections
    for (const section of narrative.sections) {
      const content = getContent(section.id, section.content)
      const elements = parseMarkdownContent(content)

      // Section Title
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.title,
              bold: true,
              size: 32, // 16pt
              font: 'Calibri',
              color: primaryColorHex,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          border: {
            bottom: {
              color: primaryColorHex,
              size: 12,
              style: BorderStyle.SINGLE,
              space: 4,
            },
          },
        })
      )

      // Section content
      for (const element of elements) {
        if (element.type === 'heading') {
          docSections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: element.text,
                  bold: true,
                  size: 26, // 13pt
                  font: 'Calibri',
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            })
          )
        } else if (element.type === 'bullet') {
          docSections.push(
            new Paragraph({
              children: createTextRuns(element.text, primaryColorHex),
              bullet: {
                level: 0,
              },
              spacing: { after: 100 },
            })
          )
        } else if (element.type === 'quote') {
          docSections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: element.text,
                  italics: true,
                  size: 22,
                  font: 'Calibri',
                  color: '555555',
                }),
              ],
              indent: {
                left: convertInchesToTwip(0.5),
              },
              border: {
                left: {
                  color: primaryColorHex,
                  size: 24,
                  style: BorderStyle.SINGLE,
                  space: 8,
                },
              },
              spacing: { before: 200, after: 200 },
            })
          )
        } else {
          docSections.push(
            new Paragraph({
              children: createTextRuns(element.text, primaryColorHex),
              spacing: { after: 200 },
            })
          )
        }
      }

      // Add spacing between sections
      docSections.push(
        new Paragraph({
          children: [],
          spacing: { after: 300 },
        })
      )
    }

    // Create the document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1.25),
                right: convertInchesToTwip(1.25),
              },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${settings.fundName} | ${settings.reportingPeriod}`,
                      size: 18,
                      font: 'Calibri',
                      color: '999999',
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Confidential - For Investor Use Only',
                      size: 16,
                      font: 'Calibri',
                      color: '999999',
                    }),
                    new TextRun({
                      text: '    |    Page ',
                      size: 16,
                      font: 'Calibri',
                      color: '999999',
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 16,
                      font: 'Calibri',
                      color: '999999',
                    }),
                    new TextRun({
                      text: ' of ',
                      size: 16,
                      font: 'Calibri',
                      color: '999999',
                    }),
                    new TextRun({
                      children: [PageNumber.TOTAL_PAGES],
                      size: 16,
                      font: 'Calibri',
                      color: '999999',
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          },
          children: docSections,
        },
      ],
    })

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)

    // Sanitize filename - remove newlines and other invalid characters
    const sanitizedName = (settings.fundName || 'investor-report')
      .replace(/[\n\r]/g, ' ')  // Replace newlines with spaces
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
      .trim()

    // Return the Word document
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${sanitizedName}.docx"`,
      },
    })
  } catch (error) {
    console.error('Word generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate Word document' },
      { status: 500 }
    )
  }
}
