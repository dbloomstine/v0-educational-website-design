'use client'

import { useEffect, useRef, useState } from 'react'

interface StaggeredGridProps {
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export function StaggeredGrid({
  children,
  className = '',
  staggerDelay = 75,
  duration = 700,
  direction = 'up',
}: StaggeredGridProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (ref.current) {
            observer.unobserve(ref.current)
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  const getInitialTransform = () => {
    switch (direction) {
      case 'up':
        return 'translateY(20px)'
      case 'down':
        return 'translateY(-20px)'
      case 'left':
        return 'translateX(20px)'
      case 'right':
        return 'translateX(-20px)'
      default:
        return 'translateY(20px)'
    }
  }

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'none' : getInitialTransform(),
            transition: `opacity ${duration}ms ease-out ${index * staggerDelay}ms, transform ${duration}ms ease-out ${index * staggerDelay}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
