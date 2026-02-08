"use client"

import { useCallback, useRef } from "react"

interface ResizeHandleProps {
  onResize: (delta: number) => void
}

export function ResizeHandle({ onResize }: ResizeHandleProps) {
  const startXRef = useRef(0)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      startXRef.current = e.clientX
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"

      const onMouseMove = (me: MouseEvent) => {
        const delta = me.clientX - startXRef.current
        startXRef.current = me.clientX
        onResize(delta)
      }

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [onResize]
  )

  return (
    <div
      onMouseDown={onMouseDown}
      className="hidden md:block absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize z-40 group/handle"
      style={{ touchAction: "none" }}
    >
      <div className="absolute right-[2px] top-2 bottom-2 w-[1px] bg-border opacity-0 group-hover/handle:opacity-100 transition-opacity" />
    </div>
  )
}
