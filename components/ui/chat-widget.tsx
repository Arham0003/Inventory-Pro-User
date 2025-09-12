'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
  type?: 'text' | 'action'
}

interface ChatWidgetProps {
  isDemo?: boolean
}

export function ChatWidget({ isDemo = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello! I'm your AI assistant. ${isDemo ? 'In demo mode, I can help you understand the features.' : 'How can I help you manage your inventory today?'}`,
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    if (isDemo) {
      if (message.includes('demo') || message.includes('features')) {
        return "This is a demo of InventoryPro! Key features include: inventory tracking, sales recording, barcode scanning, GST support, and offline functionality. Try exploring the dashboard!"
      }
      if (message.includes('product') || message.includes('inventory')) {
        return "In demo mode, you can view sample products but can&apos;t add new ones. Sign up to manage your real inventory with features like low stock alerts and barcode scanning!"
      }
      if (message.includes('sales') || message.includes('revenue')) {
        return "The demo shows ₹8,950 in today's revenue from 12 sales. In the real app, you can record sales, generate invoices, and track customer data!"
      }
    }

    // General responses
    if (message.includes('help') || message.includes('support')) {
      return "I can help you with: adding products, recording sales, understanding reports, managing inventory, and using features. What would you like to know?"
    }
    if (message.includes('product')) {
      return "To add products: Go to Products → Add New Product. You can use barcode scanning, set GST rates, and configure low stock alerts."
    }
    if (message.includes('sales') || message.includes('sell')) {
      return "Record sales by going to Sales → New Sale. You can scan barcodes, select customers, apply discounts, and generate invoices automatically."
    }
    if (message.includes('report')) {
      return "Access reports from the Reports section. View sales trends, top products, customer analytics, and export data to Excel."
    }
    if (message.includes('gst') || message.includes('tax')) {
      return "InventoryPro supports Indian GST rates (0%, 5%, 12%, 18%, 28%). Set GST rates per product in the product settings."
    }
    if (message.includes('offline')) {
      return "The app works offline! Your data syncs automatically when you&apos;re back online. Perfect for areas with poor connectivity."
    }
    if (message.includes('hello') || message.includes('hi')) {
      return "Hello! I'm here to help you make the most of InventoryPro. What would you like to know?"
    }

    return "I'm here to help with inventory management, sales tracking, and using InventoryPro features. Could you be more specific about what you need help with?"
  }

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(content),
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputMessage)
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <MessageCircle className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        </Button>
        <div className="absolute -top-2 -right-2 h-4 w-4 bg-green-500 rounded-full animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className={`fixed ${isMinimized ? 'bottom-6' : 'bottom-6'} right-6 z-50 transition-all duration-300`}>
      <div className={`bg-white rounded-lg shadow-2xl border ${isMinimized ? 'w-80 h-16' : 'w-80 h-96'} transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
              <p className="text-xs text-blue-100">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        {!isMinimized && (
          <>
            <ScrollArea className="flex-1 p-4 h-64">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 max-w-xs p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button
                  onClick={() => sendMessage(inputMessage)}
                  size="sm"
                  className="px-3"
                  disabled={!inputMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}