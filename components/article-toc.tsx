'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

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
    }
  }

  if (headings.length === 0) {
    return null
  }

  return (
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
  )
}
