'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Send, Plus } from 'lucide-react'

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
  created_at: string
}

interface Session {
  id: number
  title: string
  created_at: string
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  // Load messages when session changes
  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession)
    }
  }, [currentSession])

  const loadSessions = async () => {
    // For demo, create sample sessions
    const sampleSessions: Session[] = [
      { id: 1, title: "Tesla Q2 2025 Analysis", created_at: "2025-01-04T10:00:00Z" },
      { id: 2, title: "Covenant Compliance Review", created_at: "2025-01-04T09:30:00Z" },
    ]
    setSessions(sampleSessions)
  }

  const loadMessages = async (sessionId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/questions/history?session_id=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      // For demo, show sample messages
      const sampleMessages: Message[] = [
        {
          id: 1,
          role: 'user',
          text: 'What is Tesla\'s current leverage ratio?',
          created_at: '2025-01-04T10:00:00Z'
        },
        {
          id: 2,
          role: 'assistant',
          text: 'Tesla Inc. Q2 2025 — Leverage: 3.78x vs 3.5x limit → BREACH (margin: -0.28x)',
          created_at: '2025-01-04T10:00:01Z'
        },
        {
          id: 3,
          role: 'user',
          text: 'Why did this breach occur?',
          created_at: '2025-01-04T10:01:00Z'
        },
        {
          id: 4,
          role: 'assistant',
          text: 'The leverage breach occurred because Tesla\'s total debt of $4,994M divided by EBITDA of $1,322M equals 3.78x, which exceeds the 3.5x covenant limit. This indicates the company\'s debt burden relative to earnings is too high.',
          created_at: '2025-01-04T10:01:01Z'
        }
      ]
      setMessages(sampleMessages)
    }
  }

  const createNewSession = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'Hello, I\'d like to start a new analysis session.'
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data.session_id)
        loadSessions() // Refresh sessions
      }
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  const askQuestion = async () => {
    if (!question.trim()) return

    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: currentSession,
          question: question
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Add user message
        const userMessage: Message = {
          id: Date.now(),
          role: 'user',
          text: question,
          created_at: new Date().toISOString()
        }
        
        // Add assistant response
        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          text: data.answer,
          created_at: new Date().toISOString()
        }
        
        setMessages(prev => [...prev, userMessage, assistantMessage])
        setQuestion('')
        
        // Set session if new
        if (!currentSession) {
          setCurrentSession(data.session_id)
          loadSessions()
        }
      }
    } catch (error) {
      console.error('Error asking question:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      askQuestion()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Q&A Chat</h1>
          <p className="text-gray-600 mt-2">Ask questions about covenant compliance and financial data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sessions Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Sessions</span>
                  <Button
                    onClick={createNewSession}
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setCurrentSession(session.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentSession === session.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm">{session.title}</div>
                    <div className="text-xs opacity-70">
                      {new Date(session.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>
                    {currentSession ? `Session ${currentSession}` : 'Select a session to start chatting'}
                  </span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Ask a question to get started!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-sm">{message.text}</div>
                          <div className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about leverage, coverage, liquidity, or any covenant data..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={loading}
                  />
                  <Button
                    onClick={askQuestion}
                    disabled={!question.trim() || loading}
                    className="flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Ask</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sample Questions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Sample Questions</CardTitle>
              <CardDescription>Try asking these questions to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  "What is Tesla's current leverage ratio?",
                  "Why did the leverage breach occur?",
                  "What is the interest coverage ratio?",
                  "How much cash does Tesla have?",
                  "Are there any red flags detected?",
                  "What is the overall covenant status?"
                ].map((sampleQuestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-left justify-start h-auto p-3"
                    onClick={() => setQuestion(sampleQuestion)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{sampleQuestion}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
