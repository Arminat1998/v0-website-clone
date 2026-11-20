/**
 * True when `pathname` is a plain blob path directly under `prefix`.
 * Every segment after the prefix may only hold letters, digits, `_`, `-` and `.`, and may not start
 * with a dot. That rules out `..`, percent-encoded parts such as `%2e%2e`, backslashes and empty
 * segments, which the blob client would otherwise resolve to a path outside the prefix.
 */
export function isSafeBlobPath(pathname: unknown, prefix: string): pathname is string {
  if (typeof pathname !== "string" || pathname.length > 500 || !pathname.startsWith(prefix)) return false
  const rest = pathname.slice(prefix.length)
  return rest.length > 0 && rest.split("/").every((segment) => /^[A-Za-z0-9_][A-Za-z0-9._-]*$/.test(segment))
}
