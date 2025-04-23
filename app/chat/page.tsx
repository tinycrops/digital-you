'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '../components/Navigation';
import Link from 'next/link';
import Image from 'next/image';
import ConversationStarters from '../components/ConversationStarters';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Source {
  id: string;
  summary: string;
  score: number;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const videoParam = searchParams.get('video');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi, I\'m the digital representation of the person in these videos. Ask me anything based on what I\'ve shared in my recordings!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Scroll to the bottom of the chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle video parameter from URL if present
  useEffect(() => {
    if (videoParam) {
      const videoQuestion = `Tell me about the video ${videoParam}. What are the key points discussed?`;
      setInput(videoQuestion);
      
      // Auto-resize the input
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
      }
    }
  }, [videoParam]);
  
  // Focus the input field when the page loads
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Auto resize the textarea based on content
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };
  
  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    
    // Clear any previous errors
    setError(null);
    
    // Add user message to chat
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // Reset input height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    try {
      // Prepare message history (last 10 messages for context)
      const messageHistory = messages.slice(-10);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          history: messageHistory
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
      
      // Add assistant response to chat
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: data.response }
      ]);
      
      // Store sources for the info panel
      setSources(data.sources || []);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Sorry, there was an error processing your request. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const highlightSource = (sourceId: string) => {
    setActiveSource(activeSource === sourceId ? null : sourceId);
  };
  
  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Chat window */}
        <div className="flex-1 flex flex-col h-[calc(100vh-64px)]">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user' 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-white shadow-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white shadow-md max-w-[80%] rounded-lg p-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm text-center">
                  <p className="font-semibold mb-1">Error:</p>
                  <p>{error}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Message input */}
          <div className="border-t p-4 bg-white">
            <div className="max-w-3xl mx-auto">
              {messages.length === 1 && (
                <ConversationStarters onSelectPrompt={handlePromptSelect} />
              )}
              
              <div className="flex">
                <textarea
                  ref={inputRef}
                  placeholder="Ask me anything..."
                  className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none overflow-hidden min-h-[40px] max-h-[150px]"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={loading}
                  rows={1}
                />
                <button
                  className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center min-w-[80px]"
                  onClick={handleSendMessage}
                  disabled={loading || !input.trim()}
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sources panel */}
        <div className="w-80 bg-white border-l overflow-y-auto p-4 hidden md:block">
          <h2 className="text-xl font-semibold mb-4 text-indigo-800">
            Video Sources
          </h2>
          
          {sources.length > 0 ? (
            <div className="space-y-4">
              {sources.map((source, index) => (
                <div 
                  key={source.id} 
                  className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                    activeSource === source.id ? 'border-indigo-500 bg-indigo-50' : ''
                  }`}
                  onClick={() => highlightSource(source.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">
                      Source #{index + 1}
                    </h3>
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                      Score: {source.score}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {source.summary}
                  </p>
                  
                  {activeSource === source.id && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Video ID:</p>
                      <p className="text-sm text-gray-700 mb-3 font-mono">{source.id}</p>
                      
                      <Link
                        href={`/video/${source.id}`}
                        className="text-indigo-600 text-sm hover:underline block py-2 px-3 bg-indigo-50 rounded text-center"
                      >
                        View Video
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">
                Ask a question to see video sources that inform the response.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 