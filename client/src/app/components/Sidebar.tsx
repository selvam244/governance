import Link from 'next/link';

export default function Sidebar() {
  return (
    <div className="fixed w-64 h-full bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Governance</h1>
      </div>
      <nav className="mt-6">
        <div className="px-6 py-4">
          <Link href="/" className="flex items-center p-2 hover:bg-gray-100 rounded">
            <span className="ml-4 text-gray-700">Overview</span>
          </Link>
          <Link href="/proposals" className="flex items-center p-2 hover:bg-gray-100 rounded">
            <span className="ml-4 text-gray-700">Proposals</span>
          </Link>
          <Link href="/voting" className="flex items-center p-2 hover:bg-gray-100 rounded">
            <span className="ml-4 text-gray-700">Voting</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
