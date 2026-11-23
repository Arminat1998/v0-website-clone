"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { X, Eye, EyeOff, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { authClient } from "@/lib/auth-client"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignup?: () => void
  onSwitchToForgotPassword?: () => void
  onLogin?: () => void
}

export function LoginModal({
  open,
  onOpenChange,
  onSwitchToSignup,
  onSwitchToForgotPassword,
  onLogin,
}: LoginModalProps) {
  const { t, language } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error: signInError } = await authClient.signIn.email({ email: email.trim(), password, rememberMe })
    setLoading(false)
    if (signInError) {
      if (signInError.status === 403) {
        setError(
          language === "nl"
            ? "Dit account is geblokkeerd of geschorst. Neem contact op met ARSI Events als je denkt dat dit een vergissing is."
            : "This account is blocked or suspended. Contact ARSI Events if you think this is a mistake.",
        )
        return
      }
      if (signInError.status === 429) {
        setError(
          language === "nl"
            ? "Te veel pogingen. Probeer het over een minuut opnieuw."
            : "Too many attempts. Try again in a minute.",
        )
        return
      }
      setError(language === "nl" ? "E-mailadres of wachtwoord is onjuist." : "Incorrect email or password.")
      return
    }
    setPassword("")
    onLogin?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          document.getElementById("login-email")?.focus()
        }}
        showCloseButton={false} className="!max-w-[95vw] sm:!max-w-[480px] md:!max-w-[480px] lg:!max-w-[480px] p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <div className="relative p-4 sm:p-8">
          <DialogClose
            aria-label={language === "nl" ? "Sluiten" : "Close"}
            className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-5" aria-hidden />
          </DialogClose>

          <div className="mb-4 sm:mb-6">
            <DialogTitle className="mb-2 pr-10 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {language === "nl" ? "Inloggen" : "Log in"}
            </DialogTitle>
            <DialogDescription className="text-sm">{t.loginSubtitle}</DialogDescription>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="login-email" className="mb-1.5 block">
                {t.email}
              </Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-[var(--rf-line)] bg-[var(--rf-field)] text-foreground placeholder:text-[var(--rf-placeholder)] dark:bg-[var(--rf-field)]"
                required
              />
            </div>

            <div>
              <Label htmlFor="login-password" className="mb-1.5 block">
                {t.password}
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-[var(--rf-line)] bg-[var(--rf-field)] text-foreground placeholder:text-[var(--rf-placeholder)] dark:bg-[var(--rf-field)] pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-pressed={showPassword}
                  aria-label={language === "nl" ? "Wachtwoord tonen" : "Show password"}
                  className="absolute right-0 top-0 flex size-12 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {showPassword ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4">
              <div className="flex min-h-11 items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="flex min-h-11 cursor-pointer items-center text-sm">
                  {t.rememberMe}
                </Label>
              </div>
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-sm inline-flex min-h-11 items-center font-medium text-red-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring dark:text-red-400"
              >
                {t.forgotPassword}
              </button>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-red-700 hover:bg-red-600 text-white text-sm sm:text-base"
            >
              {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {language === "nl" ? "Inloggen" : "Log in"}
            </Button>

            <p className="text-center text-sm text-muted-foreground pt-2">
              {t.dontHaveAccount}{" "}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="inline-flex min-h-11 items-center font-medium text-red-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring dark:text-red-400"
              >
                {language === "nl" ? "Registreren" : "Sign up"}
              </button>
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
