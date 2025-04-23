import { NextResponse } from 'next/server';
import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const videoId = id;
    const chroma = new ChromaClient({ path: process.env.CHROMADB_URL });
    const embedder = new DefaultEmbeddingFunction();
    const collection = await chroma.getCollection({ name: 'videos', embeddingFunction: embedder });
    const results = await collection.get({ ids: [videoId] });
    if (!results || !results.metadatas || !results.metadatas[0]) {
      return NextResponse.json(
        { error: 'Transcript not found in ChromaDB' },
        { status: 404 }
      );
    }
    const json = results.metadatas[0];
    const transcript = {
      id: videoId,
      videoFileName: json.videoFileName || `${videoId}.mp4`,
      transcript: json.transcript || '',
      summary: json.summary || '',
      topics: json.topics || [],
      tags: json.tags || [],
      insights: json.insights || [],
      screenContent: json.screenContent || ''
    };
    return NextResponse.json(transcript);
  } catch (error) {
    console.error('Error fetching transcript from ChromaDB:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
} 