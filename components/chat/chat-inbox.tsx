"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import useSWR from "swr"
import { ArrowLeft, LifeBuoy, MessageSquare, Send } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getInbox, getThread, openConversation, sendMessage, type InboxItem } from "@/app/actions/messages"
import { AccountHeading } from "@/components/account/account-common"
import { cn } from "@/lib/utils"

function formatTime(iso: string, locale: string) {
  const date = new Date(iso)
  const today = new Date().toDateString() === date.toDateString()
  return date.toLocaleString(locale, today ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" })
}

export function ChatHeading({ audience }: { audience: "admin" | "professional" }) {
  const nl = useLanguage().language === "nl"
  const admin = audience === "admin"

  return (
    <AccountHeading
      title={admin ? (nl ? "Support & berichten" : "Support & messages") : nl ? "Berichten" : "Messages"}
      description={
        admin
          ? nl
            ? "Beantwoord supportvragen van klanten en professionals."
            : "Answer support requests from customers and professionals."
          : nl
            ? "Chat met klanten over aanvragen, boekingen en evenementdetails."
            : "Chat with customers about requests, bookings and event details."
      }
    />
  )
}

function ConversationAvatar({ item }: { item: InboxItem }) {
  return (
    <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
      {item.kind === "support" ? <LifeBuoy className="size-5" /> : item.name.slice(0, 2).toUpperCase()}
    </span>
  )
}

const roleBadge = "w-fit rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"

export function ChatInbox({
  initialInbox,
  initialId,
  canContactSupport = false,
  startsFromBooking = false,
}: {
  initialInbox: InboxItem[]
  initialId?: number
  canContactSupport?: boolean
  /** The viewer can open a conversation from one of their bookings. */
  startsFromBooking?: boolean
}) {
  const nl = useLanguage().language === "nl"
  const locale = nl ? "nl-NL" : "en-GB"
  const [selectedId, setSelectedId] = useState<number | null>(initialId ?? null)
  // What was typed but not sent, per conversation, so it can never end up with someone else.
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  // The conversation the problem belongs to; null for the list.
  const [problem, setProblem] = useState<{ id: number | null; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const threadRef = useRef<HTMLDivElement>(null)

  const inbox = useSWR("chat-inbox", () => getInbox(), { fallbackData: initialInbox, refreshInterval: 10000 })
  const items = inbox.data ?? []
  // The cached list can be older than the one this page was opened with.
  const selected = items.find((item) => item.id === selectedId) ?? initialInbox.find((item) => item.id === selectedId)
  const thread = useSWR(selected ? ["chat-thread", selected.id] : null, () => getThread(selected!.id), {
    refreshInterval: 4000,
  })
  const draft = selected ? (drafts[selected.id] ?? "") : ""
  const error = problem && problem.id === (selected?.id ?? null) ? problem.text : ""
  const notFound = selectedId !== null && !selected

  useEffect(() => {
    const panel = threadRef.current
    if (panel) panel.scrollTop = panel.scrollHeight
  }, [thread.data?.length, selectedId])

  function select(id: number) {
    setSelectedId(id)
    // A message that did not arrive stays marked in its own conversation.
    setProblem((current) => (current?.id ? current : null))
    inbox.mutate((list) => list?.map((item) => (item.id === id ? { ...item, unread: false } : item)), {
      revalidate: false,
    })
  }

  function contactSupport() {
    setProblem(null)
    startTransition(async () => {
      try {
        const id = await openConversation(null)
        await inbox.mutate()
        select(id)
      } catch {
        setProblem({
          id: null,
          text: nl ? "Het gesprek kon niet worden geopend. Probeer opnieuw." : "Could not open the conversation. Try again.",
        })
      }
    })
  }

  function submit() {
    if (!selected || !draft.trim() || pending) return
    const id = selected.id
    const body = draft
    setProblem(null)
    startTransition(async () => {
      // The text stays in the field until the server has the message.
      const result = await sendMessage(id, body).catch(() => ({ ok: false as const, error: "offline" }))
      if (!result.ok) {
        setProblem({
          id,
          text:
            result.error === "too_many"
              ? nl
                ? "Je hebt veel berichten achter elkaar gestuurd. Wacht een minuut en verstuur dan opnieuw."
                : "You sent a lot of messages in a row. Wait a minute and send again."
              : nl
                ? "Versturen is niet gelukt. Probeer opnieuw."
                : "Could not send. Try again.",
        })
        return
      }
      setDrafts((current) => (current[id] === body ? { ...current, [id]: "" } : current))
      await Promise.all([thread.mutate(), inbox.mutate()])
    })
  }

  const kindLabel = (kind: InboxItem["kind"]) =>
    kind === "support" ? (nl ? "Klantenservice" : "Customer support") : kind === "professional" ? "Professional" : nl ? "Klant" : "Customer"

  const hasSupport = items.some((item) => item.kind === "support")

  return (
    <div className="@container">
      <div className="flex h-[calc(100dvh-15.5rem)] min-h-[520px] max-h-[820px] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <aside className={cn("w-full shrink-0 flex-col @2xl:flex @2xl:w-80 @2xl:border-r @4xl:w-96", selected ? "hidden" : "flex")}>
          <div className="flex items-center justify-between gap-2 border-b p-4">
            <h2 className="font-semibold">{nl ? "Gesprekken" : "Conversations"}</h2>
            {canContactSupport && !hasSupport && (
              <Button size="sm" variant="outline" onClick={contactSupport} disabled={pending}>
                <LifeBuoy />
                Support
              </Button>
            )}
          </div>
          {!selected && (error || notFound) && (
            <p role="alert" className="border-b p-4 text-sm text-red-700 dark:text-red-400">
              {error ||
                (nl
                  ? "Dit gesprek is niet gevonden. Kies een gesprek uit de lijst."
                  : "This conversation was not found. Choose one from the list.")}
            </p>
          )}
          <ul className="flex-1 overflow-y-auto">
            {items.length === 0 && (
              <li className="flex flex-col items-center gap-3 p-8 text-center text-sm text-muted-foreground">
                <MessageSquare className="size-6" />
                <p className="text-pretty leading-relaxed">
                  {canContactSupport
                    ? nl
                      ? "Nog geen gesprekken. Start een gesprek vanuit een boeking, of neem contact op met support."
                      : "No conversations yet. Start one from a booking, or contact support."
                    : startsFromBooking
                      ? nl
                        ? "Nog geen gesprekken. Start een gesprek vanuit een boeking."
                        : "No conversations yet. Start one from a booking."
                      : nl
                        ? "Nog geen gesprekken."
                        : "No conversations yet."}
                </p>
              </li>
            )}
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => select(item.id)}
                  aria-current={item.id === selectedId ? "true" : undefined}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-l-4 border-l-transparent p-4 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
                    item.id === selectedId && "border-l-brand bg-accent/80",
                  )}
                >
                  <ConversationAvatar item={item} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-sm", item.unread ? "font-semibold" : "font-medium")}>{item.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatTime(item.lastAt, locale)}</span>
                    </span>
                    <span className={roleBadge}>{kindLabel(item.kind)}</span>
                    <span className="flex items-center gap-2">
                      <span className={cn("truncate text-sm", item.unread ? "text-foreground" : "text-muted-foreground")}>
                        {item.lastBody ?? (nl ? "Nog geen berichten" : "No messages yet")}
                      </span>
                      {item.unread && (
                        <span className="ml-auto size-2 shrink-0 rounded-full bg-brand">
                          <span className="sr-only">{nl ? "Ongelezen" : "Unread"}</span>
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className={cn("min-w-0 flex-1 flex-col @2xl:flex", selected ? "flex" : "hidden")}>
          {selected ? (
            <>
              <header className="flex items-center gap-3 border-b p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="@2xl:hidden"
                  onClick={() => setSelectedId(null)}
                  aria-label={nl ? "Terug naar gesprekken" : "Back to conversations"}
                >
                  <ArrowLeft />
                </Button>
                <ConversationAvatar item={selected} />
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="truncate font-semibold">{selected.name}</h2>
                  <p className={roleBadge}>{kindLabel(selected.kind)}</p>
                </div>
              </header>
              <div ref={threadRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-muted/20 p-4" aria-live="polite">
                {thread.data === undefined && !thread.error && (
                  <p role="status" className="m-auto text-center text-sm text-muted-foreground">
                    {nl ? "Gesprek laden..." : "Loading conversation..."}
                  </p>
                )}
                {thread.data === undefined && thread.error && (
                  <div role="alert" className="m-auto flex max-w-xs flex-col items-center gap-3 text-center text-sm text-muted-foreground">
                    <p>{nl ? "Het gesprek kon niet worden geladen." : "The conversation could not be loaded."}</p>
                    <Button variant="outline" className="min-h-11" disabled={thread.isValidating} onClick={() => thread.mutate()}>
                      {nl ? "Opnieuw proberen" : "Try again"}
                    </Button>
                  </div>
                )}
                {thread.data === null && (
                  <p role="alert" className="m-auto max-w-xs text-center text-sm text-muted-foreground">
                    {nl ? "Dit gesprek is niet meer beschikbaar." : "This conversation is no longer available."}
                  </p>
                )}
                {thread.data?.length === 0 && (
                  <div className="m-auto flex max-w-xs flex-col items-center gap-3 text-center text-sm text-muted-foreground">
                    <MessageSquare aria-hidden className="size-6" />
                    <p>{nl ? "Stuur het eerste bericht om het gesprek te starten." : "Send the first message to start the conversation."}</p>
                  </div>
                )}
                {thread.data?.map((message) => (
                  <div key={message.id} className={cn("flex flex-col gap-1", message.mine ? "items-end" : "items-start")}>
                    {!message.mine && message.role === "admin" && <span className={roleBadge}>ARSI Support</span>}
                    <p
                      className={cn(
                        "max-w-[min(85%,28rem)] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs",
                        message.mine ? "rounded-tr-xs bg-red-700 text-white" : "rounded-tl-xs border border-border/50 bg-muted text-foreground",
                      )}
                    >
                      {message.body}
                    </p>
                    <time dateTime={message.createdAt} className="text-xs text-muted-foreground">
                      {formatTime(message.createdAt, locale)}
                    </time>
                  </div>
                ))}
              </div>
              <form
                className="flex flex-col gap-2 border-t p-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  submit()
                }}
              >
                <div className="flex items-center gap-2">
                  <label htmlFor="chat-message" className="sr-only">
                    {nl ? "Bericht" : "Message"}
                  </label>
                  <Input
                    id="chat-message"
                    className="min-h-11 bg-background"
                    value={draft}
                    maxLength={2000}
                    autoComplete="off"
                    onChange={(e) => {
                      const text = e.target.value
                      setDrafts((current) => ({ ...current, [selected.id]: text }))
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
                    }}
                    placeholder={nl ? "Typ een bericht..." : "Type a message..."}
                  />
                  <Button type="submit" className="min-h-11 bg-red-700 text-white hover:bg-red-800" disabled={!draft.trim() || pending} aria-label={nl ? "Versturen" : "Send"}>
                    <Send />
                    <span className="hidden sm:inline">{nl ? "Versturen" : "Send"}</span>
                  </Button>
                </div>
                {error && (
                  <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                    {error}
                  </p>
                )}
              </form>
            </>
          ) : (
            <div className="m-auto flex flex-col items-center gap-3 p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="size-6" />
              <p>{nl ? "Kies een gesprek om berichten te lezen." : "Select a conversation to read messages."}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
