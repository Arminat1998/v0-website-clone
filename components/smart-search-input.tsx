"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Sparkles, Send, X, ChevronUp, ChevronDown, ArrowDown, RotateCcw, Music } from "lucide-react"
import { generateSearchSuggestions } from "@/lib/smart-search"
import {
  type ConversationMessage,
  type FilterState,
  type MissingFilters,
  identifyMissingFilters,
  getNextQuestion,
  extractAnswerToFilter,
  generateWelcomeMessage,
} from "@/lib/conversational-ai"
import { generateFilterSuggestions } from "@/lib/adaptive-filters"
import { enhancedArtists } from "@/lib/smart-search"
import { useLanguage } from "@/contexts/language-context"

interface SmartSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onFilterUpdate?: (filters: Partial<FilterState>) => void
  autoStart?: boolean
  onAutoStartComplete?: () => void
  onMusicUpload?: (file: File) => void
  /** Id of the results list, so the chat can scroll to it. */
  resultsId?: string
}

type QuestionKey = keyof MissingFilters

const QUESTION_ORDER: QuestionKey[] = ["categories", "selectedDate", "city", "duration", "priceRange", "genres", "eventTypes"]

// Tap-to-answer options per question; each is phrased so extractAnswerToFilter understands it.
const QUICK_REPLIES: Record<QuestionKey, { nl: string[]; en: string[] }> = {
  categories: { nl: ["DJ", "Band", "Zanger", "Saxofonist", "Pianist"], en: ["DJ", "Band", "Singer", "Saxophonist", "Pianist"] },
  selectedDate: { nl: [], en: [] },
  city: { nl: ["Amsterdam", "Rotterdam", "Utrecht", "Den Haag", "Eindhoven"], en: ["Amsterdam", "Rotterdam", "Utrecht", "The Hague", "Eindhoven"] },
  duration: { nl: ["2 uur", "3 uur", "4 uur", "20:00 tot 00:00"], en: ["2 hours", "3 hours", "4 hours", "20:00 to 00:00"] },
  priceRange: { nl: ["max 500 euro", "tussen 300 en 800 euro", "max 1500 euro"], en: ["max 500 euro", "between 300 and 800 euro", "max 1500 euro"] },
  genres: { nl: ["House", "Techno", "Pop", "Hip-hop", "Jazz"], en: ["House", "Techno", "Pop", "Hip-hop", "Jazz"] },
  eventTypes: { nl: ["Bruiloft", "Bedrijfsfeest", "Verjaardag", "Festival"], en: ["Wedding", "Corporate", "Birthday", "Festival"] },
}

/** Short labels for what the chat knows so far, shown as chips. */
function summarizeFilters(filters: Partial<FilterState>, nl: boolean): string[] {
  const items: string[] = []
  if (filters.categories?.length) items.push(filters.categories.join(", "))
  if (filters.eventTypes?.length) items.push(filters.eventTypes.join(", "))
  if (filters.selectedDate) items.push(filters.selectedDate)
  if (filters.city) items.push(filters.city.charAt(0).toUpperCase() + filters.city.slice(1))
  if (filters.duration) items.push(`${filters.duration} ${nl ? "uur" : filters.duration === "1" ? "hour" : "hours"}`)
  const range = filters.priceRange
  if (range && !(range[0] === 100 && range[1] === 5000)) {
    items.push(range[0] > 0 ? `€${range[0]}–€${range[1]}` : `max €${range[1]}`)
  }
  if (filters.genres?.length) items.push(filters.genres.join(", "))
  return items
}

