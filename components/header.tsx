"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"
import { ForgotPasswordModal } from "@/components/forgot-password-modal"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"
import { useTheme } from "@/contexts/theme-context"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Menu, Moon, Sun, X } from "lucide-react"

/** The main sections of the site. `match` lists the paths that belong to a section, such as a profile page. */
const NAV_ITEMS = [
  { href: "/artiesten", nl: "Artiesten", en: "Artists", match: ["/artiesten", "/artiest"] },
  { href: "/photo-video", nl: "Foto & video", en: "Photo & video", match: ["/photo-video", "/foto-video"] },
  { href: "/#hoe-het-werkt", nl: "Hoe het werkt", en: "How it works", match: [] as string[] },
]

/** "page" on the page itself, "true" on pages below it (a profile), undefined elsewhere. */
function currentState(item: (typeof NAV_ITEMS)[number], pathname: string) {
  if (pathname === item.href) return "page" as const
  return item.match.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ? ("true" as const) : undefined
}

/** A path on this site, so a link can never send someone elsewhere after logging in. */
const isOwnPath = (path: string) => path.startsWith("/") && !path.startsWith("//") && !/[\\\u0000-\u0020]/.test(path)

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
  const [menuOpen, setMenuOpen] = useState(false)
  const themeLabel = nl ? "Licht of donker thema" : "Light or dark theme"

  const openLoginModal = () => {
    afterLoginRef.current = null
    setMenuOpen(false)
    setLoginModalOpen(true)
  }

  const themeToggle = (className: string) => (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn("size-11 text-foreground hover:bg-accent", className)}
      title={themeLabel}
      aria-label={themeLabel}
      suppressHydrationWarning
    >
      <Moon className="size-5 dark:hidden" />
      <Sun className="hidden size-5 dark:block" />
    </Button>
  )

  return (
    <>
      <header
        suppressHydrationWarning
        className="flex items-center justify-between gap-2 border-b border-border bg-background px-3 py-2 sm:gap-4 sm:px-6 sm:py-3"
      >
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="flex min-h-11 shrink-0 items-center" aria-label={nl ? "ARSI Events, naar home" : "ARSI Events, go to home"}>
            <Image
              src="/arsi-logo.png"
              alt=""
              width={120}
              height={60}
              priority
              className="h-8 w-auto sm:h-12 dark:hidden"
            />
            <Image
              src="/arsi-logo-dark.png"
              alt=""
              width={120}
              height={60}
              priority
              className="hidden h-8 w-auto sm:h-12 dark:block"
            />
          </Link>

          <nav aria-label={nl ? "Hoofdnavigatie" : "Main navigation"} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const current = currentState(item, pathname)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current}
                      className={cn(
                        "flex h-11 items-center border-b-2 px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                        current
                          ? "border-red-600 font-semibold text-foreground"
                          : "border-transparent font-medium text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {nl ? item.nl : item.en}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          {themeToggle("hidden sm:inline-flex")}

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
                className="h-11 px-2 text-sm text-red-700 max-[359px]:hidden hover:bg-red-50 hover:text-red-700 sm:px-4 sm:text-base dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                onClick={openLoginModal}
              >
                {nl ? "Inloggen" : "Log in"}
              </Button>
              <Button
                className="h-11 bg-red-700 px-3 text-sm text-white hover:bg-red-600 sm:px-6 sm:text-base"
                onClick={() => {
                  afterLoginRef.current = null
                  setSignupModalOpen(true)
                }}
              >
                {nl ? "Registreren" : "Sign up"}
              </Button>
            </>
          )}

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-11 lg:hidden" aria-label={nl ? "Menu openen" : "Open menu"}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            {/* The sheet's own close button is 16 px and English only, so it is replaced by the one below. */}
            <SheetContent side="right" className="[&>button]:hidden">
              <SheetHeader className="flex-row items-center justify-between">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  {nl ? "Navigatie, taal en thema" : "Navigation, language and theme"}
                </SheetDescription>
                <div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="size-11" aria-label={nl ? "Menu sluiten" : "Close menu"}>
                      <X className="size-5" />
                    </Button>
                  </SheetClose>
                </div>
              </SheetHeader>
              <nav aria-label={nl ? "Hoofdnavigatie" : "Main navigation"} className="px-4">
                <ul className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => {
                    const current = currentState(item, pathname)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={current}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "flex min-h-12 items-center rounded-lg border-l-4 px-4 text-base transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                            current
                              ? "border-red-600 bg-accent font-semibold text-foreground"
                              : "border-transparent text-foreground hover:bg-accent",
                          )}
                        >
                          {nl ? item.nl : item.en}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>
              {!isPending && !isLoggedIn && (
                <div className="px-4 min-[360px]:hidden">
                  <Button variant="outline" className="h-11 w-full" onClick={openLoginModal}>
                    {nl ? "Inloggen" : "Log in"}
                  </Button>
                </div>
              )}
              <div className="mt-auto flex items-center justify-between border-t border-border p-4 sm:hidden">
                <LanguageSwitcher showLabel />
                {themeToggle("")}
              </div>
            </SheetContent>
          </Sheet>
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
