"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Sparkles, Send, X, Minimize2, Maximize2, Music } from "lucide-react"
import { Card } from "@/components/ui/card"
import { generateSearchSuggestions } from "@/lib/smart-search"
import {
  type ConversationMessage,
  type FilterState,
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
}

export function SmartSearchInput({
  value,
  onChange,
  placeholder,
  onFilterUpdate,
  autoStart = false,
  onAutoStartComplete,
  onMusicUpload,
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

    console.log("[v0] Applying filter suggestions:", initialFilters)

    if (onFilterUpdate) {
      const convertedFilters = { ...initialFilters }
      if ((initialFilters as any).musicGenres) {
        convertedFilters.genres = (initialFilters as any).musicGenres
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

  const handleSendMessage = () => {
    if (!currentInput.trim() || !currentQuestion) return

    const userMessage: ConversationMessage = {
      role: "user",
      content: currentInput,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    const extractedFilter = extractAnswerToFilter(currentQuestion, currentInput, language)
    const updatedFilters = { ...currentFilters, ...extractedFilter }
    setCurrentFilters(updatedFilters)

    if (onFilterUpdate) {
      console.log("[v0] Conversational AI filter update:", updatedFilters)
      onFilterUpdate(updatedFilters)
    }

    const missingFilters = identifyMissingFilters(updatedFilters)
    const nextQuestion = getNextQuestion(missingFilters, language)

    setTimeout(() => {
      if (nextQuestion) {
        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content: nextQuestion,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        setCurrentQuestion(nextQuestion)
      } else {
        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content: t.aiCompleteMessage,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        setIsComplete(true)
        setCurrentQuestion(null)
      }
    }, 500)

    setCurrentInput("")
  }

  const handleConversationKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const closeConversation = () => {
    setShowConversation(false)
    setMessages([])
    setCurrentInput("")
    setIsComplete(false)
    setCurrentQuestion(null)
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

  if (showConversation) {
    if (isMinimized) {
      return (
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-blue-900 dark:text-blue-200 flex-1">{t.aiAssistant}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
              className="dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeConversation}
              className="dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )
    }

    return (
      <Card className="flex-1 max-w-2xl p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-200">{t.aiAssistant}</h3>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeConversation}
              className="dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div ref={conversationRef} className="space-y-3 mb-4 max-h-48 overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString(language === "nl" ? "nl-NL" : "en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {!isComplete && (
          <div className="flex gap-2">
            <Input
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleConversationKeyPress}
              placeholder={t.typeYourAnswer}
              className="flex-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:border-red-500 dark:focus:border-red-400 transition-colors w-full"
              autoFocus
            />
            <Button onClick={handleSendMessage} disabled={!currentInput.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isComplete && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.viewResultsBelow}</p>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
        {onMusicUpload && (
          <>
            <button
              type="button"
              onClick={handleMusicClick}
              className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
              aria-label="Upload MP3"
            >
              <Music className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
          </>
        )}
        <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 dark:text-red-400 w-4 h-4" />
        <Input
          ref={inputRef}
          placeholder={effectivePlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length > 0 && setShowSuggestions(true)}
          onBlur={handleBlur}
          className="pl-10 pr-10 h-12 text-base bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-700 focus:border-red-500 dark:focus:border-red-400 transition-colors w-full"
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
