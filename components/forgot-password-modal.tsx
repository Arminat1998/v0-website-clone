"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await authClient.requestPasswordReset({ email: email.trim(), redirectTo: "/reset-password" })
    setLoading(false)
    setSent(true)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setSent(false)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-[95vw] sm:!max-w-[480px] p-0 gap-0">
        <DialogTitle className="sr-only">{nl ? "Wachtwoord vergeten" : "Forgot password"}</DialogTitle>
        <div className="relative p-5 sm:p-8">
          <button
            onClick={() => handleOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-2">
              {nl ? "Wachtwoord vergeten" : "Forgot password"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm text-pretty">
              {sent
                ? nl
                  ? "Bestaat er een account met dit e-mailadres, dan ontvang je een link om je wachtwoord opnieuw in te stellen."
                  : "If an account exists for this email address, you will receive a link to reset your password."
                : nl
                  ? "Vul je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen."
                  : "Enter your email address and we will send you a link to reset your password."}
            </p>
          </div>

          {!sent && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={nl ? "Je e-mailadres" : "Your email address"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-gray-300 dark:border-gray-600 dark:bg-gray-800 pl-10"
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 bg-red-700 hover:bg-red-600 text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : nl ? "Stuur resetlink" : "Send reset link"}
              </Button>
            </form>
          )}

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 mt-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {nl ? "Terug naar inloggen" : "Back to login"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
