import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  // The dashboard layouts and data access still verify the session and role.
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url), 303)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/account/:path*", "/mijn-boekingen/:path*"],
}
