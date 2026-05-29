"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Send, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  type ConversationMessage,
  type FilterState,
  identifyMissingFilters,
  getNextQuestion,
  extractAnswerToFilter,
  generateWelcomeMessage,
} from "@/lib/conversational-ai"

interface ConversationalAIAssistantProps {
  initialFilters: Partial<FilterState>
  onFilterUpdate: (filters: Partial<FilterState>) => void
  onComplete: () => void
}

export function ConversationalAIAssistant({
  initialFilters,
  onFilterUpdate,
  onComplete,
}: ConversationalAIAssistantProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [currentFilters, setCurrentFilters] = useState<Partial<FilterState>>(initialFilters)
  const [isComplete, setIsComplete] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)

  useEffect(() => {
    // Initialize conversation with welcome message
    const welcomeMessage = generateWelcomeMessage(initialFilters)
    const missingFilters = identifyMissingFilters(initialFilters)
    const firstQuestion = getNextQuestion(missingFilters)

    const initialMessages: ConversationMessage[] = [
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
        content: "Perfect! Ik heb alle informatie die ik nodig heb. Je kunt nu de resultaten bekijken!",
        timestamp: new Date(),
      })
    }

    setMessages(initialMessages)
  }, [initialFilters])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!currentInput.trim() || !currentQuestion) return

    // Add user message
    const userMessage: ConversationMessage = {
      role: "user",
      content: currentInput,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Extract filter from answer
    const extractedFilter = extractAnswerToFilter(currentQuestion, currentInput)
    const updatedFilters = { ...currentFilters, ...extractedFilter }
    setCurrentFilters(updatedFilters)
    onFilterUpdate(extractedFilter)

    // Check for next question
    const missingFilters = identifyMissingFilters(updatedFilters)
    const nextQuestion = getNextQuestion(missingFilters)

    setTimeout(() => {
      if (nextQuestion) {
        // Ask next question
        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content: `Prima! ${nextQuestion}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        setCurrentQuestion(nextQuestion)
      } else {
        // All questions answered
        const assistantMessage: ConversationMessage = {
          role: "assistant",
          content:
            "Geweldig! Ik heb alle informatie. De filters zijn automatisch toegepast. Je ziet nu de beste matches voor jouw evenement! 🎉",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        setIsComplete(true)
        setCurrentQuestion(null)
      }
    }, 500)

    setCurrentInput("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-200">AI Assistent</h3>
        </div>
        {isComplete && (
          <Button variant="ghost" size="sm" onClick={onComplete} className="dark:text-gray-300 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
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
                {message.timestamp.toLocaleTimeString("nl-NL", {
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
            onKeyPress={handleKeyPress}
            placeholder="Type je antwoord..."
            className="flex-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
          />
          <Button onClick={handleSendMessage} disabled={!currentInput.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {isComplete && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Alle vragen beantwoord! Bekijk je resultaten hieronder.
          </p>
        </div>
      )}
    </Card>
  )
}
