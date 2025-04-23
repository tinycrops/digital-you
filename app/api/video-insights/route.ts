import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    
    // Get the video dataset path from env
    const datasetPath = process.env.NEXT_PUBLIC_VIDEO_DATASET_PATH || '../video-dataset';
    
    // Get the video data
    const jsonPath = path.join(datasetPath, `${videoId}.json`);
    
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json(
        { error: 'Video data not found' },
        { status: 404 }
      );
    }
    
    const videoData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
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