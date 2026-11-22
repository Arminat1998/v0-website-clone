/** Database errors repeat the values of the query, so only the kind of error is logged. */
export function logError(context: string, error: unknown) {
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error
  const code = (cause as { code?: unknown } | null)?.code
  console.error(context, cause instanceof Error ? cause.name : "unknown", typeof code === "string" ? code : "")
}
