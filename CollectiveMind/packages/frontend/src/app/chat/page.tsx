'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  DocumentTextIcon,
  UserIcon,
  ClipboardDocumentIcon,
  LinkIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
  isTyping?: boolean;
}

interface Citation {
  id: string;
  title: string;
  type: 'document' | 'message' | 'person';
  author: string;
  team: string;
  url: string;
}

const mockCitations: Citation[] = [
  {
    id: '1',
    title: 'Customer Churn Analysis Q3 2024',
    type: 'document',
    author: 'Maya Chen',
    team: 'Product',
    url: '/documents/churn-analysis-q3'
  },
  {
    id: '2',
    title: 'Marketing Campaign Performance',
    type: 'document',
    author: 'Rahul Sharma',
    team: 'Marketing',
    url: '/documents/campaign-performance'
  }
];

const suggestedQuestions = [
  "What are the main causes of customer churn?",
  "How can Product and Marketing teams collaborate better?",
  "Show me recent cross-team discussions about retention",
  "Who are the experts on customer behavior analysis?"
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI assistant for CollectiveMind. I can help you discover insights, find relevant documents, connect with team members, and answer questions about your organization's knowledge. What would you like to explore today?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateMockResponse(inputValue),
        timestamp: new Date(),
        citations: mockCitations,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const generateMockResponse = (query: string): string => {
    if (query.toLowerCase().includes('churn')) {
      return `Based on the latest analysis, customer churn has increased by 15% this quarter. Here are the key insights:

## Main Causes
1. **Pricing concerns** - 34% of churned customers cited cost as primary factor
2. **Competitive pressure** - New market entrants offering similar features at lower prices
3. **Feature gaps** - Missing integrations that competitors provide

## Recommendations
- **Immediate**: Review pricing strategy with Finance team
- **Short-term**: Prioritize integration features in Q4 roadmap  
- **Long-term**: Develop customer success program

The Marketing team has already started a retention campaign that shows 23% improvement in engagement. I recommend connecting with **Rahul Sharma** to align on messaging and **Maya Chen** for product roadmap discussions.`;
    }

    return `I found several relevant insights related to your query. The Product and Marketing teams have been actively collaborating on customer retention strategies. Here's what I discovered:

## Key Findings
- Recent cross-team discussions show strong alignment on customer experience priorities
- Multiple documents reference similar challenges and opportunities
- Several team members have complementary expertise in this area

## Suggested Actions
1. Review the connected documents for detailed analysis
2. Consider reaching out to the mentioned team members
3. Explore related topics that might provide additional context

Would you like me to dive deeper into any specific aspect?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  const getCitationIcon = (type: string) => {
    switch (type) {
      case 'document': return DocumentTextIcon;
      case 'person': return UserIcon;
      default: return DocumentTextIcon;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 text-sm font-medium mb-4">
            <SparklesIcon className="w-4 h-4 mr-2" />
            AI-Powered Knowledge Assistant
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chat with CollectiveMind
          </h1>
          <p className="text-gray-600">
            Ask questions, discover insights, and explore your organization's knowledge
          </p>
        </motion.div>

        {/* Chat Container */}
        <div className="card h-[600px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-3xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-primary-600 text-white ml-12'
                          : 'bg-white border border-gray-200 shadow-sm mr-12'
                      }`}
                    >
                      {message.type === 'assistant' && (
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center mr-2">
                            <SparklesIcon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">CollectiveMind AI</span>
                        </div>
                      )}
                      
                      <div className={`prose prose-sm max-w-none ${
                        message.type === 'user' ? 'prose-invert' : ''
                      }`}>
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>

                    {/* Citations */}
                    {message.citations && message.citations.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-3 mr-12"
                      >
                        <div className="text-xs text-gray-500 mb-2 font-medium">Sources:</div>
                        <div className="space-y-2">
                          {message.citations.map((citation) => {
                            const IconComponent = getCitationIcon(citation.type);
                            return (
                              <div
                                key={citation.id}
                                className="flex items-center p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200 cursor-pointer group"
                              >
                                <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded flex items-center justify-center mr-3 flex-shrink-0">
                                  <IconComponent className="w-3 h-3" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors duration-200">
                                    {citation.title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {citation.author} • {citation.team}
                                  </div>
                                </div>
                                <LinkIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors duration-200" />
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Message Actions */}
                    {message.type === 'assistant' && !message.isTyping && (
                      <div className="flex items-center space-x-2 mt-2 mr-12">
                        <button className="p-1 text-gray-400 hover:text-green-500 transition-colors duration-200">
                          <HandThumbUpIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200">
                          <HandThumbDownIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                          <ArrowPathIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={`text-xs text-gray-500 mt-2 ${
                      message.type === 'user' ? 'text-right ml-12' : 'mr-12'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white border border-gray-200 shadow-sm rounded-2xl px-4 py-3 mr-12">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                      <SparklesIcon className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="px-6 pb-4"
            >
              <div className="text-sm text-gray-600 mb-3">Try asking:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors duration-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your organization's knowledge..."
                  className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </motion.button>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}