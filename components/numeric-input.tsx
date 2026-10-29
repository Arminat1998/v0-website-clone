"use client"

import type React from "react"
import { Input } from "@/components/ui/input"

interface NumericInputProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: string
  onValueChange: (value: string) => void
  allowDecimal?: boolean
}

export function sanitizeNumeric(raw: string, allowDecimal: boolean) {
  if (!allowDecimal) return raw.replace(/\D/g, "")
  const cleaned = raw.replace(/,/g, ".").replace(/[^\d.]/g, "")
  const [whole, ...rest] = cleaned.split(".")
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole
}

/** Text input that only ever contains digits (and optionally one decimal separator). */
export function NumericInput({ value, onValueChange, allowDecimal = false, ...props }: NumericInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      autoComplete="off"
      value={value}
      onChange={(event) => onValueChange(sanitizeNumeric(event.target.value, allowDecimal))}
    />
  )
}
