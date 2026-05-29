"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Mail, ArrowLeft } from "lucide-react"

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBackToLogin?: () => void
}

export function ForgotPasswordModal({ open, onOpenChange, onBackToLogin }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle password reset logic here
    console.log("Send reset link to:", email)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[480px] sm:max-w-[480px] md:max-w-[480px] lg:max-w-[480px] p-0 gap-0">
        <div className="relative p-8">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Forgot Password</h2>
            <p className="text-gray-600 text-sm">
              Enter your email address below and we will send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-gray-300 pl-10"
                required
              />
            </div>

            <Button type="submit" className="w-full h-12 bg-red-700 hover:bg-red-600 text-white">
              Send Reset Link
            </Button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full text-center text-sm text-blue-600 hover:underline flex items-center justify-center gap-1 mt-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
