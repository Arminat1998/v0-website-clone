import "server-only"

import { desc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  adminAuditLog,
  blacklist,
  professionalProfiles,
  user as userTable,
  userNotes,
  userWarnings,
} from "@/lib/db/schema"
import { getRestriction } from "@/lib/moderation"
import { requireAdmin } from "@/lib/session"

export type EffectiveStatus = "active" | "suspended" | "banned"

export interface AdminUserRow {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  category: string | null
  createdAt: string
  status: EffectiveStatus
  statusReason: string | null
  suspendedUntil: string | null
  warningCount: number
  reviewStatus: string | null
}

export interface AdminWarning {
  id: number
  message: string
  severity: string
  adminName: string
  createdAt: string
  acknowledgedAt: string | null
}

export interface AdminNote {
  id: number
  note: string
  adminName: string
  createdAt: string
}

export interface BlacklistEntry {
  id: number
  type: string
  value: string
  reason: string | null
  adminName: string
  createdAt: string
}

export interface AuditEntry {
  id: number
  adminName: string
  action: string
  targetUserId: string | null
  targetLabel: string | null
  details: string | null
  createdAt: string
}

export interface ModerationStats {
  totalUsers: number
  professionals: number
  suspended: number
  banned: number
  warningsLast30Days: number
  blacklistCount: number
}

function effectiveStatus(row: { status: string; statusReason: string | null; suspendedUntil: Date | null }): EffectiveStatus {
  const restriction = getRestriction(row)
  return restriction ? restriction.status : "active"
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  await requireAdmin()
  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      image: userTable.image,
      role: userTable.role,
      category: userTable.category,
      createdAt: userTable.createdAt,
      status: userTable.status,
      statusReason: userTable.statusReason,
      suspendedUntil: userTable.suspendedUntil,
      warningCount: sql<number>`(select count(*)::int from user_warnings w where w.user_id = ${userTable.id})`,
      reviewStatus: professionalProfiles.reviewStatus,
    })
    .from(userTable)
    .leftJoin(professionalProfiles, eq(professionalProfiles.professionalId, userTable.id))
    .orderBy(desc(userTable.createdAt))

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    role: row.role,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
    status: effectiveStatus(row),
    statusReason: row.statusReason,
    suspendedUntil: row.suspendedUntil?.toISOString() ?? null,
    warningCount: Number(row.warningCount) || 0,
    reviewStatus: row.reviewStatus ?? null,
  }))
}

export async function getAdminUserDetail(id: string) {
  await requireAdmin()
  const users = (await listAdminUsers()).filter((row) => row.id === id)
  const account = users[0]
  if (!account) return null

  const [warnings, notes, audit] = await Promise.all([
    db.select().from(userWarnings).where(eq(userWarnings.userId, id)).orderBy(desc(userWarnings.createdAt)),
    db.select().from(userNotes).where(eq(userNotes.userId, id)).orderBy(desc(userNotes.createdAt)),
    db
      .select()
      .from(adminAuditLog)
      .where(eq(adminAuditLog.targetUserId, id))
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(50),
  ])

  return {
    account,
    warnings: warnings.map<AdminWarning>((w) => ({
      id: w.id,
      message: w.message,
      severity: w.severity,
      adminName: w.adminName,
      createdAt: w.createdAt.toISOString(),
      acknowledgedAt: w.acknowledgedAt?.toISOString() ?? null,
    })),
    notes: notes.map<AdminNote>((n) => ({
      id: n.id,
      note: n.note,
      adminName: n.adminName,
      createdAt: n.createdAt.toISOString(),
    })),
    audit: audit.map<AuditEntry>(toAuditEntry),
  }
}

function toAuditEntry(row: typeof adminAuditLog.$inferSelect): AuditEntry {
  return {
    id: row.id,
    adminName: row.adminName,
    action: row.action,
    targetUserId: row.targetUserId,
    targetLabel: row.targetLabel,
    details: row.details,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listBlacklist(): Promise<BlacklistEntry[]> {
  await requireAdmin()
  const rows = await db.select().from(blacklist).orderBy(desc(blacklist.createdAt))
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    value: row.value,
    reason: row.reason,
    adminName: row.adminName,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function listAuditLog(limit = 200): Promise<AuditEntry[]> {
  await requireAdmin()
  const rows = await db.select().from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt)).limit(limit)
  return rows.map(toAuditEntry)
}

export async function getModerationStats(): Promise<ModerationStats> {
  await requireAdmin()
  const users = await listAdminUsers()
  const [{ count: warnings }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userWarnings)
    .where(sql`${userWarnings.createdAt} > now() - interval '30 days'`)
  const [{ count: blacklisted }] = await db.select({ count: sql<number>`count(*)::int` }).from(blacklist)
  return {
    totalUsers: users.length,
    professionals: users.filter((u) => u.role === "professional").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    banned: users.filter((u) => u.status === "banned").length,
    warningsLast30Days: Number(warnings) || 0,
    blacklistCount: Number(blacklisted) || 0,
  }
}

export async function getActiveWarningsForUser(userId: string) {
  const rows = await db
    .select()
    .from(userWarnings)
    .where(eq(userWarnings.userId, userId))
    .orderBy(desc(userWarnings.createdAt))
    .limit(5)
  return rows
    .filter((row) => !row.acknowledgedAt)
    .map<AdminWarning>((w) => ({
      id: w.id,
      message: w.message,
      severity: w.severity,
      adminName: w.adminName,
      createdAt: w.createdAt.toISOString(),
      acknowledgedAt: null,
    }))
}
