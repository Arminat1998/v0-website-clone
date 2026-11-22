"use server"

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { db } from "@/lib/db"
import { bookings, conversations, messages, professionalProfiles, user, type MessageRole } from "@/lib/db/schema"
import { isBookingId } from "@/lib/bookings/booking-input"
import { takeToken } from "@/lib/rate-limit"
import { getSession } from "@/lib/session"

type Viewer = { id: string; role: MessageRole }

async function viewer(): Promise<Viewer> {
  const session = await getSession()
  const u = session?.user
  if (!u) throw new Error("Unauthorized")
  if (u.role === "admin") return { id: u.id, role: "admin" }
  if (u.role === "professional") return { id: u.id, role: "professional" }
  if (u.role === "user") return { id: u.id, role: "customer" }
  throw new Error("Forbidden")
}

function scope(v: Viewer) {
  if (v.role === "customer") return eq(conversations.customerId, v.id)
  if (v.role === "professional") return eq(conversations.professionalId, v.id)
  return isNull(conversations.professionalId)
}

async function accessible(v: Viewer, id: number) {
  if (!Number.isSafeInteger(id) || id < 1) return null
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), scope(v)))
    .limit(1)
  return row ?? null
}

export interface InboxItem {
  id: number
  name: string
  kind: "professional" | "customer" | "support"
  lastBody: string | null
  lastAt: string
  unread: boolean
}

export async function getInbox(): Promise<InboxItem[]> {
  const v = await viewer()
  const customer = alias(user, "customer_user")
  const pro = alias(user, "pro_user")
  const readAt = v.role === "customer" ? conversations.customerLastReadAt : conversations.staffLastReadAt
  const fromOtherSide = v.role === "customer" ? sql`m.sender_role <> 'customer'` : sql`m.sender_role = 'customer'`
  const rows = await db
    .select({
      id: conversations.id,
      professionalId: conversations.professionalId,
      customerName: customer.name,
      proName: sql<string | null>`coalesce(nullif(${professionalProfiles.stageName}, ''), ${pro.name})`,
      lastAt: conversations.lastMessageAt,
      lastBody: sql<string | null>`(select m.body from messages m where m.conversation_id = ${conversations.id} order by m.created_at desc limit 1)`,
      unread: sql<boolean>`exists (select 1 from messages m where m.conversation_id = ${conversations.id} and m.created_at > ${readAt} and ${fromOtherSide})`,
    })
    .from(conversations)
    .leftJoin(customer, eq(customer.id, conversations.customerId))
    .leftJoin(pro, eq(pro.id, conversations.professionalId))
    .leftJoin(professionalProfiles, eq(professionalProfiles.professionalId, conversations.professionalId))
    .where(scope(v))
    .orderBy(desc(conversations.lastMessageAt))

  return rows.map((r) => ({
    id: r.id,
    name: v.role === "customer" ? (r.professionalId ? r.proName ?? "Professional" : "ARSI support") : r.customerName ?? "Klant",
    kind: v.role === "customer" ? (r.professionalId ? "professional" : "support") : "customer",
    lastBody: r.lastBody,
    lastAt: r.lastAt.toISOString(),
    unread: Boolean(r.unread),
  }))
}

export async function getUnreadMessageCount() {
  const inbox = await getInbox().catch(() => [])
  return inbox.filter((c) => c.unread).length
}

export interface ThreadMessage {
  id: number
  body: string
  mine: boolean
  role: MessageRole
  createdAt: string
}

export async function getThread(id: number): Promise<ThreadMessage[] | null> {
  const v = await viewer()
  const conversation = await accessible(v, id)
  if (!conversation) return null
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt))
    .limit(500)
  await db
    .update(conversations)
    .set(v.role === "customer" ? { customerLastReadAt: new Date() } : { staffLastReadAt: new Date() })
    .where(eq(conversations.id, id))
  return rows.map((m) => ({
    id: m.id,
    body: m.body,
    mine: v.role === "customer" ? m.senderRole === "customer" : m.senderRole !== "customer",
    role: m.senderRole,
    createdAt: m.createdAt.toISOString(),
  }))
}

export async function sendMessage(id: number, body: string) {
  const v = await viewer()
  const text = typeof body === "string" ? body.replaceAll("\u0000", "").trim() : ""
  if (!text || text.length > 2000) return { ok: false as const, error: "invalid" }
  if (!takeToken(`message:${v.id}`, 30, 60 * 1000)) return { ok: false as const, error: "too_many" }
  const conversation = await accessible(v, id)
  if (!conversation) return { ok: false as const, error: "not_found" }
  const now = new Date()
  await db.transaction(async (tx) => {
    await tx.insert(messages).values({ conversationId: id, senderId: v.id, senderRole: v.role, body: text })
    await tx
      .update(conversations)
      .set({ lastMessageAt: now, ...(v.role === "customer" ? { customerLastReadAt: now } : { staffLastReadAt: now }) })
      .where(eq(conversations.id, id))
  })
  return { ok: true as const }
}

/** The thread of this pair. The lock makes two requests at the same time end up in one thread. */
async function findOrCreate(customerId: string, professionalId: string | null) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`conversation:${customerId}:${professionalId ?? ""}`}))`)
    const [existing] = await tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.customerId, customerId),
          professionalId ? eq(conversations.professionalId, professionalId) : isNull(conversations.professionalId),
        ),
      )
      // Earlier versions could create several threads: always continue the oldest one that has messages.
      .orderBy(
        sql`exists (select 1 from messages m where m.conversation_id = ${conversations.id}) desc`,
        asc(conversations.id),
      )
      .limit(1)
    if (existing) return existing.id
    const [created] = await tx.insert(conversations).values({ customerId, professionalId }).returning({ id: conversations.id })
    return created.id
  })
}

/** Customers can always reach support, and a professional once they have a booking with them. */
export async function openConversation(professionalId: string | null) {
  const v = await viewer()
  if (v.role !== "customer" || (professionalId !== null && typeof professionalId !== "string")) throw new Error("Forbidden")
  if (professionalId) {
    const [booking] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(and(eq(bookings.customerId, v.id), eq(bookings.professionalId, professionalId)))
      .limit(1)
    if (!booking) throw new Error("Forbidden")
  }
  return findOrCreate(v.id, professionalId)
}

/** Professionals open the thread with the customer behind one of their bookings. */
export async function openBookingConversation(bookingId: number) {
  const v = await viewer()
  if (v.role !== "professional") throw new Error("Forbidden")
  if (!isBookingId(bookingId)) return null
  const [booking] = await db
    .select({ customerId: bookings.customerId })
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.professionalId, v.id)))
    .limit(1)
  if (!booking?.customerId) return null
  return findOrCreate(booking.customerId, v.id)
}
