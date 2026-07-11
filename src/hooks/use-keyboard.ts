"use client"

import { useEffect, useRef } from "react"

export interface Shortcut {
  key: string
  handler: (e: KeyboardEvent) => void
  ignoreWhenInput?: boolean
}

export function useKeyboard(shortcuts: Shortcut[], enabled = true) {
  const ref = useRef(shortcuts)

  useEffect(() => {
    ref.current = shortcuts
  })

  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      for (const { key, handler: fn, ignoreWhenInput = true } of ref.current) {
        if (e.key !== key) continue
        if (ignoreWhenInput && isInput) continue
        fn(e)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [enabled])
}
