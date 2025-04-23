# Digital You - AI-Powered Video Archive & Chat

A fullstack application that allows others to interact with your videos and transcriptions using Google's Gemini AI. The system uses videos, transcriptions, and insights to respond as if it were you.

## Features

- **Video Browser** - Browse, search, and filter your video collection.
- **Video Player** - Watch videos with their associated transcripts and insights.
- **AI Chat Interface** - Chat with an AI that responds as if it were you, using RAG (Retrieval Augmented Generation).
- **Source References** - See which videos the AI uses to generate responses.

## Technical Details

- **Frontend**: Next.js with React, Tailwind CSS, and React Player
- **Backend**: Next.js API Routes
- **LLM**: Google Gemini 2.0 Flash
- **Data Storage**: Local file-based JSON and video files
- **RAG Implementation**: Custom retrieval based on keyword relevance

## Setup Instructions

1. Clone this repository.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update the `app/config.ts` file with the correct paths to your video files and dataset:
   ```typescript
   export const config = {
     GEMINI_API_KEY: 'your-gemini-api-key',
     VIDEO_PATH: 'path/to/mp4/files',
     VIDEO_DATASET_PATH: 'path/to/json/files'
   };
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/app` - The main application code
  - `/api` - Backend API endpoints
  - `/components` - Reusable UI components
  - `/videos` - Video browsing page
  - `/video/[id]` - Individual video page
  - `/chat` - AI chat interface

## Video Dataset Format

The application expects JSON files in the dataset folder with the following structure:

```json
{
  "id": "video_id",
  "videoFileName": "2025-04-22.mp4",
  "analysis": {
    "summary": "Video summary text",
    "transcript": "Full video transcript",
    "topics": ["topic1", "topic2"],
    "tags": ["tag1", "tag2"]
  },
  "inferred_insights": [
    {
      "insight": "Insight about the video",
      "type": "goal/statement/etc",
      "basis": "What the insight is based on",
      "certainty": "high/medium/low"
    }
  ]
}
```

## Deployment

For production deployment:

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Customization

- Edit the system prompt in `/app/api/chat/route.ts` to change how the AI responds
- Modify the UI styling in the component files
- Enhance the retrieval logic for better RAG performance

## License

This project is for personal use only.
