import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-white shadow-md p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-indigo-800">
          Digital You
        </Link>
        
        <div className="flex gap-6">
          <Link 
            href="/videos" 
            className="text-gray-700 hover:text-indigo-700 transition"
          >
            Videos
          </Link>
          <Link 
            href="/chat" 
            className="text-gray-700 hover:text-indigo-700 transition"
          >
            Chat
          </Link>
        </div>
      </div>
    </nav>
  );
} 