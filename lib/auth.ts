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

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60,
    // No email provider is connected yet: the reset link is written to the server log.
    sendResetPassword: async ({ user, url }) => {
      console.log(`[auth] Wachtwoord-resetlink voor ${user.email}: ${url}`)
    },
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
          return { data: { ...user, role: safeRole } }
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
