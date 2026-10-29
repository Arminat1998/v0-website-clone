"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
      <h1 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-2">
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
          <Input
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder={nl ? "Nieuw wachtwoord (min. 8 tekens)" : "New password (min. 8 characters)"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12"
            required
          />
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full h-12 bg-red-700 hover:bg-red-600 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : nl ? "Wachtwoord opslaan" : "Save password"}
          </Button>
        </form>
      )}

      <Link href="/?login=1" className="mt-6 block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline">
        {nl ? "Naar inloggen" : "Go to login"}
      </Link>
    </div>
  )
}
