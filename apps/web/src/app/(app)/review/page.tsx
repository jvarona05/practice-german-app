'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Card, RatingAction } from '@german-app/shared';

type ReviewState = 'loading' | 'empty' | 'card' | 'done';
type SessionType = 'due' | 'practice' | null;

export default function ReviewPage() {
  const [queue, setQueue] = useState<Card[]>([]);
  const [reviewState, setReviewState] = useState<ReviewState>('loading');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>(null);

  const currentCard = queue[0] ?? null;

  const speakGerman = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  const loadSession = useCallback(() => {
    setReviewState('loading');
    setCompletedCount(0);
    setShowTranslation(false);

    api.review.start().then(({ type, cards }) => {
      setSessionType(type);
      setQueue(cards);
      setReviewState(cards.length === 0 ? 'empty' : 'card');
    }).catch(console.error);
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

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
      // fire-and-forget
    }

    setQueue((prev) => {
      const [head, ...rest] = prev;
      if (action === 'again') return [...rest, head];
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

  if (reviewState === 'loading') {
    return <div className="text-center text-gray-400 pt-20">Loading your session…</div>;
  }

  if (reviewState === 'empty') {
    return (
      <div className="text-center space-y-3 pt-16">
        <div className="text-4xl">🎉</div>
        <h2 className="text-xl font-bold">All caught up!</h2>
        <p className="text-gray-500 text-sm">No cards yet. Add a new lesson to get started.</p>
        <a href="/add-lesson" className="inline-block mt-4 bg-brand-500 text-white rounded-xl px-6 py-3 font-medium">
          Add lesson
        </a>
      </div>
    );
  }

  if (reviewState === 'done') {
    return (
      <div className="text-center space-y-4 pt-16">
        <div className="text-4xl">✓</div>
        <h2 className="text-xl font-bold">
          {sessionType === 'due' ? 'Due cards done!' : 'Batch complete!'}
        </h2>
        <p className="text-gray-500 text-sm">{completedCount} cards reviewed.</p>
        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={loadSession}
            className="w-full bg-brand-500 text-white rounded-xl py-3 font-medium"
          >
            Practice more
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
    <div className="pb-36">
      <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
        <span>{completedCount} done</span>
        <span>{queue.length} remaining</span>
        {sessionType === 'due' && (
          <span className="text-xs text-orange-400 font-medium">Due cards</span>
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

      {/* Rating buttons — fixed at bottom for easy thumb reach */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] bg-white/80 backdrop-blur-md border-t border-gray-100">
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
          <button
            onClick={() => handleRate('again')}
            disabled={ratingLoading}
            className="bg-[#FF3B30] text-white rounded-2xl py-5 font-bold text-base tracking-wide shadow-[0_5px_0_#C0261C] active:shadow-none active:translate-y-[5px] transition-all duration-75 disabled:opacity-40"
          >
            Again
          </button>
          <button
            onClick={() => handleRate('good')}
            disabled={ratingLoading}
            className="bg-[#4f6ef7] text-white rounded-2xl py-5 font-bold text-base tracking-wide shadow-[0_5px_0_#2c41cc] active:shadow-none active:translate-y-[5px] transition-all duration-75 disabled:opacity-40"
          >
            Good
          </button>
          <button
            onClick={() => handleRate('easy')}
            disabled={ratingLoading}
            className="bg-[#34C759] text-white rounded-2xl py-5 font-bold text-base tracking-wide shadow-[0_5px_0_#248A3D] active:shadow-none active:translate-y-[5px] transition-all duration-75 disabled:opacity-40"
          >
            Easy
          </button>
        </div>
      </div>
    </div>
  );
}
