"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { X, Eye, EyeOff } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

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
  const { t } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Login simulated:", { email, password, rememberMe })
    if (onLogin) {
      onLogin()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] sm:!max-w-[480px] md:!max-w-[480px] lg:!max-w-[480px] p-0 gap-0 max-h-[90vh] overflow-y-auto">
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
            <div>
              <Input
                type="email"
                placeholder={t.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800"
                required
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 pr-10 bg-white dark:bg-gray-800"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
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

            <Button
              type="submit"
              className="w-full h-11 sm:h-12 bg-red-700 hover:bg-red-600 text-white text-sm sm:text-base"
            >
              {t.loginButton}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 font-medium">
                  {t.orContinueWith}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              onClick={() => console.log("Google sign in")}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t.google}
            </Button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
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
