// frontend/src/app/notebooks/[id]/components/AddVocabModal.tsx

'use client';

import { useState } from 'react';
import { X, Volume2, Sparkles } from 'lucide-react';
import { Vocab } from '../types';

interface AddVocabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (vocab: Omit<Vocab, 'id' | 'created_at' | 'updated_at'>) => void;
  editingVocab?: Vocab | null;
}

export default function AddVocabModal({ isOpen, onClose, onAdd, editingVocab }: AddVocabModalProps) {
  const [form, setForm] = useState({
    word: editingVocab?.word || '',
    meaning: editingVocab?.meaning || '',
    pronunciation: editingVocab?.pronunciation || '',
    example_sentence: editingVocab?.example_sentence || '',
    difficulty_level: editingVocab?.difficulty_level || 0,
    is_mastered: editingVocab?.is_mastered || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.word.trim() || !form.meaning.trim()) {
      alert('Vui lòng nhập từ và nghĩa!');
      return;
    }
    onAdd(form);
    setForm({
      word: '',
      meaning: '',
      pronunciation: '',
      example_sentence: '',
      difficulty_level: 0,
      is_mastered: false,
    });
    onClose();
  };

  const mockLookup = () => {
    if (form.word.toLowerCase() === 'analyze') {
      setForm({
        ...form,
        meaning: 'phân tích',
        pronunciation: '/ˈæn.əl.aɪz/',
        example_sentence: 'We need to analyze the data.',
      });
    } else if (form.word.toLowerCase() === 'significant') {
      setForm({
        ...form,
        meaning: 'đáng kể, quan trọng',
        pronunciation: '/sɪɡˈnɪf.ɪ.kənt/',
        example_sentence: 'A significant change occurred.',
      });
    } else {
      alert('Demo: Chỉ hỗ trợ tra từ "analyze" và "significant"');
    }
  };

  const speak = () => {
    if (!form.word) return;
    const utterance = new SpeechSynthesisUtterance(form.word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-md animate-zoomIn">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b">
            <h2 className="text-xl font-bold">{editingVocab ? '✏️ Sửa từ' : '➕ Thêm từ mới'}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Từ vựng *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.word}
                  onChange={(e) => setForm({ ...form, word: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="VD: beautiful"
                  required
                />
                <button
                  type="button"
                  onClick={speak}
                  className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={mockLookup}
                  className="px-3 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nghĩa *</label>
              <input
                type="text"
                value={form.meaning}
                onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="VD: xinh đẹp"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phiên âm</label>
              <input
                type="text"
                value={form.pronunciation}
                onChange={(e) => setForm({ ...form, pronunciation: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="VD: /ˈbjuː.tɪ.fəl/"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ví dụ</label>
              <textarea
                value={form.example_sentence}
                onChange={(e) => setForm({ ...form, example_sentence: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="VD: She has a beautiful smile."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingVocab ? 'Cập nhật' : 'Thêm từ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}