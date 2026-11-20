/**
 * Sample profiles (from lib/smart-search) have numeric ids; real accounts have string ids.
 * Sample profiles stay visible as examples but cannot be booked: nobody would receive the request.
 */
export function isDemoProfessional(id: unknown) {
  return /^\d+$/.test(String(id ?? ""))
}
