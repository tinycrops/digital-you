'use client';

import { useState } from 'react';
import Navigation from '../components/Navigation';

export default function TestGeminiPage() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get response');
      }
      
      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      console.error('Error testing Gemini:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-indigo-800">
          Test Gemini API
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Send a test message</h2>
          
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="mb-4">
              <label htmlFor="input" className="block text-gray-700 mb-2">
                Your message:
              </label>
              <textarea
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                placeholder="Enter your message here..."
              />
            </div>
            
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
              disabled={loading || !input.trim()}
            >
              {loading ? 'Sending...' : 'Test API'}
            </button>
          </form>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 mb-4">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}
          
          {response && (
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-800">Response:</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="whitespace-pre-wrap">{response}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <p className="text-gray-700 mb-2">
            This page tests the implementation of the Gemini API with the new system instruction format.
          </p>
          
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-[200px]">
{`const config = {
  systemInstruction: [
    { text: "You are a digital version of the person in the videos..." }
  ]
};

const result = await model.generateContent({
  contents: [...],
  ...config
});`}
          </pre>
        </div>
      </main>
    </div>
  );
} 