import { betterAuth } from "better-auth"
import { APIError } from "better-auth/api"
import { pool } from "@/lib/db"
import {
  BLOCKED_MESSAGE_NL,
  SUSPENDED_MESSAGE_NL,
  findBlacklistMatch,
  getAccountRestrictionById,
} from "@/lib/moderation"

const PUBLIC_ROLES = ["user", "professional"] as const
const PROFESSIONAL_CATEGORIES = ["artist", "photo-video"] as const

// Fields a user may only set when signing up. Afterwards they are changed by the server alone
// (server actions and admin tools), never through /api/auth/update-user.
const SIGNUP_ONLY_FIELDS = ["role", "category", "phone", "status", "statusReason", "suspendedUntil"] as const

/**
 * Connection point for the email provider. Until one is connected nothing is sent: the link holds a login token,
 * so it is only written to the log during local development.
 */
async function deliverResetLink(_to: string, url: string) {
  if (process.env.NODE_ENV === "development") console.log(`[auth] Wachtwoord-resetlink: ${url}`)
  else console.warn("[auth] Wachtwoord-reset aangevraagd, maar er is nog geen e-mailprovider gekoppeld.")
}

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  // Nothing on the site uses this endpoint: profiles are saved through server actions.
  disabledPaths: ["/update-user"],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60,
    // Whoever still has a session elsewhere, for example after a stolen password, is signed out by a reset.
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => deliverResetLink(user.email, url),
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "user", input: true },
      phone: { type: "string", required: false, input: true },
      category: { type: "string", required: false, input: true },
      status: { type: "string", required: false, defaultValue: "active", input: false },
      statusReason: { type: "string", required: false, input: false },
      suspendedUntil: { type: "date", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const role = (user as { role?: string }).role
          const safeRole = PUBLIC_ROLES.includes(role as (typeof PUBLIC_ROLES)[number]) ? role : "user"
          const blocked = await findBlacklistMatch({
            email: user.email,
            phone: (user as { phone?: string | null }).phone,
          })
          if (blocked) throw new APIError("FORBIDDEN", { message: BLOCKED_MESSAGE_NL })
          const category = (user as { category?: string | null }).category
          const safeCategory =
            safeRole === "professional"
              ? PROFESSIONAL_CATEGORIES.includes(category as (typeof PROFESSIONAL_CATEGORIES)[number])
                ? category
                : "artist"
              : null
          // The signup endpoint is public, so the free text has a ceiling. A photo is only ever set by the upload
          // routes; a URL of someone's own choosing would load in the browser of whoever sees the account.
          const phone = (user as { phone?: string | null }).phone
          return {
            data: {
              ...user,
              name: user.name.trim().slice(0, 120),
              phone: typeof phone === "string" ? phone.slice(0, 40) : null,
              image: null,
              role: safeRole,
              category: safeCategory,
            },
          }
        },
      },
      update: {
        // better-auth merges what a hook returns over the original data, so leaving a field out of the result
        // does not remove it. Refuse the update instead.
        before: async (data) => {
          if (SIGNUP_ONLY_FIELDS.some((field) => (data as Record<string, unknown>)[field] !== undefined)) {
            throw new APIError("FORBIDDEN", { message: "This field cannot be changed here." })
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const restriction = await getAccountRestrictionById(session.userId)
          if (restriction) {
            throw new APIError("FORBIDDEN", {
              message: restriction.status === "banned" ? BLOCKED_MESSAGE_NL : SUSPENDED_MESSAGE_NL,
            })
          }
        },
      },
    },
  },
  trustedOrigins: [
    ...(process.env.NODE_ENV === "development"
      ? [
          "http://localhost:3000",
          ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
          ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
          ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
          ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
        ]
      : []),
    ...(process.env.NODE_ENV === "production"
      ? [
          ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
          ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})
