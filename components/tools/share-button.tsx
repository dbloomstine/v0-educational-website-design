"use client"

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check, Link2 } from 'lucide-react'

interface ShareButtonProps {
  getShareableUrl: () => string
  onCopy?: () => Promise<boolean>
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function ShareButton({
  getShareableUrl,
  onCopy,
  variant = 'outline',
  size = 'sm',
  className
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    let success = false

    if (onCopy) {
      success = await onCopy()
    } else {
      try {
        await navigator.clipboard.writeText(getShareableUrl())
        success = true
      } catch {
        success = false
      }
    }

    if (success) {
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }, [getShareableUrl, onCopy])

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Link Copied!
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4 mr-2" />
          Share
        </>
      )}
    </Button>
  )
}
