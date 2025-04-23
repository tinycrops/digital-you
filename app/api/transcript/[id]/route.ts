import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const videoId = id;
    const jsonPath = path.join(process.env.NEXT_PUBLIC_VIDEO_DATASET_PATH || '../video-dataset', `${videoId}.json`);

    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    const data = fs.readFileSync(jsonPath, 'utf8');
    const json = JSON.parse(data);
    
    const transcript = {
      id: json.id || videoId,
      videoFileName: json.videoFileName || `${videoId}.mp4`,
      transcript: json.analysis?.transcript || '',
      summary: json.analysis?.summary || '',
      topics: json.analysis?.topics || [],
      tags: json.analysis?.tags || [],
      insights: json.inferred_insights || [],
      screenContent: json.analysis?.screenContent || ''
    };
    
    return NextResponse.json(transcript);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
} 