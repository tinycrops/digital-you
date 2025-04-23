import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-indigo-100">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col">
        <h1 className="text-4xl font-bold mb-8 text-center text-indigo-800">
          Digital You
        </h1>
        <p className="text-xl mb-12 text-center max-w-2xl text-gray-700">
          Interact with a digital version of me, built from over 120 videos with transcriptions and insights.
          Ask questions, explore videos, and see how AI can emulate a person using video data.
        </p>
        
        <div className="flex gap-6 mb-12">
          <Link 
            href="/videos" 
            className="group bg-indigo-600 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 transition"
          >
            Browse Videos
          </Link>
          <Link 
            href="/chat" 
            className="group bg-indigo-50 text-indigo-800 px-8 py-4 rounded-xl border-2 border-indigo-200 hover:bg-indigo-100 transition"
          >
            Chat with AI
          </Link>
        </div>
        
        <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:grid-cols-3 lg:text-left gap-8">
          <div className="group rounded-lg border border-indigo-200 bg-white px-5 py-4 hover:border-indigo-300 hover:bg-indigo-50">
            <h2 className="mb-3 text-2xl font-semibold text-indigo-700">
              Video Collection
            </h2>
            <p className="text-gray-600">
              Browse through a collection of videos and their transcriptions, with insights and summaries.
            </p>
          </div>

          <div className="group rounded-lg border border-indigo-200 bg-white px-5 py-4 hover:border-indigo-300 hover:bg-indigo-50">
            <h2 className="mb-3 text-2xl font-semibold text-indigo-700">
              AI Chat Interface
            </h2>
            <p className="text-gray-600">
              Chat with an AI that responds as if it were me, using data from all the videos and insights.
            </p>
          </div>

          <div className="group rounded-lg border border-indigo-200 bg-white px-5 py-4 hover:border-indigo-300 hover:bg-indigo-50">
            <h2 className="mb-3 text-2xl font-semibold text-indigo-700">
              RAG System
            </h2>
            <p className="text-gray-600">
              Powered by Google's Gemini 2.0 Flash and Retrieval Augmented Generation for accurate responses.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
} 