"use client"

import { useState, useTransition } from "react"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { acknowledgeWarning } from "@/app/actions/admin-users"
import { useUsersT } from "@/lib/admin-users-i18n"
import type { AdminWarning } from "@/lib/admin/users"

export function WarningBanner({ warnings }: { warnings: AdminWarning[] }) {
  const { t } = useUsersT()
  const [dismissed, setDismissed] = useState<number[]>([])
  const [, startTransition] = useTransition()
  const visible = warnings.filter((w) => !dismissed.includes(w.id))

  if (visible.length === 0) return null

  return (
    <div className="space-y-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3" role="alert">
      {visible.map((w) => (
        <div key={w.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t.bannerTitle} · {t.severities[w.severity] ?? w.severity}
              </p>
              <p className="whitespace-pre-wrap break-words text-sm text-foreground">{w.message}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDismissed((prev) => [...prev, w.id])
              startTransition(async () => {
                await acknowledgeWarning({ id: w.id })
              })
            }}
          >
            {t.bannerAck}
          </Button>
        </div>
      ))}
    </div>
  )
}
