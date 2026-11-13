"use server"

import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"

/**
 * Tells the signup window whether an email address is still free, so a professional
 * does not fill in the whole registration form only to be refused at the end.
 */
export async function isEmailAvailable(input: { email: string }): Promise<boolean> {
  const email = input.email.trim().toLowerCase()
  if (!email || email.length > 254) return false
  const [row] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(sql`lower(${userTable.email}) = ${email}`)
    .limit(1)
  return !row
}
