import "server-only"

/**
 * The dashboard has no login yet, so every query is scoped to this demo professional
 * (DJ Marco, id 1 in lib/smart-search.ts). Replace the body of getProfessionalId with a
 * session lookup once authentication is added; every action already filters by this id.
 */
export const DEMO_PROFESSIONAL_ID = "1"

export async function getProfessionalId() {
  return DEMO_PROFESSIONAL_ID
}
