"use client"

import { useState } from "react"
import { ListFilter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ColumnFilterPopoverProps {
  column: string
  values: string[]
  selected: string[]
  onChange: (vals: string[]) => void
}

export function ColumnFilterPopover({
  column,
  values,
  selected,
  onChange,
}: ColumnFilterPopoverProps) {
  const [search, setSearch] = useState("")
  const showSearch = values.length > 8
  const filtered = search
    ? values.filter((v) => v.toLowerCase().includes(search.toLowerCase()))
    : values

  const isActive = selected.length > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center ml-0.5 relative"
          onClick={(e) => e.stopPropagation()}
          title={`Filter by ${column}`}
        >
          <ListFilter className={`h-3 w-3 ${isActive ? "text-blue-400" : "opacity-30 hover:opacity-70"} transition-opacity`} />
          {isActive && (
            <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-3" onClick={(e) => e.stopPropagation()}>
        {showSearch && (
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
        )}
        <div className="max-h-48 overflow-y-auto space-y-1.5">
          {filtered.map((val) => (
            <div key={val} className="flex items-center gap-2">
              <Checkbox
                id={`cf-${column}-${val}`}
                checked={selected.includes(val)}
                onCheckedChange={(checked) => {
                  if (checked) onChange([...selected, val])
                  else onChange(selected.filter((s) => s !== val))
                }}
              />
              <Label
                htmlFor={`cf-${column}-${val}`}
                className="text-xs font-normal cursor-pointer truncate"
              >
                {val}
              </Label>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 text-center">No matches</p>
          )}
        </div>
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-full text-xs mt-2"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
