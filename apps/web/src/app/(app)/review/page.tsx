'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Card, RatingAction } from '@german-app/shared';

type ReviewState = 'loading' | 'empty' | 'card' | 'done';

const BATCH_SIZE = 15;

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isPracticeMode = searchParams.get('mode') === 'practice';
  const practiceOffset = Number(searchParams.get('offset') || 0);

  const [queue, setQueue] = useState<Card[]>([]);
  const [reviewState, setReviewState] = useState<ReviewState>('loading');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [practiceTotal, setPracticeTotal] = useState(0);

  const currentCard = queue[0] ?? null;

  const speakGerman = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    setReviewState('loading');
    setCompletedCount(0);

    if (isPracticeMode) {
      api.review.getPracticeSession(practiceOffset).then(({ cards, total }) => {
        setQueue(cards);
        setPracticeTotal(total);
        setReviewState(cards.length === 0 ? 'empty' : 'card');
      }).catch(console.error);
    } else {
      api.review.getSession().then((cards) => {
        setQueue(cards);
        setReviewState(cards.length === 0 ? 'empty' : 'card');
      }).catch(console.error);
    }
  }, [isPracticeMode, practiceOffset]);

  // Auto-play when a new card appears
  useEffect(() => {
    if (!currentCard || reviewState !== 'card') return;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentCard.german);
        utterance.lang = 'de-DE';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [currentCard?.id, reviewState]);

  const handleRate = async (action: RatingAction) => {
    if (!currentCard || ratingLoading) return;
    setRatingLoading(true);

    try {
      await api.review.rate(currentCard.id, action);
    } catch {
      // fire-and-forget; schedule update not critical for UX
    }

    setQueue((prev) => {
      const [head, ...rest] = prev;
      if (action === 'again') {
        return [...rest, head];
      }
      return rest;
    });
    setCompletedCount((n) => (action !== 'again' ? n + 1 : n));

    setRatingLoading(false);
    setShowTranslation(false);

    setQueue((current) => {
      if (current.length === 0) setReviewState('done');
      else setReviewState('card');
      return current;
    });
  };

  const handleNextBatch = () => {
    const nextOffset = (practiceOffset + BATCH_SIZE) % practiceTotal;
    router.push(`/review?mode=practice&offset=${nextOffset}`);
  };

  if (reviewState === 'loading') {
    return <div className="text-center text-gray-400 pt-20">Loading your session…</div>;
  }

  if (reviewState === 'empty') {
    return (
      <div className="text-center space-y-3 pt-16">
        <div className="text-4xl">🎉</div>
        <h2 className="text-xl font-bold">All caught up!</h2>
        <p className="text-gray-500 text-sm">No cards due right now. Come back later or add a new lesson.</p>
      </div>
    );
  }

  if (reviewState === 'done') {
    const nextOffset = (practiceOffset + BATCH_SIZE) % practiceTotal;
    const batchLabel = isPracticeMode
      ? `Batch ${Math.floor(practiceOffset / BATCH_SIZE) + 1} of ${Math.ceil(practiceTotal / BATCH_SIZE)}`
      : null;

    return (
      <div className="text-center space-y-4 pt-16">
        <div className="text-4xl">✓</div>
        <h2 className="text-xl font-bold">Session complete</h2>
        {batchLabel && <p className="text-gray-400 text-xs">{batchLabel}</p>}
        <p className="text-gray-500 text-sm">{completedCount} cards reviewed.</p>
        <div className="flex flex-col gap-3 mt-6">
          {isPracticeMode ? (
            <>
              <button
                onClick={handleNextBatch}
                className="w-full bg-brand-500 text-white rounded-xl py-3 font-medium"
              >
                Next batch ({nextOffset + 1}–{Math.min(nextOffset + BATCH_SIZE, practiceTotal)} of {practiceTotal})
              </button>
              <button
                onClick={() => router.push(`/review?mode=practice&offset=${practiceOffset}`)}
                className="w-full border border-gray-300 text-gray-600 rounded-xl py-3 font-medium"
              >
                Repeat this batch
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setCompletedCount(0);
                api.review.getSession().then((cards) => {
                  setQueue(cards);
                  setReviewState(cards.length === 0 ? 'empty' : 'card');
                });
              }}
              className="w-full bg-brand-500 text-white rounded-xl py-3 font-medium"
            >
              Another round
            </button>
          )}
          <a href="/dashboard" className="w-full border border-gray-300 text-gray-600 rounded-xl py-3 font-medium text-center block">
            Back to dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>{completedCount} done</span>
        <span>{queue.length} remaining</span>
        {isPracticeMode && (
          <span className="text-xs">
            Batch {Math.floor(practiceOffset / BATCH_SIZE) + 1}/{Math.ceil(practiceTotal / BATCH_SIZE)}
          </span>
        )}
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 min-h-48 flex flex-col items-center justify-center gap-4 text-center">
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className="text-2xl font-semibold leading-snug hover:text-brand-500 transition-colors cursor-pointer"
          title="Click to toggle translation"
        >
          {currentCard.german}
        </button>

        <button
          onClick={() => speakGerman(currentCard.german)}
          className="text-gray-400 hover:text-brand-500 text-sm flex items-center gap-1"
          title="Replay audio"
        >
          ▶ Replay
        </button>

        {showTranslation && (
          <div className="border-t border-gray-100 w-full pt-4 mt-2">
            <p className="text-gray-600">{currentCard.translation}</p>
            <span className="text-xs text-gray-400">{currentCard.translationLang === 'es' ? 'Spanish' : 'English'}</span>
          </div>
        )}
      </div>

      {/* Rating buttons - always visible */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleRate('again')}
          disabled={ratingLoading}
          className="bg-red-50 border border-red-200 text-red-600 rounded-xl py-4 font-medium text-sm disabled:opacity-50"
        >
          Again
        </button>
        <button
          onClick={() => handleRate('good')}
          disabled={ratingLoading}
          className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl py-4 font-medium text-sm disabled:opacity-50"
        >
          Good
        </button>
        <button
          onClick={() => handleRate('easy')}
          disabled={ratingLoading}
          className="bg-green-50 border border-green-200 text-green-600 rounded-xl py-4 font-medium text-sm disabled:opacity-50"
        >
          Easy
        </button>
      </div>
    </div>
  );
}
