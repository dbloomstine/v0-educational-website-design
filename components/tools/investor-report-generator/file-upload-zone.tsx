"use client"

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, FileText, FileSpreadsheet, File, X, CheckCircle, AlertCircle, Loader2, Globe, Sparkles } from 'lucide-react'
import { ParsedData, PerformanceData, AttributionItem, ExtractedMetadata, ConfidenceLevel, BrandSettings } from './types'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'

interface FileUploadZoneProps {
  onFilesProcessed: (files: ParsedData[]) => void
  processedFiles: ParsedData[]
  onRemoveFile: (fileName: string) => void
  brandSettings: BrandSettings
  onBrandSettingsChange: (settings: BrandSettings) => void
}

const ACCEPTED_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
}

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  csv: <FileSpreadsheet className="h-4 w-4 text-green-500" />,
  xlsx: <FileSpreadsheet className="h-4 w-4 text-green-500" />,
  xls: <FileSpreadsheet className="h-4 w-4 text-green-500" />,
  docx: <FileText className="h-4 w-4 text-blue-500" />,
  txt: <FileText className="h-4 w-4 text-gray-500" />,
  pdf: <File className="h-4 w-4 text-red-500" />,
}

export function FileUploadZone({
  onFilesProcessed,
  processedFiles,
  onRemoveFile,
  brandSettings,
  onBrandSettingsChange,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [brandUrl, setBrandUrl] = useState(brandSettings.websiteUrl || '')
  const [isExtractingBrand, setIsExtractingBrand] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExtractBrand = async () => {
    if (!brandUrl.trim()) return

    setIsExtractingBrand(true)
    try {
      const response = await fetch('/api/extract-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: brandUrl.trim() }),
      })
      const data = await response.json()

      if (data.success && data.brand) {
        onBrandSettingsChange({
          websiteUrl: brandUrl.trim(),
          logoUrl: data.brand.logoUrl,
          primaryColor: data.brand.primaryColor,
          secondaryColor: data.brand.secondaryColor,
          accentColor: data.brand.accentColor,
          isAutoExtracted: true,
          lastExtracted: new Date(),
        })
      }
    } catch (err) {
      console.error('Brand extraction failed:', err)
    } finally {
      setIsExtractingBrand(false)
    }
  }

  const parseCSV = (text: string): { headers: string[], rows: string[][] } => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const rows = lines.slice(1).map(line => {
      // Handle quoted values with commas
      const matches = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)
      if (matches) {
        return matches.map(m => m.replace(/,$/g, '').replace(/^"|"$/g, '').trim())
      }
      return line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    })
    return { headers, rows }
  }

  const detectPerformanceData = (headers: string[], rows: string[][]): PerformanceData | null => {
    // Look for common performance-related column names
    const returnColIndex = headers.findIndex(h =>
      /return|performance|net|gross/i.test(h)
    )
    const benchmarkColIndex = headers.findIndex(h =>
      /benchmark|index|s&p|sp500/i.test(h)
    )
    const periodColIndex = headers.findIndex(h =>
      /period|date|month|quarter/i.test(h)
    )

    if (returnColIndex === -1) return null

    const latestRow = rows[rows.length - 1] || rows[0]

    const fundReturn = parseFloat(latestRow[returnColIndex]?.replace(/[%,]/g, '')) || 0
    const benchmarkReturn = benchmarkColIndex !== -1
      ? parseFloat(latestRow[benchmarkColIndex]?.replace(/[%,]/g, '')) || 0
      : 0
    const period = periodColIndex !== -1 ? latestRow[periodColIndex] : 'Current Period'

    return {
      period,
      fundReturn,
      benchmarkReturn,
      alpha: fundReturn - benchmarkReturn,
    }
  }

  const detectAttributionData = (headers: string[], rows: string[][]): { contributors: AttributionItem[], detractors: AttributionItem[] } | null => {
    // Look for attribution-related columns
    const nameColIndex = headers.findIndex(h =>
      /name|security|holding|position|stock/i.test(h)
    )
    const contributionColIndex = headers.findIndex(h =>
      /contribution|impact|p&l|pnl|return/i.test(h)
    )

    if (nameColIndex === -1 || contributionColIndex === -1) return null

    const items: AttributionItem[] = rows.map(row => ({
      name: row[nameColIndex] || 'Unknown',
      contribution: parseFloat(row[contributionColIndex]?.replace(/[%,]/g, '')) || 0,
      isContributor: parseFloat(row[contributionColIndex]?.replace(/[%,]/g, '')) > 0,
    })).filter(item => item.name && item.name !== 'Unknown')

    // Sort and split into contributors and detractors
    const sorted = items.sort((a, b) => b.contribution - a.contribution)
    const contributors = sorted.filter(i => i.isContributor).slice(0, 5)
    const detractors = sorted.filter(i => !i.isContributor).slice(-5).reverse()

    return { contributors, detractors }
  }

  // Auto-detection functions for fund name and reporting period
  const detectFundName = (
    text: string,
    fileName: string,
    headers?: string[]
  ): { name: string; confidence: ConfidenceLevel; source: string } | null => {
    // Check for explicit "Fund Name:" pattern in text
    const fundNamePattern = /(?:fund\s*name|fund|portfolio|account)\s*[:\-]\s*([A-Z][A-Za-z0-9\s&,.'()-]+(?:LP|LLC|Ltd|Fund|Partners|Capital|Investments|Management)?)/i
    const fundNameMatch = text.match(fundNamePattern)
    if (fundNameMatch && fundNameMatch[1]?.trim().length > 3) {
      return {
        name: fundNameMatch[1].trim(),
        confidence: 'high',
        source: 'document content'
      }
    }

    // Check headers for fund name column
    if (headers) {
      const fundNameHeaderIdx = headers.findIndex(h => /^fund\s*name$/i.test(h.trim()))
      if (fundNameHeaderIdx !== -1) {
        // This would need row data, so just mark as found in headers
        return null // Will be handled in row processing
      }
    }

    // Try to extract from file name (e.g., "Apex_Capital_Q4_2024.xlsx")
    const fileNameClean = fileName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[_-]/g, ' ')     // Replace underscores and dashes
      .replace(/Q[1-4]\s*20\d{2}/gi, '') // Remove quarter info
      .replace(/20\d{2}/g, '')  // Remove year
      .trim()

    // Look for common fund name patterns in filename
    const fundPatterns = /(.*?)(?:\s*(?:performance|returns|report|quarterly|monthly|annual|letter))/i
    const fileMatch = fileNameClean.match(fundPatterns)
    if (fileMatch && fileMatch[1]?.trim().length > 3) {
      return {
        name: fileMatch[1].trim(),
        confidence: 'medium',
        source: 'file name'
      }
    }

    // If filename has recognizable fund-like name
    if (fileNameClean.length > 5 && /capital|fund|partners|investments|management|advisors/i.test(fileNameClean)) {
      return {
        name: fileNameClean,
        confidence: 'low',
        source: 'file name'
      }
    }

    return null
  }

  const detectReportingPeriod = (
    text: string,
    fileName: string,
    rows?: string[][]
  ): { period: string; confidence: ConfidenceLevel; source: string } | null => {
    // Check for quarter patterns (Q1 2024, Q4 2023, etc.)
    const quarterPattern = /Q([1-4])\s*['\-]?\s*(20\d{2})/i
    const quarterMatch = text.match(quarterPattern) || fileName.match(quarterPattern)
    if (quarterMatch) {
      return {
        period: `Q${quarterMatch[1]} ${quarterMatch[2]}`,
        confidence: 'high',
        source: quarterMatch === text.match(quarterPattern) ? 'document content' : 'file name'
      }
    }

    // Check for month-year patterns (December 2024, Dec 2024)
    const monthPattern = /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(20\d{2})/i
    const monthMatch = text.match(monthPattern) || fileName.match(monthPattern)
    if (monthMatch) {
      return {
        period: `${monthMatch[1]} ${monthMatch[2]}`,
        confidence: 'high',
        source: monthMatch === text.match(monthPattern) ? 'document content' : 'file name'
      }
    }

    // Check for date ranges (Jan 1 - Mar 31, 2024)
    const rangePattern = /(\w+\s+\d{1,2})\s*[-–]\s*(\w+\s+\d{1,2}),?\s*(20\d{2})/i
    const rangeMatch = text.match(rangePattern)
    if (rangeMatch) {
      return {
        period: `${rangeMatch[1]} - ${rangeMatch[2]}, ${rangeMatch[3]}`,
        confidence: 'medium',
        source: 'document content'
      }
    }

    // Check for year-only (for annual reports)
    const yearPattern = /(?:year|annual|fy)\s*(20\d{2})/i
    const yearMatch = text.match(yearPattern)
    if (yearMatch) {
      return {
        period: `FY ${yearMatch[1]}`,
        confidence: 'medium',
        source: 'document content'
      }
    }

    // Check data rows for period information
    if (rows && rows.length > 0) {
      const lastRow = rows[rows.length - 1]
      for (const cell of lastRow) {
        if (cell && quarterPattern.test(cell)) {
          const match = cell.match(quarterPattern)
          if (match) {
            return {
              period: `Q${match[1]} ${match[2]}`,
              confidence: 'high',
              source: 'data row'
            }
          }
        }
      }
    }

    return null
  }

  const processFile = async (file: File): Promise<ParsedData> => {
    const extension = file.name.split('.').pop()?.toLowerCase() || ''

    setProcessingStatus(`Processing ${file.name}...`)

    if (extension === 'csv') {
      const text = await file.text()
      const { headers, rows } = parseCSV(text)
      const performance = detectPerformanceData(headers, rows)
      const attribution = detectAttributionData(headers, rows)

      // Extract metadata
      const extractedMetadata: ExtractedMetadata = {}
      const fundNameResult = detectFundName(text, file.name, headers)
      if (fundNameResult) {
        extractedMetadata.fundName = fundNameResult.name
        extractedMetadata.fundNameConfidence = fundNameResult.confidence
        extractedMetadata.fundNameSource = fundNameResult.source
      }
      const periodResult = detectReportingPeriod(text, file.name, rows)
      if (periodResult) {
        extractedMetadata.reportingPeriod = periodResult.period
        extractedMetadata.reportingPeriodConfidence = periodResult.confidence
        extractedMetadata.reportingPeriodSource = periodResult.source
      }

      return {
        fileName: file.name,
        fileType: 'csv',
        performance: performance || undefined,
        attribution: attribution || undefined,
        rawText: text,
        extractedMetadata: Object.keys(extractedMetadata).length > 0 ? extractedMetadata : undefined,
      }
    }

    if (extension === 'xlsx' || extension === 'xls') {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 })
      const csvText = XLSX.utils.sheet_to_csv(firstSheet)

      if (data.length > 0) {
        const headers = data[0].map(h => String(h))
        const rows = data.slice(1).map(row => row.map(cell => String(cell ?? '')))
        const performance = detectPerformanceData(headers, rows)
        const attribution = detectAttributionData(headers, rows)

        // Extract metadata - also check sheet name for fund name
        const extractedMetadata: ExtractedMetadata = {}
        const sheetName = workbook.SheetNames[0]
        const fundNameResult = detectFundName(csvText + ' ' + sheetName, file.name, headers)
        if (fundNameResult) {
          extractedMetadata.fundName = fundNameResult.name
          extractedMetadata.fundNameConfidence = fundNameResult.confidence
          extractedMetadata.fundNameSource = fundNameResult.source
        }
        const periodResult = detectReportingPeriod(csvText, file.name, rows)
        if (periodResult) {
          extractedMetadata.reportingPeriod = periodResult.period
          extractedMetadata.reportingPeriodConfidence = periodResult.confidence
          extractedMetadata.reportingPeriodSource = periodResult.source
        }

        return {
          fileName: file.name,
          fileType: extension,
          performance: performance || undefined,
          attribution: attribution || undefined,
          rawText: csvText,
          extractedMetadata: Object.keys(extractedMetadata).length > 0 ? extractedMetadata : undefined,
        }
      }

      return {
        fileName: file.name,
        fileType: extension,
        rawText: 'Unable to parse spreadsheet',
      }
    }

    if (extension === 'docx') {
      const buffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer: buffer })
      const text = result.value

      // Extract metadata from document content
      const extractedMetadata: ExtractedMetadata = {}
      const fundNameResult = detectFundName(text, file.name)
      if (fundNameResult) {
        extractedMetadata.fundName = fundNameResult.name
        extractedMetadata.fundNameConfidence = fundNameResult.confidence
        extractedMetadata.fundNameSource = fundNameResult.source
      }
      const periodResult = detectReportingPeriod(text, file.name)
      if (periodResult) {
        extractedMetadata.reportingPeriod = periodResult.period
        extractedMetadata.reportingPeriodConfidence = periodResult.confidence
        extractedMetadata.reportingPeriodSource = periodResult.source
      }

      return {
        fileName: file.name,
        fileType: 'docx',
        commentary: text,
        rawText: text,
        extractedMetadata: Object.keys(extractedMetadata).length > 0 ? extractedMetadata : undefined,
      }
    }

    if (extension === 'txt') {
      const text = await file.text()

      // Extract metadata from text content
      const extractedMetadata: ExtractedMetadata = {}
      const fundNameResult = detectFundName(text, file.name)
      if (fundNameResult) {
        extractedMetadata.fundName = fundNameResult.name
        extractedMetadata.fundNameConfidence = fundNameResult.confidence
        extractedMetadata.fundNameSource = fundNameResult.source
      }
      const periodResult = detectReportingPeriod(text, file.name)
      if (periodResult) {
        extractedMetadata.reportingPeriod = periodResult.period
        extractedMetadata.reportingPeriodConfidence = periodResult.confidence
        extractedMetadata.reportingPeriodSource = periodResult.source
      }

      return {
        fileName: file.name,
        fileType: 'txt',
        commentary: text,
        rawText: text,
        extractedMetadata: Object.keys(extractedMetadata).length > 0 ? extractedMetadata : undefined,
      }
    }

    if (extension === 'pdf') {
      // PDF parsing requires server-side processing
      // For now, we'll mark it and handle on the API side
      return {
        fileName: file.name,
        fileType: 'pdf',
        rawText: '[PDF content will be extracted during generation]',
      }
    }

    return {
      fileName: file.name,
      fileType: extension,
      rawText: 'Unsupported file type',
    }
  }

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setIsProcessing(true)
    setError(null)

    try {
      const fileArray = Array.from(files)
      const validFiles = fileArray.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase()
        return ['csv', 'xlsx', 'xls', 'docx', 'txt', 'pdf'].includes(extension || '')
      })

      if (validFiles.length === 0) {
        setError('No valid files found. Please upload CSV, Excel, Word, TXT, or PDF files.')
        setIsProcessing(false)
        return
      }

      const processed: ParsedData[] = []
      for (const file of validFiles) {
        const result = await processFile(file)
        processed.push(result)
      }

      onFilesProcessed(processed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process files')
    } finally {
      setIsProcessing(false)
      setProcessingStatus('')
    }
  }, [onFilesProcessed])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
          }
          ${isProcessing ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.xlsx,.xls,.docx,.txt,.pdf"
          onChange={handleInputChange}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{processingStatus}</p>
          </div>
        ) : (
          <>
            <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-base font-medium mb-1">
              {isDragging ? 'Drop files here' : 'Drag & drop files'}
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              or click to browse
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 text-xs text-muted-foreground">
              <span className="px-1.5 py-0.5 bg-accent rounded text-[10px]">CSV</span>
              <span className="px-1.5 py-0.5 bg-accent rounded text-[10px]">Excel</span>
              <span className="px-1.5 py-0.5 bg-accent rounded text-[10px]">Word</span>
              <span className="px-1.5 py-0.5 bg-accent rounded text-[10px]">TXT</span>
              <span className="px-1.5 py-0.5 bg-accent rounded text-[10px]">PDF</span>
            </div>
          </>
        )}
      </div>

      {/* Brand URL Input - Compact inline */}
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg" onClick={(e) => e.stopPropagation()}>
        <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          type="url"
          placeholder="yourfirm.com (for PDF branding)"
          value={brandUrl}
          onChange={(e) => setBrandUrl(e.target.value)}
          className="h-8 text-sm flex-1 bg-background"
          onKeyDown={(e) => e.key === 'Enter' && handleExtractBrand()}
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={handleExtractBrand}
          disabled={isExtractingBrand || !brandUrl.trim()}
          className="h-8 px-2 gap-1"
        >
          {isExtractingBrand ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          <span className="text-xs">Extract</span>
        </Button>
        {brandSettings.isAutoExtracted && (
          <div className="flex gap-0.5 flex-shrink-0">
            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: brandSettings.primaryColor }} />
            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: brandSettings.secondaryColor }} />
            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: brandSettings.accentColor }} />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-900 dark:text-red-100">{error}</p>
        </div>
      )}

      {/* Compact Processed Files List */}
      {processedFiles.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-1">
            {processedFiles.length} file{processedFiles.length > 1 ? 's' : ''} uploaded
          </p>
          <div className="max-h-[180px] overflow-y-auto space-y-1 pr-1">
            {processedFiles.map((file) => (
              <div
                key={file.fileName}
                className="flex items-center gap-2 px-2 py-1.5 bg-accent/40 rounded-md group hover:bg-accent/60 transition-colors"
              >
                <div className="flex-shrink-0">
                  {FILE_TYPE_ICONS[file.fileType] || <File className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{file.fileName}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {file.performance && <span title="Performance data"><CheckCircle className="h-3 w-3 text-green-500" /></span>}
                  {file.attribution && <span title="Attribution data"><CheckCircle className="h-3 w-3 text-blue-500" /></span>}
                  {file.commentary && <span title="Commentary"><CheckCircle className="h-3 w-3 text-purple-500" /></span>}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveFile(file.fileName)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-background rounded"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
