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
    
    // Extract all topics from transcripts
    const allTopics: string[] = [];
    
    files.forEach(file => {
      try {
        const filePath = path.join(datasetPath, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(data);
        
        // Extract topics from analysis
        const topics = json.analysis?.topics || [];
        allTopics.push(...topics);
        
        // Extract tags as additional topics
        const tags = json.analysis?.tags || [];
        allTopics.push(...tags);
      } catch (err) {
        console.error(`Error processing file ${file}:`, err);
      }
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
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
} 