"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Mail, ArrowLeft, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { authClient } from "@/lib/auth-client"

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBackToLogin?: () => void
}

export function ForgotPasswordModal({ open, onOpenChange, onBackToLogin }: ForgotPasswordModalProps) {
  const { language } = useLanguage()
  const nl = language === "nl"
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<"busy" | "failed" | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: failed } = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: "/reset-password" })
      if (failed) setError(failed.status === 429 ? "busy" : "failed")
      else setSent(true)
    } catch {
      setError("failed")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSent(false)
      setError(null)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-[95vw] sm:!max-w-[480px] p-0 gap-0"
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          document.getElementById("forgot-email")?.focus()
        }}
        onCloseAutoFocus={(event) => {
          // Opened from the login window, which is gone by now: back to the button that started it.
          const trigger = Array.from(document.querySelectorAll<HTMLElement>("[data-login-trigger]"))
            .find((element) => element.getClientRects().length > 0)
          if (trigger) {
            event.preventDefault()
            trigger.focus()
          }
        }}
      >
        <div className="relative p-5 sm:p-8">
          <button
            onClick={() => handleOpenChange(false)}
            type="button"
            className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="h-5 w-5" aria-hidden />
            <span className="sr-only">{nl ? "Sluiten" : "Close"}</span>
          </button>

          <div className="mb-6 text-center">
            <DialogTitle className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
              {nl ? "Wachtwoord vergeten" : "Forgot password"}
            </DialogTitle>
            <DialogDescription className="text-sm text-pretty">
              {sent
                ? nl
                  ? "Bestaat er een account met dit e-mailadres, dan ontvang je een link om je wachtwoord opnieuw in te stellen."
                  : "If an account exists for this email address, you will receive a link to reset your password."
                : nl
                  ? "Vul je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen."
                  : "Enter your email address and we will send you a link to reset your password."}
            </DialogDescription>
          </div>

          {!sent && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="forgot-email" className="mb-1.5 block">
                  {nl ? "E-mail" : "Email"}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    placeholder={nl ? "Je e-mailadres" : "Your email address"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                  {error === "busy"
                    ? nl ? "Te veel pogingen. Probeer het over een minuut opnieuw." : "Too many attempts. Try again in a minute."
                    : nl ? "Dat lukte niet. Controleer je verbinding en probeer het opnieuw." : "That did not work. Check your connection and try again."}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full h-12 bg-red-700 hover:bg-red-600 text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : nl ? "Stuur resetlink" : "Send reset link"}
              </Button>
            </form>
          )}

          <button
            type="button"
            onClick={onBackToLogin}
            className="mt-6 flex min-h-11 w-full items-center justify-center gap-1 text-sm font-medium text-red-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring dark:text-red-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {nl ? "Terug naar inloggen" : "Back to login"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
