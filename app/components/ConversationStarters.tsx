'use client';

import { useState, useEffect } from 'react';

interface ConversationStartersProps {
  onSelectPrompt: (prompt: string) => void;
}

export default function ConversationStarters({ onSelectPrompt }: ConversationStartersProps) {
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchTopics() {
      try {
        const response = await fetch('/api/topics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch topics');
        }
        
        const data = await response.json();
        setTopics(data.topics);
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('Failed to load conversation starters');
      } finally {
        setLoading(false);
      }
    }
    
    fetchTopics();
  }, []);
  
  // Predefined conversation starters
  const defaultStarters = [
    "Tell me about your most recent project",
    "What are you passionate about?",
    "How do you approach problem-solving?",
    "What technologies do you use most often?",
    "Share an interesting challenge you've faced"
  ];
  
  // Generate topic-based conversation starters
  const topicBasedStarters = topics.slice(0, 5).map(topic => 
    `Tell me about your experience with ${topic}`
  );
  
  // Combine default and topic-based starters
  const allStarters = [...topicBasedStarters, ...defaultStarters].slice(0, 6);
  
  return (
    <div className="my-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Try asking about:</h3>
      
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i}
              className="h-10 bg-gray-100 rounded animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {allStarters.map((starter, index) => (
            <button
              key={index}
              onClick={() => onSelectPrompt(starter)}
              className="px-3 py-2 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-left truncate transition-colors"
            >
              {starter}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 