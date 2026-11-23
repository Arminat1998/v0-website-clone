"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { authClient } from "@/lib/auth-client"

export function ResetPasswordForm({ token, invalid }: { token?: string; invalid: boolean }) {
  const nl = useLanguage().language === "nl"
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError("")
    setLoading(true)
    const { error: resetError } = await authClient.resetPassword({ newPassword: password, token })
    setLoading(false)
    if (resetError) {
      setError(nl ? "Deze link is verlopen of ongeldig. Vraag een nieuwe aan." : "This link has expired or is invalid. Request a new one.")
      return
    }
    setDone(true)
  }

  return (
    <div className="w-full rounded-xl border border-border bg-card p-6 sm:p-8">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
        {nl ? "Nieuw wachtwoord" : "New password"}
      </h1>

      {invalid ? (
        <p className="text-sm text-muted-foreground">
          {nl ? "Deze resetlink is ongeldig of verlopen." : "This reset link is invalid or has expired."}
        </p>
      ) : done ? (
        <p className="text-sm text-muted-foreground">
          {nl ? "Je wachtwoord is gewijzigd. Je kunt nu inloggen." : "Your password has been changed. You can now log in."}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="reset-password" className="mb-1.5 block">
              {nl ? "Nieuw wachtwoord" : "New password"}
            </Label>
            <Input
              id="reset-password"
              aria-describedby="reset-password-hint"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
              required
            />
            <p id="reset-password-hint" className="mt-1.5 text-sm text-muted-foreground">
              {nl ? "Minimaal 8 tekens." : "At least 8 characters."}
            </p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full h-12 bg-red-700 hover:bg-red-600 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : nl ? "Wachtwoord opslaan" : "Save password"}
          </Button>
        </form>
      )}

      <Link href="/?login=1" className="mt-6 flex min-h-11 items-center justify-center text-sm font-medium text-red-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring dark:text-red-400">
        {nl ? "Naar inloggen" : "Go to login"}
      </Link>
    </div>
  )
}
