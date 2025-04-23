'use client';

import { useState, useRef } from 'react';

interface VideoInquiryProps {
  videoId: string;
}

export default function VideoInquiry({ videoId }: VideoInquiryProps) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/video-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId,
          question
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get insights');
      }
      
      const data = await response.json();
      setInsights(data.insights);
      setQuestion('');
    } catch (err) {
      console.error('Error getting video insights:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const suggestedQuestions = [
    "What are the key points in this video?",
    "What technologies are mentioned?",
    "Can you summarize this video briefly?",
    "What is the person trying to accomplish?",
    "What challenges were discussed?"
  ];
  
  const handleSuggestedQuestion = (q: string) => {
    setQuestion(q);
    inputRef.current?.focus();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-medium text-indigo-800 mb-3">
        Ask about this video
      </h3>
      
      <form onSubmit={handleQuestionSubmit} className="mb-4">
        <div className="flex mb-2">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What's happening in this video?"
            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center min-w-[80px]"
            disabled={loading || !question.trim()}
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Ask'
            )}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSuggestedQuestion(q)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs"
            >
              {q}
            </button>
          ))}
        </div>
      </form>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm mb-3">
          {error}
        </div>
      )}
      
      {insights && (
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-indigo-800 mb-2">AI Insights:</h4>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{insights}</p>
        </div>
      )}
    </div>
  );
} 