import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params.id is awaited properly
    const { id } = params;
    const videoId = id;
    const videoPath = path.join(process.env.NEXT_PUBLIC_VIDEO_PATH || '../', `${videoId}.mp4`);

    if (!fs.existsSync(videoPath)) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Get video file stats (including size)
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    // Handle range requests for video streaming
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': 'video/mp4',
      };

      return new NextResponse(file as any, { 
        status: 206,
        headers 
      });
    } else {
      // Handle non-range requests
      const headers = {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/mp4',
      };
      
      const file = fs.createReadStream(videoPath);
      return new NextResponse(file as any, { 
        status: 200,
        headers 
      });
    }
  } catch (error) {
    console.error('Error serving video:', error);
    return NextResponse.json(
      { error: 'Failed to serve video' },
      { status: 500 }
    );
  }
} 