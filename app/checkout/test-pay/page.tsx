"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getCheckoutDetails, confirmDeposit, type CheckoutDetailsResult } from "@/app/actions/payments"

function euro(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100)
}

function TestCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingIdParam = searchParams.get("bookingId")
  const bookingId = bookingIdParam ? Number.parseInt(bookingIdParam, 10) : null

  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [details, setDetails] = useState<CheckoutDetailsResult["booking"] | null>(null)

  useEffect(() => {
    if (!bookingId || Number.isNaN(bookingId)) {
      setError("Geen geldig boekingsnummer opgegeven.")
      setLoading(false)
      return
    }

    getCheckoutDetails(bookingId).then((res) => {
      setLoading(false)
      if (!res.ok || !res.booking) {
        setError(res.error || "Kon de boekingsgegevens niet ophalen.")
      } else {
        setDetails(res.booking)
        if (res.booking.paymentStatus === "deposit_paid" || res.booking.paymentStatus === "paid") {
          setSuccess(true)
        }
      }
    })
  }, [bookingId])

  async function handlePay() {
    if (!bookingId) return
    setPaying(true)
    setError(null)
    try {
      const res = await confirmDeposit(bookingId, `TEST-SIM-${Date.now()}`)
      if (res.ok) {
        setSuccess(true)
        // Refresh router so back navigation sees the new status
        router.refresh()
      } else {
        setError(res.error || "Betaling mislukt.")
      }
    } catch {
      setError("Er is een onverwachte fout opgetreden bij het verwerken van de testbetaling.")
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        <p className="text-sm text-muted-foreground">Betaalsessie laden...</p>
      </div>
    )
  }

  if (error && !details) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Betaling niet mogelijk</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/account/boekingen">Terug naar mijn boekingen</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!details) return null

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card className="border-green-600/40 bg-green-500/5 shadow-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="mt-3 text-2xl font-bold text-foreground">Aanbetaling geslaagd!</CardTitle>
            <CardDescription className="text-base">
              De aanbetaling van {euro(details.depositCents)} voor <strong>{details.eventName}</strong> is succesvol verwerkt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status boeking</span>
                <Badge variant="outline" className="border-transparent bg-green-500/10 text-green-800 dark:text-green-500 font-semibold">
                  Bevestigd
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aanbetaling (25%)</span>
                <span className="font-medium text-foreground">{euro(details.depositCents)} (voldaan)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resterend saldo (75%)</span>
                <span className="font-semibold text-foreground">{euro(details.balanceCents)}</span>
              </div>
            </div>
            <Button asChild className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-3">
              <Link href={`/account/boekingen/${details.id}`}>Terug naar je boeking</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground">
          <Link href={`/account/boekingen/${details.id}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Annuleren en terug
          </Link>
        </Button>
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
          Testomgeving (Sandbox)
        </Badge>
      </div>

      <Card className="border-border shadow-lg">
        <CardHeader className="border-b border-border bg-muted/20 pb-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Veilige Test Checkout · ARSI Events
          </div>
          <CardTitle className="mt-2 text-xl font-bold">Aanbetaling voldoen</CardTitle>
          <CardDescription>
            Boeking #{details.id.toString().padStart(5, "0")} · {details.professionalName} · {details.eventName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Totaalbedrag offerte</span>
                <span className="text-foreground">{euro(details.totalCents)}</span>
              </div>
              <Separator />
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="font-semibold text-foreground">Nu te betalen (25% aanbetaling)</span>
                  <p className="text-xs text-muted-foreground">Maakt je boeking definitief en gelockt</p>
                </div>
                <span className="text-2xl font-extrabold text-foreground">{euro(details.depositCents)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>Resterend bedrag (na afloop van het evenement)</span>
                <span>{euro(details.balanceCents)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gesimuleerde betaalmethode</p>
            <div className="flex items-center gap-3 rounded-lg border border-brand bg-brand/5 p-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background text-brand shadow-sm">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-semibold text-foreground">iDEAL / Test Sandbox</p>
                <p className="text-xs text-muted-foreground">Directe verificatie zonder daadwerkelijke afschrijving</p>
              </div>
              <Badge variant="secondary" className="text-xs">Actief</Badge>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <Button
              onClick={handlePay}
              disabled={paying}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-3 text-base shadow-sm"
            >
              {paying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testbetaling verifiëren...
                </>
              ) : (
                `Voltooi testbetaling (${euro(details.depositCents)})`
              )}
            </Button>
            <Button
              asChild
              variant="outline"
              disabled={paying}
              className="w-full border-border text-foreground hover:bg-muted"
            >
              <Link href={`/account/boekingen/${details.id}`}>
                Betaling afbreken (terug naar boeking)
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <p className="text-sm text-muted-foreground">Betaalpagina laden...</p>
        </div>
      }
    >
      <TestCheckoutContent />
    </Suspense>
  )
}
