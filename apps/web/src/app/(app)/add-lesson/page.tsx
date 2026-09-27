'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { SuggestedCard } from '@german-app/shared';

type CardWithMeta = SuggestedCard & { selected: boolean; id: string };

type Step = 'input' | 'review' | 'saved';

export default function AddLessonPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [cards, setCards] = useState<CardWithMeta[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setError('');
    setAnalyzing(true);
    try {
      const { suggestions } = await api.lessons.analyze(text);
      setCards(
        suggestions.map((s, i) => ({ ...s, selected: true, id: String(i) })),
      );
      setStep('review');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    const selected = cards.filter((c) => c.selected);
    if (!selected.length) return;
    setSaving(true);
    try {
      await api.lessons.save({
        cards: selected.map(({ german, translation, translationLang, type }) => ({
          german, translation, translationLang, type,
        })),
      });
      setStep('saved');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleCard = (id: string) =>
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)));

  const updateCard = (id: string, field: 'german' | 'translation', value: string) =>
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  const removeCard = (id: string) =>
    setCards((prev) => prev.filter((c) => c.id !== id));

  const selectedCount = cards.filter((c) => c.selected).length;

  if (step === 'saved') {
    return (
      <div className="text-center space-y-4 pt-10">
        <div className="text-4xl">✓</div>
        <h2 className="text-xl font-bold">Cards saved!</h2>
        <p className="text-gray-500 text-sm">{selectedCount} cards added to your deck.</p>
        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={() => { setStep('input'); setText(''); setCards([]); }}
            className="w-full border border-brand-500 text-brand-500 rounded-xl py-3 font-medium"
          >
            Add another lesson
          </button>
          <button
            onClick={() => router.push('/review')}
            className="w-full bg-brand-500 text-white rounded-xl py-3 font-medium"
          >
            Start review
          </button>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Review suggestions</h1>
          <span className="text-sm text-gray-500">{selectedCount} / {cards.length} selected</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCards((prev) => prev.map((c) => ({ ...c, selected: true })))}
            className="text-xs text-brand-500 underline"
          >
            Select all
          </button>
          <button
            onClick={() => setCards((prev) => prev.map((c) => ({ ...c, selected: false })))}
            className="text-xs text-gray-400 underline"
          >
            Deselect all
          </button>
        </div>

        <div className="space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`border rounded-xl p-3 transition-colors ${card.selected ? 'border-brand-500 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'}`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={card.selected}
                  onChange={() => toggleCard(card.id)}
                  className="mt-1 accent-brand-500"
                />
                <div className="flex-1 space-y-1">
                  <input
                    value={card.german}
                    onChange={(e) => updateCard(card.id, 'german', e.target.value)}
                    className="w-full text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-brand-500 focus:outline-none py-0.5"
                  />
                  <input
                    value={card.translation}
                    onChange={(e) => updateCard(card.id, 'translation', e.target.value)}
                    className="w-full text-xs text-gray-500 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-brand-500 focus:outline-none py-0.5"
                  />
                  {card.type && (
                    <span className="inline-block text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                      {card.type}
                    </span>
                  )}
                </div>
                <button onClick={() => removeCard(card.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setStep('input')}
            className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-3 text-sm"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedCount === 0}
            className="flex-1 bg-brand-500 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : `Save ${selectedCount} cards`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Add new lesson</h1>

      <textarea
        placeholder="Paste your class conversation or notes here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleAnalyze}
        disabled={analyzing || !text.trim()}
        className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-4 font-semibold disabled:opacity-50"
      >
        {analyzing ? 'Analyzing with AI…' : 'Analyze conversation'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Your text is analyzed and then discarded. Only saved cards are stored.
      </p>
    </div>
  );
}
