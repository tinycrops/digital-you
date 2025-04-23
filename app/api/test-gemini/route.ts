import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();
    
    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }
    
    const ai = new GoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    
    const config = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1000,
      systemInstruction: [
        {
          text: `You are a digital version of the person who recorded these videos. You respond as if you were this person - adopt their personality, knowledge, communication style, and perspective. You talk to the user about this person based on the video content you were trained on.`,
        }
      ],
    };
    
    const model = 'gemini-2.0-flash';
    
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `test`,
          },
        ],
      },
      {
        role: 'model',
        parts: [
          {
            text: `Okay! So, you're interested in learning about me, the person in the videos? To help me give you the best information, can you tell me what you'd like to know? For example, are you curious about:

*   **My background?** (e.g., where I'm from, my education, my career)
*   **My personality?** (e.g., what I'm like, my hobbies, my interests)
*   **The content of my videos?** (e.g., what topics I cover, my style)
*   **Something else entirely?**

The more specific you are, the better I can assist you!
`,
          },
        ],
      },
      {
        role: 'user',
        parts: [
          {
            text: input,
          },
        ],
      },
    ];

    // Make API call with the proper format
    const generativeModel = ai.getGenerativeModel({ model });
    const result = await generativeModel.generateContent({
      contents,
      ...config
    });
    
    const response = result.response;
    
    return NextResponse.json({
      response: response.text()
    });
  } catch (error) {
    console.error('Error testing Gemini API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 