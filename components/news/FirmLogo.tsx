'use client'

import { useState } from 'react'

interface FirmLogoProps {
  name: string
  logoUrl?: string | null
  size?: number
}

export function FirmLogo({ name, logoUrl, size = 14 }: FirmLogoProps) {
  const [failed, setFailed] = useState(false)

  if (!logoUrl || failed) {
    return (
      <span
        className="flex items-center justify-center rounded-sm bg-muted text-[8px] font-bold text-muted-foreground flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {name.charAt(0)}
      </span>
    )
  }

  return (
    <img
      src={logoUrl}
      alt=""
      width={size}
      height={size}
      className="rounded-sm object-contain bg-white flex-shrink-0"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}
