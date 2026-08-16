'use client';

import { Loader2, Volume2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Vocab, VocabMutation } from '../types';

interface AddVocabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (vocab: VocabMutation) => Promise<void>;
  editingVocab?: Vocab | null;
}

type VocabForm = VocabMutation;

const emptyForm: VocabForm = {
  word: '',
  meaning: '',
  pronunciation: '',
  example_sentence: '',
  difficulty_level: 1,
  is_mastered: false,
};

export default function AddVocabModal({ isOpen, onClose, onAdd, editingVocab }: AddVocabModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
    setForm({
      word: editingVocab?.word || '',
      meaning: editingVocab?.meaning || '',
      pronunciation: editingVocab?.pronunciation || '',
      example_sentence: editingVocab?.example_sentence || '',
      difficulty_level: editingVocab?.difficulty_level || 1,
      is_mastered: editingVocab?.is_mastered || false,
    });
  }, [editingVocab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, submitting]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.word.trim() || !form.meaning.trim()) {
      setFormError('Nhập từ và nghĩa trước.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await onAdd({
        ...form,
        word: form.word.trim(),
        meaning: form.meaning.trim(),
        pronunciation: (form.pronunciation || '').trim() || null,
        example_sentence: form.example_sentence.trim(),
      });
      setForm(emptyForm);
      onClose();
    } catch (error) {
      // Keep the modal open and expose the API detail so validation/auth errors
      // can be fixed without guessing what the server rejected.
      setFormError(
        error instanceof Error
          ? error.message
          : 'Không lưu được từ này. Kiểm tra thông tin rồi thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const speak = () => {
    if (!form.word.trim()) return;
    const utterance = new SpeechSynthesisUtterance(form.word);
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="vocab-modal-title">
      <button
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
        disabled={submitting}
        aria-label="Close vocabulary modal"
      />

      <div className="relative z-10 w-full max-w-xl animate-zoomIn rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-5 top-5 rounded-2xl bg-slate-100 p-2 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Volume2 className="h-6 w-6" />
          </div>
          <h2 id="vocab-modal-title" className="mt-4 text-2xl font-black tracking-tight text-slate-950">
            {editingVocab ? 'Edit vocabulary' : 'Add vocabulary'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Lưu từ mới vào notebook hiện tại. Review schedule sẽ do backend Learning/SRS xử lý.
          </p>
        </div>

        {formError && (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="text-sm font-bold text-slate-700">Word</label>
              <input
                type="text"
                value={form.word}
                onChange={(event) => setForm({ ...form, word: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                placeholder="abandon"
                required
                maxLength={500}
              />
            </div>
            <button
              type="button"
              onClick={speak}
              className="self-end rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              title="Speak word"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Meaning</label>
            <input
              type="text"
              value={form.meaning}
              onChange={(event) => setForm({ ...form, meaning: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              placeholder="bỏ rơi, từ bỏ"
              required
              maxLength={10000}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-slate-700">Pronunciation</label>
              <input
                type="text"
                value={form.pronunciation || ''}
                onChange={(event) => setForm({ ...form, pronunciation: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                placeholder="/əˈbændən/"
                maxLength={500}
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Difficulty</label>
              <select
                value={form.difficulty_level}
                onChange={(event) => setForm({ ...form, difficulty_level: Number(event.target.value) })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              >
                <option value={1}>Easy</option>
                <option value={2}>Normal</option>
                <option value={3}>Medium</option>
                <option value={4}>Hard</option>
                <option value={5}>Very hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700">Example sentence</label>
            <textarea
              value={form.example_sentence}
              onChange={(event) => setForm({ ...form, example_sentence: event.target.value })}
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              placeholder="He abandoned the plan after the test failed."
              maxLength={10000}
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600">
            <input
              type="checkbox"
              checked={form.is_mastered}
              onChange={(event) => setForm({ ...form, is_mastered: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Mark as mastered
          </label>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {submitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving
                </span>
              ) : editingVocab ? 'Save changes' : 'Add word'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
