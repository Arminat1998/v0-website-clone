"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { getAdminAccount } from "@/app/actions/admin-users"
import { useUsersT } from "@/lib/admin-users-i18n"
import type { AdminUserRow } from "@/lib/admin/users"
import { UserStatusBadge } from "@/components/admin/moderation-ui"
import { UserActions, type UserActionKind } from "@/components/admin/user-actions"

/** The account measures (warn, suspend, ban, delete ...) on an artist's page. */
export function ArtistAccountActions({ userId }: { userId: string }) {
  const { t, formatDate } = useUsersT()
  const [account, setAccount] = useState<AdminUserRow | null>(null)

  const load = useCallback(() => {
    getAdminAccount({ userId }).then(setAccount)
  }, [userId])

  useEffect(load, [load])

  if (!account) return null

  const handleDone = (action: UserActionKind) => {
    // The artist lists are kept in memory; reload so a removed or offline profile disappears.
    if (action === "delete") window.location.assign("/admin/artiesten")
    else if (action === "unpublish") window.location.reload()
    else load()
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <UserActions account={account} onDone={handleDone} className="" />
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-4 text-sm">
        <UserStatusBadge status={account.status} />
        {account.status === "suspended" && account.suspendedUntil && (
          <span className="text-amber-500">{t.suspendedUntil(formatDate(account.suspendedUntil))}</span>
        )}
        <Link href={`/admin/gebruikers/${account.id}`} className="ml-auto text-red-500 hover:text-red-400">
          {t.viewAccount}
        </Link>
      </div>
    </div>
  )
}
