'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-brand-500 text-lg">
          Deutsch
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/add-lesson" className="text-gray-600 hover:text-gray-900">
            Add lesson
          </Link>
          <Link href="/review" className="text-gray-600 hover:text-gray-900">
            Review
          </Link>
          <button onClick={logout} className="text-gray-400 hover:text-gray-600">
            Logout
          </button>
        </nav>
      </header>
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">{children}</main>
    </div>
  );
}
