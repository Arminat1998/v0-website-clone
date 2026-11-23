"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Sparkles, Send, X, ChevronUp, ChevronDown, ArrowDown, RotateCcw, Undo2 } from "lucide-react"
import { generateSearchSuggestions } from "@/lib/smart-search"
import {
  type ConversationMessage,
  type QuestionKey,
  extractAnswer,
  isAnswered,
  isNoPreference,
  nextQuestion,
  notUnderstood,
  questionText,
  questionsFor,
  quickReplies,
  welcomeMessage,
} from "@/lib/conversational-ai"
import { filtersFromText, parseSearch } from "@/lib/adaptive-filters"
import { activeFilters, type ListFilters, type ProfessionalKind } from "@/lib/list-filters"
import { useLanguage } from "@/contexts/language-context"
import type { ListSearch } from "@/hooks/use-list-search"

interface SmartSearchInputProps {
  kind: ProfessionalKind
  search: ListSearch
  /** The number of results for a search text with these filters. */
  count: (query: string, filters: ListFilters) => number
  /** Opens the chat with the current text, for a search that was typed on another page. */
  autoStart?: boolean
  onAutoStartComplete?: () => void
  /** Id of the results list, so the chat can scroll to it. */
  resultsId?: string
}

/** Longest text the chat and the search box accept. */
const MAX_LENGTH = 300