export function SmartSearchInput({
  value,
  onChange,
  placeholder,
  onFilterUpdate,
  autoStart = false,
  onAutoStartComplete,
  onMusicUpload,
  resultsId,
}: SmartSearchInputProps) {
  const { t, language } = useLanguage()
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const [showConversation, setShowConversation] = useState(false)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [currentFilters, setCurrentFilters] = useState<Partial<FilterState>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const conversationRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [isMinimized, setIsMinimized] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [skipped, setSkipped] = useState<Set<QuestionKey>>(new Set())
  const nl = language === "nl"
  const fileInputRef = useRef<HTMLInputElement>(null)

  const effectivePlaceholder = placeholder || t.searchYourArtist

  useEffect(() => {
    if (messagesEndRef.current && conversationRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [messages])

  useEffect(() => {
    const newSuggestions = generateSearchSuggestions(value)
    setSuggestions(newSuggestions)
    setShowSuggestions(value.length > 0 && newSuggestions.length > 0 && !showConversation)
    setSelectedIndex(-1)
  }, [value, showConversation])

  useEffect(() => {
    if (autoStart && value && !showConversation) {
      startConversation(value)
      onAutoStartComplete?.()
    }
  }, [autoStart, value])

  const startConversation = (query: string) => {
    if (!query.trim()) return

    const initialFilters = generateFilterSuggestions(query, enhancedArtists)
    setCurrentFilters(initialFilters)


    if (onFilterUpdate) {
      const convertedFilters = { ...initialFilters }
      if ((initialFilters as any).musicGenres) {
        ;(convertedFilters as Record<string, unknown>).genres = (initialFilters as any).musicGenres
        delete (convertedFilters as any).musicGenres
      }
      onFilterUpdate(convertedFilters)
    }

    const welcomeMessage = generateWelcomeMessage(initialFilters, language)
    const missingFilters = identifyMissingFilters(initialFilters)
    const firstQuestion = getNextQuestion(missingFilters, language)

    const initialMessages: ConversationMessage[] = [
      {
        role: "user",
        content: query,
        timestamp: new Date(),
      },
      {
        role: "assistant",
        content: welcomeMessage,
        timestamp: new Date(),
      },
    ]

    if (firstQuestion) {
      initialMessages.push({
        role: "assistant",
        content: firstQuestion,
        timestamp: new Date(),
      })
      setCurrentQuestion(firstQuestion)
    } else {
      setIsComplete(true)
      initialMessages.push({
        role: "assistant",
        content: t.aiCompleteMessage,
        timestamp: new Date(),
      })
    }

    setMessages(initialMessages)
    setSkipped(new Set())
    setIsMinimized(false)
    setShowConversation(true)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showConversation) return

    if (!showSuggestions) {
      if (e.key === "Enter") {
        e.preventDefault()
        startConversation(value)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          onChange(suggestions[selectedIndex])
          setShowSuggestions(false)
          startConversation(suggestions[selectedIndex])
        } else {
          startConversation(value)
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    startConversation(suggestion)
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (showConversation) return

    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false)
      }
    }, 150)
  }

  const sendAnswer = (answer: string) => {
    if (!answer.trim() || !currentQuestion || isTyping) return

    setMessages((prev) => [...prev, { role: "user", content: answer, timestamp: new Date() }])

    const updatedFilters = { ...currentFilters, ...extractAnswerToFilter(currentQuestion, answer, language) }
    setCurrentFilters(updatedFilters)
    onFilterUpdate?.(updatedFilters)
    setCurrentInput("")
    askNext(updatedFilters, skipped)
  }

  // Asks the next open question, or closes the conversation when everything is known or skipped.
  const askNext = (filters: Partial<FilterState>, skippedKeys: Set<QuestionKey>) => {
    const missing = identifyMissingFilters(filters)
    for (const key of skippedKeys) missing[key] = false
    const nextQuestion = getNextQuestion(missing, language)

    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: nextQuestion ?? t.aiCompleteMessage, timestamp: new Date() },
      ])
      setCurrentQuestion(nextQuestion)
      setIsComplete(!nextQuestion)
    }, 500)
  }

  const skipQuestion = () => {
    if (!currentKey || isTyping) return
    const nextSkipped = new Set(skipped).add(currentKey)
    setSkipped(nextSkipped)
    setMessages((prev) => [...prev, { role: "user", content: nl ? "Sla over" : "Skip", timestamp: new Date() }])
    askNext(currentFilters, nextSkipped)
  }

  const handleConversationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendAnswer(currentInput)
    }
  }

  const closeConversation = () => {
    setShowConversation(false)
    setIsMinimized(false)
    setMessages([])
    setCurrentInput("")
    setIsComplete(false)
    setCurrentQuestion(null)
    setSkipped(new Set())
    setIsTyping(false)
  }

  const startOver = () => {
    closeConversation()
    onChange("")
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const showResults = () => {
    setIsMinimized(true)
    document.getElementById(resultsId ?? "")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleMusicClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onMusicUpload) {
      onMusicUpload(file)
    }
  }

  // The question that is open now, in the same order as getNextQuestion asks them.
  const currentKey: QuestionKey | null = (() => {
    if (!currentQuestion) return null
    const missing = identifyMissingFilters(currentFilters)
    return QUESTION_ORDER.find((key) => missing[key] && !skipped.has(key)) ?? null
  })()
  const answeredCount = QUESTION_ORDER.filter(
    (key) => !identifyMissingFilters(currentFilters)[key] || skipped.has(key),
  ).length
  const remaining = QUESTION_ORDER.length - answeredCount
  const progress = isComplete ? 100 : Math.round((answeredCount / QUESTION_ORDER.length) * 100)
  const quickReplies = currentKey ? QUICK_REPLIES[currentKey][nl ? "nl" : "en"] : []
  const known = summarizeFilters(currentFilters, nl)
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
          <Button variant="outline" size="sm" className="h-9" onClick={() => setIsMinimized(false)}>
            <ChevronDown className="size-4" aria-hidden />
            {isComplete ? (nl ? "Gesprek tonen" : "Show chat") : nl ? "Verder chatten" : "Continue chat"}
          </Button>
          <Button variant="ghost" size="icon" className="size-9" onClick={startOver} aria-label={nl ? "Gesprek sluiten" : "Close chat"}>
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
            className="size-9"
            onClick={() => setIsMinimized(true)}
            aria-label={nl ? "Gesprek inklappen" : "Collapse chat"}
          >
            <ChevronUp className="size-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" className="size-9" onClick={startOver} aria-label={nl ? "Gesprek sluiten" : "Close chat"}>
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
              <span key={item} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {item}
              </span>
            ))}
          </div>
        )}

        <div
          ref={conversationRef}
          role="log"
          aria-live="polite"
          className="max-h-[min(50vh,22rem)] space-y-4 overflow-y-auto px-4 py-4"
        >
          {messages.map((message, index) =>
            message.role === "assistant" ? (
              <div key={index} className="flex items-end gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-700/10 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                  <Sparkles className="size-3.5" aria-hidden />
                </span>
                <div className="max-w-[85%]">
                  <p className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
                    {message.content}
                  </p>
                  <span className="mt-1 block pl-1 text-[11px] text-muted-foreground">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ) : (
              <div key={index} className="flex justify-end">
                <div className="max-w-[85%] text-right">
                  <p className="rounded-2xl rounded-br-sm bg-red-700 px-3.5 py-2.5 text-left text-sm leading-relaxed text-white">
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
                    className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {!isComplete ? (
          <div className="space-y-3 border-t border-border px-4 py-3">
            {quickReplies.length > 0 && !isTyping && (
              <div className="flex flex-wrap gap-2" aria-label={nl ? "Snelle antwoorden" : "Quick replies"}>
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => sendAnswer(reply)}
                    className="min-h-9 rounded-full border border-border bg-background px-3 text-sm text-foreground transition-colors hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                aria-label={currentQuestion ?? t.typeYourAnswer}
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
                onClick={skipQuestion}
                disabled={isTyping || !currentKey}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
              >
                {nl ? "Vraag overslaan" : "Skip question"}
              </button>
              {resultsId && (
                <button
                  type="button"
                  onClick={showResults}
                  className="text-sm font-medium text-red-600 underline-offset-4 dark:text-red-400 hover:underline"
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
        {onMusicUpload && (
          <>
            <button
              type="button"
              onClick={handleMusicClick}
              className="absolute right-9 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:text-red-500"
              aria-label={nl ? "Muziekbestand uploaden om op stijl te zoeken" : "Upload a music file to search by style"}
            >
              <Music className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
          </>
        )}
        <Sparkles className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-red-500" aria-hidden />
        <Input
          ref={inputRef}
          aria-label={effectivePlaceholder}
          placeholder={effectivePlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length > 0 && setShowSuggestions(true)}
          onBlur={handleBlur}
          className={`h-12 w-full bg-background pl-10 text-base transition-colors focus-visible:border-red-500 ${onMusicUpload ? "pr-16" : "pr-10"}`}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
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
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
                index === selectedIndex
                  ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
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
