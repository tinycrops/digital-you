'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '../../components/Navigation';
import VideoInquiry from '../../components/VideoInquiry';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamic import for ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface Transcript {
  id: string;
  videoFileName: string;
  transcript: string;
  summary: string;
  topics: string[];
  tags: string[];
  insights: {
    insight: string;
    type: string;
    basis: string;
    certainty: string;
  }[];
  screenContent: string;
}

export default function VideoPage() {
  const params = useParams();
  const videoId = params.id as string;
  
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transcript');
  const [showInquiry, setShowInquiry] = useState(false);

  useEffect(() => {
    async function fetchTranscript() {
      try {
        const response = await fetch(`/api/transcript/${videoId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch transcript');
        }
        const data = await response.json();
        setTranscript(data);
      } catch (error) {
        console.error('Error fetching transcript:', error);
      } finally {
        setLoading(false);
      }
    }

    if (videoId) {
      fetchTranscript();
    }
  }, [videoId]);
  
  const handleOpenChat = () => {
    // Create a URL with a query parameter to initiate a conversation about this video
    // The chat page could use this to pre-populate the chat with a question about this video
    const chatUrl = `/chat?video=${encodeURIComponent(videoId)}`;
    window.open(chatUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto py-12 px-4">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-6xl mx-auto py-12 px-4">
          <div className="text-center py-12">
            <p className="text-gray-600">Video not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-indigo-800">
            {videoId}
          </h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowInquiry(!showInquiry)}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-4 py-2 rounded-lg font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {showInquiry ? 'Hide' : 'Ask about this video'}
            </button>
            <button
              onClick={handleOpenChat}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              Chat with Digital You
            </button>
          </div>
        </div>
        
        {showInquiry && (
          <VideoInquiry videoId={videoId} />
        )}
        
        <div className="mb-8 bg-black rounded-lg overflow-hidden shadow-lg">
          <ReactPlayer
            url={`/api/video/${videoId}`}
            controls
            width="100%"
            height="600px"
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload'
                }
              }
            }}
          />
        </div>
        
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Summary
          </h2>
          <p className="text-gray-700">
            {transcript.summary}
          </p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {transcript.topics.map(topic => (
              <span 
                key={topic} 
                className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === 'transcript' 
                  ? 'text-indigo-700 border-b-2 border-indigo-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('transcript')}
            >
              Transcript
            </button>
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === 'insights' 
                  ? 'text-indigo-700 border-b-2 border-indigo-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('insights')}
            >
              Insights
            </button>
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === 'screen' 
                  ? 'text-indigo-700 border-b-2 border-indigo-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('screen')}
            >
              Screen Content
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === 'transcript' && (
              <div className="whitespace-pre-wrap text-gray-700">
                {transcript.transcript}
              </div>
            )}
            
            {activeTab === 'insights' && (
              <div className="space-y-4">
                {transcript.insights.map((insight, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-800 mb-2">
                      {insight.insight}
                    </p>
                    <div className="flex gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {insight.type}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {insight.certainty}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Based on:</span> {insight.basis}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'screen' && (
              <div className="text-gray-700">
                {transcript.screenContent || 'No screen content available.'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 