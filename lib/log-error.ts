import { DrizzleQueryError } from "drizzle-orm"

/** Database errors repeat the values of the query, so only the kind of error is logged. */
export function logError(context: string, error: unknown) {
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error
  const code = (cause as { code?: unknown } | null)?.code
  console.error(context, cause instanceof Error ? cause.name : "unknown", typeof code === "string" ? code : "")
}

/** An uncaught database error would be logged with its values; other errors (redirects, refusals) pass unchanged. */
export async function withoutValues<T>(context: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (error) {
    if (!(error instanceof DrizzleQueryError)) throw error
    logError(context, error)
    throw new Error("DATABASE_ERROR")
  }
}
