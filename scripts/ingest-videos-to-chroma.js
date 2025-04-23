import fs from 'fs/promises';
import path from 'path';
import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb';

const DATASET_DIR = 'Q:/video-dataset/';
const CHROMA_URL = process.env.CHROMADB_URL || 'http://localhost:8000';

async function main() {
  const chroma = new ChromaClient({ path: CHROMA_URL });
  const embedder = new DefaultEmbeddingFunction();

  // Create or get collection
  const collection = await chroma.getOrCreateCollection({ name: 'videos', embeddingFunction: embedder });

  const seenIds = new Set();
  // Read all JSON files
  const files = await fs.readdir(DATASET_DIR);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const data = JSON.parse(await fs.readFile(path.join(DATASET_DIR, file), 'utf-8'));
    // Extract transcript, summary, screenContent, topics, tags, insights
    const transcript = data.analysis?.transcript || '';
    const summary = data.analysis?.summary || '';
    const screenContent = data.analysis?.screenContent || '';
    const topics = Array.isArray(data.analysis?.topics) ? data.analysis.topics.filter(t => typeof t === 'string') : [];
    const tags = Array.isArray(data.analysis?.tags) ? data.analysis.tags.filter(t => typeof t === 'string') : [];
    // Always produce a string for insights
    let insights = '';
    if (Array.isArray(data.inferred_insights) && data.inferred_insights.length > 0) {
      insights = data.inferred_insights.map(i => typeof i?.insight === 'string' ? i.insight : '').filter(Boolean).join('\n');
    } else if (typeof data.insights === 'string' && data.insights.trim()) {
      insights = data.insights.trim();
    } else if (typeof data.metadata?.insights === 'string' && data.metadata.insights.trim()) {
      insights = data.metadata.insights.trim();
    } else {
      insights = 'No insights available';
    }
    let text = [transcript, summary, screenContent, topics.join(', '), tags.join(', '), insights].filter(Boolean).join('\n');
    if (!text || typeof text !== 'string') {
      console.error(`Skipping file ${file}: document is empty or not a string.`);
      continue;
    }
    if (text.length > 5000) {
      text = text.slice(0, 5000);
    }
    let id = data.id || path.basename(file, '.json');
    if (!id || typeof id !== 'string' || seenIds.has(id)) {
      console.error(`Skipping file ${file}: id is empty, not a string, or duplicate.`);
      continue;
    }
    seenIds.add(id);
    // Build metadata object with only primitive values (arrays as comma-separated strings)
    const rawMetadata = {
      filename: String(file),
      videoFileName: typeof data.videoFileName === 'string' ? data.videoFileName : undefined,
      videoPath: typeof data.videoPath === 'string' ? data.videoPath : undefined,
      topics: topics.length ? topics.join(', ') : undefined,
      tags: tags.length ? tags.join(', ') : undefined,
      summary: summary || undefined,
      transcript: transcript || undefined,
      screenContent: screenContent || undefined,
      insights: insights || undefined
    };
    // Remove undefined and empty string fields, but always include 'insights'
    const metadata = Object.fromEntries(
      Object.entries(rawMetadata).filter(([k, v]) =>
        k === 'insights' ? true : (typeof v === 'string' && v.trim() !== '')
      )
    );
    console.log(`Ingesting file: ${file}`);
    console.log({ id, text, metadata });
    try {
      await collection.add({
        ids: [id],
        documents: [text],
        metadatas: [metadata]
      });
    } catch (err) {
      console.error(`Error ingesting file ${file}:`, err);
    }
  }
  console.log('Ingestion complete.');
}

main().catch(console.error); 