"use client"

import { useUsersT } from "@/lib/admin-users-i18n"

export function UsersPageHeader({ kind }: { kind: "users" | "blacklist" | "activity" }) {
  const { t } = useUsersT()
  const copy = {
    users: [t.usersTitle, t.usersSubtitle],
    blacklist: [t.blacklistTitle, t.blacklistSubtitle],
    activity: [t.activityTitle, t.activitySubtitle],
  }[kind]
  return (
    <header>
      <h1 className="text-2xl font-semibold text-foreground">{copy[0]}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{copy[1]}</p>
    </header>
  )
}
