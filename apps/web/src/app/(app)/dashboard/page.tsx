'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth';
import type { DashboardStats } from '@german-app/shared';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.stats.get().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Hallo, {user?.name}</h1>
        <p className="text-gray-500 text-sm mt-1">Ready to practice?</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Due today" value={stats.dueToday} highlight={stats.dueToday > 0} />
          <StatCard label="New cards" value={stats.newCards} />
          <StatCard label="Learned" value={stats.learnedCards} />
          <StatCard label="Need practice" value={stats.needsReinforcement} />
          <StatCard label="Total cards" value={stats.totalCards} />
          <StatCard label="Lessons" value={stats.totalLessons} />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {stats && stats.totalCards > 0 ? (
          <Link
            href="/review"
            className="w-full bg-brand-500 hover:bg-brand-600 text-white text-center rounded-xl py-4 font-semibold text-base"
          >
            Practice {stats.dueToday > 0 ? `(${stats.dueToday} due)` : ''}
          </Link>
        ) : (
          <span className="w-full bg-gray-200 text-gray-400 text-center rounded-xl py-4 font-semibold text-base cursor-default">
            No cards yet
          </span>
        )}
        <Link
          href="/add-lesson"
          className="w-full border border-brand-500 text-brand-500 hover:bg-brand-50 text-center rounded-xl py-4 font-semibold text-base"
        >
          Add new lesson
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200'}`}>
      <p className={`text-2xl font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-xs mt-1 ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>{label}</p>
    </div>
  );
}
