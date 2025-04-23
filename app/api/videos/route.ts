import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Get the video dataset path from env
    const datasetPath = process.env.NEXT_PUBLIC_VIDEO_DATASET_PATH || '../video-dataset';
    
    // Read all files from the dataset directory
    const files = fs.readdirSync(datasetPath)
      .filter(file => file.endsWith('.json'));
    
    // Get metadata for each video
    const videos = files.map(file => {
      const filePath = path.join(datasetPath, file);
      const data = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(data);
      
      return {
        id: json.id || file.replace('.json', ''),
        filename: json.videoFileName || file.replace('.json', '.mp4'),
        timestamp: file.replace('.json', ''),
        summary: json.analysis?.summary || 'No summary available',
        topics: json.analysis?.topics || [],
        tags: json.analysis?.tags || []
      };
    });
    
    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
} 