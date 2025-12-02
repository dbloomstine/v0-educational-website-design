"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface InfoPopoverProps {
  children: React.ReactNode
  className?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  iconSize?: string // e.g., "h-4 w-4" - defaults to "h-3.5 w-3.5"
}

/**
 * InfoPopover - A mobile-friendly alternative to Tooltip
 *
 * Uses click/tap instead of hover, making it accessible on touch devices.
 * Includes a close button for better mobile UX.
 *
 * Usage:
 * <InfoPopover>
 *   <p>Your explanation text here</p>
 * </InfoPopover>
 */
export function InfoPopover({
  children,
  className,
  side = "top",
  align = "center",
  iconSize = "h-3.5 w-3.5"
}: InfoPopoverProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-full p-0.5",
            "text-muted-foreground hover:text-foreground hover:bg-accent",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "transition-colors cursor-help"
          )}
          aria-label="More information"
        >
          <Info className={iconSize} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          align={align}
          sideOffset={8}
          className={cn(
            "z-50 w-72 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2",
            "data-[side=top]:slide-in-from-bottom-2",
            className
          )}
        >
          {/* Close button for mobile */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 rounded-sm p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="pr-6 text-sm leading-relaxed">
            {children}
          </div>

          <PopoverPrimitive.Arrow className="fill-popover" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

/**
 * LabelWithInfo - A convenience component for form labels with info icons
 *
 * Usage:
 * <LabelWithInfo label="Fund Size" htmlFor="fund-size">
 *   <p>The total committed capital of your fund.</p>
 * </LabelWithInfo>
 */
interface LabelWithInfoProps {
  label: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
  required?: boolean
}

export function LabelWithInfo({
  label,
  htmlFor,
  children,
  className,
  required = false
}: LabelWithInfoProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <InfoPopover>{children}</InfoPopover>
    </div>
  )
}
