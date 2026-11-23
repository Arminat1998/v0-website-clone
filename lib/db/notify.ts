import "server-only"

import type { db } from "@/lib/db"
import { logError } from "@/lib/log-error"

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Stores a notice inside a running transaction without putting the rest at risk: when the database refuses it, only
 * the notice is undone and the payment, invoice or review is still stored.
 */
export async function storeNotice(tx: Tx, context: string, store: (notice: Tx) => Promise<unknown>) {
  try {
    await tx.transaction(async (notice) => {
      await store(notice)
    })
  } catch (error) {
    logError(context, error)
  }
}
