import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb';

// Initialize the Gemini AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { videoId, question } = await request.json();
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }
    
    const chroma = new ChromaClient({ path: process.env.CHROMADB_URL });
    const embedder = new DefaultEmbeddingFunction();
    const collection = await chroma.getCollection({ name: 'videos', embeddingFunction: embedder });
    const results = await collection.get({ ids: [videoId] });
    if (!results || !results.metadatas || !results.metadatas[0]) {
      return NextResponse.json(
        { error: 'Video data not found in ChromaDB' },
        { status: 404 }
      );
    }
    const videoData = { ...results.metadatas[0], id: videoId };
    
    // Extract data from the video JSON
    const { analysis, inferred_insights = [] } = videoData;
    
    const transcript = analysis?.transcript || '';
    const summary = analysis?.summary || '';
    const topics = analysis?.topics || [];
    const screenContent = analysis?.screenContent || '';
    const tags = analysis?.tags || [];
    
    // Create a context for the AI
    const videoContext = `VIDEO TRANSCRIPT:
${transcript}

VIDEO SUMMARY:
${summary}

SCREEN CONTENT:
${screenContent}

TOPICS: ${topics.join(', ')}
TAGS: ${tags.join(', ')}

INSIGHTS:
${inferred_insights.map((insight: any) => 
  `- ${insight.insight} (${insight.type}, certainty: ${insight.certainty})`
).join('\n')}`;
    
    const userQuestion = question || "Provide insights about what's happening in this video.";
    
    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Configure the model
    const generationConfig = {
      temperature: 0.2, // Lower temperature for more factual responses
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 800,
    };
    
    // System instruction for video insights
    const systemInstructionText = `You are an AI assistant that specializes in analyzing video content. Your task is to answer questions about a specific video based on its transcript, summary, and other metadata. Only use the information provided in the context. Be specific, concise, and focused on the video content. Do not make up information not present in the data provided.`;
    
    // Configure system instruction properly
    const config = {
      systemInstruction: [{ text: systemInstructionText }]
    };
    
    // Prepare content with user's question and video context
    const contents = [
      {
        role: 'user',
        parts: [{ text: `VIDEO CONTEXT:\n${videoContext}\n\nQUESTION: ${userQuestion}` }]
      }
    ];
    
    // Make API call with the proper format
    const result = await model.generateContent({
      contents,
      generationConfig,
      ...config
    });
    
    const response = result.response;
    
    return NextResponse.json({
      insights: response.text(),
      videoId,
      topics,
      tags
    });
  } catch (error) {
    console.error('Error generating video insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
} 