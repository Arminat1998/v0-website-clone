"use server"

import { and, eq, inArray, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import {
  artistPages,
  billingProfiles,
  blacklist,
  bookings,
  conversations,
  customerFavorites,
  customerNotifications,
  customerProfiles,
  invoices,
  messages,
  notifications,
  professionalProfiles,
  professionalUnavailableDates,
  reviews,
  session as sessionTable,
  user as userTable,
  userNotes,
  userWarnings,
} from "@/lib/db/schema"
import { hasUnavailableDatesTable } from "@/lib/bookings/availability"
import { requireAdmin, requireUser } from "@/lib/session"
import { type AdminUserRow, listAdminUsers } from "@/lib/admin/users"
import { BLACKLIST_TYPES, type BlacklistType, logAdminAction, normalizeValue } from "@/lib/moderation"

type Result = { ok: true } | { ok: false; error: string }

const SEVERITIES = ["info", "warning", "final"] as const

async function loadTarget(userId: string, adminId: string) {
  const [target] = await db
    .select({ id: userTable.id, name: userTable.name, email: userTable.email, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)
  if (!target) return { error: "Gebruiker niet gevonden." as const }
  if (target.id === adminId) return { error: "Je kunt dit niet op je eigen account uitvoeren." as const }
  if (target.role === "admin") return { error: "Beheerders kunnen niet worden gemodereerd." as const }
  return { target }
}

function refresh(userId?: string) {
  revalidatePath("/admin")
  revalidatePath("/admin/gebruikers")
  revalidatePath("/admin/blacklist")
  revalidatePath("/admin/activiteit")
  if (userId) revalidatePath(`/admin/gebruikers/${userId}`)
}

/** The account row for the moderation buttons on an artist's page. */
export async function getAdminAccount(input: { userId: string }): Promise<AdminUserRow | null> {
  await requireAdmin()
  return (await listAdminUsers()).find((row) => row.id === input.userId) ?? null
}

export async function warnUser(input: { userId: string; message: string; severity: string }): Promise<Result> {
  const admin = await requireAdmin()
  const message = input.message.trim()
  if (message.length < 5) return { ok: false, error: "Schrijf een duidelijke waarschuwing (minimaal 5 tekens)." }
  const severity = (SEVERITIES as readonly string[]).includes(input.severity) ? input.severity : "warning"
  const { target, error } = await loadTarget(input.userId, admin.id)
  if (!target) return { ok: false, error: error ?? "Onbekende fout." }

  await db.insert(userWarnings).values({
    userId: target.id,
    message: message.slice(0, 1000),
    severity,
    adminName: admin.name,
  })
  await logAdminAction({
    adminName: admin.name,
    action: "warn",
    targetUserId: target.id,
    targetLabel: target.name,
    details: `[${severity}] ${message}`,
  })
  refresh(target.id)
  return { ok: true }
}

export async function updateWarning(input: {
  warningId: number
  userId: string
  message: string
  severity: string
}): Promise<Result> {
  const admin = await requireAdmin()
  const message = input.message.trim()
  if (message.length < 5) return { ok: false, error: "Schrijf een duidelijke waarschuwing (minimaal 5 tekens)." }
  const severity = (SEVERITIES as readonly string[]).includes(input.severity) ? input.severity : "warning"

  const [updated] = await db
    .update(userWarnings)
    .set({ message: message.slice(0, 1000), severity, acknowledgedAt: null })
    .where(and(eq(userWarnings.id, input.warningId), eq(userWarnings.userId, input.userId)))
    .returning({ id: userWarnings.id })
  if (!updated) return { ok: false, error: "Waarschuwing niet gevonden." }

  const [target] = await db.select({ name: userTable.name }).from(userTable).where(eq(userTable.id, input.userId)).limit(1)
  await logAdminAction({
    adminName: admin.name,
    action: "warn_edit",
    targetUserId: input.userId,
    targetLabel: target?.name ?? null,
    details: `[${severity}] ${message}`,
  })
  refresh(input.userId)
  return { ok: true }
}

export async function revokeWarning(input: { warningId: number; userId: string }): Promise<Result> {
  const admin = await requireAdmin()
  const [removed] = await db
    .delete(userWarnings)
    .where(and(eq(userWarnings.id, input.warningId), eq(userWarnings.userId, input.userId)))
    .returning({ message: userWarnings.message })
  if (!removed) return { ok: false, error: "Waarschuwing niet gevonden." }

  const [target] = await db.select({ name: userTable.name }).from(userTable).where(eq(userTable.id, input.userId)).limit(1)
  await logAdminAction({
    adminName: admin.name,
    action: "warn_revoke",
    targetUserId: input.userId,
    targetLabel: target?.name ?? null,
    details: removed.message,
  })
  refresh(input.userId)
  return { ok: true }
}

export async function suspendUser(input: { userId: string; days: number; reason: string }): Promise<Result> {
  const admin = await requireAdmin()
  const reason = input.reason.trim()
  const days = Math.floor(input.days)
  if (!reason) return { ok: false, error: "Geef een reden op voor de schorsing." }
  if (!Number.isFinite(days) || days < 1 || days > 365) return { ok: false, error: "Kies een duur tussen 1 en 365 dagen." }
  const { target, error } = await loadTarget(input.userId, admin.id)
  if (!target) return { ok: false, error: error ?? "Onbekende fout." }

  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  await db
    .update(userTable)
    .set({ status: "suspended", statusReason: reason.slice(0, 500), suspendedUntil: until, bannedAt: null })
    .where(eq(userTable.id, target.id))
  await db.delete(sessionTable).where(eq(sessionTable.userId, target.id))
  await logAdminAction({
    adminName: admin.name,
    action: "suspend",
    targetUserId: target.id,
    targetLabel: target.name,
    details: `${days} dagen — ${reason}`,
  })
  refresh(target.id)
  return { ok: true }
}

export async function banUser(input: {
  userId: string
  reason: string
  addToBlacklist: boolean
}): Promise<Result> {
  const admin = await requireAdmin()
  const reason = input.reason.trim()
  if (!reason) return { ok: false, error: "Geef een reden op voor de ban." }
  const { target, error } = await loadTarget(input.userId, admin.id)
  if (!target) return { ok: false, error: error ?? "Onbekende fout." }

  await db
    .update(userTable)
    .set({ status: "banned", statusReason: reason.slice(0, 500), suspendedUntil: null, bannedAt: new Date() })
    .where(eq(userTable.id, target.id))
  await db.delete(sessionTable).where(eq(sessionTable.userId, target.id))

  if (input.addToBlacklist) {
    await db
      .insert(blacklist)
      .values({
        type: "email",
        value: normalizeValue("email", target.email),
        reason: reason.slice(0, 500),
        adminName: admin.name,
      })
      .onConflictDoNothing()
  }

  await logAdminAction({
    adminName: admin.name,
    action: "ban",
    targetUserId: target.id,
    targetLabel: target.name,
    details: `${reason}${input.addToBlacklist ? " (e-mailadres op blacklist)" : ""}`,
  })
  refresh(target.id)
  return { ok: true }
}

export async function reinstateUser(input: { userId: string }): Promise<Result> {
  const admin = await requireAdmin()
  const { target, error } = await loadTarget(input.userId, admin.id)
  if (!target) return { ok: false, error: error ?? "Onbekende fout." }

  await db
    .update(userTable)
    .set({ status: "active", statusReason: null, suspendedUntil: null, bannedAt: null })
    .where(eq(userTable.id, target.id))
  await db
    .delete(blacklist)
    .where(and(eq(blacklist.type, "email"), eq(blacklist.value, normalizeValue("email", target.email))))
  await logAdminAction({
    adminName: admin.name,
    action: "reinstate",
    targetUserId: target.id,
    targetLabel: target.name,
  })
  refresh(target.id)
  return { ok: true }
}

export async function forceLogout(input: { userId: string }): Promise<Result> {
  const admin = await requireAdmin()
  const { target, error } = await loadTarget(input.userId, admin.id)
  if (!target) return { ok: false, error: error ?? "Onbekende fout." }

  await db.delete(sessionTable).where(eq(sessionTable.userId, target.id))
  await logAdminAction({ adminName: admin.name, action: "force_logout", targetUserId: target.id, targetLabel: target.name })
  refresh(target.id)
  return { ok: true }
}

export async function addUserNote(input: { userId: string; note: string }): Promise<Result> {
  const admin = await requireAdmin()
  const note = input.note.trim()
  if (!note) return { ok: false, error: "Notitie is leeg." }
  const [target] = await db
    .select({ id: userTable.id, name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, input.userId))
    .limit(1)
  if (!target) return { ok: false, error: "Gebruiker niet gevonden." }

  await db.insert(userNotes).values({ userId: target.id, note: note.slice(0, 2000), adminName: admin.name })
  await logAdminAction({ adminName: admin.name, action: "note", targetUserId: target.id, targetLabel: target.name })
  refresh(target.id)
  return { ok: true }
}

export async function deleteUserNote(input: { noteId: number; userId: string }): Promise<Result> {
  await requireAdmin()
  await db.delete(userNotes).where(and(eq(userNotes.id, input.noteId), eq(userNotes.userId, input.userId)))
  refresh(input.userId)
  return { ok: true }
}

/** Takes a professional offline (back to "nieuw") without affecting the account. */
export async function unpublishProfessional(input: { userId: string }): Promise<Result> {
  const admin = await requireAdmin()
  const { target, error } = await loadTarget(input.userId, admin.id)
  if (!target) return { ok: false, error: error ?? "Onbekende fout." }

  await db
    .update(professionalProfiles)
    .set({ reviewStatus: "in-beoordeling", reviewedAt: null })
    .where(eq(professionalProfiles.professionalId, target.id))
  await logAdminAction({
    adminName: admin.name,
    action: "unpublish",
    targetUserId: target.id,
    targetLabel: target.name,
    details: "Profiel offline gehaald voor nieuwe beoordeling",
  })
  refresh(target.id)
  revalidatePath("/admin/aanmeldingen")
  revalidatePath("/admin/artiesten")
  return { ok: true }
}

/**
 * Permanently deletes an account and everything that belongs to it alone.
 * Accounts with bookings or invoices are refused: those records must be kept.
 */
export async function deleteUser(input: { userId: string; confirmEmail: string }): Promise<Result> {
  const admin = await requireAdmin()
  const { target, error } = await loadTarget(input.userId, admin.id)
  if (!target) return { ok: false, error: error ?? "Onbekende fout." }
  if (input.confirmEmail.trim().toLowerCase() !== target.email.toLowerCase()) {
    return { ok: false, error: "Het e-mailadres komt niet overeen met dit account." }
  }

  const id = target.id
  const [booking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(or(eq(bookings.professionalId, id), eq(bookings.customerId, id)))
    .limit(1)
  const [invoice] = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.professionalId, id)).limit(1)
  if (booking || invoice) {
    return {
      ok: false,
      error: "Dit account heeft boekingen of facturen en kan niet worden verwijderd. Verban het account of haal het profiel offline.",
    }
  }

  const hasUnavailableDates = await hasUnavailableDatesTable()
  try {
    await db.transaction(async (tx) => {
      const threads = await tx
        .select({ id: conversations.id })
        .from(conversations)
        .where(or(eq(conversations.customerId, id), eq(conversations.professionalId, id)))
      const threadIds = threads.map((thread) => thread.id)
      if (threadIds.length) {
        await tx.delete(messages).where(inArray(messages.conversationId, threadIds))
        await tx.delete(conversations).where(inArray(conversations.id, threadIds))
      }
      await tx.delete(reviews).where(or(eq(reviews.customerId, id), eq(reviews.professionalId, id)))
      await tx.delete(customerFavorites).where(or(eq(customerFavorites.userId, id), eq(customerFavorites.professionalId, id)))
      await tx.delete(customerNotifications).where(eq(customerNotifications.userId, id))
      await tx.delete(customerProfiles).where(eq(customerProfiles.userId, id))
      await tx.delete(notifications).where(eq(notifications.professionalId, id))
      if (hasUnavailableDates) await tx.delete(professionalUnavailableDates).where(eq(professionalUnavailableDates.professionalId, id))
      await tx.delete(artistPages).where(eq(artistPages.professionalId, id))
      await tx.delete(billingProfiles).where(eq(billingProfiles.professionalId, id))
      await tx.delete(professionalProfiles).where(eq(professionalProfiles.professionalId, id))
      // Sessions, login details, warnings and notes go with the user row (cascade).
      await tx.delete(userTable).where(eq(userTable.id, id))
    })
  } catch (deleteError) {
    console.error("Failed to delete account:", deleteError)
    return { ok: false, error: "Verwijderen is mislukt. Er is niets verwijderd." }
  }

  await logAdminAction({
    adminName: admin.name,
    action: "delete",
    targetUserId: id,
    targetLabel: target.name,
    details: `Account verwijderd (${target.email})`,
  })
  refresh()
  revalidatePath("/admin/aanmeldingen")
  revalidatePath("/admin/artiesten")
  revalidatePath("/artiesten")
  return { ok: true }
}

export async function addBlacklistEntry(input: { type: string; value: string; reason: string }): Promise<Result> {
  const admin = await requireAdmin()
  if (!(BLACKLIST_TYPES as readonly string[]).includes(input.type)) return { ok: false, error: "Ongeldig type." }
  const type = input.type as BlacklistType
  const value = normalizeValue(type, input.value)
  if (!value) return { ok: false, error: "Vul een waarde in." }
  if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { ok: false, error: "Ongeldig e-mailadres." }
  if (type === "domain" && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(value)) return { ok: false, error: "Ongeldig domein (bijv. voorbeeld.nl)." }
  if (type === "phone" && value.replace(/\D/g, "").length < 6) return { ok: false, error: "Ongeldig telefoonnummer." }

  await db
    .insert(blacklist)
    .values({ type, value, reason: input.reason.trim().slice(0, 500) || null, adminName: admin.name })
    .onConflictDoNothing()
  await logAdminAction({
    adminName: admin.name,
    action: "blacklist_add",
    targetLabel: `${type}: ${value}`,
    details: input.reason.trim() || null,
  })
  refresh()
  return { ok: true }
}

export async function removeBlacklistEntry(input: { id: number }): Promise<Result> {
  const admin = await requireAdmin()
  const [entry] = await db.select().from(blacklist).where(eq(blacklist.id, input.id)).limit(1)
  if (!entry) return { ok: false, error: "Item niet gevonden." }
  await db.delete(blacklist).where(eq(blacklist.id, input.id))
  await logAdminAction({
    adminName: admin.name,
    action: "blacklist_remove",
    targetLabel: `${entry.type}: ${entry.value}`,
  })
  refresh()
  return { ok: true }
}

/** Called by the signed-in user to dismiss a warning shown to them. */
export async function acknowledgeWarning(input: { id: number }): Promise<Result> {
  const current = await requireUser()
  await db
    .update(userWarnings)
    .set({ acknowledgedAt: new Date() })
    .where(and(eq(userWarnings.id, input.id), eq(userWarnings.userId, current.id)))
  return { ok: true }
}
