'use client';

import { Loader2, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import AnimatedModal from '@/components/AnimatedModal';
import { useVocabLookup } from '@/hooks/useVocabLookup';

import { CefrLevel, Vocab, VocabMutation } from '../types';

interface AddVocabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (vocab: VocabMutation) => Promise<void>;
  editingVocab?: Vocab | null;
}

type VocabForm = VocabMutation;

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const emptyForm: VocabForm = {
  word: '',
  meaning: '',
  pronunciation: '',
  example_sentence: '',
  difficulty_level: 1,
  cefr_level: null,
  is_mastered: false,
};

export default function AddVocabModal({ isOpen, onClose, onAdd, editingVocab }: AddVocabModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [lookupAudioUrl, setLookupAudioUrl] = useState<string | null>(null);
  // Once a field has been manually edited, an in-flight/late lookup result
  // must never overwrite it again for the rest of this modal session.
  const touchedRef = useRef({ pronunciation: false, cefr: false });

  const isCreating = !editingVocab;
  const lookup = useVocabLookup(form.word, isOpen && isCreating);

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
    setLookupAudioUrl(null);
    touchedRef.current = { pronunciation: false, cefr: false };
    setForm({
      word: editingVocab?.word || '',
      meaning: editingVocab?.meaning || '',
      pronunciation: editingVocab?.pronunciation || '',
      example_sentence: editingVocab?.example_sentence || '',
      difficulty_level: editingVocab?.difficulty_level || 1,
      cefr_level: editingVocab?.cefr_level || null,
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

  // Apply a successful lookup, but never overwrite a field the user already
  // edited by hand.
  useEffect(() => {
    if (lookup.status !== 'found' || !lookup.data) return;
    const result = lookup.data;
    setForm((current) => ({
      ...current,
      pronunciation: touchedRef.current.pronunciation
        ? current.pronunciation
        : result.ipa ?? current.pronunciation,
      cefr_level: touchedRef.current.cefr ? current.cefr_level : result.cefr ?? current.cefr_level,
    }));
    setLookupAudioUrl(result.audio_url);
  }, [lookup.status, lookup.data]);

  const handleWordChange = (value: string) => {
    if (!isCreating) {
      setForm((current) => ({ ...current, word: value }));
      return;
    }
    // A new term invalidates all term-derived state — pronunciation, CEFR,
    // lookup audio, and manual-edit ownership all belonged to the old term.
    // This must not be conditional on `touched`: a manual edit only wins
    // against a late lookup for the *same* term, not across a term change.
    touchedRef.current = { pronunciation: false, cefr: false };
    setLookupAudioUrl(null);
    setForm((current) => ({
      ...current,
      word: value,
      pronunciation: '',
      cefr_level: null,
    }));
  };

  const handleIpaChange = (value: string) => {
    touchedRef.current.pronunciation = true;
    setForm((current) => ({ ...current, pronunciation: value }));
  };

  const handleCefrChange = (value: string) => {
    touchedRef.current.cefr = true;
    setForm((current) => ({ ...current, cefr_level: (value || null) as CefrLevel | null }));
  };

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
        audio_url: lookupAudioUrl ?? undefined,
      });
      touchedRef.current = { pronunciation: false, cefr: false };
      setLookupAudioUrl(null);
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

  const speakWithBrowserTts = () => {
    const utterance = new SpeechSynthesisUtterance(form.word);
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const speak = () => {
    if (!form.word.trim()) return;
    if (lookupAudioUrl) {
      const audio = new Audio(lookupAudioUrl);
      audio.play().catch(() => speakWithBrowserTts());
      return;
    }
    speakWithBrowserTts();
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      closeLabel="Close vocabulary modal"
      closeDisabled={submitting}
      labelledBy="vocab-modal-title"
      panelClassName="max-w-xl"
    >
      <div className="rounded-[30px] bg-brand-paper p-6 shadow-xl shadow-[#0d2b24]/15">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-5 top-5 rounded-xl border-2 border-transparent p-2 text-brand-subtle transition-colors duration-200 hover:border-brand-forest hover:bg-brand-sand hover:text-brand-forest"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] bg-brand-cream text-brand-forest shadow-sm">
            <Volume2 className="h-6 w-6" />
          </div>
          <h2 id="vocab-modal-title" className="landing-display mt-4 text-2xl font-black tracking-[-0.035em] text-brand-forest">
            {editingVocab ? 'Edit vocabulary' : 'Add vocabulary'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-brand-subtle">
            Lưu từ mới vào notebook hiện tại. Review schedule sẽ do backend Learning/SRS xử lý.
          </p>
        </div>

        {formError && (
          <div className="mt-5 rounded-xl border-2 border-brand-accent-soft bg-brand-error-bg px-4 py-3 text-sm font-semibold text-brand-accent-deep" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="text-sm font-bold text-brand-forest">Word</label>
              <input
                type="text"
                value={form.word}
                onChange={(event) => handleWordChange(event.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-[#173f3430] bg-white px-4 py-3 text-sm font-semibold text-brand-forest outline-none transition-colors placeholder:text-brand-faint focus:border-brand-forest"
                placeholder="abandon"
                required
                maxLength={500}
              />
            </div>
            <button
              type="button"
              onClick={speak}
              className="self-end rounded-xl border-2 border-[#173f3430] bg-white px-4 py-3 text-brand-subtle transition-colors hover:border-brand-forest hover:bg-brand-sand hover:text-brand-forest"
              title="Speak word"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 px-1">
            <input
              type="text"
              value={form.pronunciation || ''}
              onChange={(event) => handleIpaChange(event.target.value)}
              placeholder="/…/"
              maxLength={500}
              aria-label="IPA pronunciation"
              className="w-full max-w-[180px] rounded-lg border-2 border-transparent bg-transparent px-1 py-1 font-mono text-sm text-brand-subtle outline-none transition-colors placeholder:text-brand-faint focus:border-brand-forest focus:bg-white"
            />
            <select
              value={form.cefr_level || ''}
              onChange={(event) => handleCefrChange(event.target.value)}
              aria-label="CEFR level"
              className="rounded-full border-2 border-[#173f3430] bg-white px-3 py-1.5 text-xs font-black text-brand-forest outline-none transition-colors focus:border-brand-forest"
            >
              <option value="">—</option>
              {CEFR_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          {isCreating && lookup.status === 'loading' && (
            <p className="-mt-3 px-1 text-xs font-semibold text-brand-faint">Đang tra cứu…</p>
          )}
          {isCreating && lookup.status === 'unavailable' && (
            <p className="-mt-3 px-1 text-xs font-semibold text-brand-faint">Không tự động lấy được cách phát âm.</p>
          )}

          <div>
            <label className="text-sm font-bold text-brand-forest">Meaning</label>
            <input
              type="text"
              value={form.meaning}
              onChange={(event) => setForm({ ...form, meaning: event.target.value })}
              className="mt-2 w-full rounded-xl border-2 border-[#173f3430] bg-white px-4 py-3 text-sm font-medium text-brand-forest outline-none transition-colors placeholder:text-brand-faint focus:border-brand-forest"
              placeholder="bỏ rơi, từ bỏ"
              required
              maxLength={10000}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-brand-forest">Example sentence</label>
            <textarea
              value={form.example_sentence}
              onChange={(event) => setForm({ ...form, example_sentence: event.target.value })}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border-2 border-[#173f3430] bg-white px-4 py-3 text-sm font-medium text-brand-forest outline-none transition-colors placeholder:text-brand-faint focus:border-brand-forest"
              placeholder="He abandoned the plan after the test failed."
              maxLength={10000}
            />
          </div>

          {editingVocab && (
            <label className="flex items-center gap-3 rounded-2xl bg-brand-sand p-3 text-sm font-bold text-brand-subtle">
              <input
                type="checkbox"
                checked={form.is_mastered}
                onChange={(event) => setForm({ ...form, is_mastered: event.target.checked })}
                className="h-4 w-4 rounded border-[#173f3440] text-brand-forest focus:ring-brand-forest"
              />
              Mark as mastered
            </label>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-full border-2 border-[#173f3435] bg-white px-4 py-3 text-sm font-black text-brand-forest transition-colors hover:border-brand-forest hover:bg-brand-sand"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-full bg-brand-cream px-4 py-3 text-sm font-black text-brand-forest shadow-sm transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
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
    </AnimatedModal>
  );
}
