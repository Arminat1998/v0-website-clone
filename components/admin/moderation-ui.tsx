"use client"

import { useUsersT } from "@/lib/admin-users-i18n"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/30",
  suspended: "bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/30",
  banned: "bg-red-500/10 text-red-800 dark:text-red-400 border-red-500/30",
}

export function UserStatusBadge({ status }: { status: string }) {
  const { t } = useUsersT()
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? STATUS_STYLES.active,
      )}
    >
      {t.statuses[status] ?? status}
    </span>
  )
}

export function UserAvatar({ name, image, size = 36 }: { name: string; image: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image || "/placeholder.svg"}
      alt=""
      width={size}
      height={size}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden="true"
      className="rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {initials || "?"}
    </span>
  )
}
