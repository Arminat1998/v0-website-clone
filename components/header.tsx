"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
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
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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

  const handleSignOut = () => {
    setIsLoggedIn(false)
  }

  const handleLogin = () => {
    setIsLoggedIn(true)
    setLoginModalOpen(false)
  }

  const handleSignup = (accountType?: string) => {
    if (accountType !== "professional") {
      setIsLoggedIn(true)
    }
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
      <header className="bg-background px-3 sm:px-6 py-2 sm:py-4 flex items-center justify-between border-b border-border transition-colors overflow-hidden">
        <div className="flex items-center">
          <Link href="/" className="cursor-pointer">
            <Image
              src={isDark ? "/arsi-logo-dark.png" : "/arsi-logo.png"}
              alt="ARSI Events Logo"
              width={120}
              height={60}
              className={`h-8 sm:h-12 w-auto ${isDark ? "scale-[3.3] sm:scale-[3.2] translate-x-[2.2rem] sm:translate-x-[3.35rem] translate-y-[0.2rem] sm:translate-y-[0.3rem]" : ""}`}
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
            title={isDark ? t.lightMode : t.darkMode}
          >
            {isDark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>

          {isLoggedIn ? (
            <ProfileDropdown onSignOut={handleSignOut} />
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
