"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  List,
  Quote,
  Check,
  X,
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  onSave: () => void
  onCancel: () => void
  brandColor?: string
}

// Convert markdown to HTML for editing
function markdownToHtml(markdown: string): string {
  let html = markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Bullet lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\* )(.+)$/gm, '<li>$2</li>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Paragraphs (lines that don't start with special chars)
    .replace(/^(?!<[hl]|<li|<block)(.+)$/gm, '<p>$1</p>')
    // Wrap consecutive li elements in ul
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Clean up extra newlines
    .replace(/\n+/g, '\n')
    .trim()

  return html
}

// Convert HTML back to markdown
function htmlToMarkdown(html: string): string {
  let markdown = html
    // Remove wrapper divs
    .replace(/<div>/gi, '\n')
    .replace(/<\/div>/gi, '')
    // Headers
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    // Bold
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    // Italic
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    // List items
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    // Remove ul/ol wrappers
    .replace(/<\/?ul[^>]*>/gi, '')
    .replace(/<\/?ol[^>]*>/gi, '')
    // Blockquotes
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')
    // Paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove any remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return markdown
}

export function RichTextEditor({
  content,
  onChange,
  onSave,
  onCancel,
  brandColor,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize content
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = markdownToHtml(content)
      setIsInitialized(true)
    }
  }, [content, isInitialized])

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }, [])

  const handleBold = () => execCommand('bold')
  const handleItalic = () => execCommand('italic')

  const handleBulletList = () => {
    execCommand('insertUnorderedList')
  }

  const handleQuote = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      if (selectedText) {
        const blockquote = document.createElement('blockquote')
        blockquote.className = 'border-l-4 border-primary/50 pl-4 py-1 my-2 bg-primary/5 rounded-r-lg italic'
        blockquote.textContent = selectedText
        range.deleteContents()
        range.insertNode(blockquote)
      }
    }
  }

  const handleInput = () => {
    if (editorRef.current) {
      const markdown = htmlToMarkdown(editorRef.current.innerHTML)
      onChange(markdown)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      handleBold()
    }
    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      handleItalic()
    }
    // Ctrl/Cmd + S for save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      onSave()
    }
    // Escape to cancel
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBold}
          className="h-8 w-8 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          className="h-8 w-8 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBulletList}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleQuote}
          className="h-8 w-8 p-0"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 px-3 gap-1 text-muted-foreground"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          className="h-8 px-3 gap-1"
          style={brandColor ? { backgroundColor: brandColor } : undefined}
        >
          <Check className="h-4 w-4" />
          Save
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[200px] p-4 outline-none prose prose-sm dark:prose-invert max-w-none
          prose-p:mb-3 prose-p:leading-relaxed
          prose-strong:font-semibold prose-strong:text-foreground
          prose-em:italic prose-em:text-foreground/80
          prose-ul:list-disc prose-ul:pl-5 prose-ul:mb-3 prose-ul:space-y-1
          prose-li:leading-relaxed
          prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:my-3 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:italic
          prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2
          focus:ring-2 focus:ring-primary/20"
        suppressContentEditableWarning
      />

      {/* Keyboard hints */}
      <div className="flex items-center gap-4 px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
        <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+B</kbd> Bold</span>
        <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+I</kbd> Italic</span>
        <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+S</kbd> Save</span>
        <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> Cancel</span>
      </div>
    </div>
  )
}
