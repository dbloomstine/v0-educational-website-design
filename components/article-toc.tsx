'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { List, X, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TocItem {
  id: string
  text: string
  level: number
}

interface ArticleTocProps {
  content: string
}

export function ArticleToc({ content }: ArticleTocProps) {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    // Extract headings from content
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const headingElements = doc.querySelectorAll('h2, h3')

    const items: TocItem[] = Array.from(headingElements).map((heading, index) => {
      const text = heading.textContent || ''
      const id = `heading-${index}`
      heading.id = id // Add ID to heading for linking

      return {
        id,
        text,
        level: parseInt(heading.tagName.substring(1))
      }
    })

    setHeadings(items)

    // Add IDs to actual DOM headings after content is rendered
    setTimeout(() => {
      const actualHeadings = document.querySelectorAll('.prose h2, .prose h3')
      actualHeadings.forEach((heading, index) => {
        heading.id = `heading-${index}`
      })
    }, 100)
  }, [content])

  useEffect(() => {
    // Scroll spy functionality
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-100px 0px -66%',
        threshold: 0
      }
    )

    const headingElements = document.querySelectorAll('.prose h2, .prose h3')
    headingElements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [headings])

  useEffect(() => {
    // Reading progress and scroll to top visibility
    const handleScroll = () => {
      const article = document.querySelector('article')
      if (!article) return

      const articleTop = article.offsetTop
      const articleHeight = article.offsetHeight
      const windowHeight = window.innerHeight
      const scrollTop = window.scrollY

      // Calculate progress
      const scrollableHeight = articleHeight - windowHeight
      const scrolled = scrollTop - articleTop
      const progressPercent = Math.min(Math.max((scrolled / scrollableHeight) * 100, 0), 100)
      setProgress(progressPercent)

      // Show scroll to top button after scrolling 300px
      setShowScrollTop(scrollTop > 300)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial call

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      setMobileMenuOpen(false)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (headings.length === 0) {
    return null
  }

  const currentSection = headings.find(h => h.id === activeId)

  return (
    <>
      {/* Reading Progress Bar - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-border">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Desktop TOC - Sidebar */}
      <div className="hidden xl:block">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="space-y-1 pb-8">
            <p className="text-sm font-semibold mb-4">On this page</p>
            <nav className="space-y-1">
              {headings.map((heading) => (
                <button
                  key={heading.id}
                  onClick={() => scrollToHeading(heading.id)}
                  className={cn(
                    "block w-full text-left text-sm transition-colors hover:text-foreground py-1.5",
                    heading.level === 3 && "pl-4",
                    activeId === heading.id
                      ? "text-foreground font-medium border-l-2 border-primary pl-3"
                      : "text-muted-foreground border-l-2 border-transparent pl-3"
                  )}
                >
                  {heading.text}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile TOC Button - Fixed Bottom */}
      <div className="xl:hidden fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            size="icon"
            onClick={scrollToTop}
            className="rounded-full shadow-lg h-12 w-12"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}

        {/* TOC Button */}
        <Button
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-full shadow-lg h-14 w-14"
          aria-label="Table of contents"
        >
          <List className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile TOC Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="xl:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">On this page</h3>
                {currentSection && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Currently reading: {currentSection.text}
                  </p>
                )}
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-2 hover:bg-accent"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="px-6 py-4 space-y-2">
              {headings.map((heading) => (
                <button
                  key={heading.id}
                  onClick={() => scrollToHeading(heading.id)}
                  className={cn(
                    "block w-full text-left text-base transition-colors hover:text-foreground py-3 px-4 rounded-lg",
                    heading.level === 3 && "pl-8",
                    activeId === heading.id
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  {heading.text}
                </button>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
