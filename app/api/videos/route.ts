import { NextResponse } from 'next/server';
import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb';

export async function GET() {
  try {
    const chroma = new ChromaClient({ path: process.env.CHROMADB_URL });
    const embedder = new DefaultEmbeddingFunction();
    const collection = await chroma.getCollection({ name: 'videos', embeddingFunction: embedder });
    const results = await collection.get();
    const videos = (results.metadatas || []).map((meta, i) => ({
      id: results.ids[i],
      filename: meta.videoFileName || meta.filename?.replace('.json', '.mp4'),
      timestamp: meta.filename?.replace('.json', ''),
      summary: meta.summary || 'No summary available',
      topics: meta.topics || [],
      tags: meta.tags || []
    }));
    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos from ChromaDB:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
} 