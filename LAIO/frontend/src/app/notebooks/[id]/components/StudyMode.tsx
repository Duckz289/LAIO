// frontend/src/app/notebooks/[id]/components/StudyMode.tsx

'use client';

import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Vocab } from '../types';

interface StudyModeProps {
  dueVocabs: Vocab[];
  onReview: (id: string, remembered: boolean) => void;
}

export default function StudyMode({ dueVocabs, onReview }: StudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const current = dueVocabs[currentIndex];

  const speak = () => {
    if (!current) return;
    const utterance = new SpeechSynthesisUtterance(current.word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleReview = (remembered: boolean) => {
    onReview(current.id, remembered);
    setShowAnswer(false);
    
    if (currentIndex + 1 < dueVocabs.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert('🎉 Chúc mừng! Bạn đã ôn tập xong hôm nay!');
      setCurrentIndex(0);
    }
  };

  if (dueVocabs.length === 0) {
    return (
      <div className="text-center py-12 bg-green-50 rounded-2xl">
        <p className="text-green-600">🎉 Hôm nay bạn không có từ nào cần ôn tập!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {dueVocabs.length}
        </span>
        <button onClick={speak} className="p-2 rounded-full hover:bg-gray-100">
          <Volume2 className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="text-center py-8">
        <div className="text-3xl font-bold text-gray-900 mb-2">{current.word}</div>
        <div className="text-sm text-gray-400">{current.pronunciation}</div>
        
        {showAnswer && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-700">{current.meaning}</p>
            {current.example_sentence && (
              <p className="text-sm text-gray-500 mt-2 italic">"{current.example_sentence}"</p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-center mt-6">
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-colors"
          >
            🔍 Xem đáp án
          </button>
        ) : (
          <>
            <button
              onClick={() => handleReview(false)}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
            >
              😰 Không nhớ
            </button>
            <button
              onClick={() => handleReview(true)}
              className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
            >
              😎 Nhớ rồi
            </button>
          </>
        )}
      </div>
    </div>
  );
}