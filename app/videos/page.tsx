'use client';

import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import Link from 'next/link';

interface Video {
  id: string;
  filename: string;
  timestamp: string;
  summary: string;
  topics: string[];
  tags: string[];
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const response = await fetch('/api/videos');
        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }
        const data = await response.json();
        setVideos(data);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  // Get all unique topics
  const allTopics = Array.from(
    new Set(videos.flatMap(video => video.topics))
  );

  // Filter videos based on search and topic
  const filteredVideos = videos.filter(video => {
    const matchesSearch = 
      video.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
      video.timestamp.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTopic = selectedTopic 
      ? video.topics.includes(selectedTopic)
      : true;
    
    return matchesSearch && matchesTopic;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-indigo-800">
          Video Collection
        </h1>
        
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-2/3">
            <input
              type="text"
              placeholder="Search videos by content, topic, or date..."
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-1/3">
            <select
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={selectedTopic || ''}
              onChange={(e) => setSelectedTopic(e.target.value || null)}
            >
              <option value="">All Topics</option>
              {allTopics.map(topic => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading videos...</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-gray-600">
              {filteredVideos.length} videos found
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map(video => (
                <Link 
                  href={`/video/${video.timestamp}`}
                  key={video.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  <div className="p-5">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">
                      {video.timestamp}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {video.summary}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {video.topics.slice(0, 3).map(topic => (
                        <span 
                          key={topic} 
                          className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm"
                        >
                          {topic}
                        </span>
                      ))}
                      {video.topics.length > 3 && (
                        <span className="text-gray-500 text-sm">
                          +{video.topics.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {filteredVideos.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No videos found matching your criteria.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
} 