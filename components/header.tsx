"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { clearBookingDrafts } from "@/hooks/use-booking-draft"
import { authClient } from "@/lib/auth-client"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"
import { ForgotPasswordModal } from "@/components/forgot-password-modal"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"
import { useTheme } from "@/contexts/theme-context"
import { Moon, Sun } from "lucide-react"

// The server sends Dutch titles; these follow the language the visitor chose.
const PAGE_TITLES: Record<string, { nl: string; en: string }> = {
  "/": { nl: "ARSI Events — Alles voor jouw evenement", en: "ARSI Events — Everything for your event" },
  "/artiesten": { nl: "Artiesten boeken | ARSI Events", en: "Book artists | ARSI Events" },
  "/register/professional": { nl: "Aanmelden als professional | ARSI Events", en: "Join as a professional | ARSI Events" },
  "/booking": { nl: "Boeken | ARSI Events", en: "Book | ARSI Events" },
  "/photo-video": { nl: "Fotografen en videografen boeken | ARSI Events", en: "Book photographers and videographers | ARSI Events" },
  "/reset-password": { nl: "Nieuw wachtwoord | ARSI Events", en: "New password | ARSI Events" },
  "/security": { nl: "Beveiliging | ARSI Events", en: "Security | ARSI Events" },
  "/catering": { nl: "Catering | ARSI Events", en: "Catering | ARSI Events" },
  "/entertainment": { nl: "Entertainment | ARSI Events", en: "Entertainment | ARSI Events" },
  "/location": { nl: "Locatie | ARSI Events", en: "Venues | ARSI Events" },
  "/decoration": { nl: "Decoratie | ARSI Events", en: "Decoration | ARSI Events" },
}

/** A path on this site, so a link can never send someone elsewhere after logging in. */
const isOwnPath = (path: string) => path.startsWith("/") && !path.startsWith("//") && !/[\\\u0000-\u0020]/.test(path) && !new URL(path, window.location.origin).pathname.startsWith("//")

export function Header() {
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false)
  const { data: sessionData, isPending } = authClient.useSession()
  const router = useRouter()
  const isLoggedIn = Boolean(sessionData?.user)
  // Where to go after logging in from a book button; reset when the header buttons are used.
  const afterLoginRef = useRef<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("login") === "1") {
      setLoginModalOpen(true)
      params.delete("login")
      const query = params.toString()
      window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""))
    }
  }, [])

  // Lets other components (e.g. the booking page) open the login or signup modal.
  useEffect(() => {
    const openLogin = (event: Event) => {
      afterLoginRef.current = (event as CustomEvent<{ next?: string }>).detail?.next ?? null
      setLoginModalOpen(true)
    }
    const openSignup = () => setSignupModalOpen(true)
    window.addEventListener("arsi:open-login", openLogin)
    window.addEventListener("arsi:open-signup", openSignup)
    return () => {
      window.removeEventListener("arsi:open-login", openLogin)
      window.removeEventListener("arsi:open-signup", openSignup)
    }
  }, [])

  const switchToSignup = () => {
    setLoginModalOpen(false)
    setSignupModalOpen(true)
  }

  const switchToLogin = () => {
    setSignupModalOpen(false)
    setForgotPasswordModalOpen(false)
    setLoginModalOpen(true)
  }

  const switchToForgotPassword = () => {
    setLoginModalOpen(false)
    setForgotPasswordModalOpen(true)
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    clearBookingDrafts()
    router.push("/")
    router.refresh()
  }

  const handleLogin = async () => {
    setLoginModalOpen(false)
    setSignupModalOpen(false)
    const afterLogin = afterLoginRef.current
    afterLoginRef.current = null
    if (afterLogin && isOwnPath(afterLogin)) {
      router.push(afterLogin)
      router.refresh()
      return
    }
    // Keep the in-memory booking form intact when authentication happens mid-booking.
    if (window.location.pathname === "/booking") {
      router.refresh()
      return
    }
    const result = await authClient.getSession()
    const role = result.data?.user.role
    const home = role === "admin" ? "/admin" : role === "professional" ? "/dashboard" : "/account"
    const next = new URLSearchParams(window.location.search).get("next")
    router.push(role === "user" && next && isOwnPath(next) ? next : home)
    router.refresh()
  }

  const handleSignup = handleLogin

  const nl = useLanguage().language === "nl"
  const { toggleTheme } = useTheme()
  const pathname = usePathname()
  useEffect(() => {
    const title = PAGE_TITLES[pathname ?? ""]
    if (!title) return
    const [wanted, other] = nl ? [title.nl, title.en] : [title.en, title.nl]
    // The page's own title can arrive after this component, so swap it whenever it is the one in the other language.
    const apply = () => {
      if (document.title === other) document.title = wanted
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.head, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [pathname, nl])
  const themeLabel = nl ? "Licht of donker thema" : "Light or dark theme"

  const openLoginModal = () => {
    afterLoginRef.current = null
    setLoginModalOpen(true)
  }

  return (
    <>
      <header
        suppressHydrationWarning
        className="flex items-center justify-between gap-1 border-b border-border bg-background px-2 py-2 sm:gap-4 sm:px-6 sm:py-3"
      >
        <Link href="/" className="flex min-h-11 shrink-0 items-center" aria-label={nl ? "ARSI Events, naar home" : "ARSI Events, go to home"}>
          <Image
            src="/arsi-logo.png"
            alt=""
            width={120}
            height={60}
            priority
            className="h-7 w-14 object-contain sm:h-12 sm:w-auto dark:hidden"
          />
          <Image
            src="/arsi-logo-dark.png"
            alt=""
            width={120}
            height={60}
            priority
            className="hidden h-7 w-14 object-contain sm:h-12 sm:w-auto dark:block"
          />
        </Link>

        <div className="flex shrink-0 items-center sm:gap-2">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="size-11 text-foreground hover:bg-accent"
            title={themeLabel}
            aria-label={themeLabel}
            suppressHydrationWarning
          >
            <Moon className="size-5 dark:hidden" />
            <Sun className="hidden size-5 dark:block" />
          </Button>

          {isPending ? (
            <div className="h-11 w-24 sm:w-40" aria-hidden="true" />
          ) : isLoggedIn && sessionData ? (
            <ProfileDropdown
              name={sessionData.user.name}
              image={sessionData.user.image}
              role={sessionData.user.role}
              onSignOut={handleSignOut}
            />
          ) : (
            <>
              <Button
                variant="ghost"
                data-login-trigger
                className="h-11 px-1.5 text-xs text-red-700 hover:bg-red-50 hover:text-red-700 sm:px-4 sm:text-base dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                onClick={openLoginModal}
              >
                {nl ? "Inloggen" : "Log in"}
              </Button>
              <Button
                className="h-11 bg-red-700 px-2 text-xs text-white hover:bg-red-600 sm:px-6 sm:text-base"
                onClick={() => {
                  afterLoginRef.current = null
                  setSignupModalOpen(true)
                }}
              >
                {nl ? "Registreren" : "Sign up"}
              </Button>
            </>
          )}
        </div>
      </header>

      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        onSwitchToSignup={switchToSignup}
        onSwitchToForgotPassword={switchToForgotPassword}
        onLogin={handleLogin}
      />
      <SignupModal
        open={signupModalOpen}
        onOpenChange={setSignupModalOpen}
        onSwitchToLogin={switchToLogin}
        onSignup={handleSignup}
      />
      <ForgotPasswordModal
        open={forgotPasswordModalOpen}
        onOpenChange={setForgotPasswordModalOpen}
        onBackToLogin={switchToLogin}
      />
    </>
  )
}
