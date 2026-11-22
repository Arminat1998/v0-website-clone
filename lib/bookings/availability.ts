import "server-only"

import { and, asc, eq, gte, inArray, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { bookings, professionalUnavailableDates } from "@/lib/db/schema"
import { todayIso } from "@/lib/bookings/format"

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

const TABLE = "professional_unavailable_dates"

// There is no migration tool, so the table is created by the first professional who saves a date. Reading
// never runs DDL: as long as the table is missing there are no blocked dates.
let exists = false
let creating: Promise<void> | null = null

async function checkTable() {
  if (exists) return true
  const result = await db.execute<{ ok: boolean }>(sql`select to_regclass(${TABLE}) is not null as ok`)
  exists = result.rows[0]?.ok === true
  return exists
}

async function createTable() {
  if (await checkTable()) return
  await db.transaction(async (tx) => {
    // Another server instance may be creating the table at the same moment. Never wait long for it.
    await tx.execute(sql`set local lock_timeout = '5s'`)
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`create:${TABLE}`}))`)
    await tx.execute(sql`
      create table if not exists professional_unavailable_dates (
        professional_id text not null,
        date date not null,
        created_at timestamptz not null default now(),
        primary key (professional_id, date)
      )
    `)
  })
  exists = true
}

/** Makes sure the table exists: once per server instance, and again after a failure. Not inside a transaction. */
export function ensureUnavailableDatesTable() {
  creating ??= createTable().catch((error) => {
    creating = null
    throw error
  })
  return creating
}

/**
 * Whether blocked dates can be read. A problem with this table must not break booking, so it counts as
 * "no blocked dates". Call it before a transaction: a failing query would abort the transaction.
 */
export async function hasUnavailableDatesTable() {
  try {
    return await checkTable()
  } catch (error) {
    console.error("Failed to check the availability table:", error)
    return false
  }
}

const takenStatuses = ["accepted", "completed"] as const

/** Dates from today on that cannot be booked, per professional: accepted bookings and dates blocked by hand. */
export async function loadUnavailableDates(professionalIds: string[]): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>()
  if (professionalIds.length === 0) return result
  const today = todayIso()
  const booked = () =>
    db
      .select({ professionalId: bookings.professionalId, date: bookings.eventDate })
      .from(bookings)
      .where(
        and(
          inArray(bookings.professionalId, professionalIds),
          inArray(bookings.status, [...takenStatuses]),
          gte(bookings.eventDate, today),
        ),
      )
  const blocked = () =>
    db
      .select({ professionalId: professionalUnavailableDates.professionalId, date: professionalUnavailableDates.date })
      .from(professionalUnavailableDates)
      .where(
        and(inArray(professionalUnavailableDates.professionalId, professionalIds), gte(professionalUnavailableDates.date, today)),
      )

  let rows: { professionalId: string; date: string }[]
  if (await hasUnavailableDatesTable()) {
    try {
      rows = await booked().union(blocked())
    } catch (error) {
      console.error("Failed to load blocked dates:", error)
      rows = await booked()
    }
  } else rows = await booked()

  for (const row of rows) {
    const dates = result.get(row.professionalId)
    if (!dates) result.set(row.professionalId, [row.date])
    else if (!dates.includes(row.date)) dates.push(row.date)
  }
  for (const dates of result.values()) dates.sort()
  return result
}

/** The dates a professional blocked by hand, from today on. */
export async function loadBlockedByHand(professionalId: string): Promise<string[]> {
  if (!(await hasUnavailableDatesTable())) return []
  try {
    const rows = await db
      .select({ date: professionalUnavailableDates.date })
      .from(professionalUnavailableDates)
      .where(and(eq(professionalUnavailableDates.professionalId, professionalId), gte(professionalUnavailableDates.date, todayIso())))
      .orderBy(asc(professionalUnavailableDates.date))
    return rows.map((row) => row.date)
  } catch (error) {
    console.error("Failed to load blocked dates:", error)
    return []
  }
}

/** Everyone who books, accepts or blocks this date for this professional waits for each other. */
export async function lockDate(tx: Tx, professionalId: string, date: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`accept:${professionalId}:${date}`}))`)
}

/** Why a date cannot be booked: an accepted booking, or blocked by hand. `hasTable` is checked beforehand. */
export async function dateProblem(tx: Tx, professionalId: string, date: string, hasTable: boolean): Promise<"booked" | "blocked" | null> {
  const [booked] = await tx
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.professionalId, professionalId), eq(bookings.eventDate, date), inArray(bookings.status, [...takenStatuses])))
    .limit(1)
  if (booked) return "booked"
  if (!hasTable) return null
  const [blocked] = await tx
    .select({ date: professionalUnavailableDates.date })
    .from(professionalUnavailableDates)
    .where(and(eq(professionalUnavailableDates.professionalId, professionalId), eq(professionalUnavailableDates.date, date)))
    .limit(1)
  return blocked ? "blocked" : null
}
