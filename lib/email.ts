import "server-only"

import { after } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { user, type Booking } from "@/lib/db/schema"
import { formatEventDate } from "@/lib/bookings/format"
import { paymentSummary } from "@/lib/bookings/payments"
import { formatEuro } from "@/lib/bookings/pricing"
import { getRestriction } from "@/lib/moderation"

const RESEND_URL = "https://api.resend.com/emails"

/** True once an email provider is configured; without it every email is skipped. */
export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

interface Email {
  to: string
  subject: string
  heading: string
  /** Plain text; escaped when the email is built. */
  paragraphs: string[]
  action?: { label: string; url: string }
  footer?: string
  /** Same key within 24 hours: the provider sends the email once. */
  idempotencyKey?: string
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

/**
 * Text someone typed, for an email to the other party: on one line, not too long, and without phone numbers,
 * email addresses and links. Contact details are only shared after acceptance, and links in an email from
 * ARSI Events should be ours.
 */
export function safeUserText(value: string, max = 300) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[^\s@<>]+@[^\s@<>]+/g, "[e-mailadres]")
    .replace(/(?:https?:\/\/|www\.)\S+/gi, "[link]")
    .replace(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|nl|be|de|eu|info|io|me|app|co|link|xyz)\b\S*/gi, "[link]")
    .replace(/(?:\+|\b0)\d(?:[\s().-]?\d){7,}/g, "[telefoonnummer]")
    .trim()
    .slice(0, max)
}

function siteUrl() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL.replace(/\/+$/, "")
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  return host ? `https://${host}` : "http://localhost:3000"
}

function render(email: Email) {
  const paragraphs = email.paragraphs
    .map((text) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#27272a">${escapeHtml(text)}</p>`)
    .join("")
  const action = email.action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(email.action.url)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#b91c1c;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none">${escapeHtml(email.action.label)}</a></p>`
    : ""
  const footer = email.footer ?? "Je krijgt deze e-mail omdat je een account hebt bij ARSI Events."
  return {
    html: `<!doctype html><html lang="nl"><body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif"><div style="max-width:560px;margin:0 auto;padding:32px;border-radius:12px;background:#ffffff"><p style="margin:0 0 24px;font-size:14px;font-weight:700;color:#b91c1c">ARSI Events</p><h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#18181b">${escapeHtml(email.heading)}</h1>${paragraphs}${action}<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#71717a">${escapeHtml(footer)}</p></div></body></html>`,
    text: [email.heading, ...email.paragraphs, email.action ? `${email.action.label}: ${email.action.url}` : "", footer]
      .filter(Boolean)
      .join("\n\n"),
  }
}

/** Sends one email. False when nothing was sent; it never throws and never logs who or what it was about. */
async function sendEmail(email: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) return false
  try {
    const { html, text } = render(email)
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(email.idempotencyKey ? { "Idempotency-Key": email.idempotencyKey } : {}),
      },
      body: JSON.stringify({ from, to: [email.to], subject: email.subject, html, text }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
    // The response can repeat the address, so only the status is logged.
    if (!response.ok) console.error(`[email] Niet verstuurd: status ${response.status}`)
    return response.ok
  } catch (error) {
    console.error(`[email] Niet verstuurd: ${error instanceof Error ? error.name : "onbekende fout"}`)
    return false
  }
}

/** Runs after the response is sent. A problem with an email can never make the action itself fail. */
function inBackground(task: () => Promise<unknown>) {
  if (!isEmailConfigured()) return
  const safely = async () => {
    try {
      await task()
    } catch (error) {
      console.error(`[email] Niet verstuurd: ${error instanceof Error ? error.name : "onbekende fout"}`)
    }
  }
  try {
    after(safely)
  } catch {
    // Outside a request there is nothing to wait for.
    void safely()
  }
}

/** The address of an account; null when there is none or the account is banned or suspended. */
async function accountEmail(userId: string | null) {
  if (!userId) return null
  const [account] = await db
    .select({ email: user.email, status: user.status, statusReason: user.statusReason, suspendedUntil: user.suspendedUntil })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  return account && !getRestriction(account) ? account.email : null
}

