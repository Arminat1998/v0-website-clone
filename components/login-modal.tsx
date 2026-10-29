"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
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
      setError(language === "nl" ? "E-mailadres of wachtwoord is onjuist." : "Incorrect email or password.")
      return
    }
    setPassword("")
    onLogin?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] sm:!max-w-[480px] md:!max-w-[480px] lg:!max-w-[480px] p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">{t.loginTitle}</DialogTitle>
        <div className="relative p-4 sm:p-8">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>

          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-500 mb-2">{t.loginTitle}</h2>
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">{t.loginSubtitle}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
            <Input
              type="email"
              autoComplete="email"
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800"
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 pr-10 bg-white dark:bg-gray-800"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                  {t.rememberMe}
                </Label>
              </div>
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t.forgotPassword}
              </button>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 bg-red-700 hover:bg-red-600 text-white text-sm sm:text-base"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.loginButton}
            </Button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-300 pt-2">
              {t.dontHaveAccount}{" "}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {t.signUp}
              </button>
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
