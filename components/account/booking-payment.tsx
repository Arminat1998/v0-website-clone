"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { MessageButton } from "@/components/chat/message-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DEPOSIT_PERCENT,
  PAYMENT_STEPS,
  paymentReference,
  paymentSummary,
  type BankDetails,
  type CustomerInvoice,
  type PaymentStep,
} from "@/lib/bookings/payments";
import { euro } from "./account-common";
import { displayStatus } from "@/lib/bookings/display-status";
import { bookingVatCents } from "@/lib/bookings/pricing";
import type { CustomerBookingDetail } from "@/app/actions/customer";

function date(value: Date | string, nl: boolean) {
  return new Date(value).toLocaleDateString(nl ? "nl-NL" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Row({
  label,
  sub,
  value,
  strong,
}: {
  label: string;
  sub?: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${strong ? "font-semibold" : "text-sm"}`}
    >
      <div>
        <p>{label}</p>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copyValue = value,
  nl,
}: {
  label: string;
  value: string;
  /** What lands on the clipboard when it differs from what is shown. */
  copyValue?: string;
  nl: boolean;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is unavailable; the value stays selectable on screen.
    }
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="break-words font-medium">{value}</dd>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={copy}
        aria-label={`${nl ? "Kopieer" : "Copy"} ${label.toLowerCase()}`}
      >
        {copied ? <Check /> : <Copy />}
        <span aria-live="polite">
          {copied ? (nl ? "Gekopieerd" : "Copied") : nl ? "Kopieer" : "Copy"}
        </span>
      </Button>
    </div>
  );
}

export function BookingPayment({
  booking: b,
  invoice,
  bank,
}: {
  booking: CustomerBookingDetail;
  invoice: CustomerInvoice | null;
  bank: BankDetails | null;
}) {
  const nl = useLanguage().language === "nl";
  const supportLabel = nl ? "Bericht aan ARSI Events" : "Message ARSI Events";
  const s = paymentSummary(b, invoice);
  const quoted = b.status !== "pending" && s.active;
  const currentIndex = PAYMENT_STEPS.indexOf(s.current);

  const quoteLines = [
    {
      label: "Professional",
      sub: `${Number(b.hours)} ${nl ? "uur" : "hours"} × ${euro(b.hourlyRateCents, nl)}`,
      cents: Math.round(Number(b.hours) * b.hourlyRateCents),
    },
    { label: nl ? "Apparatuur" : "Equipment", cents: b.equipmentCents },
    { label: nl ? "Reiskosten" : "Travel", cents: b.travelCents },
  ];
  // Bookings priced excl. VAT show the VAT as its own line, so the lines add up to the total.
  const vatCents = bookingVatCents(b);
  if (vatCents > 0) quoteLines.push({ label: nl ? "Btw" : "VAT", cents: vatCents });

  const steps: Record<PaymentStep, { title: string; text: string }> = {
    request: {
      title: nl ? "Aanvraag verstuurd" : "Request sent",
      text: nl ? "Je betaalt nu nog niets." : "You pay nothing yet.",
    },
    quote: {
      title: nl ? "Offerte" : "Quote",
      text: quoted
        ? nl
          ? `${b.professionalName} heeft je aanvraag goedgekeurd.`
          : `${b.professionalName} approved your request.`
        : nl
          ? `Je krijgt je offerte zodra ${b.professionalName} je aanvraag goedkeurt.`
          : `You get your quote once ${b.professionalName} approves your request.`,
    },
    deposit: {
      title: nl
        ? `Aanbetaling van ${DEPOSIT_PERCENT}%`
        : `${DEPOSIT_PERCENT}% deposit`,
      text: nl
        ? `${euro(s.depositCents, nl)} om je boeking definitief te maken.`
        : `${euro(s.depositCents, nl)} to make your booking final.`,
    },
    invoice: {
      title: nl ? "Eindfactuur" : "Final invoice",
      text: nl
        ? "Na het evenement betaal je het restant. Extra kosten, zoals een extra uur of parkeren, staan apart op de factuur."
        : "After the event you pay the balance. Extra costs, such as an extra hour or parking, are listed separately on the invoice.",
    },
    done: {
      title: nl ? "Afgerond" : "Completed",
      text: nl ? "Alles is betaald." : "Everything has been paid.",
    },
  };

  function stepState(step: PaymentStep, index: number) {
    if (s.paid) return "done";
    if (step === "deposit") {
      if (s.depositPaid) return "done";
      return s.current === "deposit" ? "current" : "upcoming";
    }
    if (index < currentIndex) return "done";
    return index === currentIndex ? "current" : "upcoming";
  }

  const expired = displayStatus(b) === "expired";
  if (!s.active || expired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{nl ? "Betaling" : "Payment"}</h2>
          </CardTitle>
          <CardDescription>
            {b.paymentStatus === "refunded"
              ? nl
                ? "Je betaling is terugbetaald."
                : "Your payment has been refunded."
              : s.depositPaid
                ? nl
                  ? "Deze boeking gaat niet door. Neem contact op met ARSI Events over je betaling."
                  : "This booking will not take place. Contact ARSI Events about your payment."
                : expired
                  ? nl
                    ? "De datum van deze aanvraag is verstreken. Je hoeft niets te betalen."
                    : "The date of this request has passed. You do not have to pay anything."
                  : nl
                    ? "Deze boeking gaat niet door. Je hoeft niets te betalen."
                    : "This booking will not take place. You do not have to pay anything."}
          </CardDescription>
        </CardHeader>
        {s.depositPaid && b.paymentStatus !== "refunded" && (
          <CardContent>
            <MessageButton label={supportLabel} />
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{nl ? "Zo betaal je" : "How you pay"}</h2>
          </CardTitle>
          <CardDescription>
            {nl
              ? "Je ziet vooraf wanneer je wat betaalt."
              : "You see in advance when you pay what."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-4">
            {PAYMENT_STEPS.map((step, index) => {
              const state = stepState(step, index);
              return (
                <li
                  key={step}
                  className="flex gap-3"
                  aria-current={state === "current" ? "step" : undefined}
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${
                      state === "done"
                        ? "border-brand bg-brand text-white"
                        : state === "current"
                          ? "border-brand text-foreground"
                          : "border-border text-muted-foreground"
                    }`}
                    aria-hidden="true"
                  >
                    {state === "done" ? <Check className="size-4" /> : index + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    <p
                      className={`text-sm ${state === "upcoming" ? "text-muted-foreground" : "font-medium"}`}
                    >
                      {steps[step].title}
                      <span className="sr-only">
                        {" "}
                        (
                        {state === "done"
                          ? nl ? "klaar" : "done"
                          : state === "current"
                            ? nl ? "huidige stap" : "current step"
                            : nl ? "komt nog" : "upcoming"}
                        )
                      </span>
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {steps[step].text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {s.due && (
        <Card id="betaling" className="scroll-mt-24 border-brand">
          <CardHeader>
            <CardTitle>
            <h2>{s.due.part === "deposit"
                ? nl ? "Betaal je aanbetaling" : "Pay your deposit"
                : s.depositPaid
                  ? nl ? "Betaal het restant" : "Pay the balance"
                  : nl ? "Betaal je factuur" : "Pay your invoice"}</h2>
          </CardTitle>
            <CardDescription>
              {nl
                ? "Maak het bedrag over met je eigen bank-app. Zodra ARSI Events je betaling heeft ontvangen, zie je dat hier terug."
                : "Transfer the amount with your own banking app. Once ARSI Events has received your payment, you will see it here."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bank ? (
              <dl className="flex flex-col gap-4">
                <CopyRow
                  label={nl ? "Bedrag" : "Amount"}
                  value={euro(s.due.cents, nl)}
                  copyValue={(s.due.cents / 100).toFixed(2).replace(".", ",")}
                  nl={nl}
                />
                <CopyRow label="IBAN" value={bank.iban} nl={nl} />
                <CopyRow
                  label={nl ? "Ten name van" : "Account name"}
                  value={bank.accountName}
                  nl={nl}
                />
                <CopyRow
                  label={nl ? "Betaalkenmerk" : "Payment reference"}
                  value={paymentReference(b.id, s.due.part)}
                  nl={nl}
                />
              </dl>
            ) : (
              <div className="flex flex-col gap-4">
                <Row
                  label={nl ? "Te betalen" : "Amount due"}
                  value={euro(s.due.cents, nl)}
                  strong
                />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {nl
                    ? "De betaalgegevens staan hier nog niet. Neem contact op met ARSI Events om te betalen."
                    : "The payment details are not available here yet. Contact ARSI Events to pay."}
                </p>
                <MessageButton variant="brand" label={supportLabel} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{quoted
              ? nl ? "Offerte" : "Quote"
              : nl ? "Prijsindicatie" : "Price estimate"}</h2>
          </CardTitle>
          <CardDescription>
            {quoted && b.respondedAt
              ? `${nl ? "Goedgekeurd op" : "Approved on"} ${date(b.respondedAt, nl)}`
              : nl
                ? "Op basis van je ingediende aanvraag."
                : "Based on your submitted request."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-5">
            {quoteLines.map((line) => (
              <Row
                key={line.label}
                label={line.label}
                sub={line.sub}
                value={euro(line.cents, nl)}
              />
            ))}
            <Separator />
            <Row
              label={vatCents > 0 ? (nl ? "Totaal incl. btw" : "Total incl. VAT") : nl ? "Totaal" : "Total"}
              value={euro(s.quoteCents, nl)}
              strong
            />
            <Separator />
            <div className="flex items-center justify-between gap-4 text-sm">
              <div>
                <p>
                  {nl
                    ? `Aanbetaling (${DEPOSIT_PERCENT}%)`
                    : `Deposit (${DEPOSIT_PERCENT}%)`}
                </p>
                <p className="text-muted-foreground">
                  {nl ? "Na goedkeuring" : "After approval"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {s.depositPaid && (
                  <Badge variant="secondary">{nl ? "Betaald" : "Paid"}</Badge>
                )}
                <span className="tabular-nums">
                  {euro(s.depositCents, nl)}
                </span>
              </div>
            </div>
            <Row
              label={nl ? "Restant" : "Balance"}
              sub={nl ? "Na het evenement" : "After the event"}
              value={euro(Math.max(s.quoteCents - s.depositCents, 0), nl)}
            />
          </div>
        </CardContent>
      </Card>

      {invoice && (
        <Card>
          <CardHeader>
            <CardTitle>
            <h2>{nl ? "Eindfactuur" : "Final invoice"}</h2>
          </CardTitle>
            <CardDescription>
              {nl ? "Factuur" : "Invoice"} {invoice.invoiceNumber} ·{" "}
              {date(invoice.invoiceDate, nl)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-5">
              {invoice.lines.map((line, index) => (
                <Row
                  key={`${line.key}-${index}`}
                  label={line.description}
                  sub={
                    line.quantity !== 1
                      ? `${line.quantity} ${line.unitLabel}`
                      : undefined
                  }
                  value={euro(line.grossCents, nl)}
                />
              ))}
              <Separator />
              <Row
                label={nl ? "Totaal" : "Total"}
                sub={
                  s.addedCents !== 0
                    ? `${s.addedCents > 0 ? "+" : "−"}${euro(Math.abs(s.addedCents), nl)} ${nl ? "ten opzichte van de offerte" : "compared to the quote"}`
                    : undefined
                }
                value={euro(s.finalCents, nl)}
                strong
              />
              {s.depositPaid && (
                <Row
                  label={nl ? "Al betaald (aanbetaling)" : "Already paid (deposit)"}
                  value={`− ${euro(s.depositCents, nl)}`}
                />
              )}
              <Separator />
              <div className="flex items-center justify-between gap-4 font-semibold">
                <span>
                  {s.paid
                    ? nl ? "Restant" : "Balance"
                    : nl ? "Nog te betalen" : "Still to pay"}
                </span>
                <div className="flex items-center gap-2">
                  {s.paid && (
                    <Badge variant="secondary">{nl ? "Betaald" : "Paid"}</Badge>
                  )}
                  <span className="tabular-nums">
                    {euro(
                      s.depositPaid ? s.balanceCents : s.finalCents,
                      nl,
                    )}
                  </span>
                </div>
              </div>
              {s.paid && b.paidAt && (
                <p className="text-sm text-muted-foreground">
                  {nl ? "Betaling ontvangen op" : "Payment received on"}{" "}
                  {date(b.paidAt, nl)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
