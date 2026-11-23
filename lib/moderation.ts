import { and, eq, inArray, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { adminAuditLog, blacklist, user as userTable } from "@/lib/db/schema"

export const BLACKLIST_TYPES = ["email", "domain", "phone"] as const
export type BlacklistType = (typeof BLACKLIST_TYPES)[number]

export type AccountStatus = "active" | "suspended" | "banned"

export interface AccountRestriction {
  status: "suspended" | "banned"
  reason: string | null
  until: Date | null
}

export const BLOCKED_MESSAGE_NL = "Dit account is geblokkeerd. Neem contact op met ARSI Events als je denkt dat dit een vergissing is."
export const SUSPENDED_MESSAGE_NL = "Dit account is tijdelijk geschorst. Neem contact op met ARSI Events voor meer informatie."

export function normalizeValue(type: BlacklistType, raw: string) {
  const value = raw.trim().toLowerCase()
  if (type === "phone") return value.replace(/[^\d+]/g, "")
  if (type === "domain") return value.replace(/^@/, "")
  return value
}

/** Returns the active restriction for an account, or null when the account may sign in. */
export function getRestriction(account: {
  status?: string | null
  statusReason?: string | null
  suspendedUntil?: Date | string | null
}): AccountRestriction | null {
  if (account.status === "banned") {
    return { status: "banned", reason: account.statusReason ?? null, until: null }
  }
  if (account.status === "suspended") {
    const until = account.suspendedUntil ? new Date(account.suspendedUntil) : null
    if (until && until.getTime() <= Date.now()) return null
    return { status: "suspended", reason: account.statusReason ?? null, until }
  }
  return null
}

export async function findBlacklistMatch(input: { email?: string | null; phone?: string | null }) {
  const conditions = []
  if (input.email) {
    const email = normalizeValue("email", input.email)
    const domain = email.split("@")[1]
    conditions.push(and(eq(blacklist.type, "email"), eq(blacklist.value, email)))
    if (domain) conditions.push(and(eq(blacklist.type, "domain"), eq(blacklist.value, domain)))
  }
  if (input.phone) {
    const phone = normalizeValue("phone", input.phone)
    if (phone) conditions.push(and(eq(blacklist.type, "phone"), eq(blacklist.value, phone)))
  }
  if (conditions.length === 0) return null
  const [match] = await db
    .select()
    .from(blacklist)
    .where(or(...conditions))
    .limit(1)
  return match ?? null
}

export async function logAdminAction(
  entry: {
    adminId: string
    adminName: string
    action: string
    targetUserId?: string | null
    targetLabel?: string | null
    details?: string | null
  },
  tx: Pick<typeof db, "insert"> = db,
) {
  // The name can be changed by the admin, the id cannot. The table has no column for it, so it goes in the details.
  const by = `[admin-id ${entry.adminId}]`
  await tx.insert(adminAuditLog).values({
    adminName: entry.adminName,
    action: entry.action,
    targetUserId: entry.targetUserId ?? null,
    targetLabel: entry.targetLabel ?? null,
    details: entry.details ? `${entry.details.slice(0, 1000)} ${by}` : by,
  })
}

export async function getAccountRestrictionById(userId: string) {
  const [row] = await db
    .select({
      status: userTable.status,
      statusReason: userTable.statusReason,
      suspendedUntil: userTable.suspendedUntil,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)
  return row ? getRestriction(row) : null
}

/** Ids of professionals that may not be shown publicly (banned or suspended). */
export async function getHiddenProfessionalIds(ids: string[]) {
  if (ids.length === 0) return new Set<string>()
  const rows = await db
    .select({
      id: userTable.id,
      status: userTable.status,
      statusReason: userTable.statusReason,
      suspendedUntil: userTable.suspendedUntil,
    })
    .from(userTable)
    .where(and(inArray(userTable.id, ids), inArray(userTable.status, ["banned", "suspended"])))
  return new Set(rows.filter((row) => getRestriction(row)).map((row) => row.id))
}
