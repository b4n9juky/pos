"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { DatePreset, DateRange } from "./types"

const presets: { key: DatePreset; label: string; daysOffset: number }[] = [
  { key: "today", label: "Hari Ini", daysOffset: 0 },
  { key: "yesterday", label: "Kemarin", daysOffset: 1 },
  { key: "7d", label: "7 Hari", daysOffset: 7 },
  { key: "30d", label: "30 Hari", daysOffset: 30 },
]

function formatISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getRange(preset: DatePreset): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (preset) {
    case "today":
      return { from: formatISODate(today), to: formatISODate(today), label: "Hari Ini" }
    case "yesterday": {
      const y = new Date(today.getTime() - 86400000)
      return { from: formatISODate(y), to: formatISODate(y), label: "Kemarin" }
    }
    case "7d": {
      const f = new Date(today.getTime() - 6 * 86400000)
      return { from: formatISODate(f), to: formatISODate(today), label: "7 Hari Terakhir" }
    }
    case "30d": {
      const f = new Date(today.getTime() - 29 * 86400000)
      return { from: formatISODate(f), to: formatISODate(today), label: "30 Hari Terakhir" }
    }
    default:
      return { from: formatISODate(today), to: formatISODate(today), label: "Hari Ini" }
  }
}

interface DateRangeFilterProps {
  onChange: (range: DateRange) => void
  className?: string
}

export function DateRangeFilter({ onChange, className }: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<DatePreset>("today")

  function handlePresetClick(key: DatePreset) {
    setActivePreset(key)
    onChange(getRange(key))
  }

  return (
    <>
      <div className={cn("hidden md:flex flex-wrap items-center gap-1.5", className)}>
        {presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => handlePresetClick(preset.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
              "border border-border",
              activePreset === preset.key
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <select
        value={activePreset}
        onChange={(e) => handlePresetClick(e.target.value as DatePreset)}
        className={cn("md:hidden flex h-8 items-center rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground", className)}
      >
        {presets.map((preset) => (
          <option key={preset.key} value={preset.key}>
            {preset.label}
          </option>
        ))}
      </select>
    </>
  )
}
