'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Card, RatingAction } from '@german-app/shared';

type ReviewState = 'loading' | 'empty' | 'card' | 'revealed' | 'done';

export default function ReviewPage() {
  const [queue, setQueue] = useState<Card[]>([]);
  const [reviewState, setReviewState] = useState<ReviewState>('loading');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

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
    api.review.getSession().then((cards) => {
      setQueue(cards);
      setReviewState(cards.length === 0 ? 'empty' : 'card');
    }).catch(console.error);
  }, []);

  // Auto-play when a new card appears
  useEffect(() => {
    if (reviewState === 'card' && currentCard) {
      speakGerman(currentCard.german);
    }
  }, [currentCard?.id, reviewState, speakGerman]);

  const handleReveal = () => setReviewState('revealed');

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
        // push to back of queue
        return [...rest, head];
      }
      return rest;
    });
    setCompletedCount((n) => (action !== 'again' ? n + 1 : n));

    setRatingLoading(false);

    setQueue((current) => {
      if (current.length === 0) setReviewState('done');
      else setReviewState('card');
      return current;
    });
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
    return (
      <div className="text-center space-y-4 pt-16">
        <div className="text-4xl">✓</div>
        <h2 className="text-xl font-bold">Session complete</h2>
        <p className="text-gray-500 text-sm">{completedCount} cards reviewed.</p>
        <div className="flex flex-col gap-3 mt-6">
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
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 min-h-48 flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-2xl font-semibold leading-snug">{currentCard.german}</p>

        <button
          onClick={() => speakGerman(currentCard.german)}
          className="text-gray-400 hover:text-brand-500 text-sm flex items-center gap-1"
          title="Replay audio"
        >
          ▶ Replay
        </button>

        {(reviewState === 'revealed') && (
          <div className="border-t border-gray-100 w-full pt-4 mt-2">
            <p className="text-gray-600">{currentCard.translation}</p>
            <span className="text-xs text-gray-400">{currentCard.translationLang === 'es' ? 'Spanish' : 'English'}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {reviewState === 'card' && (
        <button
          onClick={handleReveal}
          className="w-full bg-gray-900 text-white rounded-xl py-4 font-semibold"
        >
          Show translation
        </button>
      )}

      {reviewState === 'revealed' && (
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
      )}
    </div>
  );
}
