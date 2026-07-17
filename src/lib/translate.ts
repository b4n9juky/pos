import { id } from "./lang/id"

export function t(key: string, params?: Record<string, string | number>): string {
  let text = id[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v))
    }
  }
  return text
}
