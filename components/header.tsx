"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"
import { ForgotPasswordModal } from "@/components/forgot-password-modal"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"
import { useTheme } from "@/contexts/theme-context"
import { Moon, Sun } from "lucide-react"

export function Header() {
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false)
  const { data: sessionData, isPending } = authClient.useSession()
  const router = useRouter()
  const isLoggedIn = Boolean(sessionData?.user)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("login") === "1") {
      setLoginModalOpen(true)
      params.delete("login")
      const query = params.toString()
      window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""))
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

  const handleLogin = () => {
    setLoginModalOpen(false)
    router.refresh()
  }

  const handleSignup = () => {
    setSignupModalOpen(false)
  }

  const { t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && theme === "dark"

  return (
    <>
      <header suppressHydrationWarning className="bg-background px-3 sm:px-6 py-2 sm:py-4 flex items-center justify-between border-b border-border transition-colors overflow-hidden">
        <div className="flex items-center">
          <Link href="/" className="cursor-pointer">
            <Image
              src="/arsi-logo.png"
              alt="ARSI Events Logo"
              width={120}
              height={60}
              priority
              className="h-8 sm:h-12 w-auto dark:hidden"
            />
            <Image
              src="/arsi-logo-dark.png"
              alt="ARSI Events Logo"
              width={120}
              height={60}
              priority
              className="hidden h-8 sm:h-12 w-auto dark:block"
            />
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-4">
          <LanguageSwitcher />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-foreground hover:bg-accent h-8 w-8 sm:h-10 sm:w-10"
            title="Toggle theme"
            aria-label="Toggle theme"
            suppressHydrationWarning
          >
            <Moon className="h-4 w-4 sm:h-5 sm:w-5 dark:hidden" />
            <Sun className="hidden h-4 w-4 sm:h-5 sm:w-5 dark:block" />
          </Button>

          {isPending ? (
            <div className="h-8 w-24 sm:h-10 sm:w-40" aria-hidden="true" />
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
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 text-xs sm:text-base px-2 sm:px-4 h-8 sm:h-10"
                onClick={() => setLoginModalOpen(true)}
              >
                {t.logIn}
              </Button>
              <Button
                className="bg-red-700 hover:bg-red-600 text-white text-xs sm:text-base px-2 sm:px-6 h-8 sm:h-10"
                onClick={() => setSignupModalOpen(true)}
              >
                {t.signUp}
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