export function SmartSearchInput({ kind, search, count, autoStart = false, onAutoStartComplete, resultsId }: SmartSearchInputProps) {
  const { t, language } = useLanguage()
  const nl = language === "nl"
  const value = search.query
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const [showConversation, setShowConversation] = useState(false)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [currentKey, setCurrentKey] = useState<QuestionKey | null>(null)
  const [skipped, setSkipped] = useState<Set<QuestionKey>>(new Set())
  /** How it was before the last answer, when that answer left no results. */
  const [undo, setUndo] = useState<{ filters: ListFilters; key: QuestionKey } | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const conversationRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const placeholder =
    kind === "artist" ? (nl ? "Bijv. DJ voor een bruiloft" : "E.g. DJ for a wedding") : nl ? "Bijv. fotograaf voor een bruiloft" : "E.g. photographer for a wedding"
  const searchLabel =
    kind === "artist" ? t.searchDescription : nl ? "Beschrijf je evenement of wat je zoekt in een fotograaf of videograaf" : "Describe your event or what you need from a photographer or videographer"

  // Only the chat itself scrolls, so a new message never moves the page.
  useEffect(() => {
    conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isTyping, isMinimized])

  useEffect(() => () => clearTimeout(typingTimer.current), [])

  // Suggestions always lead to results; others are left out.
  const suggestions = useMemo(() => {
    if (!value.trim() || showConversation) return []
    return generateSearchSuggestions(value, kind, language)
      .filter((suggestion) => count(suggestion, filtersFromText(suggestion, kind)) > 0)
      .slice(0, 8)
  }, [value, kind, language, showConversation, count])
  const showSuggestions = suggestionsOpen && suggestions.length > 0 && !showConversation

  const say = (role: ConversationMessage["role"], content: string): ConversationMessage => ({ role, content, timestamp: new Date() })

  const resultsText = (n: number) =>
    n === 0
      ? nl ? "Hier past nu niemand bij. Laat hieronder een keuze los, of beantwoord de volgende vraag." : "No one fits this right now. Drop a choice below, or answer the next question."
      : nl ? `${n} ${n === 1 ? "professional past" : "professionals passen"} hierbij.` : `${n} ${n === 1 ? "professional fits" : "professionals fit"} this.`

  const closingText = (n: number) =>
    n === 0
      ? nl ? "Dat waren mijn vragen. Laat hieronder een van je keuzes los om weer resultaten te zien." : "Those were my questions. Drop one of your choices below to see results again."
      : nl ? "Dat waren mijn vragen. Je ziet hieronder de professionals die passen." : "Those were my questions. Below you see the professionals that fit."

  const startConversation = (text: string, filters: ListFilters) => {
    if (!text.trim()) return
    const key = nextQuestion(kind, filters, new Set())
    const n = count(text, filters)
    setMessages([
      say("user", text),
      say("assistant", welcomeMessage(parseSearch(text, kind).filters, kind, language)),
      say("assistant", `${resultsText(n)} ${key ? questionText(key, kind, language) : closingText(n)}`),
    ])
    setCurrentKey(key)
    setSkipped(new Set())
    setUndo(null)
    setIsTyping(false)
    setIsMinimized(false)
    setShowConversation(true)
    setSuggestionsOpen(false)
  }

  useEffect(() => {
    if (!autoStart || !value || showConversation) return
    startConversation(value, search.filters)
    onAutoStartComplete?.()
  }, [autoStart, value])

  const chooseSuggestion = (suggestion: string) => {
    search.search(suggestion)
    startConversation(suggestion, filtersFromText(suggestion, kind))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (showSuggestions && selectedIndex >= 0) chooseSuggestion(suggestions[selectedIndex])
      else startConversation(value, search.filters)
      return
    }
    if (!showSuggestions) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, -1))
    } else if (e.key === "Escape") {
      setSuggestionsOpen(false)
      setSelectedIndex(-1)
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) setSuggestionsOpen(false)
  }

  // Asks the next open question, or closes the conversation when everything is known or skipped.
  const askNext = (filters: ListFilters, skippedKeys: Set<QuestionKey>, intro: string) => {
    const key = nextQuestion(kind, filters, skippedKeys)
    const text = `${intro} ${key ? questionText(key, kind, language) : closingText(count(value, filters))}`.trim()
    setIsTyping(true)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [...prev, say("assistant", text)])
      setCurrentKey(key)
    }, 500)
  }

  const skipQuestion = (words: string) => {
    if (!currentKey || isTyping) return
    const nextSkipped = new Set(skipped).add(currentKey)
    setSkipped(nextSkipped)
    setUndo(null)
    setMessages((prev) => [...prev, say("user", words)])
    askNext(search.filters, nextSkipped, "")
  }

  const sendAnswer = (raw: string) => {
    const answer = raw.trim().slice(0, MAX_LENGTH)
    if (!answer || !currentKey || isTyping) return
    setCurrentInput("")
    if (isNoPreference(answer)) {
      skipQuestion(answer)
      return
    }
    const result = extractAnswer(currentKey, answer, kind)
    if (!result.ok) {
      setMessages((prev) => [...prev, say("user", answer), say("assistant", notUnderstood(currentKey, kind, language, result.reason))])
      return
    }
    setMessages((prev) => [...prev, say("user", answer)])
    const filters = { ...search.filters, ...result.filters }
    const n = count(value, filters)
    setUndo(n === 0 && count(value, search.filters) > 0 ? { filters: search.filters, key: currentKey } : null)
    search.update(result.filters)
    // An answer that sets no limit ("max 9000") still answers the question.
    const nextSkipped = isAnswered(currentKey, filters) ? skipped : new Set(skipped).add(currentKey)
    setSkipped(nextSkipped)
    askNext(filters, nextSkipped, resultsText(n))
  }

  const undoLast = () => {
    if (!undo || isTyping) return
    search.update(undo.filters)
    setMessages((prev) => [...prev, say("user", nl ? "Laatste antwoord ongedaan maken" : "Undo last answer")])
    setUndo(null)
    const nextSkipped = new Set(skipped).add(undo.key)
    setSkipped(nextSkipped)
    askNext(undo.filters, nextSkipped, nl ? "Dat antwoord telt niet meer mee." : "That answer no longer counts.")
  }

  const handleConversationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      sendAnswer(currentInput)
    }
  }

  // Closing the chat or starting a new search empties the text and every filter.
  const startOver = () => {
    clearTimeout(typingTimer.current)
    setShowConversation(false)
    setMessages([])
    setCurrentInput("")
    setCurrentKey(null)
    setSkipped(new Set())
    setUndo(null)
    setIsTyping(false)
    setIsMinimized(false)
    search.clearAll()
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const showResults = () => {
    setIsMinimized(true)
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    document.getElementById(resultsId ?? "")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
  }

  const isComplete = currentKey === null && !isTyping
  const questions = questionsFor(kind, search.filters)
  const answeredCount = questions.filter((key) => key !== currentKey && (isAnswered(key, search.filters) || skipped.has(key))).length
  const remaining = questions.length - answeredCount
  const progress = isComplete ? 100 : Math.round((answeredCount / questions.length) * 100)
  const replies = currentKey ? quickReplies(currentKey, kind, language) : []
  const known = activeFilters(search.filters, language).map((item) => item.label)
  const assistantName = nl ? "ARSI-assistent" : "ARSI assistant"
  const formatTime = (date: Date) =>
    date.toLocaleTimeString(nl ? "nl-NL" : "en-GB", { hour: "2-digit", minute: "2-digit" })

  if (showConversation) {
    if (isMinimized) {
      return (
        <div className="flex w-full flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-700/10 text-red-600 dark:bg-red-500/15 dark:text-red-400">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{assistantName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {known.length > 0 ? known.join(" · ") : nl ? "Nog geen voorkeuren" : "No preferences yet"}
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-11" onClick={() => setIsMinimized(false)}>
            <ChevronDown className="size-4" aria-hidden />
            {isComplete ? (nl ? "Gesprek tonen" : "Show chat") : nl ? "Verder chatten" : "Continue chat"}
          </Button>
          <Button variant="ghost" size="icon" className="size-11" onClick={startOver} aria-label={nl ? "Gesprek sluiten en alles wissen" : "Close chat and clear everything"}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      )
    }

    return (
      <section
        aria-label={assistantName}
        className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-700/10 text-red-600 dark:bg-red-500/15 dark:text-red-400">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">{assistantName}</h3>
            <p className="text-xs text-muted-foreground">
              {isComplete
                ? nl
                  ? "Klaar: de resultaten hieronder zijn bijgewerkt"
                  : "Done: the results below are updated"
                : nl
                  ? `Nog ${remaining} ${remaining === 1 ? "vraag" : "vragen"} · elk antwoord past de resultaten aan`
                  : `${remaining} ${remaining === 1 ? "question" : "questions"} left · every answer updates the results`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={() => setIsMinimized(true)}
            aria-label={nl ? "Gesprek inklappen" : "Collapse chat"}
          >
            <ChevronUp className="size-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" className="size-11" onClick={startOver} aria-label={nl ? "Gesprek sluiten en alles wissen" : "Close chat and clear everything"}>
            <X className="size-4" aria-hidden />
          </Button>
        </header>
        <div
          className="h-1 bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={nl ? "Voortgang" : "Progress"}
        >
          <div className="h-full bg-red-600 transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>

        {known.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2.5">
            <span className="mr-1 text-xs font-medium text-muted-foreground">{nl ? "Je zoekt:" : "Looking for:"}</span>
            {known.map((item) => (
              <span key={item} className="max-w-full rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground [overflow-wrap:anywhere]">
                {item}
              </span>
            ))}
          </div>
        )}

        <div
          ref={conversationRef}
          role="log"
          aria-live="polite"
          className="max-h-[min(50vh,22rem)] space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4"
        >
          {messages.map((message, index) =>
            message.role === "assistant" ? (
              <div key={index} className="flex items-end gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-700/10 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                  <Sparkles className="size-3.5" aria-hidden />
                </span>
                <div className="min-w-0 max-w-[85%]">
                  <p className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
                    {message.content}
                  </p>
                  <span className="mt-1 block pl-1 text-[11px] text-muted-foreground">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ) : (
              <div key={index} className="flex justify-end">
                <div className="min-w-0 max-w-[85%] text-right">
                  <p className="rounded-2xl rounded-br-sm bg-red-700 px-3.5 py-2.5 text-left text-sm leading-relaxed text-white [overflow-wrap:anywhere]">
                    {message.content}
                  </p>
                  <span className="mt-1 block pr-1 text-[11px] text-muted-foreground">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ),
          )}
          {isTyping && (
            <div className="flex items-end gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-700/10 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                <Sparkles className="size-3.5" aria-hidden />
              </span>
              <span className="flex gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3.5">
                <span className="sr-only">{nl ? "Assistent typt" : "Assistant is typing"}</span>
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="size-1.5 animate-bounce motion-reduce:animate-none rounded-full bg-muted-foreground"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            </div>
          )}
        </div>

        {undo && !isTyping && (
          <div className="border-t border-border px-4 py-3">
            <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={undoLast}>
              <Undo2 className="size-4" aria-hidden />
              {nl ? "Laatste antwoord ongedaan maken" : "Undo last answer"}
            </Button>
          </div>
        )}

        {!isComplete ? (
          <div className="space-y-3 border-t border-border px-4 py-3">
            {replies.length > 0 && !isTyping && (
              <div role="group" className="flex flex-wrap gap-2" aria-label={nl ? "Snelle antwoorden" : "Quick replies"}>
                {replies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => sendAnswer(reply)}
                    className="min-h-11 rounded-full border border-border bg-background px-3 text-sm text-foreground transition-colors hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleConversationKeyDown}
                placeholder={t.typeYourAnswer}
                aria-label={currentKey ? questionText(currentKey, kind, language) : t.typeYourAnswer}
                maxLength={MAX_LENGTH}
                className="h-11 flex-1 bg-background"
                autoFocus
              />
              <Button
                onClick={() => sendAnswer(currentInput)}
                disabled={!currentInput.trim() || isTyping}
                size="icon"
                className="size-11 bg-red-700 text-white hover:bg-red-600"
                aria-label={nl ? "Versturen" : "Send"}
              >
                <Send className="size-4" aria-hidden />
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => skipQuestion(nl ? "Sla over" : "Skip")}
                disabled={isTyping || !currentKey}
                className="min-h-11 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
              >
                {nl ? "Vraag overslaan" : "Skip question"}
              </button>
              {resultsId && (
                <button
                  type="button"
                  onClick={showResults}
                  className="min-h-11 text-sm font-medium text-red-600 underline-offset-4 dark:text-red-400 hover:underline"
                >
                  {nl ? "Nu resultaten bekijken" : "See results now"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row">
            {resultsId && (
              <Button className="h-11 flex-1 bg-red-700 text-white hover:bg-red-600" onClick={showResults}>
                {t.viewResultsBelow}
                <ArrowDown className="size-4" aria-hidden />
              </Button>
            )}
            <Button variant="outline" className="h-11 flex-1" onClick={startOver}>
              <RotateCcw className="size-4" aria-hidden />
              {nl ? "Nieuwe zoekopdracht" : "New search"}
            </Button>
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          ref={inputRef}
          aria-label={searchLabel}
          placeholder={placeholder}
          maxLength={MAX_LENGTH}
          enterKeyHint="search"
          value={value}
          onChange={(e) => {
            search.setQuery(e.target.value)
            setSuggestionsOpen(true)
            setSelectedIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setSuggestionsOpen(true)}
          onBlur={handleBlur}
          className="h-12 w-full bg-background pl-10 text-base transition-colors focus-visible:border-red-500"
        />
      </div>

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 mt-1 max-h-64 overflow-y-auto"
        >
          <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Sparkles className="inline w-3 h-3 mr-1" />
            {t.smartSearchSuggestions}
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              className={`w-full min-h-11 text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
                index === selectedIndex
                  ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
              type="button"
              // Keeps the focus in the field, so the list is still there when the click lands.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => chooseSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center">
                <Search className="w-3 h-3 mr-2 text-gray-400 dark:text-gray-500" />
                <span className="text-sm">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
