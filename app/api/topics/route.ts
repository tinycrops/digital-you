import { NextResponse } from 'next/server';
import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb';

export async function GET() {
  try {
    const chroma = new ChromaClient({ path: process.env.CHROMADB_URL });
    const embedder = new DefaultEmbeddingFunction();
    const collection = await chroma.getCollection({ name: 'videos', embeddingFunction: embedder });
    const results = await collection.get();
    // Extract all topics and tags from metadata
    const allTopics = [];
    (results.metadatas || []).forEach(meta => {
      if (meta.topics) allTopics.push(...meta.topics);
      if (meta.tags) allTopics.push(...meta.tags);
    });
    // Count occurrences of each topic
    const topicCounts = allTopics.reduce((acc, topic) => {
      const normalizedTopic = topic.toLowerCase();
      acc[normalizedTopic] = (acc[normalizedTopic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    // Sort topics by frequency
    const sortedTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic);
    // Return unique topics (case-insensitive)
    const uniqueTopics = [...new Set(sortedTopics)];
    return NextResponse.json({ 
      topics: uniqueTopics,
      total: uniqueTopics.length
    });
  } catch (error) {
    console.error('Error fetching topics from ChromaDB:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
} 