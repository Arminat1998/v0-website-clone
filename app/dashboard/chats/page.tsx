"use client"

import React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { User, Send, ArrowLeft } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface Message {
  id: number
  text: string
  sender: "user" | "other"
  timestamp: string
}

interface Chat {
  id: number
  name: string
  avatar: string | null
  lastMessage: string
  unread: number
  messages: Message[]
}

const initialChats: Chat[] = [
  {
    id: 1,
    name: "Lisa",
    avatar: null,
    lastMessage: "Hoi Lisa! Ja, ik ben beschikbaar die dag 😊",
    unread: 0,
    messages: [
      {
        id: 1,
        text: "Hoi DJ! Ben je beschikbaar op 5 mei?",
        sender: "other",
        timestamp: "10:30",
      },
      {
        id: 2,
        text: "Hoi Lisa! Ja, ik ben beschikbaar die dag 😊",
        sender: "user",
        timestamp: "10:32",
      },
    ],
  },
  {
    id: 2,
    name: "Mark",
    avatar: null,
    lastMessage: "Ja, ik ben beschikbaar! Laat me de details...",
    unread: 1,
    messages: [
      {
        id: 1,
        text: "Hoi! Ben je beschikbaar voor een feest op 10 juni?",
        sender: "other",
        timestamp: "09:15",
      },
      {
        id: 2,
        text: "Ja, ik ben beschikbaar! Laat me de details...",
        sender: "user",
        timestamp: "09:20",
      },
      {
        id: 3,
        text: "Super! Het is in Rotterdam, vanaf 20:00 uur.",
        sender: "other",
        timestamp: "09:22",
      },
    ],
  },
  {
    id: 3,
    name: "Sophie",
    avatar: null,
    lastMessage: "Graag gedaan! Was een topavond!",
    unread: 1,
    messages: [
      {
        id: 1,
        text: "Bedankt voor het geweldige optreden gisteravond!",
        sender: "other",
        timestamp: "08:45",
      },
      {
        id: 2,
        text: "Graag gedaan! Was een topavond!",
        sender: "user",
        timestamp: "08:50",
      },
      {
        id: 3,
        text: "Iedereen was super enthousiast!",
        sender: "other",
        timestamp: "08:52",
      },
    ],
  },
]

export default function ChatsPage() {
  const { t } = useLanguage()
  const [chats, setChats] = useState<Chat[]>(initialChats)
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [showMobileChat, setShowMobileChat] = useState(false)

  const selectedChat = chats.find((chat) => chat.id === selectedChatId)

  const handleSelectChat = (chatId: number) => {
    setSelectedChatId(chatId)
    setShowMobileChat(true)
    // Mark chat as read when selected
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, unread: 0 } : chat
      )
    )
  }

  const handleBackToList = () => {
    setShowMobileChat(false)
  }

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return

    const newMessage: Message = {
      id: selectedChat.messages.length + 1,
      text: messageInput,
      sender: "user",
      timestamp: new Date().toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === selectedChatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: messageInput,
            }
          : chat
      )
    )

    setMessageInput("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] bg-background">
        {/* Chat List */}
        <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 bg-card border-r border-border flex-col`}>
          <div className="p-3 sm:p-4 border-b border-border">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">{t.chatsTitle}</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => handleSelectChat(chat.id)}
                className={`w-full p-3 sm:p-4 flex items-start gap-2 sm:gap-3 hover:bg-accent transition-colors border-l-4 touch-manipulation ${
                  selectedChatId === chat.id
                    ? "border-l-blue-500 bg-accent"
                    : "border-l-transparent"
                }`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">{chat.name}</h3>
                    {chat.unread > 0 && (
                      <span className="w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs font-semibold rounded-full flex items-center justify-center flex-shrink-0">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {chat.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        {selectedChat ? (
          <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-background`}>
            {/* Chat Header */}
            <div className="p-3 sm:p-4 bg-card border-b border-border flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleBackToList}
                className="md:hidden p-1.5 hover:bg-accent rounded-lg transition-colors touch-manipulation"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                {t.chatWith} {selectedChat.name}
              </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {selectedChat.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-xs lg:max-w-md xl:max-w-lg px-3 sm:px-4 py-2 rounded-lg ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-accent text-foreground"
                    }`}
                  >
                    <p className="text-xs sm:text-sm break-words">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-3 sm:p-4 bg-card border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.typeMessage}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="px-3 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-muted disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-1 sm:gap-2 touch-manipulation"
                >
                  <span className="hidden sm:inline">{t.send}</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-background">
            <p className="text-muted-foreground">Selecteer een chat om te beginnen</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
