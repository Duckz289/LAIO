// frontend/src/app/notebooks/[id]/components/VocabItem.tsx

'use client';

import { useState } from 'react';
import { Volume2, Star, Edit2, Trash2, EyeOff, Eye } from 'lucide-react';
import { Vocab } from '../types';

interface VocabItemProps {
  vocab: Vocab;
  onToggleMaster: (id: string) => void;
  onEdit: (vocab: Vocab) => void;
  onDelete: (id: string) => void;
}

export default function VocabItem({ vocab, onToggleMaster, onEdit, onDelete }: VocabItemProps) {
  const [isMeaningHidden, setIsMeaningHidden] = useState(false);

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(vocab.word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-lg text-gray-900">{vocab.word}</h4>
            <span className="text-xs text-gray-400 font-mono">{vocab.pronunciation}</span>
            <button 
              onClick={speak}
              className="text-gray-400 hover:text-blue-500 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          
          {!isMeaningHidden ? (
            <p className="text-gray-600 mt-1">{vocab.meaning}</p>
          ) : (
            <div className="mt-1">
              <span className="text-gray-400 italic text-sm">--- Đã ẩn nghĩa ---</span>
            </div>
          )}
          
          {vocab.example_sentence && (
            <p className="text-sm text-gray-400 italic mt-2">💡 {vocab.example_sentence}</p>
          )}
        </div>

        <div className="flex gap-1 ml-4">
          <button
            onClick={() => setIsMeaningHidden(!isMeaningHidden)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            title={isMeaningHidden ? "Hiện nghĩa" : "Ẩn nghĩa"}
          >
            {isMeaningHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => onToggleMaster(vocab.id)}
            className={`p-2 rounded-lg transition-all ${vocab.is_mastered ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-300 hover:text-yellow-500'}`}
            title={vocab.is_mastered ? "Đã nhớ" : "Đánh dấu đã nhớ"}
          >
            <Star className="w-4 h-4" fill={vocab.is_mastered ? 'currentColor' : 'none'} />
          </button>
          
          <button
            onClick={() => onEdit(vocab)}
            className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDelete(vocab.id)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}