import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Function to get relevant transcripts based on the query
async function getRelevantTranscripts(query: string, limit = 5) {
  try {
    const datasetPath = process.env.NEXT_PUBLIC_VIDEO_DATASET_PATH || '../video-dataset';
    const files = fs.readdirSync(datasetPath)
      .filter(file => file.endsWith('.json'));
    
    // Load all transcripts
    const transcripts = files.map(file => {
      const filePath = path.join(datasetPath, file);
      const data = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(data);
      
      return {
        id: json.id || file.replace('.json', ''),
        filename: file.replace('.json', ''),
        transcript: json.analysis?.transcript || '',
        summary: json.analysis?.summary || '',
        topics: json.analysis?.topics || [],
        insights: json.inferred_insights || [],
        timestamp: file.replace('.json', '')
      };
    });
    
    // Simple keyword matching for now (in a production app, we'd use embeddings and cosine similarity)
    const queryTerms = query.toLowerCase().split(' ');
    
    // Score each transcript based on term frequency
    const scoredTranscripts = transcripts.map(transcript => {
      let score = 0;
      const text = (transcript.transcript + ' ' + transcript.summary + ' ' + transcript.topics.join(' ')).toLowerCase();
      
      queryTerms.forEach(term => {
        const regex = new RegExp(term, 'g');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length;
        }
      });
      
      return { ...transcript, score };
    });
    
    // Sort by score and take the top results
    return scoredTranscripts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting relevant transcripts:', error);
    return [];
  }
}

// Function to extract personality traits from insights
function extractPersonality(insights: any[]) {
  const personalityTraits = [];
  
  for (const insight of insights) {
    if (insight.type === 'mental_state' || 
        insight.type === 'personality' || 
        insight.type === 'interest' || 
        insight.type === 'opinion') {
      personalityTraits.push(insight.insight);
    }
  }
  
  return personalityTraits;
}

// Function to extract knowledge and experiences from insights
function extractKnowledgeAndExperiences(insights: any[]) {
  const knowledge = [];
  
  for (const insight of insights) {
    if (insight.type === 'knowledge' || 
        insight.type === 'experience' || 
        insight.type === 'goal' ||
        insight.type === 'skill') {
      knowledge.push(insight.insight);
    }
  }
  
  return knowledge;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Get relevant transcripts
    const relevantTranscripts = await getRelevantTranscripts(message);
    
    // Extract personality traits and knowledge from insights
    const personalityTraits = relevantTranscripts.flatMap(t => extractPersonality(t.insights));
    const knowledgeAndExperiences = relevantTranscripts.flatMap(t => extractKnowledgeAndExperiences(t.insights));
    
    // Prepare context for the AI model with more structured data
    const contextualTranscripts = relevantTranscripts.map(t => 
      `VIDEO_CONTEXT: ${t.filename}
TRANSCRIPT: ${t.transcript}
SUMMARY: ${t.summary}
TOPICS: ${t.topics.join(', ')}`
    ).join('\n\n');
    
    // Create system instruction with contextual information
    const systemInstructionText = `You are a digital version of the person who recorded these videos. You should respond as if you were this person - adopt their personality, knowledge, communication style, and perspective.

PERSONALITY TRAITS:
${personalityTraits.length > 0 ? personalityTraits.join('\n') : "You have a casual, conversational style. You're comfortable with technology and enjoy sharing your experiences."}

KNOWLEDGE & EXPERIENCES:
${knowledgeAndExperiences.length > 0 ? knowledgeAndExperiences.join('\n') : "You have knowledge about programming, video deployment, and creating digital interfaces."}

RELEVANT VIDEO CONTEXT:
${contextualTranscripts}

CONVERSATION GUIDELINES:
- Respond naturally as if you're having a conversation in person.
- Reference specific videos or insights from your recordings when relevant.
- If you don't know something, acknowledge it honestly rather than making up information.
- If the conversation refers to videos you've recorded, share your thoughts and experiences from them.
- Your personality should be consistent with what is revealed in your videos.
- Use your natural speaking style, including occasional filler words if that matches your style.`;

    try {
      // Call Gemini API with the updated format
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      // Configure the model
      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      };
      
      // Configure system instruction properly
      const config = {
        systemInstruction: [{ text: systemInstructionText }]
      };
      
      // Prepare the chat history
      let contents = [];
      
      // Add formatted history
      if (history.length > 0) {
        const formattedHistory = history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));
        contents = formattedHistory;
      }
      
      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
      
      // Make API call with the proper format
      const result = await model.generateContent({
        contents,
        generationConfig,
        ...config
      });
      
      const response = result.response;
      
      return NextResponse.json({
        response: response.text(),
        sources: relevantTranscripts.map(t => ({
          id: t.filename,
          summary: t.summary,
          score: t.score
        }))
      });
    } catch (geminiError) {
      console.error('Gemini API Error:', geminiError);
      return NextResponse.json(
        { error: `Gemini API Error: ${geminiError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
} 