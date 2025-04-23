import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb';
import { GoogleGenAI, Type } from '@google/genai';

const CHROMA_URL = process.env.CHROMADB_URL || 'http://localhost:8000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const chromaSearchFunction = {
  name: 'search_chromadb',
  description: 'Searches the ChromaDB video collection for relevant videos.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query or keywords.'
      },
      nResults: {
        type: 'integer',
        description: 'Number of results to return.',
        default: 5
      }
    },
    required: ['query']
  }
};

async function searchChromaDB(collection, query, nResults = 5) {
  const results = await collection.query({
    queryTexts: [query],
    nResults,
    include: ['metadatas', 'documents']
  });
  const ids = results.ids[0] || [];
  const metadatas = results.metadatas[0] || [];
  const documents = results.documents[0] || [];
  return ids.map((id, i) => ({
    id,
    ...metadatas[i],
    document: documents[i]
  }));
}

async function main() {
  const chroma = new ChromaClient({ path: CHROMA_URL });
  const collection = await chroma.getOrCreateCollection({ name: 'videos', embeddingFunction: new DefaultEmbeddingFunction() });
  const rl = readline.createInterface({ input, output });
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  console.log('Welcome to the Gemini-Powered Video Search!');
  console.log('Type a keyword, topic, or question to search your video database. Type "exit" to quit.');

  while (true) {
    const userInput = (await rl.question('\nSearch term: ')).trim();
    if (!userInput || userInput.toLowerCase() === 'exit') break;

    // Send user input and function declaration to Gemini
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: userInput,
        config: {
          tools: [{ functionDeclarations: [chromaSearchFunction] }]
        }
      });
    } catch (err) {
      console.error('Error calling Gemini:', err.message || err);
      continue;
    }

    // Check for function call
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      if (functionCall.name === 'search_chromadb') {
        const { query, nResults } = functionCall.args;
        let results;
        try {
          results = await searchChromaDB(collection, query, nResults);
        } catch (err) {
          console.error('Error querying ChromaDB:', err.message || err);
          continue;
        }
        if (!results.length) {
          console.log('No results found.');
          continue;
        }
        // Show summary list
        console.log(`\nFound ${results.length} result(s):`);
        results.forEach((meta, i) => {
          console.log(`${i + 1}. ${meta.filename || meta.id} - ${meta.summary ? meta.summary.slice(0, 120) : '(no summary)'}`);
        });
        // Prompt for detail
        const detailIdx = await rl.question('Enter result number for details, or press Enter to search again: ');
        const idx = parseInt(detailIdx, 10);
        if (!isNaN(idx) && idx > 0 && idx <= results.length) {
          const meta = results[idx - 1];
          console.log('\n--- Video Details ---');
          console.log('Filename:', meta.filename);
          console.log('Video File:', meta.videoFileName);
          console.log('Video Path:', meta.videoPath);
          console.log('Topics:', meta.topics);
          console.log('Tags:', meta.tags);
          console.log('Summary:', meta.summary);
          console.log('Transcript:', meta.transcript);
          console.log('Screen Content:', meta.screenContent);
          console.log('Insights:', meta.insights && meta.insights.trim() ? meta.insights : 'No insights');
          console.log('\nFull Text:\n', meta.document);
          console.log('---------------------\n');
        }
      }
    } else {
      // Gemini responded directly, no function call needed
      console.log(response.text);
    }
  }
  rl.close();
  console.log('Goodbye!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 