const longDate = (iso: string) => formatEventDate(iso, "nl-NL")

/** To the professional: a new request. Without the customer's contact details; those follow after acceptance. */
export function emailNewRequest(booking: { id: number; professionalId: string; eventName: string; eventDate: string }) {
  inBackground(async () => {
    const to = await accountEmail(booking.professionalId)
    if (!to) return
    await sendEmail({
      to,
      subject: `Nieuwe boekingsaanvraag voor ${longDate(booking.eventDate)}`,
      heading: "Je hebt een nieuwe boekingsaanvraag",
      paragraphs: [
        `Evenement: ${safeUserText(booking.eventName, 120)}`,
        `Datum: ${longDate(booking.eventDate)}`,
        "Bekijk de aanvraag in je dashboard en laat weten of je kunt. De contactgegevens van de klant zie je zodra je de aanvraag accepteert.",
      ],
      action: { label: "Aanvraag bekijken", url: `${siteUrl()}/dashboard/bookings/${booking.id}` },
      idempotencyKey: `booking-${booking.id}-new`,
    })
  })
}

type RespondedBooking = Pick<
  Booking,
  "id" | "customerId" | "professionalName" | "professionalType" | "eventName" | "eventDate" | "status" | "totalCents" | "paymentStatus" | "rejectionReason"
>

/** To the organiser: accepted, with the deposit as the next step. */
export function emailAccepted(booking: RespondedBooking) {
  inBackground(async () => {
    const to = await accountEmail(booking.customerId)
    if (!to) return
    const { depositCents } = paymentSummary(booking, null)
    await sendEmail({
      to,
      subject: `Geaccepteerd: je aanvraag voor ${longDate(booking.eventDate)}`,
      heading: "Je aanvraag is geaccepteerd",
      paragraphs: [
        `${safeUserText(booking.professionalName, 80)} heeft je aanvraag voor ${safeUserText(booking.eventName, 120)} op ${longDate(booking.eventDate)} geaccepteerd.`,
        `Volgende stap: de aanbetaling van ${formatEuro(depositCents)}. In je account zie je hoe je betaalt.`,
      ],
      action: { label: "Boeking bekijken", url: `${siteUrl()}/account/boekingen/${booking.id}` },
      idempotencyKey: `booking-${booking.id}-accepted`,
    })
  })
}

/** To the organiser: declined, with the reason and a way to find someone else. */
export function emailRejected(booking: RespondedBooking) {
  inBackground(async () => {
    const to = await accountEmail(booking.customerId)
    if (!to) return
    const reason = safeUserText(booking.rejectionReason ?? "", 500)
    const search = booking.professionalType === "photographer" ? "/photo-video" : "/artiesten"
    await sendEmail({
      to,
      subject: `Afgewezen: je aanvraag voor ${longDate(booking.eventDate)}`,
      heading: "Je aanvraag is afgewezen",
      paragraphs: [
        `${safeUserText(booking.professionalName, 80)} kan je aanvraag voor ${safeUserText(booking.eventName, 120)} op ${longDate(booking.eventDate)} helaas niet aannemen.`,
        ...(reason ? [`Reden: ${reason}`] : []),
        "Er zijn meer professionals die je kunt aanvragen.",
      ],
      action: { label: "Andere professionals bekijken", url: `${siteUrl()}${search}` },
      idempotencyKey: `booking-${booking.id}-rejected`,
    })
  })
}

/** The password reset link. False when it was not sent, e.g. because no email provider is configured. */
export async function sendPasswordResetEmail(to: string, url: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Nieuw wachtwoord instellen voor ARSI Events",
    heading: "Nieuw wachtwoord instellen",
    paragraphs: [
      "Er is een nieuw wachtwoord aangevraagd voor je account bij ARSI Events. Met de knop hieronder stel je het in. De link werkt één uur en één keer.",
      "Heb je dit niet aangevraagd? Dan hoef je niets te doen; je wachtwoord blijft hetzelfde.",
    ],
    action: { label: "Nieuw wachtwoord instellen", url },
    footer: "Je krijgt deze e-mail omdat voor dit e-mailadres een nieuw wachtwoord is aangevraagd.",
  })
}
