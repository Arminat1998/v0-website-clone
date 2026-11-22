"use server"

import { sql } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
import { takeToken } from "@/lib/rate-limit"

/**
 * Tells the signup window whether an email address is still free, so a professional
 * does not fill in the whole registration form only to be refused at the end.
 */
export async function isEmailAvailable(input: { email: string }): Promise<boolean> {
  const email = String(input?.email ?? "").trim().toLowerCase()
  if (!email || email.length > 254) return false
  // Limits how fast someone can test which addresses have an account. Past the limit the answer is
  // "available"; the signup itself still refuses an address that is taken.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!takeToken(`email-check:${ip}`, 20, 10 * 60 * 1000)) return true
  const [row] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(sql`lower(${userTable.email}) = ${email}`)
    .limit(1)
  return !row
}
